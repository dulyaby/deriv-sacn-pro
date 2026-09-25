import { SubscriptionTier, PricingPlan, PaymentWebhookData, PRICING_PLANS } from '../src/types/scanner';
import { upgradeUserTier } from './auth';

export interface PaymentIntent {
  reference: string;
  userId: string;
  tier: SubscriptionTier;
  amount: number;
  currency: string;
  gateway: 'FLUTTERWAVE' | 'PAYSTACK' | 'NOWPAYMENTS';
  paymentMethod: 'MPESA' | 'CARD' | 'USDT' | 'CRYPTO';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: number;
  checkoutUrl: string;
}

const paymentIntents: Map<string, PaymentIntent> = new Map();

export function createPaymentIntent(
  userId: string,
  tier: SubscriptionTier,
  gateway: 'FLUTTERWAVE' | 'PAYSTACK' | 'NOWPAYMENTS',
  paymentMethod: 'MPESA' | 'CARD' | 'USDT' | 'CRYPTO'
): PaymentIntent {
  const plan = PRICING_PLANS.find((p) => p.id === tier);
  if (!plan) {
    throw new Error('Invalid subscription tier');
  }

  const reference = `DS_${tier}_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  
  const intent: PaymentIntent = {
    reference,
    userId,
    tier,
    amount: plan.price,
    currency: plan.currency,
    gateway,
    paymentMethod,
    status: 'PENDING',
    createdAt: Date.now(),
    checkoutUrl: `/checkout/${reference}`
  };

  paymentIntents.set(reference, intent);
  return intent;
}

export function handlePaymentWebhook(payload: PaymentWebhookData) {
  console.log(`[Payment Webhook] Received from ${payload.gateway} for Ref: ${payload.transactionId}, Status: ${payload.status}`);

  if (payload.status !== 'SUCCESS') {
    return { success: false, message: 'Payment status not successful' };
  }

  let durationDays = 30;
  if (payload.tier === 'WEEKLY') durationDays = 7;
  else if (payload.tier === 'YEARLY') durationDays = 365;

  try {
    // If metadata contains userId
    const userId = (payload.metadata?.userId as string) || 'user_pro_demo';
    const updatedUser = upgradeUserTier(userId, payload.tier, durationDays);
    return { success: true, user: updatedUser };
  } catch (err: any) {
    console.error('[Payment Webhook] Error upgrading user tier:', err.message);
    return { success: false, error: err.message };
  }
}

export function completeMockPayment(reference: string, userId: string): { success: boolean; tier: SubscriptionTier; expiresAt: number | null } {
  const intent = paymentIntents.get(reference);
  const tier = intent ? intent.tier : 'MONTHLY';

  let durationDays = 30;
  if (tier === 'WEEKLY') durationDays = 7;
  else if (tier === 'YEARLY') durationDays = 365;

  const updatedUser = upgradeUserTier(userId, tier, durationDays);
  if (intent) {
    intent.status = 'SUCCESS';
  }

  return {
    success: true,
    tier: updatedUser.tier,
    expiresAt: updatedUser.tierExpiresAt
  };
}
