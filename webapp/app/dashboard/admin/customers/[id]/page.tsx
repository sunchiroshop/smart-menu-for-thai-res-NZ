'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Loader2, Save, Shield, Mail, Phone, Building,
  Calendar, CreditCard, Clock, MapPin, User, Store,
  Edit, CheckCircle, XCircle, AlertCircle, Plus, Minus
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  t,
  formatDate,
  formatCurrency,
  getStatusColor,
  getPlanColor,
  AdminLanguage
} from '@/lib/admin-translations';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  admin_notes: string;
  restaurants?: any[];
  branch_count?: number;
  total_orders?: number;
  total_revenue?: number;
  total_menu_items?: number;
  total_staff?: number;
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const userId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUserId, setAdminUserId] = useState('');
  const [lang, setLang] = useState<AdminLanguage>('en');
  const [user, setUser] = useState<UserProfile | null>(null);

  // Editable fields
  const [formData, setFormData] = useState({
    email: '',
    restaurant_name: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    plan: '',
    subscription_status: '',
    billing_interval: '',
    is_active: true,
    admin_notes: ''
  });

  // Action states
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [extensionDays, setExtensionDays] = useState(30);
  const [extensionReason, setExtensionReason] = useState('');
  const [newPlan, setNewPlan] = useState('');
  const [newBillingInterval, setNewBillingInterval] = useState('monthly');
  const [planChangeReason, setPlanChangeReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelImmediate, setCancelImmediate] = useState(false);

  useEffect(() => {
    checkAdminAndLoadUser();
  }, [userId]);

  const checkAdminAndLoadUser = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        router.push('/login');
        return;
      }

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('role, user_id')
        .or(`user_id.eq.${authUser.id},id.eq.${authUser.id}`);

      const profile = profiles?.[0];

      if (!profile || profile.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      setAdminUserId(authUser.id);
      await loadUserDetail(authUser.id);
    } catch (error) {
      console.error('Failed to check admin:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetail = async (adminId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}?admin_user_id=${adminId}`);
      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        setFormData({
          email: data.user.email || '',
          restaurant_name: data.user.restaurant_name || '',
          phone: data.user.phone || '',
          address: data.user.address || '',
          city: data.user.city || '',
          country: data.user.country || 'NZ',
          plan: data.user.plan || 'free_trial',
          subscription_status: data.user.subscription_status || 'trial',
          billing_interval: data.user.billing_interval || 'monthly',
          is_active: data.user.is_active !== false,
          admin_notes: data.user.admin_notes || ''
        });
        setNewPlan(data.user.plan || 'free_trial');
      } else {
        alert('User not found');
        router.push('/dashboard/admin');
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      alert('Failed to load user');
      router.push('/dashboard/admin');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/users/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_user_id: adminUserId,
          target_user_id: userId,
          ...formData
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(t('messages.saved', lang));
        await loadUserDetail(adminUserId);
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleExtendSubscription = async () => {
    if (extensionDays <= 0) {
      alert('Please enter a valid number of days');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/subscriptions/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_user_id: adminUserId,
          target_user_id: userId,
          extension_days: extensionDays,
          reason: extensionReason
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(t('messages.subscriptionExtended', lang));
        setShowExtendModal(false);
        setExtensionDays(30);
        setExtensionReason('');
        await loadUserDetail(adminUserId);
      } else {
        alert(data.error || 'Failed to extend subscription');
      }
    } catch (error) {
      console.error('Failed to extend:', error);
      alert('Failed to extend subscription');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePlan = async () => {
    if (!newPlan) {
      alert('Please select a plan');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/subscriptions/change-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_user_id: adminUserId,
          target_user_id: userId,
          new_plan: newPlan,
          billing_interval: newBillingInterval,
          reason: planChangeReason
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(t('messages.planChanged', lang));
        setShowChangePlanModal(false);
        setPlanChangeReason('');
        setNewBillingInterval('monthly');
        await loadUserDetail(adminUserId);
      } else {
        alert(data.error || 'Failed to change plan');
      }
    } catch (error) {
      console.error('Failed to change plan:', error);
      alert('Failed to change plan');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/subscriptions/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_user_id: adminUserId,
          target_user_id: userId,
          reason: cancelReason,
          immediate: cancelImmediate
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(t('messages.subscriptionCancelled', lang));
        setShowCancelModal(false);
        setCancelReason('');
        setCancelImmediate(false);
        await loadUserDetail(adminUserId);
      } else {
        alert(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Failed to cancel:', error);
      alert('Failed to cancel subscription');
    } finally {
      setSaving(false);
    }
  };

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

  if (!isAdmin || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/admin')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <User className="w-7 h-7" />
                  {user.restaurant_name || user.email || 'Customer Details'}
                </h1>
                <p className="text-purple-200 text-sm">Edit customer information and subscription</p>
              </div>
            </div>
            <button
              onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
              className="px-3 py-1 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
            >
              {lang === 'en' ? 'TH' : 'EN'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-500" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customer.email', lang)}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customer.restaurantName', lang)}
                  </label>
                  <input
                    type="text"
                    value={formData.restaurant_name}
                    onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customer.phone', lang)}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customer.city', lang)}
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customer.address', lang)}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Subscription Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-500" />
                Subscription
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customer.plan', lang)}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-2 rounded-lg text-sm font-medium ${getPlanColor(user.plan)}`}>
                      {t(`plans.${user.plan || 'free_trial'}`, lang)}
                    </span>
                    <button
                      onClick={() => setShowChangePlanModal(true)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customer.status', lang)}
                  </label>
                  <span className={`px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(user.subscription_status)}`}>
                    {t(`subscriptionStatus.${user.subscription_status || 'trial'}`, lang)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customer.nextBillingDate', lang)}
                  </label>
                  <p className="text-gray-900">
                    {user.next_billing_date ? formatDate(user.next_billing_date, lang) : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customer.trialEndsAt', lang)}
                  </label>
                  <p className="text-gray-900">
                    {user.trial_end_date ? formatDate(user.trial_end_date, lang) : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customer.paymentMethod', lang)}
                  </label>
                  <p className="text-gray-900">
                    {user.payment_method ? t(`paymentMethods.${user.payment_method}`, lang) : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Interval
                  </label>
                  <p className="text-gray-900">
                    {user.billing_interval === 'yearly' ? 'Yearly' : 'Monthly'}
                  </p>
                </div>
              </div>

              {/* Subscription Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
                <button
                  onClick={() => setShowExtendModal(true)}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('actions.extendSubscription', lang)}
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  {t('actions.cancelSubscription', lang)}
                </button>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Edit className="w-5 h-5 text-purple-500" />
                {t('customer.adminNotes', lang)}
              </h2>
              <textarea
                value={formData.admin_notes}
                onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                placeholder="Internal notes about this customer..."
              />
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" />
                Account Status
              </h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-gray-700">Account is active</span>
              </label>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {t('actions.save', lang)}
            </button>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('customer.branchCount', lang)}</span>
                  <span className="font-semibold text-gray-900">{user.branch_count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('customer.totalOrders', lang)}</span>
                  <span className="font-semibold text-gray-900">{user.total_orders || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('customer.totalRevenue', lang)}</span>
                  <span className="font-semibold text-green-600">{formatCurrency(user.total_revenue || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Menu Items</span>
                  <span className="font-semibold text-gray-900">{user.total_menu_items || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Staff</span>
                  <span className="font-semibold text-gray-900">{user.total_staff || 0}</span>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Info</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-500">{t('customer.createdAt', lang)}</p>
                  <p className="font-medium text-gray-900">{formatDate(user.created_at, lang)}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('customer.lastLogin', lang)}</p>
                  <p className="font-medium text-gray-900">
                    {user.last_login_at ? formatDate(user.last_login_at, lang) : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">User ID</p>
                  <p className="font-mono text-xs text-gray-600 break-all">{user.user_id}</p>
                </div>
              </div>
            </div>

            {/* Restaurants */}
            {user.restaurants && user.restaurants.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5 text-purple-500" />
                  Restaurants
                </h2>
                <div className="space-y-3">
                  {user.restaurants.map((restaurant: any) => (
                    <div key={restaurant.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{restaurant.name}</p>
                      <p className="text-xs text-gray-500">{restaurant.slug}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Extend Subscription Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowExtendModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('actions.extendSubscription', lang)}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extension Days</label>
                <input
                  type="number"
                  value={extensionDays}
                  onChange={(e) => setExtensionDays(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <textarea
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExtendModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  {t('actions.cancel', lang)}
                </button>
                <button
                  onClick={handleExtendSubscription}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Extend'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {showChangePlanModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowChangePlanModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('actions.changePlan', lang)}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Plan</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="free_trial">Free Trial</option>
                  <option value="starter">Starter ($39/mo)</option>
                  <option value="professional">Professional ($89/mo)</option>
                  <option value="enterprise">Enterprise ($199/mo)</option>
                </select>
              </div>
              {newPlan !== 'free_trial' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Interval</label>
                  <div className="flex gap-3">
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${newBillingInterval === 'monthly' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="radio"
                        name="billing_interval"
                        value="monthly"
                        checked={newBillingInterval === 'monthly'}
                        onChange={(e) => setNewBillingInterval(e.target.value)}
                        className="sr-only"
                      />
                      <span className="font-medium">Monthly</span>
                      <span className="text-sm text-gray-500">(30 days)</span>
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${newBillingInterval === 'yearly' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="radio"
                        name="billing_interval"
                        value="yearly"
                        checked={newBillingInterval === 'yearly'}
                        onChange={(e) => setNewBillingInterval(e.target.value)}
                        className="sr-only"
                      />
                      <span className="font-medium">Yearly</span>
                      <span className="text-sm text-gray-500">(365 days)</span>
                    </label>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <textarea
                  value={planChangeReason}
                  onChange={(e) => setPlanChangeReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  rows={2}
                />
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  {newPlan === 'free_trial'
                    ? 'This will reset the user to free trial status.'
                    : `Subscription will be set to ${newBillingInterval === 'yearly' ? '1 year' : '1 month'} starting today.`
                  }
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowChangePlanModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  {t('actions.cancel', lang)}
                </button>
                <button
                  onClick={handleChangePlan}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Change'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCancelModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('actions.cancelSubscription', lang)}</h2>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  This will cancel the customer's subscription. They will lose access to premium features.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                  rows={2}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cancelImmediate}
                  onChange={(e) => setCancelImmediate(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">Cancel immediately (otherwise at period end)</span>
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  {t('actions.cancel', lang)}
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Cancel Subscription'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
