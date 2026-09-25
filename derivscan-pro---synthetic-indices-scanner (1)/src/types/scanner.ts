export type MarketCategory = 'VOLATILITY' | 'VOLATILITY_1S' | 'BOOM_CRASH' | 'STEP_JUMP';

export interface MarketInfo {
  symbol: string;
  name: string;
  category: MarketCategory;
  decimals: number;
  description: string;
  isProOnly?: boolean;
}

export const SYNTHETIC_MARKETS: MarketInfo[] = [
  { symbol: 'R_10', name: 'Volatility 10 Index', category: 'VOLATILITY', decimals: 3, description: 'Simulates volatility of 10% with constant variance' },
  { symbol: 'R_25', name: 'Volatility 25 Index', category: 'VOLATILITY', decimals: 3, description: 'Simulates volatility of 25% with constant variance' },
  { symbol: 'R_50', name: 'Volatility 50 Index', category: 'VOLATILITY', decimals: 4, description: 'Simulates volatility of 50% with constant variance' },
  { symbol: 'R_75', name: 'Volatility 75 Index', category: 'VOLATILITY', decimals: 4, description: 'Simulates volatility of 75% with constant variance', isProOnly: true },
  { symbol: 'R_100', name: 'Volatility 100 Index', category: 'VOLATILITY', decimals: 2, description: 'Simulates volatility of 100% with high variance', isProOnly: true },
  
  { symbol: '1HZ10V', name: 'Volatility 10 (1s)', category: 'VOLATILITY_1S', decimals: 2, description: '1-second tick interval at 10% volatility' },
  { symbol: '1HZ25V', name: 'Volatility 25 (1s)', category: 'VOLATILITY_1S', decimals: 2, description: '1-second tick interval at 25% volatility' },
  { symbol: '1HZ50V', name: 'Volatility 50 (1s)', category: 'VOLATILITY_1S', decimals: 2, description: '1-second tick interval at 50% volatility', isProOnly: true },
  { symbol: '1HZ75V', name: 'Volatility 75 (1s)', category: 'VOLATILITY_1S', decimals: 2, description: '1-second tick interval at 75% volatility', isProOnly: true },
  { symbol: '1HZ100V', name: 'Volatility 100 (1s)', category: 'VOLATILITY_1S', decimals: 2, description: '1-second tick interval at 100% volatility', isProOnly: true },
  
  { symbol: 'BOOM300', name: 'Boom 300 Index', category: 'BOOM_CRASH', decimals: 4, description: 'Spikes on average every 300 ticks', isProOnly: true },
  { symbol: 'BOOM500', name: 'Boom 500 Index', category: 'BOOM_CRASH', decimals: 4, description: 'Spikes on average every 500 ticks' },
  { symbol: 'BOOM1000', name: 'Boom 1000 Index', category: 'BOOM_CRASH', decimals: 4, description: 'Spikes on average every 1000 ticks', isProOnly: true },
  { symbol: 'CRASH300', name: 'Crash 300 Index', category: 'BOOM_CRASH', decimals: 4, description: 'Drops on average every 300 ticks', isProOnly: true },
  { symbol: 'CRASH500', name: 'Crash 500 Index', category: 'BOOM_CRASH', decimals: 4, description: 'Drops on average every 500 ticks' },
  { symbol: 'CRASH1000', name: 'Crash 1000 Index', category: 'BOOM_CRASH', decimals: 4, description: 'Drops on average every 1000 ticks', isProOnly: true },
  
  { symbol: 'stpRNG', name: 'Step Index', category: 'STEP_JUMP', decimals: 1, description: 'Steps up or down with equal probability 0.1 size', isProOnly: true },
  { symbol: 'JD10', name: 'Jump 10 Index', category: 'STEP_JUMP', decimals: 2, description: 'Jump index with average 3 jumps per hour', isProOnly: true },
  { symbol: 'JD50', name: 'Jump 50 Index', category: 'STEP_JUMP', decimals: 2, description: 'Jump index with average 50 jumps per hour', isProOnly: true },
  { symbol: 'JD100', name: 'Jump 100 Index', category: 'STEP_JUMP', decimals: 2, description: 'Jump index with average 100 jumps per hour', isProOnly: true }
];

