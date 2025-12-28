'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign, CreditCard, Building2, Banknote, Receipt,
  TrendingUp, AlertTriangle, XCircle, CheckCircle, Clock,
  Calendar, RefreshCw, Loader2, LogOut, ArrowLeft, Printer,
  Eye, X
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import POSNavbar from '@/components/POSNavbar';
import { mapToPOSLanguage, POSLanguage } from '@/lib/pos-translations';
import { getThemeClasses, POSTheme } from '@/lib/pos-theme';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client for real-time
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface POSSession {
  staffId: string;
  staffName: string;
  role: string;
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  expires: number;
}

interface DailySummary {
  total_orders: number;
  completed_orders: number;
  voided_orders: number;
  pending_payment: number;
  total_revenue: number;
  revenue_by_method: {
    card: number;
    bank_transfer: number;
    cash_at_counter: number;
    unpaid: number;
  };
  void_reasons: Array<{
    order_id: string;
    reason: string;
    amount: number;
  }>;
}

interface OrderDetail {
  id: string;
  table_no: string | null;
  customer_name: string | null;
  service_type: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  total_price: number;
  created_at: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  void_reason?: string;
}

type ViewType = 'total' | 'completed' | 'voided' | 'pending' | null;

export default function CashierDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<POSSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // View details states
  const [viewType, setViewType] = useState<ViewType>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Print preview states
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Language state
  const [lang, setLang] = useState<POSLanguage>('th');

  // Theme state
  const [posTheme, setPosTheme] = useState<POSTheme>('orange');
  const themeClasses = getThemeClasses(posTheme);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('pos_session');
    if (savedSession) {
      const parsedSession = JSON.parse(savedSession);
      if (parsedSession.expires > Date.now()) {
        // Check if user is cashier or has permission
        if (parsedSession.role === 'cashier' || parsedSession.role === 'manager' || parsedSession.role === 'owner') {
          setSession(parsedSession);
          // Set language from session
          if (parsedSession.primaryLanguage) {
            const posLang = mapToPOSLanguage(parsedSession.primaryLanguage);
            setLang(posLang);
          }
        } else {
          router.push('/pos/orders');
          return;
        }
      } else {
        localStorage.removeItem('pos_session');
        router.push('/pos/login');
        return;
      }
    } else {
      router.push('/pos/login');
      return;
    }
    setLoading(false);
  }, [router]);

  // Fetch summary when session or date changes
  useEffect(() => {
    if (session) {
      fetchSummary();
    }
  }, [session, selectedDate]);

  // Initial fetch for restaurant settings
  useEffect(() => {
    if (session?.restaurantId) {
      fetchRestaurantSettings();
    }
  }, [session?.restaurantId, fetchRestaurantSettings]);

  // Real-time subscription for restaurant settings (language changes)
  useEffect(() => {
    if (!session?.restaurantId) return;

    const settingsChannel = supabase
      .channel('cashier-settings')
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
            setLang(mapToPOSLanguage(newLang));
          }
          if (payload.new && (payload.new as any).pos_theme_color) {
            setPosTheme((payload.new as any).pos_theme_color as POSTheme);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
    };
  }, [session?.restaurantId]);

  const fetchSummary = async () => {
    if (!session) return;

    setRefreshing(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/cashier/daily-summary/${session.restaurantId}?date=${selectedDate}`
      );
      const data = await response.json();

      if (data.success) {
        setSummary(data.summary);
      } else {
        setError(data.detail || 'Failed to fetch summary');
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
      setError('Failed to fetch summary');
    } finally {
      setRefreshing(false);
    }
  };

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
        const posLang = mapToPOSLanguage(data.primary_language);
        setLang(posLang);
      }
      if (data?.pos_theme_color) {
        setPosTheme(data.pos_theme_color as POSTheme);
      }
    } catch (error) {
      console.error('Failed to fetch restaurant settings:', error);
    }
  }, [session?.restaurantId]);

  const handleLogout = () => {
    localStorage.removeItem('pos_session');
    router.push('/pos/login');
  };

  // Fetch order details by type
  const fetchOrderDetails = async (type: ViewType) => {
    if (!session || !type) return;

    setLoadingDetails(true);
    setViewType(type);
    setOrderDetails([]);

    try {
      let statusFilter = '';
      switch (type) {
        case 'total':
          statusFilter = 'all';
          break;
        case 'completed':
          statusFilter = 'completed';
          break;
        case 'voided':
          statusFilter = 'voided';
          break;
        case 'pending':
          statusFilter = 'pending_payment';
          break;
      }

      const response = await fetch(
        `${API_URL}/api/cashier/orders/${session.restaurantId}?date=${selectedDate}&filter=${statusFilter}`
      );
      const data = await response.json();

      if (data.success) {
        setOrderDetails(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getViewTitle = (type: ViewType) => {
    if (lang === 'th') {
      switch (type) {
        case 'total': return 'ออเดอร์ทั้งหมด';
        case 'completed': return 'ออเดอร์สำเร็จ';
        case 'voided': return 'ออเดอร์ที่ยกเลิก';
        case 'pending': return 'รอชำระเงิน';
        default: return '';
      }
    } else {
      switch (type) {
        case 'total': return 'All Orders';
        case 'completed': return 'Completed Orders';
        case 'voided': return 'Voided Orders';
        case 'pending': return 'Pending Payment';
        default: return '';
      }
    }
  };

  const openPrintPreview = () => {
    setShowPrintPreview(true);
  };

  const printReport = () => {
    if (!summary) return;

    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) {
      alert('Please allow popups to print');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Cashier Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; width: 80mm; padding: 10mm; font-size: 12px; }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
          .header h1 { font-size: 16px; margin-bottom: 5px; }
          .section { margin: 15px 0; padding-bottom: 10px; border-bottom: 1px dashed #000; }
          .section h2 { font-size: 14px; margin-bottom: 10px; }
          .row { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { font-size: 18px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${session?.restaurantName || 'Restaurant'}</h1>
          <p>Daily Cashier Report</p>
          <p>${selectedDate}</p>
        </div>

        <div class="section">
          <h2>Orders Summary</h2>
          <div class="row"><span>Total Orders:</span><span>${summary.total_orders}</span></div>
          <div class="row"><span>Completed:</span><span>${summary.completed_orders}</span></div>
          <div class="row"><span>Voided:</span><span>${summary.voided_orders}</span></div>
          <div class="row"><span>Pending Payment:</span><span>${summary.pending_payment}</span></div>
        </div>

        <div class="section">
          <h2>Revenue by Payment Method</h2>
          <div class="row"><span>Credit/Debit Card:</span><span>$${summary.revenue_by_method.card.toFixed(2)}</span></div>
          <div class="row"><span>Bank Transfer:</span><span>$${summary.revenue_by_method.bank_transfer.toFixed(2)}</span></div>
          <div class="row"><span>Cash at Counter:</span><span>$${summary.revenue_by_method.cash_at_counter.toFixed(2)}</span></div>
          <div class="row"><span>Unpaid:</span><span>$${summary.revenue_by_method.unpaid.toFixed(2)}</span></div>
        </div>

        <div class="section">
          <div class="row total">
            <span>TOTAL REVENUE:</span>
            <span>$${summary.total_revenue.toFixed(2)} NZD</span>
          </div>
        </div>

        ${summary.void_reasons.length > 0 ? `
          <div class="section">
            <h2>Void Reasons</h2>
            ${summary.void_reasons.map(v => `
              <div style="margin: 5px 0; font-size: 10px;">
                <div>Order: ${v.order_id.slice(0, 8)}</div>
                <div>Reason: ${v.reason}</div>
                <div>Amount: $${v.amount.toFixed(2)}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="footer">
          <p>Printed: ${new Date().toLocaleString()}</p>
          <p>Powered by Smart Menu</p>
        </div>

        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation Bar */}
      <POSNavbar
        session={session}
        currentTime={currentTime}
        lang={lang}
        theme={posTheme}
      />

      {/* Sub Header - Date and Controls */}
      <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
        <h2 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>
          {lang === 'th' ? 'รายงานประจำวัน' : 'Daily Report'}
        </h2>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="bg-transparent text-white text-sm outline-none"
            />
          </div>

          <button
            onClick={fetchSummary}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{lang === 'th' ? 'รีเฟรช' : 'Refresh'}</span>
          </button>

          <button
            onClick={openPrintPreview}
            disabled={!summary}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 text-sm"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'th' ? 'ดูตัวอย่าง' : 'Preview'}</span>
          </button>

          <button
            onClick={printReport}
            disabled={!summary}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 text-sm"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'th' ? 'พิมพ์' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {refreshing && !summary ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
          </div>
        ) : summary ? (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                className="bg-slate-800 rounded-xl p-6 cursor-pointer hover:bg-slate-700 transition-colors group"
                onClick={() => fetchOrderDetails('total')}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Receipt className="w-6 h-6 text-blue-400" />
                    <span className="text-slate-400">{lang === 'th' ? 'ออเดอร์ทั้งหมด' : 'Total Orders'}</span>
                  </div>
                  <Eye className="w-5 h-5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-3xl font-bold">{summary.total_orders}</p>
              </div>

              <div
                className="bg-slate-800 rounded-xl p-6 cursor-pointer hover:bg-slate-700 transition-colors group"
                onClick={() => fetchOrderDetails('completed')}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <span className="text-slate-400">{lang === 'th' ? 'สำเร็จ' : 'Completed'}</span>
                  </div>
                  <Eye className="w-5 h-5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-3xl font-bold text-green-400">{summary.completed_orders}</p>
              </div>

              <div
                className="bg-slate-800 rounded-xl p-6 cursor-pointer hover:bg-slate-700 transition-colors group"
                onClick={() => fetchOrderDetails('voided')}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-6 h-6 text-red-400" />
                    <span className="text-slate-400">{lang === 'th' ? 'ยกเลิก' : 'Voided'}</span>
                  </div>
                  <Eye className="w-5 h-5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-3xl font-bold text-red-400">{summary.voided_orders}</p>
              </div>

              <div
                className="bg-slate-800 rounded-xl p-6 cursor-pointer hover:bg-slate-700 transition-colors group"
                onClick={() => fetchOrderDetails('pending')}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-yellow-400" />
                    <span className="text-slate-400">{lang === 'th' ? 'รอชำระเงิน' : 'Pending Payment'}</span>
                  </div>
                  <Eye className="w-5 h-5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-3xl font-bold text-yellow-400">{summary.pending_payment}</p>
              </div>
            </div>

            {/* Total Revenue */}
            <div className={`bg-gradient-to-r ${themeClasses.bgGradient} rounded-xl p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-8 h-8" />
                    <span className="text-lg opacity-90">{lang === 'th' ? 'รายได้รวม' : 'Total Revenue'}</span>
                  </div>
                  <p className="text-5xl font-bold">${summary.total_revenue.toFixed(2)}</p>
                  <p className="text-lg opacity-75 mt-1">NZD</p>
                </div>
                <DollarSign className="w-24 h-24 opacity-20" />
              </div>
            </div>

            {/* Revenue by Payment Method */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-blue-400" />
                {lang === 'th' ? 'รายได้ตามวิธีชำระเงิน' : 'Revenue by Payment Method'}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-300 text-sm">{lang === 'th' ? 'บัตรเครดิต/เดบิต' : 'Credit/Debit'}</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">
                    ${summary.revenue_by_method.card.toFixed(2)}
                  </p>
                </div>

                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-green-400" />
                    <span className="text-green-300 text-sm">{lang === 'th' ? 'โอนเงิน' : 'Bank Transfer'}</span>
                  </div>
                  <p className="text-2xl font-bold text-green-400">
                    ${summary.revenue_by_method.bank_transfer.toFixed(2)}
                  </p>
                </div>

                <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Banknote className="w-5 h-5 text-orange-400" />
                    <span className="text-orange-300 text-sm">{lang === 'th' ? 'เงินสด' : 'Cash at Counter'}</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-400">
                    ${summary.revenue_by_method.cash_at_counter.toFixed(2)}
                  </p>
                </div>

                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-300 text-sm">{lang === 'th' ? 'ยังไม่ชำระ' : 'Unpaid'}</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">
                    ${summary.revenue_by_method.unpaid.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Void Reasons */}
            {summary.void_reasons.length > 0 && (
              <div className="bg-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  {lang === 'th' ? `ออเดอร์ที่ยกเลิก (${summary.void_reasons.length})` : `Voided Orders (${summary.void_reasons.length})`}
                </h2>

                <div className="space-y-3">
                  {summary.void_reasons.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm text-slate-400">
                          Order #{item.order_id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-red-400">{item.reason}</p>
                      </div>
                      <p className="text-lg font-bold text-red-400">
                        -${item.amount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">{lang === 'th' ? 'ทางลัด' : 'Quick Actions'}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <button
                  onClick={() => router.push('/pos/orders')}
                  className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-center"
                >
                  <Receipt className="w-8 h-8 mx-auto mb-2" />
                  <span>{lang === 'th' ? 'ดูออเดอร์' : 'View Orders'}</span>
                </button>

                <button
                  onClick={printReport}
                  className="p-4 bg-green-600 hover:bg-green-700 rounded-lg text-center"
                >
                  <Printer className="w-8 h-8 mx-auto mb-2" />
                  <span>{lang === 'th' ? 'พิมพ์รายงาน' : 'Print Report'}</span>
                </button>

                <button
                  onClick={fetchSummary}
                  className="p-4 bg-orange-600 hover:bg-orange-700 rounded-lg text-center"
                >
                  <RefreshCw className="w-8 h-8 mx-auto mb-2" />
                  <span>{lang === 'th' ? 'รีเฟรช' : 'Refresh Data'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-12">
            <Receipt className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>{lang === 'th' ? 'ไม่มีข้อมูลสำหรับวันที่เลือก' : 'No data available for the selected date'}</p>
          </div>
        )}
      </main>

      {/* Order Details Modal */}
      {viewType && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden my-4">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold">{getViewTitle(viewType)}</h3>
              <button
                onClick={() => setViewType(null)}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[70vh]">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : orderDetails.length === 0 ? (
                <div className="text-center text-slate-500 py-12">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>ไม่พบข้อมูล / No orders found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orderDetails.map((order) => (
                    <div
                      key={order.id}
                      className={`bg-slate-700/50 rounded-lg p-4 border-l-4 ${
                        order.status === 'voided' ? 'border-red-500' :
                        order.payment_status === 'paid' ? 'border-green-500' :
                        'border-yellow-500'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-sm text-slate-400">
                            {order.table_no ? `โต๊ะ ${order.table_no}` : order.customer_name || 'N/A'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(order.created_at).toLocaleTimeString('th-TH')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${
                            order.status === 'voided' ? 'text-red-400 line-through' : ''
                          }`}>
                            ${order.total_price.toFixed(2)}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            order.status === 'voided' ? 'bg-red-500/20 text-red-400' :
                            order.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {order.status === 'voided' ? 'Voided' :
                             order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="bg-slate-800 rounded p-2 mb-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm py-1">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="text-slate-400">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Payment Method */}
                      {order.payment_method && (
                        <p className="text-xs text-slate-400">
                          Payment: {order.payment_method === 'card' ? 'Credit/Debit Card' :
                                   order.payment_method === 'bank_transfer' ? 'Bank Transfer' :
                                   order.payment_method === 'cash_at_counter' ? 'Cash at Counter' : order.payment_method}
                        </p>
                      )}

                      {/* Void Reason */}
                      {order.void_reason && (
                        <div className="mt-2 p-2 bg-red-500/10 rounded border border-red-500/30">
                          <p className="text-sm text-red-400">
                            <strong>Void reason:</strong> {order.void_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-700">
              <button
                onClick={() => setViewType(null)}
                className="w-full py-2 bg-slate-600 hover:bg-slate-500 rounded-lg font-semibold"
              >
                ปิด / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintPreview && summary && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full text-black my-4">
            <div className="p-4 border-b flex items-center justify-between bg-slate-100 rounded-t-xl">
              <h3 className="text-lg font-bold">ตัวอย่างก่อนพิมพ์ / Print Preview</h3>
              <button
                onClick={() => setShowPrintPreview(false)}
                className="p-1 hover:bg-slate-200 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Report Preview */}
            <div className="p-6 font-mono text-sm">
              <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
                <h1 className="text-lg font-bold">{session?.restaurantName}</h1>
                <p className="text-gray-600">Daily Cashier Report</p>
                <p className="text-gray-500">{selectedDate}</p>
              </div>

              <div className="border-b border-dashed border-gray-400 pb-4 mb-4 space-y-2">
                <div className="flex justify-between">
                  <span>Total Orders:</span>
                  <span className="font-bold">{summary.total_orders}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span className="font-bold text-green-600">{summary.completed_orders}</span>
                </div>
                <div className="flex justify-between">
                  <span>Voided:</span>
                  <span className="font-bold text-red-600">{summary.voided_orders}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Payment:</span>
                  <span className="font-bold text-yellow-600">{summary.pending_payment}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-gray-400 pb-4 mb-4">
                <p className="font-bold mb-2">Revenue by Payment:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Credit/Debit:</span>
                    <span>${summary.revenue_by_method.card.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bank Transfer:</span>
                    <span>${summary.revenue_by_method.bank_transfer.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash at Counter:</span>
                    <span>${summary.revenue_by_method.cash_at_counter.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unpaid:</span>
                    <span>${summary.revenue_by_method.unpaid.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-xl font-bold border-t-2 border-dashed border-gray-400 pt-4">
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-green-600">${summary.total_revenue.toFixed(2)} NZD</p>
              </div>

              <div className="text-center mt-4 text-xs text-gray-500">
                <p>Printed: {new Date().toLocaleString()}</p>
                <p>Powered by Smart Menu</p>
              </div>
            </div>

            <div className="p-4 border-t bg-slate-100 rounded-b-xl flex gap-3">
              <button
                onClick={() => setShowPrintPreview(false)}
                className="flex-1 py-2 bg-slate-300 hover:bg-slate-400 rounded-lg font-semibold text-black"
              >
                ปิด / Close
              </button>
              <button
                onClick={() => {
                  printReport();
                  setShowPrintPreview(false);
                }}
                className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                พิมพ์ / Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
