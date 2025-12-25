'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Bell, Volume2, VolumeX, Clock, CheckCircle,
  AlertTriangle, LogOut, RefreshCw, Loader2, Timer,
  Utensils, Coffee, Hand, Droplets, Receipt,
  MessageSquare, Store, MapPin, X
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
  total_price: number;
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

export default function StaffOrdersPage() {
  const router = useRouter();
  const [session, setSession] = useState<POSSession | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'requests'>('orders');
  const [loading, setLoading] = useState(true);
  const [volume, setVolume] = useState(70);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

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

  // Create audio context for Web Audio API
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio API
  useEffect(() => {
    // Use Web Audio API for sound notifications (no mp3 files needed)
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('✅ Web Audio API initialized for notifications');
    } catch (e) {
      console.log('⚠️ Web Audio API not available');
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);


  // Play Web Audio notification
  const playWebAudioNotification = useCallback((type: 'order' | 'request' = 'order') => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const baseFreq = type === 'request' ? 600 : 800;
    const pattern = type === 'request' ? [600, 800, 600, 800] : [800, 1000];

    pattern.forEach((freq, i) => {
      setTimeout(() => {
        if (!audioContextRef.current) return;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = freq;
        oscillator.type = type === 'request' ? 'triangle' : 'sine';
        gainNode.gain.value = (volume / 100) * 0.3;
        oscillator.start();
        gainNode.gain.setValueAtTime((volume / 100) * 0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        oscillator.stop(ctx.currentTime + 0.2);
      }, i * 150);
    });
  }, [volume]);

  // Play notification using Web Audio API
  const playNotification = useCallback((type: 'order' | 'request' = 'order') => {
    if (soundEnabled) {
      playWebAudioNotification(type);
    }
    if (vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate(type === 'request' ? [300, 100, 300, 100, 300] : [200, 100, 200]);
    }
  }, [soundEnabled, vibrationEnabled, playWebAudioNotification]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!session?.restaurantId) return;

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/orders?restaurant_id=${session.restaurantId}`
      );
      const data = await response.json();
      if (data.success) {
        setOrders((data.orders || []).filter((o: Order) =>
          !['completed', 'cancelled'].includes(o.status)
        ));
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  }, [session?.restaurantId]);

  // Fetch service requests
  const fetchServiceRequests = useCallback(async () => {
    if (!session?.restaurantId) return;

    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('restaurant_id', session.restaurantId)
        .in('status', ['pending', 'acknowledged'])
        .order('created_at', { ascending: false });

      if (data) {
        setServiceRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch service requests:', error);
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

  // Auto-translate order notes, instructions, and service request messages
  useEffect(() => {
    // Translate order notes and instructions
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

    // Translate service request messages
    serviceRequests.forEach(req => {
      if (req.message) {
        const key = `request_${req.id}_message`;
        if (!translatedTexts[key]) {
          translateText(req.message, key);
        }
      }
    });
  }, [orders, serviceRequests, translateText, translatedTexts]);

  // Initial fetch
  useEffect(() => {
    if (session?.restaurantId) {
      fetchOrders();
      fetchServiceRequests();
      fetchRestaurantSettings();
    }
  }, [session?.restaurantId, fetchOrders, fetchServiceRequests, fetchRestaurantSettings]);

  // Real-time subscription for restaurant settings (language changes)
  useEffect(() => {
    if (!session?.restaurantId) return;

    const settingsChannel = supabase
      .channel('staff-settings')
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

  // Real-time subscriptions for orders and service requests
  useEffect(() => {
    if (!session?.restaurantId) return;

    // Orders channel
    const ordersChannel = supabase
      .channel('staff-orders')
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
            playNotification('order');
            setOrders((prev) => [payload.new as Order, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const newOrder = payload.new as Order;
            if (['completed', 'cancelled'].includes(newOrder.status)) {
              setOrders((prev) => prev.filter((o) => o.id !== newOrder.id));
            } else {
              setOrders((prev) =>
                prev.map((order) =>
                  order.id === newOrder.id ? newOrder : order
                )
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((order) => order.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Service requests channel
    const requestsChannel = supabase
      .channel('staff-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `restaurant_id=eq.${session.restaurantId}`
        },
        (payload) => {
          console.log('Service request update:', payload);

          if (payload.eventType === 'INSERT') {
            playNotification('request');
            setServiceRequests((prev) => [payload.new as ServiceRequest, ...prev]);
            // Auto-switch to requests tab
            setActiveTab('requests');
          } else if (payload.eventType === 'UPDATE') {
            const newRequest = payload.new as ServiceRequest;
            if (newRequest.status === 'completed') {
              setServiceRequests((prev) => prev.filter((r) => r.id !== newRequest.id));
            } else {
              setServiceRequests((prev) =>
                prev.map((req) =>
                  req.id === newRequest.id ? newRequest : req
                )
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setServiceRequests((prev) => prev.filter((req) => req.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(requestsChannel);
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
        if (['completed', 'cancelled'].includes(newStatus)) {
          setOrders((prev) => prev.filter((o) => o.id !== orderId));
        }
      }
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  // Update service request status
  const updateRequestStatus = async (requestId: string, newStatus: ServiceRequest['status']) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({
          status: newStatus,
          acknowledged_by: newStatus === 'acknowledged' ? session?.staffId : undefined,
          acknowledged_at: newStatus === 'acknowledged' ? new Date().toISOString() : undefined,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (!error && newStatus === 'completed') {
        setServiceRequests((prev) => prev.filter((r) => r.id !== requestId));
      }
    } catch (error) {
      console.error('Failed to update request:', error);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('pos_session');
    router.push('/pos/login');
  };

  // Calculate time since
  const getTimeSince = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t('orders', 'justNow', lang);
    if (minutes < 60) return `${minutes} ${t('orders', 'minutes', lang)}`;
    const hours = Math.floor(minutes / 60);
    return `${hours} ${t('orders', 'hours', lang)}`;
  };

  // Get request type icon and text
  const getRequestTypeInfo = (type: ServiceRequest['request_type']) => {
    switch (type) {
      case 'call_waiter': return { icon: Hand, text: t('orders', 'callWaiter', lang), color: 'text-blue-500' };
      case 'request_sauce': return { icon: Droplets, text: t('orders', 'requestSauce', lang), color: 'text-orange-500' };
      case 'request_water': return { icon: Coffee, text: t('orders', 'requestWater', lang), color: 'text-cyan-500' };
      case 'request_bill': return { icon: Receipt, text: t('orders', 'requestBill', lang), color: 'text-green-500' };
      default: return { icon: MessageSquare, text: t('orders', 'other', lang), color: 'text-purple-500' };
    }
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

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const pendingRequestsCount = serviceRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-8 h-8 text-orange-500" />
              <div>
                <h1 className="text-xl font-bold">{t('orders', 'title', lang)}</h1>
                <p className="text-sm text-slate-400">{session.restaurantName} • {session.staffName}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Clock */}
            <div className="text-2xl font-mono text-orange-500">
              {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled ? 'bg-green-500/20 text-green-500' : 'bg-slate-700 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>

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

            {/* Refresh */}
            <button
              onClick={() => { fetchOrders(); fetchServiceRequests(); }}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <RefreshCw className="w-6 h-6" />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {t('orders', 'logout', lang)}
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-4 font-semibold flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'orders'
              ? 'bg-slate-800 text-orange-500 border-b-2 border-orange-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Utensils className="w-5 h-5" />
          {t('orders', 'ordersTab', lang)}
          <span className="px-2 py-0.5 bg-orange-500 text-white text-sm rounded-full">
            {orders.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-4 font-semibold flex items-center justify-center gap-2 transition-colors relative ${
            activeTab === 'requests'
              ? 'bg-slate-800 text-orange-500 border-b-2 border-orange-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bell className="w-5 h-5" />
          {t('orders', 'requestsTab', lang)}
          {pendingRequestsCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-sm rounded-full animate-pulse">
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <main className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
          </div>
        ) : activeTab === 'orders' ? (
          /* Orders Tab */
          orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <Coffee className="w-16 h-16 mb-4" />
              <p className="text-xl">{t('orders', 'noOrders', lang)}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-slate-800 rounded-xl overflow-hidden">
                  {/* Order Header */}
                  <div className="p-4 bg-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {order.service_type === 'dine_in' ? (
                        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold">T{order.table_no}</span>
                        </div>
                      ) : order.service_type === 'pickup' ? (
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                          <Store className="w-6 h-6" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                          <MapPin className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status === 'pending' ? t('orders', 'pending', lang) :
                           order.status === 'confirmed' ? t('orders', 'confirmed', lang) :
                           order.status === 'preparing' ? t('orders', 'preparing', lang) :
                           order.status === 'ready' ? t('orders', 'ready', lang) : order.status}
                        </span>
                        {order.customer_name && (
                          <p className="text-sm text-slate-400 mt-1">{order.customer_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-500">฿{order.total_price?.toFixed(0) || '0'}</p>
                      <p className="text-xs text-slate-400">{getTimeSince(order.created_at)}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
                    {order.items.map((item, idx) => (
                      <div key={idx}>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center text-sm">
                            {item.quantity}
                          </span>
                          <span className="flex-1 text-sm">{item.name}</span>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-yellow-500 ml-8 mt-1">
                            📝 {translatedTexts[`order_${order.id}_item_${idx}_notes`] || item.notes}
                            {translatedTexts[`order_${order.id}_item_${idx}_notes`] && translatedTexts[`order_${order.id}_item_${idx}_notes`] !== item.notes && (
                              <span className="text-gray-500 ml-1">({item.notes})</span>
                            )}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Special Instructions */}
                  {order.special_instructions && (
                    <div className="px-4 py-2 bg-yellow-500/20 border-t border-yellow-500/30">
                      <p className="text-sm text-yellow-400">
                        ⚠️ {translatedTexts[`order_${order.id}_instructions`] || order.special_instructions}
                      </p>
                      {translatedTexts[`order_${order.id}_instructions`] && translatedTexts[`order_${order.id}_instructions`] !== order.special_instructions && (
                        <p className="text-xs text-gray-500 mt-1">
                          (Original: {order.special_instructions})
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="p-3 bg-slate-700/30 flex gap-2">
                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="flex-1 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        {t('orders', 'served', lang)}
                      </button>
                    )}
                    {order.status !== 'ready' && order.status !== 'completed' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg font-semibold"
                      >
                        {t('orders', 'complete', lang)}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Service Requests Tab */
          serviceRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <Bell className="w-16 h-16 mb-4" />
              <p className="text-xl">{t('orders', 'noRequests', lang)}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceRequests.map((request) => {
                const typeInfo = getRequestTypeInfo(request.request_type);
                const Icon = typeInfo.icon;
                const isPending = request.status === 'pending';

                return (
                  <div
                    key={request.id}
                    className={`bg-slate-800 rounded-xl overflow-hidden border-l-4 ${
                      isPending ? 'border-red-500 animate-pulse' : 'border-yellow-500'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center ${typeInfo.color}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-semibold">{typeInfo.text}</p>
                            <p className="text-2xl font-bold text-orange-500">{t('orders', 'table', lang)} {request.table_no}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            isPending ? 'bg-red-500' : 'bg-yellow-500'
                          }`}>
                            {isPending ? t('orders', 'pendingAction', lang) : t('orders', 'acknowledged', lang)}
                          </span>
                          <p className="text-xs text-slate-400 mt-1">{getTimeSince(request.created_at)}</p>
                        </div>
                      </div>

                      {request.message && (
                        <div className="p-3 bg-slate-700 rounded-lg mb-4">
                          <p className="text-sm text-slate-300">
                            {translatedTexts[`request_${request.id}_message`] || request.message}
                          </p>
                          {translatedTexts[`request_${request.id}_message`] && translatedTexts[`request_${request.id}_message`] !== request.message && (
                            <p className="text-xs text-slate-500 mt-1">
                              (Original: {request.message})
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {isPending && (
                          <button
                            onClick={() => updateRequestStatus(request.id, 'acknowledged')}
                            className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg font-semibold text-black"
                          >
                            {t('orders', 'acknowledge', lang)}
                          </button>
                        )}
                        <button
                          onClick={() => updateRequestStatus(request.id, 'completed')}
                          className="flex-1 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          {t('orders', 'complete', lang)}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>
    </div>
  );
}
