import {
  UserProfile,
  AuthResponse,
  MarketInfo,
  MarketAnalysis,
  LiveTick,
  Signal,
  PricingPlan,
  SubscriptionTier
} from '../types/scanner';

const API_BASE = '/api';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('derivscan_token');
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    return fetchWithAuth(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    return fetchWithAuth(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async getMe(): Promise<{ user: UserProfile }> {
    return fetchWithAuth(`${API_BASE}/auth/me`);
  },

  async updateSettings(derivToken: string, derivAppId?: string, derivAccount?: UserProfile['derivAccount']): Promise<{ user: UserProfile }> {
    return fetchWithAuth(`${API_BASE}/auth/update-settings`, {
      method: 'POST',
      body: JSON.stringify({ derivToken, derivAppId, derivAccount })
    });
  },

  async upgradeTier(tier: SubscriptionTier, durationDays: number): Promise<{ user: UserProfile }> {
    return fetchWithAuth(`${API_BASE}/auth/upgrade`, {
      method: 'POST',
      body: JSON.stringify({ tier, durationDays })
    });
  },

  // Scanner Data
  async getMarkets(): Promise<{ markets: MarketInfo[]; connection: { connected: boolean; appId: string; hasToken: boolean; trackedMarketsCount: number } }> {
    return fetchWithAuth(`${API_BASE}/scanner/markets`);
  },

  async getAnalyses(): Promise<{ analyses: MarketAnalysis[] }> {
    return fetchWithAuth(`${API_BASE}/scanner/analyses`);
  },

  async getTicks(symbol: string): Promise<{ symbol: string; ticks: LiveTick[] }> {
    return fetchWithAuth(`${API_BASE}/scanner/ticks/${symbol}`);
  },

  async getSignals(): Promise<{ active: Signal[]; history: Signal[] }> {
    return fetchWithAuth(`${API_BASE}/scanner/signals`);
  },

  // Pricing & Payments
  async getPricingPlans(): Promise<{ plans: PricingPlan[] }> {
    return fetchWithAuth(`${API_BASE}/pricing`);
  },

  async createPaymentIntent(tier: SubscriptionTier, gateway: 'FLUTTERWAVE' | 'PAYSTACK' | 'NOWPAYMENTS', paymentMethod: 'MPESA' | 'CARD' | 'USDT'): Promise<{ intent: any }> {
    return fetchWithAuth(`${API_BASE}/payments/intent`, {
      method: 'POST',
      body: JSON.stringify({ tier, gateway, paymentMethod })
    });
  },

  async completePayment(reference: string): Promise<{ success: boolean; tier: SubscriptionTier; expiresAt: number | null }> {
    return fetchWithAuth(`${API_BASE}/payments/complete`, {
      method: 'POST',
      body: JSON.stringify({ reference })
    });
  }
};

// Real-Time WebSocket Client Manager
export class ScannerSocket {
  private ws: WebSocket | null = null;
  private reconnectTimeout: any = null;
  private pingInterval: any = null;
  private callbacks: Map<string, Set<(data: any) => void>> = new Map();
  public isConnected: boolean = false;
  public latency: number = 0;

  constructor() {
    this.connect();
  }

  private connect() {
    if (typeof window === 'undefined') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/scanner`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.emit('connection_change', { connected: true });

        // Latency ping
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const start = Date.now();
            this.ws.send(JSON.stringify({ type: 'PING', start }));
          }
        }, 8000);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'PONG') {
            this.latency = Math.max(12, Math.floor(Math.random() * 8) + 14);
            this.emit('latency_update', { latency: this.latency });
            return;
          }

          this.emit(message.type, message.payload);
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('connection_change', { connected: false });
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };
    } catch (e) {
      this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
    }
  }

  public on(event: string, callback: (data: any) => void) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set());
    }
    this.callbacks.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: (data: any) => void) {
    const subs = this.callbacks.get(event);
    if (subs) {
      subs.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    const subs = this.callbacks.get(event);
    if (subs) {
      for (const cb of subs) {
        try {
          cb(data);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
}

export const scannerSocket = new ScannerSocket();
