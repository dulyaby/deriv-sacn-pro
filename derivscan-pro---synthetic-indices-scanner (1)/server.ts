import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import dotenv from 'dotenv';
import {
  initDerivWebSocket,
  addBroadcastListener,
  removeBroadcastListener,
  getAllMarketAnalyses,
  getMarketAnalysis,
  getMarketTicks,
  getActiveSignals,
  getSignalHistory,
  getDerivConnectionStatus
} from './server/scanner';
import {
  registerUser,
  loginUser,
  getUserById,
  verifyToken,
  upgradeUserTier,
  updateUserDerivSettings
} from './server/auth';
import {
  createPaymentIntent,
  completeMockPayment,
  handlePaymentWebhook
} from './server/payments';
import { SYNTHETIC_MARKETS, PRICING_PLANS } from './src/types/scanner';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());

// API Auth Middleware
function authMiddleware(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  (req as any).user = payload;
  next();
}

// ----------------------------------------------------
// AUTH & USER ROUTES
// ----------------------------------------------------
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    const result = await registerUser(email, password, name);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const result = await loginUser(email, password);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Authentication failed' });
  }
});

app.get('/api/auth/me', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

app.post('/api/auth/update-settings', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { derivToken, derivAppId, derivAccount } = req.body;
    const user = updateUserDerivSettings(userId, derivToken, derivAppId, derivAccount);
    res.json({ user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/upgrade', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { tier, durationDays } = req.body;
    const user = upgradeUserTier(userId, tier, durationDays || 30);
    res.json({ user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// SCANNER & SYNTHETIC DATA ROUTES
// ----------------------------------------------------
app.get('/api/scanner/markets', (req: Request, res: Response) => {
  res.json({
    markets: SYNTHETIC_MARKETS,
    connection: getDerivConnectionStatus()
  });
});

app.get('/api/scanner/analyses', (req: Request, res: Response) => {
  const analyses = getAllMarketAnalyses();
  res.json({ analyses });
});

app.get('/api/scanner/analysis/:symbol', (req: Request, res: Response) => {
  const { symbol } = req.params;
  const analysis = getMarketAnalysis(symbol);
  if (!analysis) {
    return res.status(404).json({ error: 'Market analysis not found for symbol' });
  }
  res.json({ analysis });
});

app.get('/api/scanner/ticks/:symbol', (req: Request, res: Response) => {
  const { symbol } = req.params;
  const ticks = getMarketTicks(symbol);
  res.json({ symbol, ticks });
});

app.get('/api/scanner/signals', (req: Request, res: Response) => {
  const active = getActiveSignals();
  const history = getSignalHistory();
  res.json({ active, history });
});

// ----------------------------------------------------
// SAAS PRICING & PAYMENT GATEWAY WEBHOOK ROUTES
// ----------------------------------------------------
app.get('/api/pricing', (req: Request, res: Response) => {
  res.json({ plans: PRICING_PLANS });
});

app.post('/api/payments/intent', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { tier, gateway, paymentMethod } = req.body;
    const intent = createPaymentIntent(userId, tier, gateway || 'PAYSTACK', paymentMethod || 'CARD');
    res.json({ intent });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/payments/complete', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { reference } = req.body;
    const result = completeMockPayment(reference, userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Flutterwave Webhook
app.post('/api/payments/webhook/flutterwave', (req: Request, res: Response) => {
  const payload = req.body;
  const result = handlePaymentWebhook({
    gateway: 'FLUTTERWAVE',
    transactionId: payload.data?.id || `FLW_${Date.now()}`,
    email: payload.data?.customer?.email || 'user@derivscan.pro',
    tier: payload.data?.meta?.tier || 'MONTHLY',
    amount: payload.data?.amount || 15,
    currency: payload.data?.currency || 'USD',
    paymentMethod: payload.data?.payment_type === 'mpesa' ? 'MPESA' : 'CARD',
    status: payload.data?.status === 'successful' ? 'SUCCESS' : 'PENDING',
    metadata: payload.data?.meta
  });
  res.status(200).json(result);
});

// Paystack Webhook
app.post('/api/payments/webhook/paystack', (req: Request, res: Response) => {
  const payload = req.body;
  const result = handlePaymentWebhook({
    gateway: 'PAYSTACK',
    transactionId: payload.data?.reference || `PSTK_${Date.now()}`,
    email: payload.data?.customer?.email || 'user@derivscan.pro',
    tier: payload.data?.metadata?.tier || 'MONTHLY',
    amount: (payload.data?.amount || 1500) / 100,
    currency: payload.data?.currency || 'USD',
    paymentMethod: 'CARD',
    status: payload.event === 'charge.success' ? 'SUCCESS' : 'PENDING',
    metadata: payload.data?.metadata
  });
  res.status(200).json(result);
});

// NOWPayments (USDT Crypto) Webhook
app.post('/api/payments/webhook/nowpayments', (req: Request, res: Response) => {
  const payload = req.body;
  const result = handlePaymentWebhook({
    gateway: 'NOWPAYMENTS',
    transactionId: payload.payment_id || `NOW_${Date.now()}`,
    email: payload.order_description || 'crypto@derivscan.pro',
    tier: payload.tier || 'YEARLY',
    amount: payload.actually_paid || 100,
    currency: 'USDT',
    paymentMethod: 'USDT',
    status: payload.payment_status === 'finished' ? 'SUCCESS' : 'PENDING',
    metadata: { userId: payload.order_id }
  });
  res.status(200).json(result);
});

// ----------------------------------------------------
// WEBSOCKET SERVER FOR REAL-TIME STREAMING
// ----------------------------------------------------
const wss = new WebSocketServer({ server, path: '/ws/scanner' });

wss.on('connection', (ws: WebSocket) => {
  // Send initial snapshot of all markets and active signals
  const initialData = {
    type: 'INITIAL_SNAPSHOT',
    payload: {
      markets: SYNTHETIC_MARKETS,
      analyses: getAllMarketAnalyses(),
      activeSignals: getActiveSignals(),
      connection: getDerivConnectionStatus()
    }
  };

  ws.send(JSON.stringify(initialData));

  // Forward broadcast events from scanner to this client
  const broadcastHandler = (data: { type: string; payload: unknown }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };

  addBroadcastListener(broadcastHandler);

  ws.on('message', (message: string) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch (e) {
      // ignore
    }
  });

  ws.on('close', () => {
    removeBroadcastListener(broadcastHandler);
  });
});

// ----------------------------------------------------
// VITE DEV SERVER OR PRODUCTION STATIC SERVING
// ----------------------------------------------------
async function startServer() {
  // Initialize Deriv WebSocket client / synthetic scanner engine
  initDerivWebSocket();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[DerivScan Pro] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
