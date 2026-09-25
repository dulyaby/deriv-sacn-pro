import React from 'react';
import { Target, AlertTriangle, ShieldCheck, Flame, Zap, ArrowUp, ArrowDown, Lock } from 'lucide-react';
import { useScanner } from '../context/ScannerContext';
import { useAuth } from '../context/AuthContext';
import { SYNTHETIC_MARKETS } from '../types/scanner';

export const BoomCrashRadar: React.FC = () => {
  const { analyses, setSelectedSymbol, triggerUpgradePrompt } = useScanner();
  const { isProOrHigher } = useAuth();

  const boomCrashMarkets = SYNTHETIC_MARKETS.filter((m) => m.category === 'BOOM_CRASH');

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Boom & Crash Spike Hunter Radar</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-mono">
                PRO ENGINE
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Spike cycle probability matrix, tick accumulation timers, and anti-spike scalping zones
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span>Strategy: </span>
          <strong className="text-emerald-400">Catch Explosive Spikes</strong>
          <span className="text-slate-600"> / </span>
          <strong className="text-cyan-400">Safe Tick Scalping</strong>
        </div>
      </div>

      {/* Grid of Boom & Crash Indices */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {boomCrashMarkets.map((market) => {
          const analysis = analyses[market.symbol];
          const isLocked = market.isProOnly && !isProOrHigher;
          const spikeData = analysis?.boomCrashSpikeStatus;
          const isBoom = market.symbol.startsWith('BOOM');
          const ticksSince = spikeData?.ticksSinceLastSpike || 42;
          const prob = spikeData?.probabilityOfImminentSpike || 65;
          const action = spikeData?.recommendedAction || 'ACCUMULATING';

          let statusColor = 'text-cyan-400 border-cyan-500/30 bg-cyan-950/30';
          if (action === 'SPIKE_WATCH') {
            statusColor = 'text-emerald-400 border-emerald-500/50 bg-emerald-950/50 animate-pulse';
          } else if (action === 'SCALP_CLEAR') {
            statusColor = 'text-amber-400 border-amber-500/30 bg-amber-950/30';
          }

          return (
            <div
              key={market.symbol}
              className="relative rounded-xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col justify-between overflow-hidden"
            >
              {isLocked && (
                <div className="absolute inset-0 z-20 backdrop-blur-md bg-slate-950/85 flex flex-col items-center justify-center p-4 text-center">
                  <Lock className="w-6 h-6 text-amber-400 mb-2" />
                  <div className="text-xs font-bold text-white">{market.name} Locked</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Unlock institutional spike algorithms.
                  </div>
                  <button
                    onClick={() => triggerUpgradePrompt('MONTHLY')}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
                  >
                    Upgrade to Pro ($15)
                  </button>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                        isBoom ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40' : 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {isBoom ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{market.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Quote: {analysis?.currentQuote.toFixed(market.decimals) ?? '---'}
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${statusColor}`}>
                    {action.replace('_', ' ')}
                  </span>
                </div>

                {/* Spike Probability Radial / Bar */}
                <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 mb-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Spike Probability:</span>
                    <span className="text-base font-extrabold text-emerald-400 tabular-nums">
                      {prob}%
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        prob >= 75
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                          : prob >= 40
                          ? 'bg-cyan-500'
                          : 'bg-slate-600'
                      }`}
                      style={{ width: `${prob}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Ticks Since Spike: <strong className="text-white">{ticksSince}</strong></span>
                    <span>Type: <strong>{isBoom ? 'Upward Spike' : 'Crash Drop'}</strong></span>
                  </div>
                </div>

                {/* Strategy recommendation */}
                <div className="text-xs text-slate-300 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 mb-3 leading-relaxed">
                  {prob >= 75 ? (
                    <span className="text-emerald-300">
                      ⚡ <strong>High Spike Risk</strong>: Prepare Buy Call (Boom) or Sell Put (Crash) for maximum spike capture.
                    </span>
                  ) : prob <= 35 ? (
                    <span className="text-cyan-300">
                      🛡️ <strong>Safe Scalping Zone</strong>: Spike probability is low. Favorable for short 3-5 tick scalps.
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      ⌛ <strong>Cycle Accumulation</strong>: Average tick progression in motion.
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setSelectedSymbol(market.symbol)}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
              >
                Open in Chart & Scanner
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
