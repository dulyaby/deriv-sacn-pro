import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  MarketInfo,
  MarketAnalysis,
  LiveTick,
  Signal,
  SYNTHETIC_MARKETS,
  SubscriptionTier
} from '../types/scanner';
import { api, scannerSocket } from '../services/api';
import { soundManager } from '../services/sound';
import { useAuth } from './AuthContext';

interface ScannerContextType {
  markets: MarketInfo[];
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  selectedMarket: MarketInfo;
  analyses: Record<string, MarketAnalysis>;
  currentAnalysis: MarketAnalysis | undefined;
  ticks: LiveTick[];
  activeSignals: Signal[];
  signalHistory: Signal[];
  activeTab: 'SCANNER' | 'DIGIT_MATRIX' | 'CHART' | 'SPIKE_HUNTER' | 'SCREENER' | 'BOT_TRADER';
  setActiveTab: (tab: 'SCANNER' | 'DIGIT_MATRIX' | 'CHART' | 'SPIKE_HUNTER' | 'SCREENER' | 'BOT_TRADER') => void;
  tickWindow: 25 | 50 | 100;
  setTickWindow: (w: 25 | 50 | 100) => void;
  isMuted: boolean;
  toggleMute: () => void;
  latency: number;
  isConnected: boolean;
  isSubscriptionModalOpen: boolean;
  setIsSubscriptionModalOpen: (open: boolean) => void;
  isTokenModalOpen: boolean;
  setIsTokenModalOpen: (open: boolean) => void;
  suggestedUpgradeTier: SubscriptionTier;
  triggerUpgradePrompt: (tier?: SubscriptionTier) => void;
  latestFlashTick: { symbol: string; direction: 'UP' | 'DOWN' } | null;
}

const ScannerContext = createContext<ScannerContextType | undefined>(undefined);

