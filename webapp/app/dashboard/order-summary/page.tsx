'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Banknote,
  Users,
  Truck,
  ShoppingBag,
  DollarSign,
  Filter,
  Eye,
  X,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Download,
  FileSpreadsheet,
  FileText,
  Lock
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface OrderItem {
  name: string;
  nameEn?: string;
  quantity: number;
  price: number;
  itemTotal: number;
  selectedMeat?: { name: string; nameEn?: string; price: number };
  selectedAddOns?: Array<{ name: string; nameEn?: string; price: number }>;
}

interface CustomerDetails {
  table_no?: string;
  name?: string;
  phone?: string;
  address?: string;
  pickup_time?: string;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  service_type: string;
  customer_name?: string;
  customer_phone?: string;
  customer_details?: CustomerDetails;
  table_no?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  delivery_fee?: number;
  total_price: number;
  special_instructions?: string;
  // Voided order fields
  is_voided?: boolean;
  void_reason?: string;
  voided_at?: string;
}

interface Summary {
  total_orders: number;
  total_revenue: number;
  payment_status: {
    paid: number;
    pending: number;
    failed: number;
  };
  service_type: {
    dine_in: number;
    pickup: number;
    delivery: number;
  };
  payment_method: {
    card: { count: number; revenue: number };
    bank_transfer: { count: number; revenue: number };
  };
  // Voided orders
  voided_orders?: number;
  voided_amount?: number;
}

type ViewType = 'total' | 'revenue' | 'payment' | 'service' | 'voided' | null;

