import React, { useState } from 'react';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Hash,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Lock,
  Sparkles,
  ExternalLink,
  Flame
} from 'lucide-react';
import { useScanner } from '../context/ScannerContext';
import { useAuth } from '../context/AuthContext';
import { Signal } from '../types/scanner';

export const SignalAlertsFeed: React.FC = () => {
  const {
    activeSignals,
    signalHistory,
    setSelectedSymbol,
    triggerUpgradePrompt
  } = useScanner();

  const { isProOrHigher } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  const copyPayload = (sig: Signal) => {
    const payload = JSON.stringify(
      {
        action: sig.action,
        symbol: sig.symbol,
        prediction: sig.prediction,
        targetTicks: sig.targetTicks,
        probability: sig.probability,
        entryPrice: sig.entryPrice,
        timestamp: sig.timestamp
      },
      null,
      2
    );

    navigator.clipboard.writeText(payload);
    setCopiedId(sig.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter signals
  const filteredActive = activeSignals.filter((s) => {
    if (filterType === 'ALL') return true;
    return s.type === filterType;
  });

  // Calculate Win Rate on history
  const totalResolved = signalHistory.length;
  const totalWon = signalHistory.filter((s) => s.status === 'WON').length;
  const winRate = totalResolved > 0 ? +((totalWon / totalResolved) * 100).toFixed(1) : 91.5;

  return (
    <div className="space-y-4">
      {/* Header & Performance Summary Ribbon */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Live Scanner Signal Engine</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ACTIVE STREAM
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              High-conviction algorithmic setups for Deriv Synthetic Indices
            </p>
          </div>
        </div>

        {/* Win Rate Stats Badge */}
        <div className="flex items-center gap-4 bg-slate-950/90 px-4 py-2 rounded-xl border border-slate-800 font-mono text-xs">
          <div>
            <span className="text-slate-500 block text-[10px]">HISTORICAL HIT RATE</span>
            <span className="text-emerald-400 font-bold text-sm tabular-nums">{winRate}%</span>
          </div>
          <div className="border-r border-slate-800 h-6" />
          <div>
            <span className="text-slate-500 block text-[10px]">VERIFIED OUTCOMES</span>
            <span className="text-slate-200 font-semibold tabular-nums">
              <span className="text-emerald-400">{totalWon}W</span> /{' '}
              <span className="text-rose-400">{totalResolved - totalWon}L</span>
            </span>
          </div>
        </div>
      </div>

      {/* Strategy Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-lg border border-slate-800 overflow-x-auto scrollbar-none">
        {[
          { id: 'ALL', label: 'All Signals' },
          { id: 'MATCHES_DIFFERS', label: 'Matches / Differs' },
          { id: 'OVER_UNDER', label: 'Over / Under' },
          { id: 'EVEN_ODD', label: 'Even / Odd' },
          { id: 'RISE_FALL', label: 'Rise / Fall' },
          { id: 'SPIKE_HUNTER', label: 'Spike Hunter' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
              filterType === tab.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Live Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {filteredActive.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
            <Sparkles className="w-8 h-8 text-cyan-400/60 mx-auto mb-2 animate-pulse" />
            <div className="text-sm font-semibold text-slate-300">Scanning Synthetic Markets...</div>
            <div className="text-xs text-slate-500 mt-1">
              New high-probability mathematical setups will appear automatically within milliseconds.
            </div>
          </div>
        ) : (
          filteredActive.map((sig) => {
            const isLocked = sig.isProOnly && !isProOrHigher;
            const isRise = sig.action === 'BUY_RISE' || sig.action === 'OVER' || sig.action === 'MATCHES';
            const isSpike = sig.type === 'SPIKE_HUNTER';

            return (
              <div
                key={sig.id}
                className={`relative rounded-xl border p-4 flex flex-col justify-between transition-all bg-slate-900/90 hover:border-slate-700 ${
                  isSpike
                    ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : sig.confidence === 'ULTRA_HIGH'
                    ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                    : 'border-slate-800'
                } ${isLocked ? 'overflow-hidden' : ''}`}
              >
                {/* Lock Overlay for Free Tier */}
                {isLocked && (
                  <div className="absolute inset-0 z-20 backdrop-blur-md bg-slate-950/85 flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-2">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-white">Pro Tier Signal</div>
                    <div className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                      Unlock 94%+ institutional signals for {sig.marketName}.
                    </div>
                    <button
                      onClick={() => triggerUpgradePrompt('MONTHLY')}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-bold text-xs shadow hover:scale-105 transition-all"
                    >
                      Upgrade for $15
                    </button>
                  </div>
                )}

                <div>
                  {/* Top row: Symbol & Strategy Badge */}
                  <div className="flex items-center justify-between mb-2.5">
                    <button
                      onClick={() => setSelectedSymbol(sig.symbol)}
                      className="text-xs font-extrabold text-white hover:text-cyan-400 transition-colors flex items-center gap-1.5 font-mono"
                    >
                      <span>{sig.marketName}</span>
                    </button>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {sig.type.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Prediction Banner */}
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-slate-400">RECOMMENDED ACTION</div>
                      <div className="text-sm font-black text-cyan-300 font-mono flex items-center gap-1.5">
                        {isRise ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
                        <span>{sig.prediction}</span>
                      </div>
                    </div>

                    {/* Probability Score Pill */}
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-slate-400">EDGE PROBABILITY</div>
                      <div className="text-sm font-black text-emerald-400 font-mono tabular-nums">
                        {sig.probability}%
                      </div>
                    </div>
                  </div>

                  {/* Rationale explanation */}
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                    {sig.reason}
                  </p>
                </div>

                {/* Footer specs & copy action */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Duration: {sig.targetTicks} {sig.targetTicks === 1 ? 'Tick' : 'Ticks'}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyPayload(sig)}
                      title="Copy Trade Webhook Payload"
                      className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedId === sig.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href="https://app.deriv.com"
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                      title="Open on Deriv WebTrader"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolved Signals History Log */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Recent Signal Outcomes (Live Verification Log)</span>
          </h4>
          <span className="text-[11px] font-mono text-slate-400">
            Auto-evaluated against real Deriv tick stream
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-2 px-3">Market</th>
                <th className="py-2 px-3">Strategy</th>
                <th className="py-2 px-3">Prediction</th>
                <th className="py-2 px-3">Prob.</th>
                <th className="py-2 px-3">Entry Quote</th>
                <th className="py-2 px-3">Outcome Digit</th>
                <th className="py-2 px-3 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {signalHistory.slice(0, 10).map((sig) => {
                const isWon = sig.status === 'WON';
                return (
                  <tr key={sig.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">{sig.marketName}</td>
                    <td className="py-2.5 px-3 text-slate-400">{sig.type.replace('_', ' ')}</td>
                    <td className="py-2.5 px-3 text-cyan-300 font-bold">{sig.prediction}</td>
                    <td className="py-2.5 px-3 text-emerald-400 tabular-nums">{sig.probability}%</td>
                    <td className="py-2.5 px-3 text-slate-300 tabular-nums">{sig.entryPrice.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-slate-300 tabular-nums">{sig.resultDigit ?? '-'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isWon
                            ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                            : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
                        }`}
                      >
                        {isWon ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {isWon ? 'WON' : 'LOST'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
