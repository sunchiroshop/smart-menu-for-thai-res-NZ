'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, Users, Lock, Store, Loader2, Globe } from 'lucide-react';
import { t, mapToPOSLanguage, POSLanguage } from '@/lib/pos-translations';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  primaryLanguage?: string;
}

export default function POSLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'restaurant' | 'pin'>('restaurant');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [restaurantCode, setRestaurantCode] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginType, setLoginType] = useState<'kitchen' | 'staff'>('staff');
  const [lang, setLang] = useState<POSLanguage>('en'); // Default to English for NZ

  // Check for saved session
  useEffect(() => {
    const savedSession = localStorage.getItem('pos_session');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      if (session.expires > Date.now()) {
        // Session still valid, redirect
        if (session.role === 'chef') {
          router.push('/pos/kitchen');
        } else {
          router.push('/pos/orders');
        }
      } else {
        localStorage.removeItem('pos_session');
      }
    }
  }, [router]);

  const handleRestaurantSubmit = async () => {
    if (!restaurantCode.trim()) {
      setError(t('login', 'enterRestaurantCode', lang));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Fetch restaurant by slug or ID
      const response = await fetch(`${BACKEND_URL}/api/public/menu/${restaurantCode}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.restaurant) {
          // Get primary language from branding
          const primaryLanguage = data.branding?.primary_language || 'th';
          const posLang = mapToPOSLanguage(primaryLanguage);
          setLang(posLang);

          setSelectedRestaurant({
            id: data.restaurant.id,
            name: data.restaurant.name,
            slug: data.restaurant.slug || restaurantCode,
            primaryLanguage: primaryLanguage
          });
          setStep('pin');
        } else {
          setError(t('login', 'restaurantNotFound', lang));
        }
      } else {
        setError(t('login', 'restaurantNotFound', lang));
      }
    } catch (err) {
      console.error('Failed to fetch restaurant:', err);
      setError(t('login', 'error', lang));
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 6) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/staff/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: selectedRestaurant?.id,
          pin_code: pin
        })
      });

      const data = await response.json();

      if (data.success && data.staff) {
        // Save session with language
        const session = {
          staffId: data.staff.id,
          staffName: data.staff.name,
          role: data.staff.role,
          restaurantId: selectedRestaurant?.id,
          restaurantName: selectedRestaurant?.name,
          restaurantSlug: selectedRestaurant?.slug,
          primaryLanguage: selectedRestaurant?.primaryLanguage || 'th',
          expires: Date.now() + (8 * 60 * 60 * 1000) // 8 hours
        };
        localStorage.setItem('pos_session', JSON.stringify(session));

        // Redirect based on role
        if (data.staff.role === 'chef') {
          router.push('/pos/kitchen');
        } else {
          router.push('/pos/orders');
        }
      } else {
        setError(t('login', 'invalidPin', lang));
        setPin('');
      }
    } catch (err) {
      console.error('Failed to verify PIN:', err);
      setError(t('login', 'error', lang));
    } finally {
      setLoading(false);
    }
  };

  const handlePinKeyPress = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);

      // Auto-submit when 6 digits
      if (newPin.length === 6) {
        setTimeout(() => handlePinSubmit(), 100);
      }
    }
  };

  const handlePinDelete = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language Selector - Top Right */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-sm transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>{lang === 'en' ? '🇬🇧 EN' : '🇹🇭 TH'}</span>
          </button>
        </div>

        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            {loginType === 'kitchen' ? (
              <ChefHat className="w-10 h-10 text-white" />
            ) : (
              <Users className="w-10 h-10 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">{t('login', 'title', lang)}</h1>
          <p className="text-slate-400 mt-2">
            {loginType === 'kitchen' ? t('login', 'kitchenSystem', lang) : t('login', 'staffSystem', lang)}
          </p>
        </div>

        {/* Login Type Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setLoginType('staff')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              loginType === 'staff'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Users className="w-5 h-5" />
            {t('login', 'staffMode', lang)}
          </button>
          <button
            onClick={() => setLoginType('kitchen')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              loginType === 'kitchen'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <ChefHat className="w-5 h-5" />
            {t('login', 'kitchenMode', lang)}
          </button>
        </div>

        {/* Step 1: Restaurant Code */}
        {step === 'restaurant' && (
          <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Store className="w-6 h-6 text-orange-500" />
              <h2 className="text-lg font-semibold text-white">{t('login', 'selectRestaurant', lang)}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {t('login', 'restaurantCode', lang)}
                </label>
                <input
                  type="text"
                  value={restaurantCode}
                  onChange={(e) => setRestaurantCode(e.target.value.toLowerCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleRestaurantSubmit()}
                  placeholder={t('login', 'restaurantPlaceholder', lang)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleRestaurantSubmit}
                disabled={loading}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>{t('login', 'next', lang)}</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: PIN Entry */}
        {step === 'pin' && (
          <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
            {/* Restaurant Info */}
            <div className="text-center mb-6">
              <p className="text-slate-400 text-sm">{t('login', 'restaurant', lang)}</p>
              <p className="text-white font-semibold text-lg">{selectedRestaurant?.name}</p>
              <button
                onClick={() => {
                  setStep('restaurant');
                  setPin('');
                  setError('');
                }}
                className="text-orange-500 text-sm mt-1 hover:underline"
              >
                {t('login', 'changeRestaurant', lang)}
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-orange-500" />
              <h2 className="text-lg font-semibold text-white">{t('login', 'pinCode', lang)}</h2>
            </div>

            {/* PIN Display */}
            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                    pin.length > i
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-500'
                  }`}
                >
                  {pin.length > i ? '•' : ''}
                </div>
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center mb-4">
                {error}
              </div>
            )}

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'del'].map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === 'del') {
                      handlePinDelete();
                    } else if (key === 'clear') {
                      setPin('');
                    } else {
                      handlePinKeyPress(key);
                    }
                  }}
                  disabled={loading}
                  className={`h-16 rounded-xl font-bold text-xl transition-all ${
                    key === 'clear'
                      ? 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      : key === 'del'
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-slate-700 text-white hover:bg-slate-600 active:scale-95'
                  } disabled:opacity-50`}
                >
                  {key === 'del' ? '⌫' : key === 'clear' ? 'C' : key}
                </button>
              ))}
            </div>

            {/* Enter Button */}
            <button
              onClick={handlePinSubmit}
              disabled={pin.length !== 6 || loading}
              className="w-full mt-4 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('login', 'loggingIn', lang)}
                </>
              ) : (
                <>
                  ✓ {t('login', 'enter', lang)}
                </>
              )}
            </button>

          </div>
        )}

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Smart Menu POS System
        </p>
      </div>
    </div>
  );
}
