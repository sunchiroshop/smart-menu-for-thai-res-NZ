'use client';

import { useEffect, useState } from 'react';
import { Crown, Sparkles, ImagePlus, AlertCircle, ChefHat } from 'lucide-react';
import Link from 'next/link';

interface TrialLimits {
  role: string;
  is_subscribed: boolean;
  subscription_plan: string | null;
  trial_days_remaining: number;
  menu_items_count: number;
  image_generation_count: number;
  image_enhancement_count: number;
  limits: {
    menu_items: number;
    image_generation: number;
    image_enhancement: number;
  };
}

interface TrialLimitsCardProps {
  userId: string;
}

export default function TrialLimitsCard({ userId }: TrialLimitsCardProps) {
  const [limits, setLimits] = useState<TrialLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trial/status/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch trial limits');
        
        const data = await response.json();
        if (data.success) {
          setLimits(data);
        }
      } catch (error) {
        console.error('Error fetching trial limits:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchLimits();
      // Refresh every 30 seconds
      const interval = setInterval(fetchLimits, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  if (loading || !limits) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  const planName = limits.subscription_plan || 'Free Trial';
  const isTrial = limits.role === 'free_trial';
  const isUnlimited = (value: number) => value >= 999999;

  const getProgressColor = (used: number, limit: number) => {
    if (isUnlimited(limit)) return 'text-green-600';
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-orange-600';
    return 'text-green-600';
  };

  const getProgressBarColor = (used: number, limit: number) => {
    if (isUnlimited(limit)) return 'bg-green-500';
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const renderProgressBar = (used: number, limit: number, label: string, icon: React.ReactNode) => {
    const percentage = isUnlimited(limit) ? 0 : Math.min((used / limit) * 100, 100);
    const remaining = isUnlimited(limit) ? '∞' : Math.max(0, limit - used);
    const isNearLimit = !isUnlimited(limit) && percentage >= 70;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </div>
          <span className={`text-sm font-bold ${getProgressColor(used, limit)}`}>
            {isUnlimited(limit) ? 'Unlimited' : `${remaining} left`}
          </span>
        </div>
        {!isUnlimited(limit) && (
          <>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${getProgressBarColor(used, limit)} transition-all duration-300`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {used} / {limit} used {isNearLimit && '⚠️'}
            </p>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg shadow-md p-6 border border-orange-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {isTrial ? (
            <AlertCircle className="w-5 h-5 text-orange-500" />
          ) : (
            <Crown className="w-5 h-5 text-orange-500" />
          )}
          <h3 className="text-lg font-bold text-gray-900">
            {isTrial ? 'Free Trial' : planName.charAt(0).toUpperCase() + planName.slice(1)} Plan
          </h3>
        </div>
        {isTrial && (
          <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
            {limits.trial_days_remaining} days left
          </span>
        )}
      </div>

      {/* Trial Warning */}
      {isTrial && limits.trial_days_remaining <= 3 && (
        <div className="mb-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
          <p className="text-sm text-orange-800 font-medium">
            ⚠️ Your trial expires soon! Upgrade to keep using all features.
          </p>
        </div>
      )}

      {/* Usage Stats */}
      <div className="space-y-4">
        {/* Menu Items */}
        {renderProgressBar(
          limits.menu_items_count,
          limits.limits.menu_items,
          'Menu Items',
          <ChefHat className="w-4 h-4 text-gray-500" />
        )}

        {/* AI Image Generation */}
        {renderProgressBar(
          limits.image_generation_count,
          limits.limits.image_generation,
          'AI Image Generation',
          <ImagePlus className="w-4 h-4 text-gray-500" />
        )}

        {/* AI Image Enhancement */}
        {renderProgressBar(
          limits.image_enhancement_count,
          limits.limits.image_enhancement,
          'AI Image Enhancement',
          <Sparkles className="w-4 h-4 text-gray-500" />
        )}
      </div>

      {/* Upgrade CTA */}
      {(isTrial || limits.subscription_plan === 'starter') && (
        <div className="mt-6 pt-4 border-t border-orange-200">
          <Link
            href="/pricing"
            className="w-full inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Link>
        </div>
      )}
    </div>
  );
}

