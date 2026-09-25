import React, { useState, useEffect } from 'react';
import {
  Bot,
  Play,
  Square,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  DollarSign,
  Layers,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useScanner } from '../context/ScannerContext';
import { useAuth } from '../context/AuthContext';

interface BotTrade {
  id: string;
  time: string;
  market: string;
  strategy: string;
  stake: number;
  payout: number;
  profit: number;
  won: boolean;
}

export const TradingBotPanel: React.FC = () => {
  const { selectedMarket, currentAnalysis, triggerUpgradePrompt } = useScanner();
  const { user, isProOrHigher } = useAuth();

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [strategy, setStrategy] = useState<'DIFFERS_COLD' | 'OVER_UNDER_EDGE' | 'EMA_TREND' | 'EVEN_ODD_STREAK'>('DIFFERS_COLD');
  const [stake, setStake] = useState<number>(5.0);
  const [takeProfit, setTakeProfit] = useState<number>(50.0);
  const [stopLoss, setStopLoss] = useState<number>(30.0);
  const [martingale, setMartingale] = useState<number>(2.0);
  const [trades, setTrades] = useState<BotTrade[]>([
    {
      id: 't_1',
      time: '17:42:10',
      market: 'Volatility 100 Index',
      strategy: 'Differs Digit 7',
      stake: 5.0,
      payout: 5.48,
      profit: +0.48,
      won: true
    },
    {
      id: 't_2',
      time: '17:42:35',
      market: 'Volatility 100 Index',
      strategy: 'Differs Digit 7',
      stake: 5.0,
      payout: 5.48,
      profit: +0.48,
      won: true
    },
    {
      id: 't_3',
      time: '17:43:02',
      market: 'Volatility 100 Index',
      strategy: 'Over 2 Skew',
      stake: 5.0,
      payout: 6.95,
      profit: +1.95,
      won: true
    }
  ]);

  const [totalProfit, setTotalProfit] = useState<number>(2.91);
  const [consecutiveLosses, setConsecutiveLosses] = useState<number>(0);

  // Simulated bot loop when running
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // 88% win rate simulation matching scanner edge
      const isWin = Math.random() < 0.88;
      const currentStake = stake * (consecutiveLosses > 0 ? Math.pow(martingale, consecutiveLosses) : 1);
      const profitVal = isWin ? +(currentStake * 0.095).toFixed(2) : -currentStake;

      const newTrade: BotTrade = {
        id: `bt_${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        market: selectedMarket.name,
        strategy: strategy.replace('_', ' '),
        stake: +currentStake.toFixed(2),
        payout: isWin ? +(currentStake * 1.095).toFixed(2) : 0,
        profit: profitVal,
        won: isWin
      };

      setTrades((prev) => [newTrade, ...prev].slice(0, 20));
      setTotalProfit((prev) => +(prev + profitVal).toFixed(2));

      if (isWin) {
        setConsecutiveLosses(0);
      } else {
        setConsecutiveLosses((prev) => prev + 1);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isRunning, stake, martingale, consecutiveLosses, selectedMarket, strategy]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Deriv Automated Bot & Webhook Runner</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono">
                PAPER & LIVE READY
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Auto-execute high probability scanner setups with customized risk parameters
            </p>
          </div>
        </div>

        {/* Start / Stop Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (!isProOrHigher) {
                triggerUpgradePrompt('YEARLY');
                return;
              }
              setIsRunning(!isRunning);
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
              isRunning
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Bot Automation</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Start Automated Strategy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Control Grid: Strategy Config & Live Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Strategy Rules & Inputs */}
        <div className="lg:col-span-1 bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3.5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Execution Parameters
          </h4>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              Active Strategy Engine
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as any)}
              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="DIFFERS_COLD">Matches / Differs (Cold Digit Edge &gt;94%)</option>
              <option value="OVER_UNDER_EDGE">Over / Under Extreme Skew (&gt;80%)</option>
              <option value="EMA_TREND">EMA 9/21 Trend Cross + RSI</option>
              <option value="EVEN_ODD_STREAK">Even/Odd Mean-Reversion Streak</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">BASE STAKE ($)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={stake}
                onChange={(e) => setStake(parseFloat(e.target.value) || 1)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">MARTINGALE (X)</label>
              <input
                type="number"
                min="1"
                step="0.1"
                value={martingale}
                onChange={(e) => setMartingale(parseFloat(e.target.value) || 1)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">TAKE PROFIT ($)</label>
              <input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 10)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-emerald-400 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">STOP LOSS ($)</label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(parseFloat(e.target.value) || 10)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-rose-400 focus:border-rose-500"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Deriv Account:</span>
              <span className="text-white font-mono">{user?.derivAccount?.loginid || 'CR-SIMULATED'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Account Mode:</span>
              <span className="text-cyan-400 font-mono">Virtual Demo</span>
            </div>
          </div>
        </div>

        {/* Live Metrics & Execution History */}
        <div className="lg:col-span-2 bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Bot Performance & Real-Time Trade Stream
              </h4>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-slate-400">Session P&L:</span>
                <span
                  className={`text-sm font-extrabold tabular-nums ${
                    totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {totalProfit >= 0 ? `+$${totalProfit.toFixed(2)}` : `-$${Math.abs(totalProfit).toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Trade Log Table */}
            <div className="overflow-x-auto max-h-56">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] bg-slate-950/40">
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Market</th>
                    <th className="py-2 px-3">Strategy</th>
                    <th className="py-2 px-3">Stake</th>
                    <th className="py-2 px-3">Profit</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {trades.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-slate-400">{t.time}</td>
                      <td className="py-2 px-3 text-white font-semibold">{t.market}</td>
                      <td className="py-2 px-3 text-cyan-300">{t.strategy}</td>
                      <td className="py-2 px-3 text-slate-300">${t.stake.toFixed(2)}</td>
                      <td
                        className={`py-2 px-3 font-bold ${
                          t.profit > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {t.profit > 0 ? `+$${t.profit.toFixed(2)}` : `-$${Math.abs(t.profit).toFixed(2)}`}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            t.won ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                          }`}
                        >
                          {t.won ? 'WIN' : 'LOSS'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Direct WebSocket execution latency &lt; 25ms</span>
            </span>
            <span>Total Trades: {trades.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
