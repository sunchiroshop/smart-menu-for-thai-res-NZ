'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChefHat, Bell, Volume2, VolumeX, Clock, CheckCircle,
  AlertTriangle, LogOut, RefreshCw, Loader2, Timer,
  Utensils, Coffee, Users, XCircle, X, Printer
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { t, tBilingual, mapToPOSLanguage, POSLanguage } from '@/lib/pos-translations';
import { getThemeClasses, POSTheme } from '@/lib/pos-theme';
import BilingualText, { BilingualTextInline } from '@/components/BilingualText';
import POSNavbar from '@/components/POSNavbar';

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

  // Theme state - load from localStorage first for instant display
  const [posTheme, setPosTheme] = useState<POSTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_theme');
      if (saved) return saved as POSTheme;
    }
    return 'orange';
  });
  const themeClasses = getThemeClasses(posTheme);

  // Void order states
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidingOrder, setVoidingOrder] = useState<Order | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidLoading, setVoidLoading] = useState(false);

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

  // Initialize audio - Use Web Audio API directly (no external file needed)
  useEffect(() => {
    // Use Web Audio API for notification sounds
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    return () => {
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
      playWebAudioNotification();
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

  // Fetch restaurant settings (primary language and theme)
  const fetchRestaurantSettings = useCallback(async () => {
    if (!session?.restaurantId) return;

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('primary_language, pos_theme_color')
        .eq('id', session.restaurantId)
        .single();

      if (data?.primary_language) {
        setPrimaryLanguage(data.primary_language);
        // Sync UI language with database setting
        const posLang = mapToPOSLanguage(data.primary_language);
        setLang(posLang);
      }
      if (data?.pos_theme_color) {
        setPosTheme(data.pos_theme_color as POSTheme);
        localStorage.setItem('pos_theme', data.pos_theme_color);
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
          if (payload.new && (payload.new as any).pos_theme_color) {
            const newTheme = (payload.new as any).pos_theme_color as POSTheme;
            setPosTheme(newTheme);
            localStorage.setItem('pos_theme', newTheme);
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

  // Void order
  const handleVoidOrder = async () => {
    if (!voidingOrder || !voidReason.trim()) return;

    setVoidLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/${voidingOrder.id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: voidReason,
          voided_by: session?.staffId
        })
      });

      if (response.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== voidingOrder.id));
        setShowVoidModal(false);
        setVoidingOrder(null);
        setVoidReason('');
      } else {
        const data = await response.json();
        alert(data.detail || 'Failed to void order');
      }
    } catch (error) {
      console.error('Failed to void order:', error);
      alert('Failed to void order');
    } finally {
      setVoidLoading(false);
    }
  };

  // Open void modal
  const openVoidModal = (order: Order) => {
    setVoidingOrder(order);
    setVoidReason('');
    setShowVoidModal(true);
  };

  // Print kitchen ticket (optimized for 80mm thermal printers)
  const printKitchenTicket = (order: Order) => {
    const printWindow = window.open('', '', 'width=320,height=600');
    if (!printWindow) {
      alert('Please allow popups to print');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kitchen - ${order.id.slice(0, 8).toUpperCase()}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 80mm;
            padding: 3mm;
            font-size: 12px;
            background: white;
            color: black;
          }
          .order-number {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            border: 3px solid black;
            padding: 3mm;
            margin-bottom: 3mm;
          }
          .order-type {
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            background: black;
            color: white;
            padding: 2mm;
            margin-bottom: 3mm;
          }
          .info { font-size: 11px; margin-bottom: 3mm; }
          .info p { margin: 1mm 0; }
          .items { border-top: 2px solid black; padding-top: 3mm; }
          .item {
            font-size: 14px;
            font-weight: bold;
            margin: 3mm 0;
            padding-bottom: 2mm;
            border-bottom: 1px dashed #ccc;
          }
          .item-qty { font-size: 16px; }
          .modifier {
            font-size: 12px;
            font-weight: normal;
            padding-left: 5mm;
            margin: 1mm 0;
          }
          .special {
            background: #f0f0f0;
            border: 3px solid black;
            padding: 3mm;
            margin: 3mm 0;
            font-size: 14px;
            font-weight: bold;
          }
          .time {
            text-align: center;
            font-size: 11px;
            margin-top: 3mm;
            padding-top: 2mm;
            border-top: 1px dashed black;
          }
        </style>
      </head>
      <body>
        <div class="order-number">
          #${order.id.slice(0, 8).toUpperCase()}
        </div>

        <div class="order-type">
          ${order.service_type === 'dine_in' ? 'DINE IN' : order.service_type === 'pickup' ? 'PICKUP' : 'DELIVERY'}
        </div>

        <div class="info">
          ${order.table_no ? `<p><strong>TABLE: ${order.table_no}</strong></p>` : ''}
          ${order.customer_name ? `<p>Customer: ${order.customer_name}</p>` : ''}
        </div>

        <div class="items">
          ${order.items.map(item => `
            <div class="item">
              <span class="item-qty">${item.quantity}x</span> ${item.name}
              ${item.selectedMeat ? `<div class="modifier">+ ${item.selectedMeat}</div>` : ''}
              ${item.selectedAddOns?.length ? `<div class="modifier">+ ${item.selectedAddOns.join(', ')}</div>` : ''}
              ${item.notes ? `<div class="modifier">"${item.notes}"</div>` : ''}
            </div>
          `).join('')}
        </div>

        ${order.special_instructions ? `
          <div class="special">
            NOTE: ${order.special_instructions}
          </div>
        ` : ''}

        <div class="time">
          ${new Date(order.created_at).toLocaleString('en-NZ', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          })}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 250);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
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
      {/* Navigation Bar */}
      <POSNavbar
        session={session}
        currentTime={currentTime}
        lang={lang}
        theme={posTheme}
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled(!soundEnabled)}
        volume={volume}
        onVolumeChange={setVolume}
        showSoundControls={true}
      />

      {/* Sub Header - Orders count and controls */}
      <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-4">
          {/* Orders count */}
          <div className={`flex items-center gap-2 px-4 py-2 ${themeClasses.bgLight} rounded-lg`}>
            <Utensils className={`w-5 h-5 ${themeClasses.textPrimary}`} />
            <span className={`font-bold ${themeClasses.textPrimary}`}>{orders.length}</span>
            <span className="text-slate-400">{lang === 'th' ? 'ออเดอร์' : 'Orders'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm"
          >
            <Bell className="w-4 h-4" />
            <span>{lang === 'th' ? 'ตั้งค่า' : 'Settings'}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{lang === 'th' ? 'รีเฟรช' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
          <div className="p-4 bg-slate-700 rounded-xl">
            <h3 className="font-semibold mb-4">{lang === 'th' ? 'ตั้งค่าการแจ้งเตือน' : 'Notification Settings'}</h3>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-5 h-5 rounded accent-orange-500"
                />
                <span>{lang === 'th' ? 'เสียงแจ้งเตือน' : 'Sound'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vibrationEnabled}
                  onChange={(e) => setVibrationEnabled(e.target.checked)}
                  className="w-5 h-5 rounded accent-orange-500"
                />
                <span>{lang === 'th' ? 'สั่นเตือน' : 'Vibration'}</span>
              </label>
              <div className="flex items-center gap-2">
                <span>{lang === 'th' ? 'ระดับเสียง:' : 'Volume:'}</span>
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
        </div>
      )}

      {/* Orders Grid */}
      <main className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Coffee className="w-16 h-16 mb-4" />
            <BilingualText
              category="kitchen"
              textKey="noOrders"
              lang={lang}
              className="items-center"
              primaryClassName="text-xl"
              englishClassName="text-sm opacity-60"
            />
            <BilingualText
              category="kitchen"
              textKey="waitingForOrders"
              lang={lang}
              className="items-center mt-2"
              primaryClassName="text-sm"
              englishClassName="text-xs opacity-60"
            />
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
                    <div className={`text-2xl font-bold ${themeClasses.textPrimary}`}>
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
                          <span className={`w-6 h-6 ${themeClasses.bgPrimary} rounded-full flex items-center justify-center text-sm font-bold`}>
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
                  {/* Void Button - always visible for pending/confirmed orders */}
                  {/* Print Kitchen Ticket Button */}
                  <button
                    onClick={() => printKitchenTicket(order)}
                    className="px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg font-semibold transition-colors flex items-center justify-center"
                    title={lang === 'th' ? 'พิมพ์ใบสั่งครัว' : 'Print Ticket'}
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  {(order.status === 'pending' || order.status === 'confirmed') && (
                    <button
                      onClick={() => openVoidModal(order)}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-colors flex items-center justify-center"
                      title={lang === 'th' ? 'ยกเลิกออเดอร์' : 'Void Order'}
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors flex items-center justify-center"
                    >
                      <BilingualTextInline
                        category="common"
                        textKey="confirm"
                        lang={lang}
                        englishClassName="text-[10px] opacity-80 ml-1"
                      />
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className={`flex-1 py-2 ${themeClasses.primaryButton} rounded-lg font-semibold transition-colors flex items-center justify-center`}
                    >
                      <BilingualTextInline
                        category="kitchen"
                        textKey="startCooking"
                        lang={lang}
                        englishClassName="text-[10px] opacity-80 ml-1"
                      />
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="flex-1 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <BilingualTextInline
                        category="kitchen"
                        textKey="markReady"
                        lang={lang}
                        englishClassName="text-[10px] opacity-80 ml-1"
                      />
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg font-semibold transition-colors flex items-center justify-center"
                    >
                      <BilingualTextInline
                        category="kitchen"
                        textKey="served"
                        lang={lang}
                        englishClassName="text-[10px] opacity-80 ml-1"
                      />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Void Order Modal */}
      {showVoidModal && voidingOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-md w-full">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-red-500">
                {lang === 'th' ? 'ยกเลิกออเดอร์' : 'Void Order'}
              </h3>
              <button
                onClick={() => setShowVoidModal(false)}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-slate-400 mb-2">
                {lang === 'th' ? 'ออเดอร์:' : 'Order:'} #{voidingOrder.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-white mb-4">
                {lang === 'th' ? 'โต๊ะ:' : 'Table:'} {voidingOrder.table_no || '-'}
              </p>

              <label className="block text-sm text-slate-400 mb-2">
                {lang === 'th' ? 'เหตุผลในการยกเลิก *' : 'Void Reason *'}
              </label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder={lang === 'th' ? 'กรุณาระบุเหตุผล...' : 'Please specify reason...'}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                rows={3}
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowVoidModal(false)}
                  className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg font-semibold"
                >
                  {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  onClick={handleVoidOrder}
                  disabled={!voidReason.trim() || voidLoading}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  {voidLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  {lang === 'th' ? 'ยืนยันยกเลิก' : 'Confirm Void'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