export default function OrderSummaryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [userRole, setUserRole] = useState<string>('free_trial');
  const [exporting, setExporting] = useState<string | null>(null);

  // Card view modal
  const [viewType, setViewType] = useState<ViewType>(null);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('');

  // Quick date presets
  const setDatePreset = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
    const today = new Date();
    let start: Date;
    let end = today;

    switch (preset) {
      case 'today':
        start = today;
        break;
      case 'yesterday':
        start = new Date(today);
        start.setDate(start.getDate() - 1);
        end = start;
        break;
      case 'week':
        start = new Date(today);
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start = new Date(today);
        start.setMonth(start.getMonth() - 1);
        break;
      default:
        start = today;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  useEffect(() => {
    checkUserAndFetchData();
  }, []);

  useEffect(() => {
    if (restaurantId) {
      fetchOrdersSummary();
    }
  }, [restaurantId, startDate, endDate, paymentStatusFilter, serviceTypeFilter]);

  const checkUserAndFetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/login');
      return;
    }

    // Get restaurant ID from profile
    try {
      const savedRestaurantId = localStorage.getItem(`selected_restaurant_${session.user.id}`);
      const url = savedRestaurantId
        ? `${API_URL}/api/user/profile?user_id=${session.user.id}&restaurant_id=${savedRestaurantId}`
        : `${API_URL}/api/user/profile?user_id=${session.user.id}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.restaurant?.restaurant_id) {
        setRestaurantId(data.restaurant.restaurant_id);
      }
      // Get user role for export feature check
      if (data.subscription?.role) {
        setUserRole(data.subscription.role);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Check if user can export (Enterprise only)
  const canExport = userRole === 'enterprise' || userRole === 'admin';

  // Export to CSV
  const exportToCSV = () => {
    if (!canExport) return;
    setExporting('csv');

    try {
      const headers = ['Date', 'Customer', 'Service Type', 'Payment Status', 'Payment Method', 'Amount'];
      const rows = orders.map(order => [
        formatDateTime(order.created_at),
        getCustomerInfo(order),
        getServiceTypeLabel(order.service_type),
        order.payment_status,
        order.payment_method || '-',
        `$${order.total_price.toFixed(2)}`
      ]);

      const csvContent = [
        `Order Summary Report - ${startDate} to ${endDate}`,
        '',
        `Total Orders: ${summary?.total_orders || 0}`,
        `Total Revenue: $${summary?.total_revenue?.toFixed(2) || '0.00'}`,
        '',
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `order-summary-${startDate}-to-${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setExporting(null);
    }
  };

  // Export to Excel (XLSX format via CSV - Excel can open CSV)
  const exportToExcel = () => {
    if (!canExport) return;
    setExporting('excel');

    try {
      const headers = ['Date', 'Customer', 'Service Type', 'Payment Status', 'Payment Method', 'Items', 'Subtotal', 'Tax', 'Delivery Fee', 'Total'];
      const rows = orders.map(order => [
        formatDateTime(order.created_at),
        getCustomerInfo(order),
        getServiceTypeLabel(order.service_type),
        order.payment_status,
        order.payment_method || '-',
        order.items.map(i => `${i.quantity}x ${i.nameEn || i.name}`).join('; '),
        order.subtotal.toFixed(2),
        order.tax.toFixed(2),
        (order.delivery_fee || 0).toFixed(2),
        order.total_price.toFixed(2)
      ]);

      const csvContent = [
        `Order Summary Report`,
        `Period: ${startDate} to ${endDate}`,
        '',
        `Summary`,
        `Total Orders,${summary?.total_orders || 0}`,
        `Total Revenue,$${summary?.total_revenue?.toFixed(2) || '0.00'}`,
        `Paid Orders,${summary?.payment_status?.paid || 0}`,
        `Pending Orders,${summary?.payment_status?.pending || 0}`,
        '',
        `Orders Detail`,
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `order-summary-${startDate}-to-${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setExporting(null);
    }
  };

  // Export to PDF (using print dialog)
  const exportToPDF = () => {
    if (!canExport) return;
    setExporting('pdf');

    try {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (!printWindow) {
        alert('Please allow popups to export PDF');
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Order Summary Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #f97316; margin-bottom: 10px; }
            .subtitle { color: #6b7280; margin-bottom: 30px; }
            .summary { background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .metric { margin-bottom: 10px; font-size: 16px; }
            .metric strong { display: inline-block; width: 200px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background: #f3f4f6; font-weight: bold; color: #374151; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>Order Summary Report</h1>
          <p class="subtitle">${startDate} to ${endDate}</p>

          <div class="summary">
            <div class="metric"><strong>Total Orders:</strong> ${summary?.total_orders || 0}</div>
            <div class="metric"><strong>Total Revenue:</strong> $${summary?.total_revenue?.toFixed(2) || '0.00'}</div>
            <div class="metric"><strong>Paid:</strong> ${summary?.payment_status?.paid || 0} orders</div>
            <div class="metric"><strong>Pending:</strong> ${summary?.payment_status?.pending || 0} orders</div>
          </div>

          <h2>Orders</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(order => `
                <tr>
                  <td>${formatDateTime(order.created_at)}</td>
                  <td>${getCustomerInfo(order)}</td>
                  <td>${getServiceTypeLabel(order.service_type)}</td>
                  <td>${order.payment_status}</td>
                  <td>$${order.total_price.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Generated by Smart Menu</p>
            <p>${new Date().toLocaleString()}</p>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
    } finally {
      setExporting(null);
    }
  };

  const fetchOrdersSummary = async () => {
    if (!restaurantId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        restaurant_id: restaurantId,
        start_date: startDate,
        end_date: endDate,
      });

      if (paymentStatusFilter) {
        params.append('payment_status', paymentStatusFilter);
      }
      if (serviceTypeFilter) {
        params.append('service_type', serviceTypeFilter);
      }

      const response = await fetch(`${API_URL}/api/orders/summary?${params}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'dine_in': return 'Dine In';
      case 'pickup': return 'Pickup';
      case 'delivery': return 'Delivery';
      default: return type;
    }
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'dine_in': return <Users className="w-4 h-4" />;
      case 'pickup': return <ShoppingBag className="w-4 h-4" />;
      case 'delivery': return <Truck className="w-4 h-4" />;
      default: return null;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return <span className="text-gray-500 text-xs">{status}</span>;
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case 'card': return 'Card';
      case 'bank_transfer': return 'Bank Transfer';
      default: return '-';
    }
  };

  const getCustomerInfo = (order: Order) => {
    if (order.service_type === 'dine_in') {
      const tableNo = order.customer_details?.table_no || order.table_no;
      return tableNo ? `Table ${tableNo}` : 'No table';
    }

    const name = order.customer_details?.name || order.customer_name || 'Guest';
    return name;
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-NZ', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle card click to show filtered orders
  const handleCardClick = (type: ViewType) => {
    if (!type) return;

    let filtered: Order[] = [];

    switch (type) {
      case 'total':
        filtered = orders;
        break;
      case 'revenue':
        filtered = orders.filter(o => o.payment_status === 'paid' && !o.is_voided);
        break;
      case 'payment':
        filtered = orders.filter(o => o.payment_method && !o.is_voided);
        break;
      case 'service':
        filtered = orders.filter(o => !o.is_voided);
        break;
      case 'voided':
        filtered = orders.filter(o => o.is_voided || o.status === 'voided');
        break;
    }

    setFilteredOrders(filtered);
    setViewType(type);
  };

  const getViewTitle = (type: ViewType) => {
    switch (type) {
      case 'total': return 'All Orders';
      case 'revenue': return 'Paid Orders';
      case 'payment': return 'Orders by Payment Method';
      case 'service': return 'Orders by Service Type';
      case 'voided': return 'Voided Orders';
      default: return 'Orders';
    }
  };

  // Calculate voided orders from orders array
  const voidedOrders = orders.filter(o => o.is_voided || o.status === 'voided');
  const voidedCount = voidedOrders.length;
  const voidedAmount = voidedOrders.reduce((sum, o) => sum + o.total_price, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-orange-500 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Summary</h1>
            <p className="text-gray-600">View all orders and payment details (Last 45 days)</p>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            {canExport ? (
              <>
                <button
                  onClick={exportToCSV}
                  disabled={exporting !== null || orders.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {exporting === 'csv' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  CSV
                </button>
                <button
                  onClick={exportToExcel}
                  disabled={exporting !== null || orders.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {exporting === 'excel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                  Excel
                </button>
                <button
                  onClick={exportToPDF}
                  disabled={exporting !== null || orders.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {exporting === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  PDF
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm">
                <Lock className="w-4 h-4" />
                <span>Export (Enterprise only)</span>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                min={new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                min={startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <select
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="dine_in">Dine In</option>
                <option value="pickup">Pickup</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setDatePreset('today')}
              className="px-3 py-1 text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-full transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setDatePreset('yesterday')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
            >
              Yesterday
            </button>
            <button
              onClick={() => setDatePreset('week')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDatePreset('month')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
            >
              Last 30 Days
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid md:grid-cols-5 gap-4 mb-6">
            {/* Total Orders */}
            <div
              className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
              onClick={() => handleCardClick('total')}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Total Orders</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{summary.total_orders}</p>
              <div className="mt-2 text-xs text-gray-500">
                <span className="text-green-600">{summary.payment_status.paid} paid</span>
                {summary.payment_status.pending > 0 && (
                  <span className="ml-2 text-yellow-600">{summary.payment_status.pending} pending</span>
                )}
              </div>
              <div className="mt-2 text-xs text-blue-500 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Click to view
              </div>
            </div>

            {/* Total Revenue */}
            <div
              className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
              onClick={() => handleCardClick('revenue')}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Total Revenue</span>
              </div>
              <p className="text-3xl font-bold text-green-600">${summary.total_revenue.toFixed(2)}</p>
              <div className="mt-2 text-xs text-gray-500">
                From paid orders only
              </div>
              <div className="mt-2 text-xs text-blue-500 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Click to view
              </div>
            </div>

            {/* By Payment Method */}
            <div
              className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
              onClick={() => handleCardClick('payment')}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Payment Methods</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Card:</span>
                  <span className="font-medium">{summary.payment_method.card.count} (${summary.payment_method.card.revenue.toFixed(2)})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bank Transfer:</span>
                  <span className="font-medium">{summary.payment_method.bank_transfer.count} (${summary.payment_method.bank_transfer.revenue.toFixed(2)})</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-blue-500 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Click to view
              </div>
            </div>

            {/* By Service Type */}
            <div
              className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
              onClick={() => handleCardClick('service')}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Service Types</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Dine In:</span>
                  <span className="font-medium">{summary.service_type.dine_in}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pickup:</span>
                  <span className="font-medium">{summary.service_type.pickup}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery:</span>
                  <span className="font-medium">{summary.service_type.delivery}</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-blue-500 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Click to view
              </div>
            </div>

            {/* Voided Orders */}
            <div
              className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all border-l-4 border-red-500"
              onClick={() => handleCardClick('voided')}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Voided Orders</span>
              </div>
              <p className="text-3xl font-bold text-red-600">{voidedCount}</p>
              <div className="mt-2 text-xs text-gray-500">
                <span className="text-red-500">${voidedAmount.toFixed(2)} total</span>
              </div>
              <div className="mt-2 text-xs text-blue-500 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Click to view
              </div>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Orders List</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No orders found for the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer/Table</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(order.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getCustomerInfo(order)}
                        </div>
                        {order.customer_details?.phone && (
                          <div className="text-xs text-gray-500">{order.customer_details.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {getServiceTypeIcon(order.service_type)}
                          {getServiceTypeLabel(order.service_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentStatusBadge(order.payment_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {getPaymentMethodLabel(order.payment_method)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          ${order.total_price.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <p className="text-sm text-gray-500">{formatDateTime(selectedOrder.created_at)}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Type:</span>
                    <span className="font-medium flex items-center gap-1">
                      {getServiceTypeIcon(selectedOrder.service_type)}
                      {getServiceTypeLabel(selectedOrder.service_type)}
                    </span>
                  </div>
                  {selectedOrder.service_type === 'dine_in' ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Table No:</span>
                      <span className="font-medium">{selectedOrder.customer_details?.table_no || selectedOrder.table_no || '-'}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedOrder.customer_details?.name || selectedOrder.customer_name || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedOrder.customer_details?.phone || selectedOrder.customer_phone || '-'}</span>
                      </div>
                    </>
                  )}
                  {selectedOrder.service_type === 'delivery' && selectedOrder.customer_details?.address && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Address:</span>
                      <span className="font-medium text-right max-w-[200px]">{selectedOrder.customer_details.address}</span>
                    </div>
                  )}
                  {selectedOrder.service_type === 'pickup' && selectedOrder.customer_details?.pickup_time && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pickup Time:</span>
                      <span className="font-medium">{new Date(selectedOrder.customer_details.pickup_time).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Payment Information</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    {getPaymentStatusBadge(selectedOrder.payment_status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method:</span>
                    <span className="font-medium">{getPaymentMethodLabel(selectedOrder.payment_method)}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.quantity}x {item.nameEn || item.name}
                        </p>
                        {item.selectedMeat && (
                          <p className="text-xs text-gray-500">
                            + {item.selectedMeat.nameEn || item.selectedMeat.name}
                            {item.selectedMeat.price > 0 && ` (+$${item.selectedMeat.price.toFixed(2)})`}
                          </p>
                        )}
                        {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                          <p className="text-xs text-gray-500">
                            + {item.selectedAddOns.map(a => a.nameEn || a.name).join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="font-medium text-gray-900">${item.itemTotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              {selectedOrder.special_instructions && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-1">Special Instructions</h3>
                  <p className="text-sm text-yellow-700">{selectedOrder.special_instructions}</p>
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span>${selectedOrder.tax.toFixed(2)}</span>
                  </div>
                )}
                {selectedOrder.delivery_fee && selectedOrder.delivery_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee:</span>
                    <span>${selectedOrder.delivery_fee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span className="text-green-600">${selectedOrder.total_price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card View Modal */}
      {viewType && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setViewType(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{getViewTitle(viewType)}</h2>
                <p className="text-sm text-gray-500">{filteredOrders.length} orders found</p>
              </div>
              <button
                onClick={() => setViewType(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No orders found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        order.is_voided || order.status === 'voided' ? 'bg-red-50' : ''
                      }`}
                      onClick={() => {
                        setSelectedOrder(order);
                        setViewType(null);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-mono text-sm text-gray-500">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDateTime(order.created_at)}
                            </span>
                            {(order.is_voided || order.status === 'voided') && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                VOIDED
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-gray-900">{getCustomerInfo(order)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              {getServiceTypeIcon(order.service_type)}
                              {getServiceTypeLabel(order.service_type)}
                            </span>
                            {getPaymentStatusBadge(order.payment_status)}
                          </div>
                          {/* Show void reason for voided orders */}
                          {order.void_reason && (
                            <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-700">
                              <strong>Void Reason:</strong> {order.void_reason}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            order.is_voided || order.status === 'voided'
                              ? 'text-red-500 line-through'
                              : 'text-gray-900'
                          }`}>
                            ${order.total_price.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.items.length} items
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setViewType(null)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
