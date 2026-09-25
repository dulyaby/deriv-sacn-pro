import React, { useState } from 'react';
import {
  X,
  Check,
  Crown,
  Sparkles,
  CreditCard,
  Smartphone,
  Coins,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useScanner } from '../context/ScannerContext';
import { soundManager } from '../services/sound';
import { SubscriptionTier, PRICING_PLANS } from '../types/scanner';

export const SubscriptionModal: React.FC = () => {
  const { user, upgradeTier, activeTier } = useAuth();
  const {
    isSubscriptionModalOpen,
    setIsSubscriptionModalOpen,
    suggestedUpgradeTier
  } = useScanner();

  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(suggestedUpgradeTier || 'MONTHLY');
  const [gateway, setGateway] = useState<'PAYSTACK' | 'FLUTTERWAVE' | 'NOWPAYMENTS'>('PAYSTACK');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'MPESA' | 'USDT'>('CARD');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  if (!isSubscriptionModalOpen) return null;

  const currentPlan = PRICING_PLANS.find((p) => p.id === selectedTier) || PRICING_PLANS[2];

  const handleCheckout = async () => {
    setIsProcessing(true);

    try {
      // Simulate realistic payment gateway processing
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const days = selectedTier === 'WEEKLY' ? 7 : selectedTier === 'YEARLY' ? 365 : 30;
      await upgradeTier(selectedTier, days);

      setIsProcessing(false);
      setPaymentSuccess(true);
      soundManager.playSuccess();

      // Confetti burst
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        setPaymentSuccess(false);
        setIsSubscriptionModalOpen(false);
      }, 2500);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                DerivScan Pro Membership & Monetization Hub
              </h3>
              <p className="text-xs text-slate-400">
                Unlock 94%+ mathematical edge scanner algorithms and synthetic indices radar
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSubscriptionModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {paymentSuccess ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-white">Payment Successful & Plan Activated!</h4>
            <p className="text-sm text-slate-300 max-w-md">
              Congratulations! Your account has been upgraded to <strong>{currentPlan.name}</strong>. Full institutional scanner signals, spike radars, and audio alerts are now unlocked.
            </p>
          </div>
        ) : (
          <div className="p-5 overflow-y-auto space-y-6">
            {/* Plan Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PRICING_PLANS.map((plan) => {
                const isSelected = selectedTier === plan.id;
                const isCurrent = activeTier === plan.id;

                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedTier(plan.id)}
                    className={`relative p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-gradient-to-r from-amber-500 to-emerald-400 text-slate-950 uppercase tracking-tight">
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{plan.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] text-emerald-400 font-semibold font-mono">CURRENT</span>
                        )}
                      </div>

                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white font-mono">${plan.price}</span>
                        <span className="text-[10px] text-slate-400">{plan.billingPeriod}</span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-tight">
                        {plan.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-[11px]">
                      {plan.features.slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-slate-300">
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Payment Gateway Options & Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              {/* Payment Methods */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Select Payment Gateway & Method
                </h4>

                <div className="space-y-2.5">
                  <button
                    onClick={() => {
                      setGateway('PAYSTACK');
                      setPaymentMethod('CARD');
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      gateway === 'PAYSTACK'
                        ? 'bg-slate-800 border-cyan-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-cyan-400" />
                      <div>
                        <div className="text-xs font-bold">Paystack (Debit / Credit Cards)</div>
                        <div className="text-[10px] text-slate-400">Visa, Mastercard, Bank Transfer</div>
                      </div>
                    </div>
                    {gateway === 'PAYSTACK' && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>

                  <button
                    onClick={() => {
                      setGateway('FLUTTERWAVE');
                      setPaymentMethod('MPESA');
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      gateway === 'FLUTTERWAVE'
                        ? 'bg-slate-800 border-emerald-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-emerald-400" />
                      <div>
                        <div className="text-xs font-bold">Flutterwave (M-Pesa & Mobile Money)</div>
                        <div className="text-[10px] text-slate-400">Kenya M-Pesa, Ghana MoMo, Airtel, Nigeria</div>
                      </div>
                    </div>
                    {gateway === 'FLUTTERWAVE' && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>

                  <button
                    onClick={() => {
                      setGateway('NOWPAYMENTS');
                      setPaymentMethod('USDT');
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      gateway === 'NOWPAYMENTS'
                        ? 'bg-slate-800 border-amber-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Coins className="w-5 h-5 text-amber-400" />
                      <div>
                        <div className="text-xs font-bold">NOWPayments (Crypto USDT TRC20/ERC20)</div>
                        <div className="text-[10px] text-slate-400">USDT, USDC, BTC, LTC instant confirmation</div>
                      </div>
                    </div>
                    {gateway === 'NOWPAYMENTS' && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                </div>
              </div>

              {/* Order Summary & Pay Action */}
              <div className="flex flex-col justify-between p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Order Summary
                  </h4>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Selected Plan:</span>
                      <span className="text-white font-bold">{currentPlan.name}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Billing Frequency:</span>
                      <span className="text-white">{currentPlan.billingPeriod}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Account Email:</span>
                      <span className="text-slate-200 truncate max-w-[180px]">{user?.email}</span>
                    </div>

                    <div className="border-t border-slate-800 my-2 pt-2 flex justify-between text-sm font-bold text-white">
                      <span>Total Amount:</span>
                      <span className="text-emerald-400 text-base">${currentPlan.price}.00 USD</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span className="animate-pulse">Processing Payment with {gateway}...</span>
                    ) : (
                      <>
                        <span>Complete Upgrade (${currentPlan.price})</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-slate-500 mt-2 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>256-Bit Encrypted Payment Security & Instant Webhook Activation</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
