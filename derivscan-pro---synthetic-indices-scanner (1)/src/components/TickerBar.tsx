import React from 'react';
import { TrendingUp, TrendingDown, Lock } from 'lucide-react';
import { useScanner } from '../context/ScannerContext';
import { useAuth } from '../context/AuthContext';
import { SYNTHETIC_MARKETS } from '../types/scanner';

export const TickerBar: React.FC = () => {
  const {
    selectedSymbol,
    setSelectedSymbol,
    analyses,
    latestFlashTick,
    triggerUpgradePrompt
  } = useScanner();

  const { isProOrHigher } = useAuth();

  return (
    <div className="w-full bg-[#0C121E] border-b border-slate-800/80 overflow-x-auto py-2 px-4 scrollbar-none">
      <div className="flex items-center gap-2.5 min-w-max">
        {SYNTHETIC_MARKETS.map((market) => {
          const analysis = analyses[market.symbol];
          const isSelected = selectedSymbol === market.symbol;
          const isLocked = market.isProOnly && !isProOrHigher;
          const quote = analysis ? analysis.currentQuote.toFixed(market.decimals) : '---';
          const lastDigit = analysis !== undefined ? analysis.lastDigit : '-';
          const change = analysis ? analysis.ticks24hChange : 0;
          const isUp = change >= 0;

          const isFlashing = latestFlashTick?.symbol === market.symbol;
          const flashClass = isFlashing
            ? latestFlashTick.direction === 'UP'
              ? 'tick-flash-up border-emerald-500/60'
              : 'tick-flash-down border-rose-500/60'
            : '';

          return (
            <button
              key={market.symbol}
              onClick={() => {
                if (isLocked) {
                  triggerUpgradePrompt('MONTHLY');
                } else {
                  setSelectedSymbol(market.symbol);
                }
              }}
              className={`relative flex items-center gap-3 px-3 py-1.5 rounded-lg border transition-all text-xs font-mono select-none ${flashClass} ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-500/10 text-white'
                  : 'bg-slate-900/60 border-slate-800/70 hover:border-slate-700 text-slate-300'
              } ${isLocked ? 'opacity-70' : ''}`}
            >
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-200">{market.name.replace(' Index', '')}</span>
                  {isLocked && <Lock className="w-3 h-3 text-amber-400" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="tabular-nums font-bold text-slate-100">{quote}</span>
                  <span
                    className={`flex items-center gap-0.5 text-[10px] tabular-nums ${
                      isUp ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    <span>{change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`}</span>
                  </span>
                </div>
              </div>

              {/* Digit highlight bubble */}
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs tabular-nums border ${
                  lastDigit !== '-' && typeof lastDigit === 'number' && lastDigit % 2 === 0
                    ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                    : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                }`}
              >
                {lastDigit}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
