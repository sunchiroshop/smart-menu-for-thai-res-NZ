'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChefHat, Bell, Volume2, VolumeX, Clock, CheckCircle,
  AlertTriangle, LogOut, RefreshCw, Loader2, Timer,
  Utensils, Coffee, Users
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { t, mapToPOSLanguage, POSLanguage } from '@/lib/pos-translations';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client for real-time
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface OrderItem {
  menu_id: string;
  name: string;
  nameEn?: string;
  quantity: number;
  price: number;
  selectedMeat?: string;
  selectedAddOns?: string[];
  notes?: string;
}

interface Order {
  id: string;
  table_no: string | null;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  service_type: 'dine_in' | 'pickup' | 'delivery';
  special_instructions?: string;
  created_at: string;
  customer_name?: string;
}

interface ServiceRequest {
  id: string;
  table_no: string;
  request_type: 'call_waiter' | 'request_sauce' | 'request_water' | 'request_bill' | 'other';
  message?: string;
  status: 'pending' | 'acknowledged' | 'completed';
  created_at: string;
}

interface POSSession {
  staffId: string;
  staffName: string;
  role: string;
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  primaryLanguage?: string;
  expires: number;
}

export default function KitchenDisplayPage() {
  const router = useRouter();
  const [session, setSession] = useState<POSSession | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [volume, setVolume] = useState(70);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Translation states
  const [primaryLanguage, setPrimaryLanguage] = useState<string>('th');
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
  const [lang, setLang] = useState<POSLanguage>('th');

  // Check session
  useEffect(() => {
    const savedSession = localStorage.getItem('pos_session');
    if (!savedSession) {
      router.push('/pos/login');
      return;
    }

    const parsedSession = JSON.parse(savedSession) as POSSession;
    if (parsedSession.expires < Date.now()) {
      localStorage.removeItem('pos_session');
      router.push('/pos/login');
      return;
    }

    setSession(parsedSession);

    // Set language from session
    if (parsedSession.primaryLanguage) {
      const posLang = mapToPOSLanguage(parsedSession.primaryLanguage);
      setLang(posLang);
      setPrimaryLanguage(parsedSession.primaryLanguage);
    }
  }, [router]);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Create audio context for Web Audio API fallback
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio
  useEffect(() => {
    // Try to load mp3 file, fallback to Web Audio API
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = volume / 100;

    // Test if audio can be loaded
    audio.addEventListener('canplaythrough', () => {
      audioRef.current = audio;
    });

    audio.addEventListener('error', () => {
      // Fallback: Use Web Audio API
      console.log('Using Web Audio API fallback for notifications');
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    });

    audio.load();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Play notification sound using Web Audio API
  const playWebAudioNotification = useCallback(() => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Notification sound pattern
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = (volume / 100) * 0.3;

    oscillator.start();

    // Beep pattern
    gainNode.gain.setValueAtTime((volume / 100) * 0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    oscillator.stop(ctx.currentTime + 0.3);

    // Second beep
    setTimeout(() => {
      if (!audioContextRef.current) return;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1000;
      osc2.type = 'sine';
      gain2.gain.value = (volume / 100) * 0.3;
      osc2.start();
      gain2.gain.setValueAtTime((volume / 100) * 0.3, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 0.3);
    }, 150);
  }, [volume]);

  // Play notification
  const playNotification = useCallback(() => {
    if (soundEnabled) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // If mp3 fails, use Web Audio API
          playWebAudioNotification();
        });
      } else {
        // No mp3 loaded, use Web Audio API
        playWebAudioNotification();
      }
    }
    if (vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [soundEnabled, vibrationEnabled, playWebAudioNotification]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!session?.restaurantId) return;

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/orders?restaurant_id=${session.restaurantId}&status=pending,confirmed,preparing`
      );
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.restaurantId]);

  // Fetch restaurant settings (primary language)
  const fetchRestaurantSettings = useCallback(async () => {
    if (!session?.restaurantId) return;

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('primary_language')
        .eq('id', session.restaurantId)
        .single();

      if (data?.primary_language) {
        setPrimaryLanguage(data.primary_language);
        // Sync UI language with database setting
        const posLang = mapToPOSLanguage(data.primary_language);
        setLang(posLang);
      }
    } catch (error) {
      console.error('Failed to fetch restaurant settings:', error);
    }
  }, [session?.restaurantId]);

  // Translate text to restaurant's primary language
  const translateText = useCallback(async (text: string, cacheKey: string) => {
    if (!text || translatedTexts[cacheKey]) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/translate/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: [text],
          source_lang: 'auto',
          target_lang: primaryLanguage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translations && data.translations[0]) {
          setTranslatedTexts(prev => ({
            ...prev,
            [cacheKey]: data.translations[0]
          }));
        }
      }
    } catch (error) {
      console.error('Translation failed:', error);
    }
  }, [primaryLanguage, translatedTexts]);

  // Auto-translate order notes and instructions when orders change
  useEffect(() => {
    orders.forEach(order => {
      if (order.special_instructions) {
        const key = `order_${order.id}_instructions`;
        if (!translatedTexts[key]) {
          translateText(order.special_instructions, key);
        }
      }
      order.items.forEach((item, idx) => {
        if (item.notes) {
          const key = `order_${order.id}_item_${idx}_notes`;
          if (!translatedTexts[key]) {
            translateText(item.notes, key);
          }
        }
      });
    });
  }, [orders, translateText, translatedTexts]);

  // Initial fetch
  useEffect(() => {
    if (session?.restaurantId) {
      fetchOrders();
      fetchRestaurantSettings();
    }
  }, [session?.restaurantId, fetchOrders, fetchRestaurantSettings]);

  // Real-time subscription for restaurant settings (language changes)
  useEffect(() => {
    if (!session?.restaurantId) return;

    const settingsChannel = supabase
      .channel('kitchen-settings')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurants',
          filter: `id=eq.${session.restaurantId}`
        },
        (payload) => {
          console.log('Restaurant settings update:', payload);
          if (payload.new && (payload.new as any).primary_language) {
            const newLang = (payload.new as any).primary_language;
            setPrimaryLanguage(newLang);
            setLang(mapToPOSLanguage(newLang));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
    };
  }, [session?.restaurantId]);

  // Real-time subscription for orders
  useEffect(() => {
    if (!session?.restaurantId) return;

    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${session.restaurantId}`
        },
        (payload) => {
          console.log('Order update:', payload);

          if (payload.eventType === 'INSERT') {
            // New order
            playNotification();
            setOrders((prev) => [payload.new as Order, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            // Order updated
            setOrders((prev) =>
              prev.map((order) =>
                order.id === payload.new.id ? (payload.new as Order) : order
              ).filter(o => !['completed', 'cancelled'].includes(o.status))
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((order) => order.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.restaurantId, playNotification]);

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update will come through real-time subscription
        if (newStatus === 'completed' || newStatus === 'cancelled') {
          setOrders((prev) => prev.filter((o) => o.id !== orderId));
        }
      }
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('pos_session');
    router.push('/pos/login');
  };

  // Calculate time since order
  const getTimeSince = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t('kitchen', 'justNow', lang);
    if (minutes < 60) return `${minutes} ${t('kitchen', 'minutes', lang)}`;
    const hours = Math.floor(minutes / 60);
    return `${hours} ${t('kitchen', 'hours', lang)} ${minutes % 60} ${t('kitchen', 'minutes', lang)}`;
  };

  // Get urgency color
  const getUrgencyColor = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 5) return 'border-green-500';
    if (minutes < 10) return 'border-yellow-500';
    if (minutes < 15) return 'border-orange-500';
    return 'border-red-500 animate-pulse';
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return t('kitchen', 'pending', lang);
      case 'confirmed': return lang === 'th' ? 'ยืนยันแล้ว' : 'Confirmed';
      case 'preparing': return t('kitchen', 'cooking', lang);
      case 'ready': return t('kitchen', 'ready', lang);
      default: return status;
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ChefHat className="w-8 h-8 text-orange-500" />
              <div>
                <h1 className="text-xl font-bold">{t('kitchen', 'title', lang)}</h1>
                <p className="text-sm text-slate-400">{session.restaurantName}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Clock */}
            <div className="text-2xl font-mono text-orange-500">
              {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </div>

            {/* Orders count */}
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-lg">
              <Utensils className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-orange-500">{orders.length}</span>
              <span className="text-slate-400">{lang === 'th' ? 'ออเดอร์' : 'Orders'}</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled ? 'bg-green-500/20 text-green-500' : 'bg-slate-700 text-slate-400'
              }`}
              title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
            >
              {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>

            {/* Volume Slider */}
            {soundEnabled && (
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-24 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            )}

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Bell className="w-6 h-6" />
            </button>

            {/* Refresh */}
            <button
              onClick={fetchOrders}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              title="รีเฟรช"
            >
              <RefreshCw className="w-6 h-6" />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {t('kitchen', 'logout', lang)}
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-slate-700 rounded-xl">
            <h3 className="font-semibold mb-4">ตั้งค่าการแจ้งเตือน</h3>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-5 h-5 rounded accent-orange-500"
                />
                <span>เสียงแจ้งเตือน</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vibrationEnabled}
                  onChange={(e) => setVibrationEnabled(e.target.checked)}
                  className="w-5 h-5 rounded accent-orange-500"
                />
                <span>สั่นเตือน</span>
              </label>
              <div className="flex items-center gap-2">
                <span>ระดับเสียง:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-32 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <span className="text-orange-500 font-bold">{volume}%</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Orders Grid */}
      <main className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Coffee className="w-16 h-16 mb-4" />
            <p className="text-xl">{t('kitchen', 'noOrders', lang)}</p>
            <p className="text-sm mt-2">{lang === 'th' ? 'รอออเดอร์ใหม่...' : 'Waiting for orders...'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`bg-slate-800 rounded-xl border-l-4 ${getUrgencyColor(order.created_at)} overflow-hidden`}
              >
                {/* Order Header */}
                <div className="p-4 bg-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-orange-500">
                      {order.table_no ? `T${order.table_no}` : '#'}
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(order.status)} text-white`}>
                        {getStatusText(order.status)}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        {order.service_type === 'dine_in' ? (lang === 'th' ? 'ทานที่ร้าน' : 'Dine-in') :
                         order.service_type === 'pickup' ? t('kitchen', 'pickup', lang) : t('kitchen', 'delivery', lang)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Timer className="w-4 h-4" />
                    <span className="text-sm">{getTimeSince(order.created_at)}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold">
                            {item.quantity}
                          </span>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        {item.selectedMeat && (
                          <p className="text-sm text-slate-400 ml-8">• {item.selectedMeat}</p>
                        )}
                        {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                          <p className="text-sm text-slate-400 ml-8">
                            + {item.selectedAddOns.join(', ')}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-sm text-yellow-500 ml-8">
                            📝 {translatedTexts[`order_${order.id}_item_${idx}_notes`] || item.notes}
                            {translatedTexts[`order_${order.id}_item_${idx}_notes`] && translatedTexts[`order_${order.id}_item_${idx}_notes`] !== item.notes && (
                              <span className="text-xs text-gray-500 ml-2">({item.notes})</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Special Instructions */}
                {order.special_instructions && (
                  <div className="px-4 py-2 bg-yellow-500/20 border-t border-yellow-500/30">
                    <p className="text-sm text-yellow-400">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      {translatedTexts[`order_${order.id}_instructions`] || order.special_instructions}
                    </p>
                    {translatedTexts[`order_${order.id}_instructions`] && translatedTexts[`order_${order.id}_instructions`] !== order.special_instructions && (
                      <p className="text-xs text-gray-500 mt-1 ml-5">
                        (Original: {order.special_instructions})
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="p-3 bg-slate-700/30 flex gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors"
                    >
                      {lang === 'th' ? 'ยืนยัน' : 'Confirm'}
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold transition-colors"
                    >
                      {t('kitchen', 'startCooking', lang)}
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="flex-1 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {t('kitchen', 'markReady', lang)}
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg font-semibold transition-colors"
                    >
                      {t('kitchen', 'served', lang)}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Audio element (hidden) */}
      <audio id="notification-sound" src="/sounds/notification.mp3" preload="auto" />
    </div>
  );
}
