'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, Lock, Check, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription/plans';
import { getPriceId } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/client';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') || 'pro';
  const interval = searchParams.get('interval') || 'monthly';
  
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  
  const supabase = createClient();
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[1];
  const isYearly = interval === 'yearly';
  const price = isYearly ? plan.price * 0.8 : plan.price;
  const savings = isYearly ? parseFloat((plan.price * 12 * 0.2).toFixed(2)) : 0;

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login?redirect=/checkout?plan=' + planId + '&interval=' + interval);
        return;
      }

      setUser(session.user);
    };

    checkUser();
  }, []);

  const handleCheckout = async () => {
    if (!user) {
      router.push('/login?redirect=/checkout?plan=' + planId + '&interval=' + interval);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get Stripe price ID
      const priceId = getPriceId(planId, interval === 'yearly' ? 'yearly' : 'monthly');
      
      if (!priceId) {
        throw new Error('Price ID not configured');
      }

      // Create checkout session
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: priceId,
          user_id: user.id,
          user_email: user.email,
          plan_id: planId,
          interval: interval,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create checkout session');
      }

      const data = await response.json();

      // Redirect to Stripe Checkout using the URL from backend
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to start checkout process');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/pricing"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pricing
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{plan.name} Plan</h3>
                  <p className="text-sm text-gray-600">
                    {isYearly ? 'Billed annually' : 'Billed monthly'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    ${price} NZD
                  </p>
                  <p className="text-sm text-gray-600">
                    /{isYearly ? 'month' : 'month'}
                  </p>
                </div>
              </div>

              {isYearly && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800">
                    🎉 You save ${savings} NZD/year with annual billing!
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">
                  ${isYearly ? (price * 12).toFixed(2) : price} NZD
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tax</span>
                <span className="font-semibold text-gray-900">Calculated at checkout</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">
                  {isYearly ? 'Total (Annual)' : 'Total'}
                </span>
                <span className="text-2xl font-bold text-orange-500">
                  ${isYearly ? (price * 12).toFixed(2) : price} NZD
                </span>
              </div>
            </div>

            {/* Features Included */}
            <div className="mt-8">
              <h3 className="font-semibold text-gray-900 mb-4">What's Included:</h3>
              <ul className="space-y-3">
                {plan.features.slice(0, 5).map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
                {plan.features.length > 5 && (
                  <li className="text-sm text-gray-500 ml-7">
                    + {plan.features.length - 5} more features
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Stripe Payment */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <CreditCard className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="font-semibold text-gray-900">Secure Payment with Stripe</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  You'll be redirected to Stripe's secure checkout page to complete your payment.
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <Lock className="w-4 h-4 mr-2" />
                  <span>Your payment information is encrypted and secure</span>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Account Information</h4>
              <p className="text-sm text-gray-600">
                Email: <span className="font-medium">{user.email}</span>
              </p>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-6 h-6 mr-2" />
                  Proceed to Stripe Checkout
                </>
              )}
            </button>

            {/* Trust Badges */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-6">
                <div className="text-center">
                  <Lock className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Secure</p>
                </div>
                <div className="text-center">
                  <Check className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Verified</p>
                </div>
                <div className="text-center">
                  <CreditCard className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Stripe</p>
                </div>
              </div>
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center mt-6">
              By proceeding, you agree to our{' '}
              <a href="/terms" className="text-orange-500 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-orange-500 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>

        {/* Money Back Guarantee */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6 text-center">
          <h3 className="font-bold text-gray-900 mb-2">💯 30-Day Money-Back Guarantee</h3>
          <p className="text-sm text-gray-600">
            Not satisfied? Get a full refund within 30 days, no questions asked.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
