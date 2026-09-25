import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Eye, Filter, Lock } from 'lucide-react';
import { useScanner } from '../context/ScannerContext';
import { useAuth } from '../context/AuthContext';
import { SYNTHETIC_MARKETS, MarketCategory } from '../types/scanner';

export const MarketScreener: React.FC = () => {
  const { analyses, setSelectedSymbol, setActiveTab, triggerUpgradePrompt } = useScanner();
  const { isProOrHigher } = useAuth();
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filtered = SYNTHETIC_MARKETS.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.symbol.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Header & Screener Search/Filter Bar */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Synthetic Indices Market Screener</span>
          </h3>
          <p className="text-xs text-slate-400">
            Parallel real-time tracking across all 20 Volatility, Boom/Crash & Step markets
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search symbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-48"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'VOLATILITY', label: 'Volatility' },
              { id: 'VOLATILITY_1S', label: '1s Indices' },
              { id: 'BOOM_CRASH', label: 'Boom & Crash' },
              { id: 'STEP_JUMP', label: 'Step & Jump' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  categoryFilter === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* High-density Screener Table */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] bg-slate-950/50">
                <th className="py-3 px-4">Market Symbol</th>
                <th className="py-3 px-3">Live Quote</th>
                <th className="py-3 px-3">24h Change</th>
                <th className="py-3 px-3">RSI (14)</th>
                <th className="py-3 px-3">Trend Momentum</th>
                <th className="py-3 px-3">Hot / Cold Digits</th>
                <th className="py-3 px-3">Even / Odd %</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((market) => {
                const analysis = analyses[market.symbol];
                const isLocked = market.isProOnly && !isProOrHigher;
                const quote = analysis?.currentQuote.toFixed(market.decimals) || '---';
                const change = analysis?.ticks24hChange || 0;
                const rsi = analysis?.rsi14 || 50;
                const trend = analysis?.trend || 'NEUTRAL';
                const isUp = change >= 0;
                const hotDigits = analysis?.stats50?.hotDigits?.join(', ') || '-';
                const coldDigits = analysis?.stats50?.coldDigits?.join(', ') || '-';
                const evenPct = analysis?.stats50?.evenPercent || 50;
                const oddPct = analysis?.stats50?.oddPercent || 50;

                return (
                  <tr key={market.symbol} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{market.name}</span>
                        {isLocked && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <span className="text-[10px] text-slate-400">{market.category}</span>
                    </td>

                    <td className="py-3 px-3 font-extrabold text-slate-100 tabular-nums">
                      {quote}
                    </td>

                    <td className="py-3 px-3 tabular-nums">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          isUp ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 tabular-nums">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          rsi >= 70
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                            : rsi <= 30
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                            : 'text-slate-300'
                        }`}
                      >
                        {rsi.toFixed(1)}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          trend.includes('BULLISH')
                            ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30'
                            : trend.includes('BEARISH')
                            ? 'bg-rose-950/70 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {trend.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-[11px]">
                      <span className="text-emerald-400 font-bold">H: {hotDigits}</span>
                      <span className="text-slate-600 mx-1">·</span>
                      <span className="text-amber-400 font-bold">C: {coldDigits}</span>
                    </td>

                    <td className="py-3 px-3 text-[11px] tabular-nums">
                      <span className="text-cyan-400 font-bold">{evenPct}% E</span>
                      <span className="text-slate-600 mx-1">/</span>
                      <span className="text-amber-400 font-bold">{oddPct}% O</span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (isLocked) {
                            triggerUpgradePrompt('MONTHLY');
                          } else {
                            setSelectedSymbol(market.symbol);
                            setActiveTab('SCANNER');
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition-all"
                      >
                        {isLocked ? 'Unlock' : 'Analyze'}
                      </button>
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
