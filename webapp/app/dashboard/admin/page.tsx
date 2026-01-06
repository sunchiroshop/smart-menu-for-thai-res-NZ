'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, CreditCard, Tag, Activity, Shield, Bell,
  Search, ArrowLeft, Loader2, DollarSign, Clock,
  Building, TrendingUp, AlertCircle, ChevronRight,
  Calendar, Mail, Phone, MapPin, Store, Eye,
  CheckCircle, XCircle, X, Edit, Trash2, Plus,
  RefreshCw, Download, Filter
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  adminTranslations,
  t,
  formatDate,
  formatCurrency,
  getStatusColor,
  getPlanColor,
  AdminLanguage
} from '@/lib/admin-translations';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types
interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  restaurant_name: string;
  role: string;
  subscription_status: string;
  plan: string;
  billing_interval: string;
  trial_start_date: string;
  trial_end_date: string;
  subscription_start_date: string;
  subscription_end_date: string;
  next_billing_date: string;
  payment_method: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  is_active: boolean;
  last_login_at: string;
  created_at: string;
  restaurants?: any[];
  branch_count?: number;
  total_orders?: number;
  total_revenue?: number;
}

interface PendingPayment {
  id: string;
  user_id: string;
  user_email?: string;
  restaurant_name?: string;
  amount: number;
  plan: string;
  billing_interval: string;
  payment_method: string;
  payment_status: string;
  bank_transfer_slip_url?: string;
  bank_transfer_reference?: string;
  bank_name?: string;
  created_at: string;
}

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  usage_limit: number | null;
  usage_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  applies_to: string;
  created_at: string;
}

interface AdminNotification {
  type: string;
  title: string;
  message: string;
  count: number;
  priority: string;
  link: string;
}

interface Stats {
  total_users: number;
  total_restaurants: number;
  total_orders: number;
  total_revenue: number;
  pending_approvals: number;
  active_subscriptions: number;
  expiring_trials: number;
  mrr: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  // Auth state
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string>('');
  const [lang, setLang] = useState<AdminLanguage>('en');