export const ScannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isProOrHigher, activeTier } = useAuth();
  const [selectedSymbol, setSelectedSymbol] = useState<string>('R_100');
  const [analyses, setAnalyses] = useState<Record<string, MarketAnalysis>>({});
  const [ticksMap, setTicksMap] = useState<Record<string, LiveTick[]>>({});
  const [activeSignals, setActiveSignals] = useState<Signal[]>([]);
  const [signalHistory, setSignalHistory] = useState<Signal[]>([]);
  const [activeTab, setActiveTab] = useState<'SCANNER' | 'DIGIT_MATRIX' | 'CHART' | 'SPIKE_HUNTER' | 'SCREENER' | 'BOT_TRADER'>('SCANNER');
  const [tickWindow, setTickWindow] = useState<25 | 50 | 100>(50);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [latency, setLatency] = useState<number>(18);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean>(false);
  const [suggestedUpgradeTier, setSuggestedUpgradeTier] = useState<SubscriptionTier>('MONTHLY');
  const [latestFlashTick, setLatestFlashTick] = useState<{ symbol: string; direction: 'UP' | 'DOWN' } | null>(null);

  // Audio trigger cache to prevent chime spam
  const lastSignalChimeRef = useRef<number>(0);

  const selectedMarket = SYNTHETIC_MARKETS.find((m) => m.symbol === selectedSymbol) || SYNTHETIC_MARKETS[0];

  const triggerUpgradePrompt = useCallback((tier: SubscriptionTier = 'MONTHLY') => {
    setSuggestedUpgradeTier(tier);
    setIsSubscriptionModalOpen(true);
  }, []);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
  }, [isMuted]);

  // Initial load via REST
  useEffect(() => {
    async function loadInitial() {
      try {
        const [analysesRes, signalsRes, ticksRes] = await Promise.all([
          api.getAnalyses(),
          api.getSignals(),
          api.getTicks(selectedSymbol)
        ]);

        const map: Record<string, MarketAnalysis> = {};
        for (const a of analysesRes.analyses) {
          map[a.symbol] = a;
        }
        setAnalyses(map);

        if (ticksRes.ticks && ticksRes.ticks.length > 0) {
          setTicksMap((prev) => ({ ...prev, [selectedSymbol]: ticksRes.ticks }));
        }

        setActiveSignals(signalsRes.active);
        setSignalHistory(signalsRes.history);
      } catch (err) {
        console.warn('Initial REST load fallback, waiting for WS:', err);
      }
    }
    loadInitial();
  }, [selectedSymbol]);

  // WebSocket event subscriptions
  useEffect(() => {
    const unsubSnapshot = scannerSocket.on('INITIAL_SNAPSHOT', (data: any) => {
      const map: Record<string, MarketAnalysis> = {};
      if (data.analyses) {
        for (const a of data.analyses) {
          map[a.symbol] = a;
        }
        setAnalyses(map);
      }
      if (data.activeSignals) {
        setActiveSignals(data.activeSignals);
      }
      setIsConnected(true);
    });

    const unsubTick = scannerSocket.on('TICK_UPDATE', (data: { tick: LiveTick; analysis: MarketAnalysis }) => {
      const { tick, analysis } = data;
      
      setAnalyses((prev) => ({
        ...prev,
        [tick.symbol]: analysis
      }));

      setTicksMap((prev) => {
        const existing = prev[tick.symbol] || [];
        const updated = [...existing, tick].slice(-100);
        return {
          ...prev,
          [tick.symbol]: updated
        };
      });

      // Visual flash indicator
      const dir: 'UP' | 'DOWN' = tick.change >= 0 ? 'UP' : 'DOWN';
      setLatestFlashTick({ symbol: tick.symbol, direction: dir });

      // Subtly play tick sound if current selected symbol
      if (tick.symbol === selectedSymbol && !isMuted) {
        // soundManager.playTick();
      }
    });

    const unsubSignal = scannerSocket.on('SIGNAL_GENERATED', (signal: Signal) => {
      setActiveSignals((prev) => [signal, ...prev.filter((s) => s.id !== signal.id)].slice(0, 30));

      // Audio notification for high-conviction signal
      const now = Date.now();
      if (!isMuted && now - lastSignalChimeRef.current > 3000) {
        lastSignalChimeRef.current = now;
        if (signal.type === 'SPIKE_HUNTER') {
          soundManager.playSpikeAlert();
        } else {
          soundManager.playSignalAlert(signal.confidence);
        }
      }
    });

    const unsubSignalResolved = scannerSocket.on('SIGNAL_RESOLVED', (signal: Signal) => {
      setActiveSignals((prev) => prev.filter((s) => s.id !== signal.id));
      setSignalHistory((prev) => [signal, ...prev.filter((s) => s.id !== signal.id)].slice(0, 40));
    });

    const unsubLatency = scannerSocket.on('latency_update', (d: { latency: number }) => {
      setLatency(d.latency);
    });

    const unsubConn = scannerSocket.on('connection_change', (d: { connected: boolean }) => {
      setIsConnected(d.connected);
    });

    return () => {
      unsubSnapshot();
      unsubTick();
      unsubSignal();
      unsubSignalResolved();
      unsubLatency();
      unsubConn();
    };
  }, [selectedSymbol, isMuted]);

  const currentAnalysis = analyses[selectedSymbol];
  const ticks = ticksMap[selectedSymbol] || [];

  return (
    <ScannerContext.Provider
      value={{
        markets: SYNTHETIC_MARKETS,
        selectedSymbol,
        setSelectedSymbol,
        selectedMarket,
        analyses,
        currentAnalysis,
        ticks,
        activeSignals,
        signalHistory,
        activeTab,
        setActiveTab,
        tickWindow,
        setTickWindow,
        isMuted,
        toggleMute,
        latency,
        isConnected,
        isSubscriptionModalOpen,
        setIsSubscriptionModalOpen,
        isTokenModalOpen,
        setIsTokenModalOpen,
        suggestedUpgradeTier,
        triggerUpgradePrompt,
        latestFlashTick
      }}
    >
      {children}
    </ScannerContext.Provider>
  );
};

export function useScanner() {
  const context = useContext(ScannerContext);
  if (!context) {
    throw new Error('useScanner must be used within a ScannerProvider');
  }
  return context;
}
