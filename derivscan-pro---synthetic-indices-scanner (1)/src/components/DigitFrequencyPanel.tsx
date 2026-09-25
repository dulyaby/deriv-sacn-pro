import React from 'react';
import { Flame, Snowflake, Hash, BarChart3, AlertCircle, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { useScanner } from '../context/ScannerContext';
import { useAuth } from '../context/AuthContext';

export const DigitFrequencyPanel: React.FC = () => {
  const {
    selectedMarket,
    currentAnalysis,
    tickWindow,
    setTickWindow,
    triggerUpgradePrompt
  } = useScanner();

  const { isProOrHigher } = useAuth();

  const stats =
    tickWindow === 25
      ? currentAnalysis?.stats25
      : tickWindow === 100
      ? currentAnalysis?.stats100
      : currentAnalysis?.stats50;

  const hotDigits = stats?.hotDigits || [7, 3];
  const coldDigits = stats?.coldDigits || [0, 9];
  const percentages = stats?.percentages || {};
  const counts = stats?.counts || {};

  // Last 25 digits history trail
  const lastDigits = currentAnalysis?.lastDigitsHistory?.slice(-25) || [];

  return (
    <div className="space-y-4">
      {/* Top Bar: Market Name & Tick Window Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{selectedMarket.name} Digit Frequency Radar</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Real-time statistical distribution of digits 0 through 9
            </p>
          </div>
        </div>

        {/* Window Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 px-2">Sample Window:</span>
          {([25, 50, 100] as const).map((win) => {
            const isWindowLocked = win === 100 && !isProOrHigher;
            return (
              <button
                key={win}
                onClick={() => {
                  if (isWindowLocked) {
                    triggerUpgradePrompt('MONTHLY');
                  } else {
                    setTickWindow(win);
                  }
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  tickWindow === win
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {win} Ticks
                {isWindowLocked && ' 🔒'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid: Digit Frequency Bars (0 to 9) */}
      <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Digit Frequency Distribution ({tickWindow} Ticks)</span>
          </span>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <Flame className="w-3.5 h-3.5" />
              <span>Hot: {hotDigits.join(', ')}</span>
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <Snowflake className="w-3.5 h-3.5" />
              <span>Cold: {coldDigits.join(', ')}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2.5">
          {Array.from({ length: 10 }, (_, d) => {
            const pct = percentages[d] || 0;
            const count = counts[d] || 0;
            const isHot = hotDigits.includes(d);
            const isCold = coldDigits.includes(d);

            let barColor = 'bg-slate-600';
            let badgeBg = 'bg-slate-800 border-slate-700 text-slate-200';
            if (isHot) {
              barColor = 'bg-gradient-to-t from-emerald-600 to-cyan-400';
              badgeBg = 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-sm shadow-emerald-500/20';
            } else if (isCold) {
              barColor = 'bg-gradient-to-t from-rose-700 to-amber-500';
              badgeBg = 'bg-amber-950/80 border-amber-500/60 text-amber-300';
            }

            return (
              <div
                key={d}
                className={`relative flex flex-col items-center justify-between p-2.5 rounded-xl border transition-all ${
                  isHot
                    ? 'border-emerald-500/50 bg-emerald-950/20'
                    : isCold
                    ? 'border-amber-500/40 bg-amber-950/20'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                {/* Digit Badge */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm border font-mono ${badgeBg}`}>
                  {d}
                </div>

                {/* Vertical Visual Progress Bar */}
                <div className="w-full h-24 my-2.5 bg-slate-900 rounded-md overflow-hidden relative flex flex-col justify-end p-0.5">
                  <div
                    className={`w-full rounded-sm transition-all duration-300 ${barColor}`}
                    style={{ height: `${Math.min(100, Math.max(8, pct * 3.2))}%` }}
                  />
                  {/* Reference 10% line */}
                  <div className="absolute top-[68%] left-0 right-0 border-t border-slate-700/60 border-dashed" />
                </div>

                {/* Percentage & Count */}
                <div className="text-center font-mono">
                  <div className="text-xs font-bold text-white tabular-nums">{pct}%</div>
                  <div className="text-[10px] text-slate-400 tabular-nums">{count} hits</div>
                </div>

                {isHot && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-500 text-slate-950 uppercase tracking-tighter shadow">
                    HOT
                  </span>
                )}
                {isCold && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500 text-slate-950 uppercase tracking-tighter shadow">
                    COLD
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Last 25 Digits History Trail */}
      <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Last 25 Digits Execution Sequence (Oldest → Latest)</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Latest Digit: <strong className="text-cyan-300">{currentAnalysis?.lastDigit ?? '-'}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {lastDigits.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-2">Receiving live ticks...</div>
          ) : (
            lastDigits.map((digit, idx) => {
              const isLatest = idx === lastDigits.length - 1;
              const isEven = digit % 2 === 0;
              const isHigh = digit >= 5;

              return (
                <div
                  key={idx}
                  className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-mono text-xs font-bold transition-all border ${
                    isLatest
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/40 ring-2 ring-cyan-400/50 animate-bounce'
                      : isEven
                      ? 'bg-cyan-950/70 border-cyan-500/30 text-cyan-300'
                      : 'bg-amber-950/70 border-amber-500/30 text-amber-300'
                  }`}
                  title={`Digit: ${digit} (${isEven ? 'Even' : 'Odd'}, ${isHigh ? 'High' : 'Low'})`}
                >
                  {digit}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Dual Column: Even/Odd Engine + Over/Under Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Even vs. Odd Engine */}
        <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Even vs. Odd Parity Engine
              </span>
              <span className="text-xs font-mono text-slate-400">
                Streak: <span className="text-cyan-400 font-bold">{currentAnalysis?.currentStreakCount || 0} {currentAnalysis?.currentStreakType}</span>
              </span>
            </div>

            {/* Split Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 font-bold">EVEN: {stats?.evenPercent || 50}% ({stats?.evenCount || 0})</span>
                <span className="text-amber-400 font-bold">ODD: {stats?.oddPercent || 50}% ({stats?.oddCount || 0})</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${stats?.evenPercent || 50}%` }}
                />
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${stats?.oddPercent || 50}%` }}
                />
              </div>
            </div>

            {/* Streak Alert Card */}
            <div className="mt-4 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-200 font-medium">
                <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  {currentAnalysis && currentAnalysis.currentStreakCount >= 4 ? (
                    <strong className="text-emerald-400">
                      Mean-Reversion Signal: {currentAnalysis.currentStreakCount} consecutive {currentAnalysis.currentStreakType} ticks. High probability reversal to {currentAnalysis.currentStreakType === 'EVEN' ? 'ODD' : 'EVEN'}.
                    </strong>
                  ) : (
                    <span>Parity equilibrium balanced. Normal oscillation between Even and Odd digits.</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Over / Under Threshold Matrix */}
        <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Over / Under Probability Edge
            </span>
            <span className="text-xs font-mono text-slate-400">Window: {tickWindow} Ticks</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { threshold: 2, type: 'OVER', label: 'Over 2 (>2)', pct: stats?.overStats[2] || 0 },
              { threshold: 3, type: 'OVER', label: 'Over 3 (>3)', pct: stats?.overStats[3] || 0 },
              { threshold: 6, type: 'UNDER', label: 'Under 7 (<7)', pct: stats?.underStats[7] || 0 },
              { threshold: 7, type: 'UNDER', label: 'Under 8 (<8)', pct: stats?.underStats[8] || 0 }
            ].map((item, idx) => {
              const isAdvantage = item.pct >= 75.0;

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                    isAdvantage
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-[11px] font-semibold flex items-center justify-between">
                    <span>{item.label}</span>
                    {item.type === 'OVER' ? (
                      <ArrowUpRight className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-amber-400" />
                    )}
                  </div>
                  <div className="mt-1 flex items-baseline justify-between font-mono">
                    <span className="text-base font-extrabold tabular-nums">{item.pct}%</span>
                    {isAdvantage && (
                      <span className="text-[9px] font-bold text-emerald-400 uppercase">EDGE</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
