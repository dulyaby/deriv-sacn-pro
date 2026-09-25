import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  Zap
} from 'lucide-react';
import { useScanner } from '../context/ScannerContext';
import { LiveTick } from '../types/scanner';

export const ChartPanel: React.FC = () => {
  const { selectedMarket, currentAnalysis, ticks } = useScanner();
  const [chartMode, setChartMode] = useState<'LINE' | 'CANDLE'>('LINE');
  const [showIndicators, setShowIndicators] = useState<boolean>(true);

  const quoteList = useMemo(() => (ticks || []).map((t) => t.quote), [ticks]);
  const minPrice = useMemo(() => (quoteList.length ? Math.min(...quoteList) : 100), [quoteList]);
  const maxPrice = useMemo(() => (quoteList.length ? Math.max(...quoteList) : 200), [quoteList]);
  const priceRange = maxPrice - minPrice || 1;

  // EMA calculations
  const calculateEMAPoints = (quotes: number[], period: number) => {
    if (!quotes || quotes.length === 0) return [];
    const k = 2 / (period + 1);
    let ema = quotes[0];
    const results: number[] = [];
    for (let i = 0; i < quotes.length; i++) {
      ema = quotes[i] * k + ema * (1 - k);
      results.push(ema);
    }
    return results;
  };

  const ema9Series = useMemo(() => calculateEMAPoints(quoteList, 9), [quoteList]);
  const ema21Series = useMemo(() => calculateEMAPoints(quoteList, 21), [quoteList]);

  // Aggregate ticks into mock 5-tick candles for candle mode
  const candles = useMemo(() => {
    const list = [];
    const safeTicks = ticks || [];
    const step = 4;
    for (let i = 0; i < safeTicks.length; i += step) {
      const slice = safeTicks.slice(i, i + step);
      if (slice.length === 0) continue;
      const quotes = slice.map((s) => s.quote);
      list.push({
        open: quotes[0],
        close: quotes[quotes.length - 1],
        high: Math.max(...quotes),
        low: Math.min(...quotes),
        time: slice[slice.length - 1]?.epoch || Date.now()
      });
    }
    return list;
  }, [ticks]);

  // Normalized SVG coordinates
  const svgWidth = 800;
  const svgHeight = 240;
  const paddingY = 20;

  const getY = (val: number) => {
    return svgHeight - paddingY - ((val - minPrice) / priceRange) * (svgHeight - paddingY * 2);
  };

  const getX = (index: number, total: number) => {
    if (total <= 1) return 0;
    return (index / (total - 1)) * (svgWidth - 20) + 10;
  };

  const linePath = useMemo(() => {
    if (quoteList.length < 2) return '';
    return quoteList
      .map((q, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, quoteList.length)} ${getY(q)}`)
      .join(' ');
  }, [quoteList, minPrice, maxPrice]);

  const ema9Path = useMemo(() => {
    if (ema9Series.length < 2) return '';
    return ema9Series
      .map((q, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, ema9Series.length)} ${getY(q)}`)
      .join(' ');
  }, [ema9Series, minPrice, maxPrice]);

  const ema21Path = useMemo(() => {
    if (ema21Series.length < 2) return '';
    return ema21Series
      .map((q, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, ema21Series.length)} ${getY(q)}`)
      .join(' ');
  }, [ema21Series, minPrice, maxPrice]);

  const areaPath = useMemo(() => {
    if (!linePath) return '';
    return `${linePath} L ${svgWidth - 10} ${svgHeight} L 10 ${svgHeight} Z`;
  }, [linePath]);

  const latestQuote = currentAnalysis?.currentQuote || (quoteList[quoteList.length - 1] ?? 0);
  const rsi = currentAnalysis?.rsi14 || 50;
  const trend = currentAnalysis?.trend || 'NEUTRAL';

  const isBullish = trend.includes('BULLISH');
  const isBearish = trend.includes('BEARISH');

  return (
    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white">{selectedMarket.name}</span>
            <span className="text-xs font-mono text-slate-400">({selectedMarket.symbol})</span>
          </div>

          <div
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
              isBullish
                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                : isBearish
                ? 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
                : 'bg-slate-800 border border-slate-700 text-slate-300'
            }`}
          >
            {isBullish ? <TrendingUp className="w-3.5 h-3.5" /> : isBearish ? <TrendingDown className="w-3.5 h-3.5" /> : null}
            <span>{trend.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setChartMode('LINE')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                chartMode === 'LINE' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tick Stream
            </button>
            <button
              onClick={() => setChartMode('CANDLE')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                chartMode === 'CANDLE' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Candlesticks
            </button>
          </div>

          {/* Indicators Toggle */}
          <button
            onClick={() => setShowIndicators(!showIndicators)}
            className={`p-1.5 rounded-lg border transition-all text-xs font-semibold flex items-center gap-1.5 ${
              showIndicators
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EMA 9/21</span>
          </button>
        </div>
      </div>

      {/* Main Real-time Chart Canvas */}
      <div className="relative w-full h-64 bg-[#090D14] rounded-xl border border-slate-800/80 overflow-hidden select-none">
        {/* Price telemetry badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-3 text-xs font-mono">
          <div className="bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-md backdrop-blur-sm">
            <span className="text-slate-400 text-[10px] block">LIVE QUOTE</span>
            <span className="text-base font-bold text-white tabular-nums">
              {latestQuote.toFixed(selectedMarket.decimals)}
            </span>
          </div>

          {showIndicators && (
            <>
              <div className="bg-slate-900/90 border border-cyan-500/40 px-2 py-1 rounded-md text-cyan-300">
                <span className="text-[10px] text-cyan-400 block">EMA (9)</span>
                <span className="font-bold tabular-nums">
                  {currentAnalysis?.ema9.toFixed(selectedMarket.decimals) ?? '-'}
                </span>
              </div>
              <div className="bg-slate-900/90 border border-amber-500/40 px-2 py-1 rounded-md text-amber-300">
                <span className="text-[10px] text-amber-400 block">EMA (21)</span>
                <span className="font-bold tabular-nums">
                  {currentAnalysis?.ema21.toFixed(selectedMarket.decimals) ?? '-'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Max & Min price guide markers */}
        <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-500 tabular-nums">
          MAX: {maxPrice.toFixed(selectedMarket.decimals)}
        </div>
        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 tabular-nums">
          MIN: {minPrice.toFixed(selectedMarket.decimals)}
        </div>

        {/* SVG Drawing */}
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full preserve-3d" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1={svgHeight * 0.25} x2={svgWidth} y2={svgHeight * 0.25} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="0.8" />
          <line x1="0" y1={svgHeight * 0.5} x2={svgWidth} y2={svgHeight * 0.5} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="0.8" />
          <line x1="0" y1={svgHeight * 0.75} x2={svgWidth} y2={svgHeight * 0.75} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="0.8" />

          {chartMode === 'LINE' ? (
            <>
              {/* Area gradient under curve */}
              {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

              {/* EMA 21 line */}
              {showIndicators && ema21Path && (
                <path d={ema21Path} fill="none" stroke="#f59e0b" strokeWidth="1.6" strokeDasharray="4 2" />
              )}

              {/* EMA 9 line */}
              {showIndicators && ema9Path && (
                <path d={ema9Path} fill="none" stroke="#06b6d4" strokeWidth="1.8" />
              )}

              {/* Primary Quote Line */}
              {linePath && <path d={linePath} fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />}

              {/* Last tick pulse dot */}
              {quoteList.length > 0 && (
                <circle
                  cx={getX(quoteList.length - 1, quoteList.length)}
                  cy={getY(quoteList[quoteList.length - 1])}
                  r="4.5"
                  className="fill-cyan-400 animate-pulse"
                />
              )}
            </>
          ) : (
            // Candlestick View
            <g>
              {candles.map((c, i) => {
                const isGreen = c.close >= c.open;
                const candleWidth = Math.max(4, Math.floor((svgWidth - 40) / candles.length) - 3);
                const x = getX(i, candles.length);
                const yHigh = getY(c.high);
                const yLow = getY(c.low);
                const yOpen = getY(c.open);
                const yClose = getY(c.close);
                const topY = Math.min(yOpen, yClose);
                const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

                return (
                  <g key={i}>
                    {/* Wick */}
                    <line
                      x1={x}
                      y1={yHigh}
                      x2={x}
                      y2={yLow}
                      stroke={isGreen ? '#10b981' : '#ef4444'}
                      strokeWidth="1.2"
                    />
                    {/* Body */}
                    <rect
                      x={x - candleWidth / 2}
                      y={topY}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={isGreen ? '#10b981' : '#ef4444'}
                      rx="1"
                    />
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* RSI (14) Sub-Oscillator Panel */}
      <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">RSI (14) Momentum:</span>
            <span
              className={`font-bold tabular-nums ${
                rsi >= 70 ? 'text-rose-400' : rsi <= 30 ? 'text-emerald-400' : 'text-cyan-400'
              }`}
            >
              {rsi.toFixed(1)}
            </span>
            <span className="text-slate-500">
              {rsi >= 70 ? '(Overbought)' : rsi <= 30 ? '(Oversold Bounce)' : '(Neutral Zone)'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>30: Oversold</span>
            <span>50: Midline</span>
            <span>70: Overbought</span>
          </div>
        </div>

        {/* RSI Meter Bar */}
        <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              rsi >= 70 ? 'bg-rose-500' : rsi <= 30 ? 'bg-emerald-500' : 'bg-cyan-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, rsi))}%` }}
          />
          {/* 30 and 70 marker lines */}
          <div className="absolute top-0 bottom-0 left-[30%] border-r border-slate-700/80 border-dashed" />
          <div className="absolute top-0 bottom-0 left-[70%] border-r border-slate-700/80 border-dashed" />
        </div>
      </div>
    </div>
  );
};