export interface LiveTick {
  symbol: string;
  quote: number;
  epoch: number;
  lastDigit: number;
  change: number; // Quote delta from previous tick
  changePercent: number;
  pipString: string;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface DigitWindowStats {
  sampleSize: number; // 25, 50, 100
  counts: Record<number, number>; // 0 to 9 counts
  percentages: Record<number, number>; // 0 to 9 percentages (e.g. 18.5)
  hotDigits: number[]; // Top 2 highest frequency
  coldDigits: number[]; // Top 2 lowest frequency
  evenCount: number;
  oddCount: number;
  evenPercent: number;
  oddPercent: number;
  overStats: Record<number, number>; // Over 0..8 percentage
  underStats: Record<number, number>; // Under 1..9 percentage
}

export interface MarketAnalysis {
  symbol: string;
  currentQuote: number;
  lastDigit: number;
  lastDigitsHistory: number[]; // Last 30 digits
  ticks24hChange: number;
  rsi14: number;
  ema9: number;
  ema21: number;
  trend: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  stats25: DigitWindowStats;
  stats50: DigitWindowStats;
  stats100: DigitWindowStats;
  currentEvenStreak: number;
  currentOddStreak: number;
  currentStreakType: 'EVEN' | 'ODD' | 'NONE';
  currentStreakCount: number;
  consecutiveDigitStreak: { digit: number; count: number };
  boomCrashSpikeStatus?: {
    ticksSinceLastSpike: number;
    probabilityOfImminentSpike: number;
    recommendedAction: 'ACCUMULATING' | 'SPIKE_WATCH' | 'SCALP_CLEAR';
  };
  lastUpdated: number;
}

export type SignalType = 'RISE_FALL' | 'MATCHES_DIFFERS' | 'OVER_UNDER' | 'EVEN_ODD' | 'SPIKE_HUNTER';

export interface Signal {
  id: string;
  symbol: string;
  marketName: string;
  type: SignalType;
  action: 'BUY_RISE' | 'BUY_FALL' | 'DIFFERS' | 'MATCHES' | 'OVER' | 'UNDER' | 'EVEN' | 'ODD' | 'SPIKE_ALERT';
  targetDigit?: number;
  prediction: string;
  probability: number; // e.g. 92.4%
  confidence: 'ULTRA_HIGH' | 'HIGH' | 'MODERATE';
  entryPrice: number;
  targetTicks: number;
  reason: string;
  timestamp: number;
  expiresAt: number;
  status: 'ACTIVE' | 'WON' | 'LOST' | 'EXPIRED';
  resultDigit?: number;
  exitPrice?: number;
  isProOnly: boolean;
}

export type SubscriptionTier = 'FREE' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  tier: SubscriptionTier;
  tierExpiresAt: number | null;
  createdAt: number;
  derivToken?: string;
  derivAppId?: string;
  derivAccount?: {
    loginid: string;
    balance: number;
    currency: string;
    isVirtual: boolean;
  };
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface PricingPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  billingPeriod: string;
  description: string;
  badge?: string;
  features: string[];
  restrictedFeatures: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'FREE',
    name: 'Starter Free',
    price: 0,
    currency: 'USD',
    billingPeriod: 'Forever Free',
    description: 'Basic synthetic scanner for casual traders testing digit trends.',
    features: [
      'Access to Volatility 10, 25 & 50',
      'Basic 25-tick digit frequency analyzer',
      'Even vs. Odd basic ratio',
      'Standard web UI with delayed alerts'
    ],
    restrictedFeatures: [
      'Volatility 75, 100 & (1s) Indices',
      'Boom & Crash Spike Hunter Engine',
      'Real-time Audio Alert Chimes',
      'Matches / Differs 94%+ High Conviction Signals',
      '1-Click Deriv Bot / Webhook execution'
    ]
  },
  {
    id: 'WEEKLY',
    name: 'Weekly Sprint Pass',
    price: 5,
    currency: 'USD',
    billingPeriod: 'per week',
    description: 'Perfect for short-term testing, scalping sessions, and weekend sprints.',
    features: [
      'All 20+ Synthetic Indices Unlocked',
      'Full 25, 50 & 100 Tick Deep Analytics',
      'Matches / Differs 94%+ Edge Signals',
      'Over / Under Statistical Deviation Alerts',
      'Real-time Web Audio Alert Chimes',
      'Fast 1s Market Screener'
    ],
    restrictedFeatures: [
      'Dedicated Strategy Bot Payload Generator',
      'Yearly VIP Private Discord Signal Channel'
    ]
  },
  {
    id: 'MONTHLY',
    name: 'Pro Trader Monthly',
    price: 15,
    currency: 'USD',
    billingPeriod: 'per month',
    description: 'Our most popular tier for full-time synthetic indices traders.',
    badge: 'MOST POPULAR',
    features: [
      'Everything in Weekly Pass',
      'Boom & Crash Spike Hunter Radar',
      'EMA 9/21 + RSI(14) Trend Cross Signals',
      'Consecutive Streak Mean-Reversion Alerts',
      'Deriv API Direct Account Connection',
      'Export Historical Scanner Data to CSV',
      'Priority WebSocket push with <20ms latency'
    ],
    restrictedFeatures: [
      '1-on-1 Trading Strategy Customization'
    ]
  },
  {
    id: 'YEARLY',
    name: 'Institutional VIP',
    price: 100,
    currency: 'USD',
    billingPeriod: 'per year',
    description: 'Complete institutional access, VIP trading bots, and max cost savings.',
    badge: 'SAVE 45%',
    features: [
      'All Pro Features Unlocked (Full 1 Year)',
      'Automated Deriv Bot Webhook Payload Execution',
      'Custom Strategy Rules & Alert Webhooks',
      'Multi-device simultaneous active connections',
      'VIP Priority Support & Strategy Guides',
      'Lifetime updates for all new synthetic index models'
    ],
    restrictedFeatures: []
  }
];

export interface PaymentWebhookData {
  gateway: 'FLUTTERWAVE' | 'PAYSTACK' | 'NOWPAYMENTS';
  transactionId: string;
  email: string;
  tier: SubscriptionTier;
  amount: number;
  currency: string;
  paymentMethod: 'MPESA' | 'CARD' | 'USDT' | 'CRYPTO';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  metadata?: Record<string, unknown>;
}