  // Data states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_users: 0,
    total_restaurants: 0,
    total_orders: 0,
    total_revenue: 0,
    pending_approvals: 0,
    active_subscriptions: 0,
    expiring_trials: 0,
    mrr: 0
  });

  // UI states
  const [activeTab, setActiveTab] = useState<'customers' | 'payments' | 'coupons' | 'logs'>('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/login');
        return;
      }

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('role, user_id')
        .or(`user_id.eq.${user.id},id.eq.${user.id}`);

      const profile = profiles?.[0];

      if (!profile || profile.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      setAdminUserId(user.id);
      await loadAllData(user.id);
    } catch (error) {
      console.error('Admin access check failed:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async (userId: string) => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadStats(userId),
        loadUsers(userId),
        loadPendingPayments(userId),
        loadCoupons(userId),
        loadNotifications(userId)
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadStats = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/overview?admin_user_id=${userId}`);
      const data = await response.json();
      if (data.success && data.stats) {
        setStats({
          total_users: data.stats.total_users || 0,
          total_restaurants: data.stats.total_restaurants || 0,
          total_orders: data.stats.total_orders || 0,
          total_revenue: data.stats.total_revenue || 0,
          pending_approvals: 0,
          active_subscriptions: data.stats.subscription_distribution?.active || 0,
          expiring_trials: 0,
          mrr: 0
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadUsers = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/list?admin_user_id=${userId}&limit=100`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadPendingPayments = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/payments/pending?admin_user_id=${userId}`);
      const data = await response.json();
      if (data.success) {
        setPendingPayments(data.payments || []);
        setStats(prev => ({ ...prev, pending_approvals: data.count || 0 }));
      }
    } catch (error) {
      console.error('Failed to load pending payments:', error);
    }
  };

  const loadCoupons = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/coupons/list?admin_user_id=${userId}&limit=100`);
      const data = await response.json();
      if (data.success) {
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error('Failed to load coupons:', error);
    }
  };

  const loadNotifications = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/notifications?admin_user_id=${userId}`);
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    if (!window.confirm(t('approval.confirmApprove', lang))) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/payments/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_user_id: adminUserId,
          payment_log_id: paymentId,
          notes: approvalNotes
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(t('messages.paymentApproved', lang));
        setSelectedPayment(null);
        setApprovalNotes('');
        await loadAllData(adminUserId);
      } else {
        alert(data.error || 'Failed to approve payment');
      }
    } catch (error) {
      console.error('Failed to approve payment:', error);
      alert('Failed to approve payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    if (!window.confirm(t('approval.confirmReject', lang))) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/payments/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_user_id: adminUserId,
          payment_log_id: paymentId,
          reason: rejectionReason
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(t('messages.paymentRejected', lang));
        setSelectedPayment(null);
        setRejectionReason('');
        await loadAllData(adminUserId);
      } else {
        alert(data.error || 'Failed to reject payment');
      }
    } catch (error) {
      console.error('Failed to reject payment:', error);
      alert('Failed to reject payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewUserDetail = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}?admin_user_id=${adminUserId}`);
      const data = await response.json();
      if (data.success && data.user) {
        setSelectedUser(data.user);
      }
    } catch (error) {
      console.error('Failed to load user detail:', error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(lang === 'th'
      ? `ยืนยันการเปลี่ยน Role เป็น ${newRole}?`
      : `Confirm changing role to ${newRole}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/users/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_user_id: adminUserId,
          target_user_id: userId,
          role: newRole,
          plan: newRole // Also update plan to match role
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(lang === 'th' ? 'เปลี่ยน Role สำเร็จ' : 'Role updated successfully');
        // Refresh the selected user data
        if (selectedUser) {
          setSelectedUser({ ...selectedUser, role: newRole, plan: newRole });
        }
        await loadAllData(adminUserId);
      } else {
        alert(data.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter data
  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCoupons = coupons.filter(c =>
    c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('messages.loading', lang)}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="w-7 h-7" />
                  {t('dashboard.title', lang)}
                </h1>
                <p className="text-purple-200 text-sm">{t('dashboard.welcome', lang)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Language Toggle */}
              <button
                onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
                className="px-3 py-1 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
              >
                {lang === 'en' ? 'TH' : 'EN'}
              </button>
              {/* Notification Bell */}
              <div className="relative">
                <button className="p-2 hover:bg-white/20 rounded-lg transition-colors relative">
                  <Bell className="w-6 h-6" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                      {notifications.reduce((sum, n) => sum + n.count, 0)}
                    </span>
                  )}
                </button>
              </div>
              {/* Refresh */}
              <button
                onClick={() => loadAllData(adminUserId)}
                disabled={refreshing}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-6 h-6 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('stats.totalUsers', lang)}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('stats.monthlyRevenue', lang)}</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_revenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setActiveTab('payments')}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center relative">
                <AlertCircle className="w-6 h-6 text-orange-600" />
                {stats.pending_approvals > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {stats.pending_approvals}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('stats.pendingApprovals', lang)}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending_approvals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('stats.activeSubscriptions', lang)}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_subscriptions}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Banner */}
      {notifications.filter(n => n.priority === 'high').length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <div className="flex-1">
                {notifications.filter(n => n.priority === 'high').map((n, i) => (
                  <span key={i} className="text-orange-800">
                    {n.message}
                    {i < notifications.filter(n => n.priority === 'high').length - 1 && ' | '}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setActiveTab('payments')}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                {t('actions.viewAll', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => { setActiveTab('customers'); setSearchTerm(''); }}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'customers'
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Users className="w-5 h-5" />
                {t('tabs.customers', lang)} ({users.length})
              </button>
              <button
                onClick={() => { setActiveTab('payments'); setSearchTerm(''); }}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'payments'
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                {t('tabs.payments', lang)}
                {stats.pending_approvals > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">
                    {stats.pending_approvals}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('coupons'); setSearchTerm(''); }}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'coupons'
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Tag className="w-5 h-5" />
                {t('tabs.coupons', lang)} ({coupons.length})
              </button>
              <button
                onClick={() => { setActiveTab('logs'); setSearchTerm(''); }}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'logs'
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Activity className="w-5 h-5" />
                {t('tabs.activityLogs', lang)}
              </button>
            </div>
          </div>

          {/* Search & Actions Bar */}
          <div className="p-4 border-b border-gray-200 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`${t('actions.search', lang)}...`}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            {activeTab === 'coupons' && (
              <button
                onClick={() => { setEditingCoupon(null); setShowCouponModal(true); }}
                className="px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {t('actions.createCoupon', lang)}
              </button>
            )}
          </div>

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="p-6">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">{t('messages.noData', lang)}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleViewUserDetail(user.user_id)}
                      className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all border border-gray-100 hover:border-purple-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center text-lg font-bold text-purple-700">
                            {user.restaurant_name?.charAt(0) || user.email?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 line-clamp-1">
                              {user.restaurant_name || user.email || 'No Name'}
                            </p>
                            <p className="text-sm text-gray-500 line-clamp-1">{user.email}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(user.plan || user.role)}`}>
                          {t(`plans.${user.plan || user.role || 'free_trial'}`, lang)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.subscription_status || 'trial')}`}>
                          {t(`subscriptionStatus.${user.subscription_status || 'trial'}`, lang)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>{t('customer.nextBillingDate', lang)}: {user.next_billing_date ? formatDate(user.next_billing_date, lang) : '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-3 h-3" />
                          <span>{user.branch_count || user.restaurants?.length || 0} {t('customer.branchCount', lang)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                {t('approval.pendingTitle', lang)} ({pendingPayments.length})
              </h3>
              {pendingPayments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p>{t('messages.noData', lang)}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="bg-orange-50 border border-orange-200 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{payment.restaurant_name || payment.user_email}</p>
                            <p className="text-sm text-gray-600">{payment.user_email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPlanColor(payment.plan)}`}>
                                {t(`plans.${payment.plan}`, lang)}
                              </span>
                              <span className="text-sm text-gray-500">
                                {payment.billing_interval === 'yearly' ? 'Yearly' : 'Monthly'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-600">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-gray-500">{formatDate(payment.created_at, lang)}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          {payment.bank_name && <span className="mr-3">Bank: {payment.bank_name}</span>}
                          {payment.bank_transfer_reference && <span>Ref: {payment.bank_transfer_reference}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {payment.bank_transfer_slip_url && (
                            <a
                              href={payment.bank_transfer_slip_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                              {t('approval.slipImage', lang)}
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                          >
                            {t('actions.view', lang)}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Coupons Tab */}
          {activeTab === 'coupons' && (
            <div className="p-6">
              {filteredCoupons.length === 0 ? (
                <div className="text-center py-12 text-gray-500">{t('messages.noData', lang)}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCoupons.map((coupon) => (
                    <div key={coupon.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-mono text-lg font-bold text-purple-600">{coupon.code}</p>
                          <p className="text-sm text-gray-600">{coupon.name}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mb-3">
                        <p className="text-2xl font-bold text-gray-900">
                          {coupon.discount_type === 'percentage'
                            ? `${coupon.discount_value}%`
                            : formatCurrency(coupon.discount_value)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {coupon.discount_type === 'percentage' ? t('coupon.percentage', lang) : t('coupon.fixedAmount', lang)}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>{t('coupon.usageCount', lang)}: {coupon.usage_count} / {coupon.usage_limit || t('coupon.unlimited', lang)}</p>
                        <p>{t('coupon.endDate', lang)}: {coupon.end_date ? formatDate(coupon.end_date, lang) : '-'}</p>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => { setEditingCoupon(coupon); setShowCouponModal(true); }}
                          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          {t('actions.edit', lang)}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activity Logs Tab */}
          {activeTab === 'logs' && (
            <div className="p-6">
              <div className="text-center py-12 text-gray-500">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Activity logs will be displayed here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{t('customer.restaurantName', lang)}</h2>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center text-2xl font-bold text-purple-700">
                    {selectedUser.restaurant_name?.charAt(0) || selectedUser.email?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedUser.restaurant_name || 'No Name'}</h3>
                    <p className="text-gray-600">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanColor(selectedUser.plan || selectedUser.role)}`}>
                        {t(`plans.${selectedUser.plan || selectedUser.role || 'free_trial'}`, lang)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedUser.subscription_status || 'trial')}`}>
                        {t(`subscriptionStatus.${selectedUser.subscription_status || 'trial'}`, lang)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 text-gray-600 mb-1">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{t('customer.email', lang)}</span>
                  </div>
                  <p className="font-medium text-gray-900">{selectedUser.email || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 text-gray-600 mb-1">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{t('customer.phone', lang)}</span>
                  </div>
                  <p className="font-medium text-gray-900">{selectedUser.phone || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 text-gray-600 mb-1">
                    <Building className="w-4 h-4" />
                    <span className="text-sm">{t('customer.branchCount', lang)}</span>
                  </div>
                  <p className="font-medium text-gray-900">{selectedUser.branch_count || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 text-gray-600 mb-1">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm">{t('customer.paymentMethod', lang)}</span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {selectedUser.payment_method ? t(`paymentMethods.${selectedUser.payment_method}`, lang) : '-'}
                  </p>
                </div>
              </div>

              {/* Role/Plan Selection */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  {lang === 'th' ? 'เปลี่ยน Role / แพคเกจ' : 'Change Role / Plan'}
                </h4>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedUser.role || 'free_trial'}
                    onChange={(e) => handleRoleChange(selectedUser.user_id, e.target.value)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white font-medium disabled:opacity-50"
                  >
                    <option value="free_trial">{lang === 'th' ? '🆓 Free Trial (ทดลองใช้ฟรี)' : '🆓 Free Trial'}</option>
                    <option value="starter">{lang === 'th' ? '⭐ Starter ($39/เดือน)' : '⭐ Starter ($39/mo)'}</option>
                    <option value="professional">{lang === 'th' ? '💎 Professional ($89/เดือน)' : '💎 Professional ($89/mo)'}</option>
                    <option value="enterprise">{lang === 'th' ? '🏢 Enterprise ($199/เดือน)' : '🏢 Enterprise ($199/mo)'}</option>
                    <option value="admin">{lang === 'th' ? '🔐 Admin (ผู้ดูแลระบบ)' : '🔐 Admin'}</option>
                  </select>
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  {lang === 'th'
                    ? '* เลือกแพคเกจเพื่ออัปเกรดหรือเปลี่ยน Role ของผู้ใช้'
                    : '* Select a plan to upgrade or change user role'}
                </p>
              </div>

              {/* Subscription Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Subscription Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{t('customer.plan', lang)}</p>
                    <p className="font-medium text-gray-900">{t(`plans.${selectedUser.plan || 'free_trial'}`, lang)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('customer.status', lang)}</p>
                    <p className="font-medium text-gray-900">{t(`subscriptionStatus.${selectedUser.subscription_status || 'trial'}`, lang)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('customer.nextBillingDate', lang)}</p>
                    <p className="font-medium text-gray-900">
                      {selectedUser.next_billing_date ? formatDate(selectedUser.next_billing_date, lang) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('customer.trialEndsAt', lang)}</p>
                    <p className="font-medium text-gray-900">
                      {selectedUser.trial_end_date ? formatDate(selectedUser.trial_end_date, lang) : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              {(selectedUser.total_orders !== undefined || selectedUser.total_revenue !== undefined) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Statistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">{t('customer.totalOrders', lang)}</p>
                      <p className="font-medium text-gray-900">{selectedUser.total_orders || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('customer.totalRevenue', lang)}</p>
                      <p className="font-medium text-gray-900">{formatCurrency(selectedUser.total_revenue || 0)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push(`/dashboard/admin/customers/${selectedUser.user_id}`)}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-5 h-5" />
                  {t('actions.edit', lang)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Approval Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPayment(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{t('approval.pendingTitle', lang)}</h2>
              <button onClick={() => setSelectedPayment(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Payment Info */}
              <div className="bg-orange-50 rounded-xl p-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600 mb-2">{formatCurrency(selectedPayment.amount)}</p>
                  <p className="text-gray-600">{selectedPayment.restaurant_name || selectedPayment.user_email}</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(selectedPayment.plan)}`}>
                      {t(`plans.${selectedPayment.plan}`, lang)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {selectedPayment.billing_interval === 'yearly' ? 'Yearly' : 'Monthly'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">{t('approval.bankName', lang)}</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Bank:</span> {selectedPayment.bank_name || '-'}</p>
                  <p><span className="text-gray-500">Reference:</span> {selectedPayment.bank_transfer_reference || '-'}</p>
                  <p><span className="text-gray-500">Submitted:</span> {formatDate(selectedPayment.created_at, lang)}</p>
                </div>
              </div>

              {/* Slip Image */}
              {selectedPayment.bank_transfer_slip_url && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">{t('approval.slipImage', lang)}</h4>
                  <a
                    href={selectedPayment.bank_transfer_slip_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={selectedPayment.bank_transfer_slip_url}
                      alt="Payment Slip"
                      className="w-full rounded-lg border border-gray-200"
                    />
                  </a>
                </div>
              )}

              {/* Approval Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('approval.approvalNotes', lang)}</label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  rows={2}
                />
              </div>

              {/* Rejection Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('approval.rejectionReason', lang)}</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Required if rejecting..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleRejectPayment(selectedPayment.id)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  {t('approval.reject', lang)}
                </button>
                <button
                  onClick={() => handleApprovePayment(selectedPayment.id)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  {t('approval.approve', lang)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {showCouponModal && (
        <CouponModal
          coupon={editingCoupon}
          lang={lang}
          adminUserId={adminUserId}
          onClose={() => { setShowCouponModal(false); setEditingCoupon(null); }}
          onSave={() => { setShowCouponModal(false); setEditingCoupon(null); loadCoupons(adminUserId); }}
        />
      )}
    </div>
  );
}

// Coupon Modal Component
function CouponModal({
  coupon,
  lang,
  adminUserId,
  onClose,
  onSave
}: {
  coupon: Coupon | null;
  lang: AdminLanguage;
  adminUserId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: coupon?.code || '',
    name: coupon?.name || '',
    description: coupon?.description || '',
    discount_type: coupon?.discount_type || 'percentage',
    discount_value: coupon?.discount_value || 10,
    usage_limit: coupon?.usage_limit || null,
    start_date: coupon?.start_date?.split('T')[0] || '',
    end_date: coupon?.end_date?.split('T')[0] || '',
    is_active: coupon?.is_active ?? true,
    applies_to: coupon?.applies_to || 'all'
  });

  const handleSubmit = async () => {
    if (!form.code || !form.name) {
      alert('Code and Name are required');
      return;
    }

    setLoading(true);
    try {
      const url = coupon
        ? `${API_URL}/api/admin/coupons/update`
        : `${API_URL}/api/admin/coupons/create`;

      const body = coupon
        ? { admin_user_id: adminUserId, coupon_id: coupon.id, ...form }
        : { admin_user_id: adminUserId, ...form };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (data.success) {
        alert(coupon ? t('messages.couponUpdated', lang) : t('messages.couponCreated', lang));
        onSave();
      } else {
        alert(data.error || 'Failed to save coupon');
      }
    } catch (error) {
      console.error('Failed to save coupon:', error);
      alert('Failed to save coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {coupon ? t('actions.edit', lang) : t('actions.createCoupon', lang)}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupon.code', lang)} *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="e.g. SAVE20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupon.name', lang)} *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupon.description', lang)}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupon.discountType', lang)}</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percentage' | 'fixed_amount' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="percentage">{t('coupon.percentage', lang)}</option>
                <option value="fixed_amount">{t('coupon.fixedAmount', lang)}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupon.discountValue', lang)}</label>
              <input
                type="number"
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupon.startDate', lang)}</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupon.endDate', lang)}</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupon.usageLimit', lang)}</label>
              <input
                type="number"
                value={form.usage_limit || ''}
                onChange={(e) => setForm({ ...form, usage_limit: e.target.value ? parseInt(e.target.value) : null })}
                placeholder={t('coupon.unlimited', lang)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('coupon.appliesTo', lang)}</label>
              <select
                value={form.applies_to}
                onChange={(e) => setForm({ ...form, applies_to: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="all">{lang === 'th' ? 'ทุกประเภท' : 'All Service Types'}</option>
                <option value="dine_in">{lang === 'th' ? 'ทานที่ร้าน' : 'Dine In Only'}</option>
                <option value="pickup">{lang === 'th' ? 'รับเอง' : 'Pickup Only'}</option>
                <option value="delivery">{lang === 'th' ? 'เดลิเวอรี่' : 'Delivery Only'}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
              {t('coupon.isActive', lang)}
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              {t('actions.cancel', lang)}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {t('actions.save', lang)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
