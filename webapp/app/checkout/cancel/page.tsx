'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, ArrowLeft, HelpCircle, MessageCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function CheckoutCancelPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
      }
      
      setLoading(false);
    };

    checkUser();
  }, []);

  if (loading) {
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
      <div className="max-w-2xl mx-auto">
        {/* Cancel Message */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center mb-8">
          {/* Cancel Icon */}
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-gray-400" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Cancelled
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Your payment was cancelled. No charges were made to your account.
          </p>

          {/* Reasons Section */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <HelpCircle className="w-5 h-5 mr-2 text-orange-500" />
              Why did you cancel?
            </h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>Not sure which plan to choose?</strong> We can help you find the perfect fit.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>Have questions?</strong> Our team is ready to answer them.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>Want a demo?</strong> See how Smart Menu can transform your restaurant.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>Need a custom plan?</strong> Let's discuss your specific needs.
                </span>
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-4">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Pricing
            </Link>
            
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center w-full bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>

        {/* Support Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Contact Support */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Talk to Our Team</h3>
            <p className="text-sm text-gray-600 mb-4">
              Have questions? We're here to help you make the right decision.
            </p>
            <a
              href="mailto:support@zestiotech.com"
              className="inline-flex items-center text-orange-500 hover:text-orange-600 font-semibold text-sm"
            >
              Contact Support →
            </a>
          </div>

          {/* Free Trial */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🎁</span>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Try It Free</h3>
            <p className="text-sm text-gray-600 mb-4">
              Start with our free trial. No credit card required.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-orange-500 hover:text-orange-600 font-semibold text-sm"
            >
              Start Free Trial →
            </Link>
          </div>
        </div>

        {/* Alternative Options */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
          <h3 className="font-bold text-gray-900 mb-4 text-center">
            Not Ready to Subscribe?
          </h3>
          <p className="text-sm text-gray-600 text-center mb-6">
            You can still use Smart Menu with our free features! Upload menus, create QR codes, and explore what we offer.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/upload"
              className="inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Upload Menu
            </Link>
            <Link
              href="/menus"
              className="inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              View My Menus
            </Link>
          </div>
        </div>

        {/* Testimonial */}
        <div className="mt-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 text-center">
          <p className="text-gray-700 italic mb-3">
            "Smart Menu transformed our restaurant! Our customers love the beautiful QR menus, and we've seen a 30% increase in orders."
          </p>
          <p className="text-sm font-semibold text-gray-900">
            - Thai Kitchen, Auckland
          </p>
          <div className="flex items-center justify-center mt-2">
            <span className="text-yellow-500">⭐⭐⭐⭐⭐</span>
          </div>
        </div>

        {/* Money Back Guarantee Reminder */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            💯 Remember: We offer a 30-day money-back guarantee. Try risk-free!
          </p>
        </div>
      </div>
    </div>
  );
}

