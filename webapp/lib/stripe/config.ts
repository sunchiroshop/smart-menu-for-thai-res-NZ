// Stripe Configuration
import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
    );
  }
  return stripePromise;
};

// Stripe price IDs for each plan
export const STRIPE_PRICE_IDS = {
  basic: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID || '',
    yearly: process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID || '',
  },
  pro: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || '',
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || '',
  },
  enterprise: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
    yearly: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '',
  },
};

// Helper to get price ID
export const getPriceId = (planId: string, interval: string): string => {
  const plan = STRIPE_PRICE_IDS[planId as keyof typeof STRIPE_PRICE_IDS];
  if (!plan) return '';
  return plan[interval as keyof typeof plan] || '';
};

