import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ScannerProvider, useScanner } from './context/ScannerContext';
import { Header } from './components/Header';
import { TickerBar } from './components/TickerBar';
import { SignalAlertsFeed } from './components/SignalAlertsFeed';
import { DigitFrequencyPanel } from './components/DigitFrequencyPanel';
import { ChartPanel } from './components/ChartPanel';
import { BoomCrashRadar } from './components/BoomCrashRadar';
import { MarketScreener } from './components/MarketScreener';
import { TradingBotPanel } from './components/TradingBotPanel';
import { SubscriptionModal } from './components/SubscriptionModal';
import { DerivTokenModal } from './components/DerivTokenModal';
import { AuthModal } from './components/AuthModal';
import { ShieldCheck, Activity, Terminal } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { activeTab } = useScanner();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#090D14] text-slate-100">
      {/* Top Bar Header */}
      <Header onOpenAuth={() => setIsAuthModalOpen(true)} />

      {/* Real-time Ticker Bar */}
      <TickerBar />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-4 lg:p-6 space-y-6">
        {activeTab === 'SCANNER' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Live Chart & Digit Frequency Radar */}
              <div className="lg:col-span-7 space-y-6">
                <ChartPanel />
                <DigitFrequencyPanel />
              </div>

              {/* Right Column: Signal Alerts Feed */}
              <div className="lg:col-span-5">
                <SignalAlertsFeed />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'DIGIT_MATRIX' && (
          <div className="space-y-6">
            <DigitFrequencyPanel />
            <ChartPanel />
          </div>
        )}

        {activeTab === 'CHART' && (
          <div className="space-y-6">
            <ChartPanel />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DigitFrequencyPanel />
              <SignalAlertsFeed />
            </div>
          </div>
        )}

        {activeTab === 'SPIKE_HUNTER' && (
          <div className="space-y-6">
            <BoomCrashRadar />
          </div>
        )}

        {activeTab === 'SCREENER' && (
          <div className="space-y-6">
            <MarketScreener />
          </div>
        )}

        {activeTab === 'BOT_TRADER' && (
          <div className="space-y-6">
            <TradingBotPanel />
          </div>
        )}
      </main>

      {/* Quiet Financial Terminal Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#070A0F] py-4 px-6 text-xs text-slate-500 font-mono flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-slate-300 font-bold">DerivScan Pro</span>
          <span>·</span>
          <span className="text-cyan-400 font-medium">Developed by Qareem Full Stack Developer</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>High-Speed WebSocket Engine</span>
          </span>
          <span>·</span>
          <span>Financial Risk Disclaimer: Synthetic trading involves risk of capital loss.</span>
        </div>
      </footer>

      {/* Modals */}
      <SubscriptionModal />
      <DerivTokenModal />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ScannerProvider>
        <DashboardContent />
      </ScannerProvider>
    </AuthProvider>
  );
}
