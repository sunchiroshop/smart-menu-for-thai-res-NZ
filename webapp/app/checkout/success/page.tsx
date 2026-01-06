'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, Download, Sparkles, Loader2, Clock, Building2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import confetti from 'canvas-confetti';

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const paymentMethod = searchParams.get('method'); // 'bank_transfer' or null (stripe)

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState('');
  const [isBankTransfer, setIsBankTransfer] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        setUser(session.user);

        // Handle bank transfer success
        if (paymentMethod === 'bank_transfer') {
          setIsBankTransfer(true);
          setLoading(false);

          // Trigger confetti celebration! 🎉
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#22c55e', '#10b981', '#14b8a6'],
          });
          return;
        }

        // Handle Stripe session verification
        if (sessionId) {
          // Verify payment with backend
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const response = await fetch(`${API_URL}/api/stripe/verify-session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              session_id: sessionId,
              user_id: session.user.id,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setSubscription(data.subscription);

            // Save selected plan to localStorage
            if (data.subscription?.plan_id) {
              localStorage.setItem('selected_plan', data.subscription.plan_id);
              localStorage.setItem('selected_interval', data.subscription.interval || 'monthly');
            }

            // Trigger confetti celebration! 🎉
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#f97316', '#ef4444', '#ec4899'],
            });
          } else {
            const errorData = await response.json();
            setError(errorData.detail || 'Failed to verify payment');
          }
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Verification error:', err);
        setError(err.message || 'Failed to verify payment');
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, paymentMethod]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-lg text-gray-600">Verifying your payment...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait, this will only take a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Verification Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Return to Pricing
          </Link>
        </div>
      </div>
    );
  }

  // Bank Transfer Success UI
  if (isBankTransfer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-emerald-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Bank Transfer Success Message */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center mb-8">
            {/* Pending Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12 text-green-500" />
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Payment Submitted!
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              Thank you! Your bank transfer details have been received.
            </p>

            {/* Status Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Clock className="w-6 h-6 text-yellow-600" />
                <h2 className="font-bold text-yellow-800 text-lg">Pending Verification</h2>
              </div>
              <p className="text-yellow-700">
                Our team will verify your payment within <strong>1-2 business days</strong>.
                You will receive an email confirmation once your subscription is activated.
              </p>
            </div>

            {/* What Happens Next */}
            <div className="text-left mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
                What Happens Next?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Payment Verification</h3>
                    <p className="text-sm text-gray-600">
                      Our admin team reviews your payment slip and bank transfer details.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email Confirmation</h3>
                    <p className="text-sm text-gray-600">
                      Once verified, you'll receive an email at <strong>{user?.email}</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Subscription Activated</h3>
                    <p className="text-sm text-gray-600">
                      Your premium features will be unlocked automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>

          {/* Support Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
            <h3 className="font-bold text-gray-900 mb-2">Questions About Your Payment?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Contact us at{' '}
              <a href="mailto:support@zestiotech.com" className="text-green-500 hover:underline font-semibold">
                support@zestiotech.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Stripe Success UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Message */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center mb-8">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            Welcome to {subscription?.plan_name || 'Premium'}! Your subscription is now active.
          </p>

          {/* Subscription Details */}
          {subscription && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 mb-8">
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Plan</p>
                  <p className="font-bold text-gray-900">{subscription.plan_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Billing</p>
                  <p className="font-bold text-gray-900">
                    {subscription.interval === 'yearly' ? 'Annual' : 'Monthly'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Amount</p>
                  <p className="font-bold text-gray-900">${subscription.amount} NZD</p>
                </div>
              </div>
            </div>
          )}

          {/* Email Confirmation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-800">
              📧 A confirmation email has been sent to{' '}
              <span className="font-semibold">{user?.email}</span>
            </p>
          </div>

          {/* What's Next */}
          <div className="text-left mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
              <Sparkles className="w-6 h-6 inline mr-2 text-yellow-500" />
              What's Next?
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Start Creating Menus</h3>
                  <p className="text-sm text-gray-600">
                    Upload your first menu item and let AI work its magic!
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Generate QR Codes</h3>
                  <p className="text-sm text-gray-600">
                    Create beautiful QR codes for each menu item
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Share with Customers</h3>
                  <p className="text-sm text-gray-600">
                    Let your customers scan and view beautiful menus
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/upload"
              className="inline-flex items-center justify-center bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg"
            >
              Upload Menu
            </Link>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
          <h3 className="font-bold text-gray-900 mb-2">Need Help Getting Started?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Our team is here to help! Contact us anytime at{' '}
            <a href="mailto:support@zestiotech.com" className="text-orange-500 hover:underline font-semibold">
              support@zestiotech.com
            </a>
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span>📞 Priority Support</span>
            <span>•</span>
            <span>📚 Knowledge Base</span>
            <span>•</span>
            <span>💬 Live Chat</span>
          </div>
        </div>

        {/* Download Invoice (Optional) */}
        {subscription && (
          <div className="mt-6 text-center">
            <button className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Download Invoice
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
