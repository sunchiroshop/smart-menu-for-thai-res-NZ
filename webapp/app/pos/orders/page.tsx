'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Bell, Volume2, VolumeX, Clock, CheckCircle,
  AlertTriangle, LogOut, RefreshCw, Loader2, Timer,
  Utensils, Coffee, Hand, Droplets, Receipt,
  MessageSquare, Store, MapPin, X, Printer, XCircle, Eye
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

  // Print preview states
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printPreviewOrder, setPrintPreviewOrder] = useState<Order | null>(null);

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

  // Open print preview
  const openPrintPreview = (order: Order) => {
    setPrintPreviewOrder(order);
    setShowPrintPreview(true);
  };

  // Print order receipt (optimized for 80mm thermal printers)
  const printOrder = (order: Order) => {
    const printWindow = window.open('', '', 'width=320,height=600');
    if (!printWindow) {
      alert('Please allow popups to print');
      return;
    }

    // Calculate subtotal from items
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Get additional fees from order (delivery_fee, surcharge_amount)
    const orderAny = order as any;
    const deliveryFee = orderAny.delivery_fee || 0;
    const surchargeAmount = orderAny.surcharge_amount || 0;

    // Calculate GST (NZ: 15% included in price, formula: total * 3 / 23)
    const totalPrice = order.total_price || subtotal + deliveryFee + surchargeAmount;
    const gstAmount = Math.round(totalPrice * 3 / 23 * 100) / 100;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${order.id.slice(0, 8).toUpperCase()}</title>
        <style>
          /* Thermal Printer CSS - 80mm width */
          * { margin: 0; padding: 0; box-sizing: border-box; }

          @page {
            size: 80mm auto;
            margin: 0;
          }

          body {
            font-family: 'Courier New', Courier, monospace;
            width: 80mm;
            max-width: 80mm;
            padding: 3mm;
            font-size: 12px;
            line-height: 1.3;
            background: white;
            color: black;
          }

          .receipt { width: 100%; }

          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 3mm;
            margin-bottom: 3mm;
          }

          .header h1 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 1mm;
          }

          .header .subtitle {
            font-size: 10px;
          }

          .order-type {
            display: inline-block;
            background: #000;
            color: #fff;
            padding: 1mm 3mm;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 2mm;
          }

          .info {
            margin-bottom: 3mm;
            font-size: 11px;
          }

          .info p { margin: 1mm 0; }

          .items {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 2mm 0;
            margin: 2mm 0;
          }

          .item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin: 1.5mm 0;
            font-size: 11px;
          }

          .item-qty {
            width: 8mm;
            font-weight: bold;
          }

          .item-name {
            flex: 1;
            padding: 0 1mm;
          }

          .item-price {
            width: 18mm;
            text-align: right;
          }

          .modifier {
            font-size: 9px;
            color: #333;
            padding-left: 10mm;
            margin: 0.5mm 0;
          }

          .special {
            background: #f0f0f0;
            border: 1px solid #999;
            padding: 2mm;
            margin: 2mm 0;
            font-size: 10px;
          }

          .special-label {
            font-weight: bold;
            margin-bottom: 1mm;
          }

          .totals {
            margin-top: 2mm;
            padding-top: 2mm;
            font-size: 11px;
          }

          .total-line {
            display: flex;
            justify-content: space-between;
            margin: 1mm 0;
          }

          .grand-total {
            font-size: 14px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 2mm;
            margin-top: 2mm;
          }

          .gst-info {
            font-size: 9px;
            text-align: right;
            color: #333;
            margin-top: 1mm;
          }

          .footer {
            text-align: center;
            margin-top: 4mm;
            padding-top: 3mm;
            border-top: 2px dashed #000;
            font-size: 9px;
          }

          .footer p { margin: 1mm 0; }

          .cut-line {
            text-align: center;
            margin-top: 5mm;
            padding-top: 3mm;
            border-top: 1px dashed #999;
            font-size: 8px;
            color: #999;
          }

          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>${session?.restaurantName || 'Restaurant'}</h1>
            <p class="subtitle">TAX INVOICE</p>
            <span class="order-type">${order.service_type === 'dine_in' ? 'DINE IN' : order.service_type === 'pickup' ? 'PICKUP' : 'DELIVERY'}</span>
          </div>

          <div class="info">
            <p><strong>Order #:</strong> ${order.id.slice(0, 8).toUpperCase()}</p>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString('en-NZ', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}</p>
            ${order.table_no ? `<p><strong>Table:</strong> ${order.table_no}</p>` : ''}
            ${order.customer_name ? `<p><strong>Customer:</strong> ${order.customer_name}</p>` : ''}
          </div>

          <div class="items">
            ${order.items.map(item => `
              <div class="item">
                <span class="item-qty">${item.quantity}x</span>
                <span class="item-name">${item.nameEn || item.name}</span>
                <span class="item-price">$${(item.price * item.quantity).toFixed(2)}</span>
              </div>
              ${item.selectedMeat ? `<div class="modifier">+ ${item.selectedMeat}</div>` : ''}
              ${item.selectedAddOns?.length ? `<div class="modifier">+ ${item.selectedAddOns.join(', ')}</div>` : ''}
              ${item.notes ? `<div class="modifier">"${item.notes}"</div>` : ''}
            `).join('')}
          </div>

          ${order.special_instructions ? `
            <div class="special">
              <div class="special-label">SPECIAL NOTE:</div>
              ${order.special_instructions}
            </div>
          ` : ''}

          <div class="totals">
            <div class="total-line">
              <span>Subtotal:</span>
              <span>$${subtotal.toFixed(2)}</span>
            </div>
            ${deliveryFee > 0 ? `
              <div class="total-line">
                <span>Delivery Fee:</span>
                <span>$${deliveryFee.toFixed(2)}</span>
              </div>
            ` : ''}
            ${surchargeAmount > 0 ? `
              <div class="total-line">
                <span>Service Fee:</span>
                <span>$${surchargeAmount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="total-line grand-total">
              <span>TOTAL:</span>
              <span>$${totalPrice.toFixed(2)} NZD</span>
            </div>
            <div class="gst-info">
              Incl. GST (15%): $${gstAmount.toFixed(2)}
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your order!</p>
            <p>Powered by Smart Menu NZ</p>
          </div>

          <div class="cut-line">
            - - - - - - - - - - - -
          </div>
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

  // Print kitchen ticket (for kitchen display)
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

      {/* Refresh Button */}
      <div className="bg-slate-800 px-4 py-2 flex justify-end border-b border-slate-700">
        <button
          onClick={() => { fetchOrders(); fetchServiceRequests(); }}
          className="flex items-center gap-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{lang === 'th' ? 'รีเฟรช' : 'Refresh'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-4 font-semibold flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'orders'
              ? `bg-slate-800 ${themeClasses.textPrimary} border-b-2 ${themeClasses.borderPrimary}`
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Utensils className="w-5 h-5" />
          <BilingualTextInline
            category="orders"
            textKey="ordersTab"
            lang={lang}
            englishClassName="text-[10px] opacity-70 ml-1"
          />
          <span className={`px-2 py-0.5 ${themeClasses.bgPrimary} text-white text-sm rounded-full`}>
            {orders.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-4 font-semibold flex items-center justify-center gap-2 transition-colors relative ${
            activeTab === 'requests'
              ? `bg-slate-800 ${themeClasses.textPrimary} border-b-2 ${themeClasses.borderPrimary}`
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bell className="w-5 h-5" />
          <BilingualTextInline
            category="orders"
            textKey="requestsTab"
            lang={lang}
            englishClassName="text-[10px] opacity-70 ml-1"
          />
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
              <BilingualText
                category="orders"
                textKey="noOrders"
                lang={lang}
                className="items-center"
                primaryClassName="text-xl"
                englishClassName="text-sm opacity-60"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-slate-800 rounded-xl overflow-hidden">
                  {/* Order Header */}
                  <div className="p-4 bg-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {order.service_type === 'dine_in' ? (
                        <div className={`w-12 h-12 ${themeClasses.bgPrimary} rounded-full flex items-center justify-center`}>
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
                      <p className={`text-lg font-bold ${themeClasses.textPrimary}`}>${order.total_price?.toFixed(2) || '0.00'}</p>
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
                  <div className="p-3 bg-slate-700/30 flex gap-2 flex-wrap">
                    {/* Preview Button */}
                    <button
                      onClick={() => openPrintPreview(order)}
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg font-semibold flex items-center justify-center gap-1"
                      title={lang === 'th' ? 'ดูรายละเอียด' : 'Preview'}
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    {/* Print Button */}
                    <button
                      onClick={() => printOrder(order)}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold flex items-center justify-center gap-1"
                      title={lang === 'th' ? 'พิมพ์' : 'Print'}
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    {/* Void Button */}
                    <button
                      onClick={() => openVoidModal(order)}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold flex items-center justify-center gap-1"
                      title={lang === 'th' ? 'ยกเลิกออเดอร์' : 'Void'}
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
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
              <BilingualText
                category="orders"
                textKey="noRequests"
                lang={lang}
                className="items-center"
                primaryClassName="text-xl"
                englishClassName="text-sm opacity-60"
              />
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
                            <p className={`text-2xl font-bold ${themeClasses.textPrimary}`}>{t('orders', 'table', lang)} {request.table_no}</p>
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
                {lang === 'th' ? 'โต๊ะ:' : 'Table:'} {voidingOrder.table_no || '-'} |
                {lang === 'th' ? ' ยอดรวม:' : ' Total:'} ${voidingOrder.total_price?.toFixed(2) || '0.00'}
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

      {/* Print Preview Modal */}
      {showPrintPreview && printPreviewOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full text-black my-4">
            <div className="p-4 border-b flex items-center justify-between bg-slate-100 rounded-t-xl">
              <h3 className="text-lg font-bold">
                {lang === 'th' ? 'ตัวอย่างก่อนพิมพ์' : 'Print Preview'}
              </h3>
              <button
                onClick={() => setShowPrintPreview(false)}
                className="p-1 hover:bg-slate-200 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Preview */}
            <div className="p-6 font-mono text-sm">
              <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
                <h1 className="text-xl font-bold">{session?.restaurantName || 'Restaurant'}</h1>
                <p className="text-gray-600">Order Receipt</p>
              </div>

              <div className="mb-4 space-y-1">
                <p><strong>Order #:</strong> {printPreviewOrder.id.slice(0, 8).toUpperCase()}</p>
                <p><strong>Date:</strong> {new Date(printPreviewOrder.created_at).toLocaleString('en-NZ')}</p>
                <p><strong>Type:</strong> {printPreviewOrder.service_type === 'dine_in' ? 'Dine In' : printPreviewOrder.service_type === 'pickup' ? 'Pickup' : 'Delivery'}</p>
                {printPreviewOrder.table_no && <p><strong>Table:</strong> {printPreviewOrder.table_no}</p>}
                {printPreviewOrder.customer_name && <p><strong>Customer:</strong> {printPreviewOrder.customer_name}</p>}
              </div>

              <div className="border-t border-b border-dashed border-gray-400 py-4 my-4">
                {printPreviewOrder.items.map((item, idx) => (
                  <div key={idx} className="mb-2">
                    <div className="flex justify-between">
                      <span>{item.quantity}x {item.nameEn || item.name}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    {item.selectedMeat && (
                      <p className="text-xs text-gray-600 ml-4">+ {item.selectedMeat}</p>
                    )}
                    {item.selectedAddOns?.length ? (
                      <p className="text-xs text-gray-600 ml-4">+ {item.selectedAddOns.join(', ')}</p>
                    ) : null}
                  </div>
                ))}
              </div>

              {printPreviewOrder.special_instructions && (
                <div className="bg-gray-100 p-2 rounded mb-4 italic text-sm">
                  Note: {printPreviewOrder.special_instructions}
                </div>
              )}

              <div className="text-right text-lg font-bold">
                Total: ${printPreviewOrder.total_price?.toFixed(2) || '0.00'}
              </div>

              <div className="text-center mt-6 text-xs text-gray-500">
                <p>Thank you for your order!</p>
                <p>Powered by Smart Menu</p>
              </div>
            </div>

            <div className="p-4 border-t bg-slate-100 rounded-b-xl flex gap-3">
              <button
                onClick={() => setShowPrintPreview(false)}
                className="flex-1 py-2 bg-slate-300 hover:bg-slate-400 rounded-lg font-semibold text-black"
              >
                {lang === 'th' ? 'ปิด' : 'Close'}
              </button>
              <button
                onClick={() => {
                  printOrder(printPreviewOrder);
                  setShowPrintPreview(false);
                }}
                className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                {lang === 'th' ? 'พิมพ์' : 'Print'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
