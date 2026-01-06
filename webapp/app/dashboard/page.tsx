'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { signOut } from '@/lib/supabase/auth';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription/plans';
import TrialLimitsCard from '@/components/TrialLimitsCard';
import {
  ChefHat,
  LogOut,
  Menu,
  Upload,
  FileText,
  User,
  Settings,
  Loader2,
  Crown,
  Zap,
  TrendingUp,
  DollarSign,
  Sparkles,
  ExternalLink,
  Receipt,
  ChevronDown,
  Building2,
  Shield
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(SUBSCRIPTION_PLANS[0]); // Default to Free Trial
  const [usage, setUsage] = useState({
    menusThisMonth: 0,
    storageUsed: '0MB',
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [restaurants, setRestaurants] = useState<Array<{id: string; name: string; slug?: string}>>([]);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('free_trial');
  const isFetchingProfile = useRef(false);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let subscription: { unsubscribe: () => void } | null = null;

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const userId = session.user.id;
      if (!userId) {
        console.error('❌ Dashboard: No user ID found in session');
        router.push('/login');
        return;
      }

      setUser(session.user);
      setCurrentUserId(userId);

      if (!restaurantId && !isFetchingProfile.current) {
        isFetchingProfile.current = true;
        try {
          // Check localStorage for selected restaurant (multi-branch support)
          const savedRestaurantId = localStorage.getItem(`selected_restaurant_${userId}`);
          
          // Fetch user role and plan from backend (also returns restaurant_id)
          const userProfile = await fetchUserPlan(userId, savedRestaurantId || undefined);

          // Fetch best sellers and usage if we have a restaurant ID
          // restaurant_id is nested under restaurant.restaurant_id in API response
          const restId = userProfile?.restaurant?.restaurant_id;
          const restSlug = userProfile?.restaurant?.slug;
          const restName = userProfile?.restaurant?.name;
          if (restId) {
            setRestaurantId(restId);
            if (restSlug) setRestaurantSlug(restSlug);
            if (restName) setRestaurantName(restName);
            await fetchRestaurantAndBestSellers(restId);
            await fetchUsageData(restId);
          }

          // Fetch all restaurants for branch switching
          await fetchAllRestaurants(userId);
        } finally {
          isFetchingProfile.current = false;
          setLoading(false);
        }
      } else if (restaurantId) {
        // Already have restaurant – just ensure loading state is cleared
        setLoading(false);
      }

      // REMOVED: Polling is no longer needed - we only update on explicit events
      // This reduces unnecessary API calls from 100+/min to just a few on page load
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        if (pollInterval) clearInterval(pollInterval);
        router.push('/login');
      } else if (event === 'SIGNED_IN' && session?.user?.id) {
        // Only update on SIGNED_IN event to avoid redundant calls
        const userId = session.user.id;
        setUser(session.user);
        setCurrentUserId(userId);
        if (!restaurantId && !isFetchingProfile.current) {
          isFetchingProfile.current = true;
          try {
            // Check localStorage for selected restaurant (multi-branch support)
            const savedRestaurantId = localStorage.getItem(`selected_restaurant_${userId}`);
            const userProfile = await fetchUserPlan(userId, savedRestaurantId || undefined);

            // Fetch best sellers and usage if we have a restaurant ID
            // restaurant_id is nested under restaurant.restaurant_id in API response
            const restId = userProfile?.restaurant?.restaurant_id;
            const restSlug = userProfile?.restaurant?.slug;
            if (restId) {
              setRestaurantId(restId);
              if (restSlug) setRestaurantSlug(restSlug);
              await fetchRestaurantAndBestSellers(restId);
              await fetchUsageData(restId);
            }
          } finally {
            isFetchingProfile.current = false;
            setLoading(false);
          }
        }
      }
    });
    subscription = authSubscription;

    // Listen for role changes from Settings page (ONLY when explicitly changed)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_role_changed' || e.key === 'selected_plan') {
        console.log('🔄 Dashboard: Role changed detected, refreshing plan...');
        if (!isFetchingProfile.current) {
          supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            if (currentSession?.user?.id) {
              isFetchingProfile.current = true;
              fetchUserPlan(currentSession.user.id).finally(() => {
                isFetchingProfile.current = false;
              });
            }
          });
        }
      }
    };

    // Listen for custom events (same-tab updates) - ONLY when explicitly changed
    const handleRoleChange = async () => {
      console.log('🔄 Dashboard: Role change event received, refreshing plan...');
      if (!isFetchingProfile.current) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user?.id) {
          isFetchingProfile.current = true;
          await fetchUserPlan(currentSession.user.id).finally(() => {
            isFetchingProfile.current = false;
          });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userRoleChanged', handleRoleChange);

    return () => {
      if (subscription) subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userRoleChanged', handleRoleChange);
      // No polling interval to clear anymore
    };
  }, [router, restaurantId]);

  const fetchUserPlan = async (userId: string | null, restaurantId?: string) => {
    // Don't fetch if userId is null or 'default'
    if (!userId || userId === 'default') {
      console.warn('⚠️ Dashboard: Skipping fetchUserPlan - invalid userId:', userId);
      return null;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Build URL with optional restaurant_id parameter (for multi-branch support)
      const url = restaurantId 
        ? `${API_URL}/api/user/profile?user_id=${userId}&restaurant_id=${restaurantId}`
        : `${API_URL}/api/user/profile?user_id=${userId}`;
      
      // Fetch user profile which includes role and subscription plan
      const response = await fetch(url, {
        cache: 'no-store', // Always fetch fresh data
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Dashboard: Fetched user profile:', data);
        
        if (data.success && data.subscription) {
          // Get role from subscription (priority) or directly from response
          const role = data.subscription.role || data.role || data.subscription.plan;
          const planId = data.subscription.plan;
          
          console.log('📊 Dashboard: Role:', role, 'Plan:', planId);
          
          // Map role/plan to frontend plan ID
          const planMapping: Record<string, string> = {
            'trial': 'free',
            'free_trial': 'free',
            'starter': 'basic',
            'pro': 'pro',
            'professional': 'pro',
            'premium': 'enterprise',
            'enterprise': 'enterprise',
            'admin': 'enterprise'  // Admin gets enterprise features
          };
          
          // Use role first, then plan
          const keyToMap = role || planId;
          const mappedPlanId = planMapping[keyToMap] || planMapping[planId] || 'basic';
          
          console.log('📊 Dashboard: Mapped plan ID:', mappedPlanId);
          
          const plan = SUBSCRIPTION_PLANS.find(p => p.id === mappedPlanId);
          
          if (plan) {
            console.log('✅ Dashboard: Setting plan to:', plan.name);
            setCurrentPlan(plan);
            // Save to localStorage for consistency
            localStorage.setItem('selected_plan', plan.id);
            localStorage.setItem('user_role', role || 'free_trial');
            // Set user role state for admin button visibility
            setUserRole(role || 'free_trial');
          } else {
            console.warn('⚠️ Dashboard: Plan not found for ID:', mappedPlanId);
          }
          
          // Return the profile data so we can extract restaurant_id
          return data;
        }
      } else {
        console.error('❌ Dashboard: Failed to fetch user profile:', response.status);
      }
    } catch (err) {
      console.error('❌ Dashboard: Failed to fetch user plan:', err);
      // Keep default plan if fetch fails
    }
    
    return null;
  };

  const fetchUsageData = async (restId?: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Use provided restId or fallback to state restaurantId
      const targetRestaurantId = restId || restaurantId;
      
      // Skip if invalid
      if (!targetRestaurantId || targetRestaurantId === 'default') {
        console.warn('⚠️ Dashboard: Skipping fetchUsageData - invalid restaurantId');
        return;
      }
      
      const response = await fetch(`${API_URL}/api/menu-stats?restaurant_id=${targetRestaurantId}`);
      
      if (response.ok) {
        const data = await response.json();
        const stats = data.stats;
        
        // Calculate storage (rough estimate: assume 200KB per menu item)
        const storageBytes = stats.total_items * 200 * 1024; // 200KB per item
        const storageMB = (storageBytes / (1024 * 1024)).toFixed(0);
        
        setUsage({
          menusThisMonth: stats.total_items || 0,
          storageUsed: `${storageMB}MB`,
        });
      }
    } catch (err) {
      console.error('Failed to fetch usage data:', err);
      // Keep default values if fetch fails
    }
  };

  const fetchRestaurantAndBestSellers = async (restaurantId: string) => {
    // Now accepts restaurantId directly to avoid duplicate profile API calls
    if (!restaurantId || restaurantId === 'default') {
      console.warn('⚠️ Dashboard: Invalid restaurant ID for best sellers');
      setBestSellers([]);
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Fetch best sellers for this restaurant
      const bestSellersResponse = await fetch(`${API_URL}/api/best-sellers?restaurant_id=${restaurantId}`);
      if (bestSellersResponse.ok) {
        const bestSellersData = await bestSellersResponse.json();
        if (bestSellersData.success && bestSellersData.items) {
          setBestSellers(bestSellersData.items);
        }
      }
    } catch (err) {
      console.error('Failed to fetch best sellers:', err);
      // Set empty array if fetch fails
      setBestSellers([]);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const fetchAllRestaurants = async (userId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/restaurants?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.restaurants) {
          setRestaurants(data.restaurants.map((r: any) => ({
            id: r.id,
            name: r.name,
            slug: r.slug
          })));
        }
      }
    } catch (err) {
      console.error('Failed to fetch restaurants:', err);
    }
  };

  const handleBranchSwitch = async (restaurant: {id: string; name: string; slug?: string}) => {
    if (!currentUserId) return;

    // Save selected restaurant to localStorage
    localStorage.setItem(`selected_restaurant_${currentUserId}`, restaurant.id);

    // Update state
    setRestaurantId(restaurant.id);
    setRestaurantName(restaurant.name);
    if (restaurant.slug) setRestaurantSlug(restaurant.slug);
    setShowBranchDropdown(false);

    // Refresh data for new restaurant
    await fetchRestaurantAndBestSellers(restaurant.id);
    await fetchUsageData(restaurant.id);

    // Trigger refresh event for other components
    window.dispatchEvent(new CustomEvent('userRoleChanged'));
  };

  const getUsagePercentage = () => {
    if (currentPlan.limits.menusPerMonth === -1) return 0;
    return (usage.menusThisMonth / currentPlan.limits.menusPerMonth) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <div className="bg-orange-500 p-2 rounded-lg">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <h1 className="ml-3 text-xl font-bold text-gray-900">SmartMenu</h1>
              </div>

              {/* Branch Dropdown */}
              {restaurants.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                    className="flex items-center gap-2 px-3 py-2 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
                  >
                    <Building2 className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-700 max-w-[150px] truncate">
                      {restaurantName || 'Select Branch'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showBranchDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showBranchDropdown && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowBranchDropdown(false)}
                      />
                      {/* Dropdown */}
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1 max-h-64 overflow-y-auto">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                          Switch Branch
                        </div>
                        {restaurants.map((restaurant) => (
                          <button
                            key={restaurant.id}
                            onClick={() => handleBranchSwitch(restaurant)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-orange-50 transition-colors flex items-center gap-2 ${
                              restaurant.id === restaurantId ? 'bg-orange-100 text-orange-700' : 'text-gray-700'
                            }`}
                          >
                            <Building2 className={`w-4 h-4 ${restaurant.id === restaurantId ? 'text-orange-500' : 'text-gray-400'}`} />
                            <span className="truncate">{restaurant.name}</span>
                            {restaurant.id === restaurantId && (
                              <span className="ml-auto text-xs text-orange-500 font-medium">Current</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Single restaurant name display */}
              {restaurants.length === 1 && restaurantName && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{restaurantName}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Admin Button - Only visible for admin role */}
              {userRole === 'admin' && (
                <Link
                  href="/dashboard/admin"
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Admin</span>
                </Link>
              )}
              <Link
                href="/dashboard/settings"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Settings</span>
              </Link>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {user?.user_metadata?.full_name || user?.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold mb-2">
                  Welcome back! 👋
                </h2>
                <p className="text-orange-100 text-lg">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
              </div>
              {/* View Menu Button - Prominent placement */}
              {restaurantId && (
                <Link
                  href={`/restaurant/${restaurantSlug || restaurantId}`}
                  target="_blank"
                  className="flex items-center gap-3 px-6 py-3 bg-white text-orange-600 rounded-xl font-bold text-lg hover:bg-orange-50 transition-colors shadow-lg"
                >
                  <ExternalLink className="w-6 h-6" />
                  View Menu
                </Link>
              )}
            </div>
          </div>
          <div className="absolute top-0 right-0 transform translate-x-12 translate-y-12">
            <ChefHat className="w-64 h-64 text-white opacity-10" />
          </div>
        </div>

        {/* Plan & Usage Cards */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Current Plan Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-orange-200 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 p-3 rounded-xl">
                    <Crown className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {currentPlan.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      ${currentPlan.price} NZD/month
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/pricing"
                className="w-full inline-block text-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors text-sm"
              >
                View Plans
              </Link>
            </div>
          </div>

          {/* Trial Limits Card */}
          <div className="lg:col-span-2">
            {currentUserId && <TrialLimitsCard userId={currentUserId} />}
          </div>
        </div>

        {/* Best Sellers Widget */}
        {bestSellers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-100 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Top 5 Best Selling Items</h3>
                <p className="text-sm text-gray-500">Last 7 days</p>
              </div>
            </div>
            <div className="space-y-3">
              {bestSellers.map((item, index) => (
                <div key={item.menu_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.nameEn || item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.total_quantity} orders • {item.order_count} times ordered
                      </p>
                    </div>
                  </div>
                  {(item.image_url || item.photo_url) && (
                    <img
                      src={item.image_url || item.photo_url}
                      alt={item.nameEn || item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/upload"
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-200 group"
          >
            <div className="bg-orange-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-lg">Upload Menu</h3>
            <p className="text-sm text-gray-500">Upload and translate new menu</p>
          </Link>

          <Link
            href="/menus"
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-200 group"
          >
            <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Menu className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-lg">My Menu</h3>
            <p className="text-sm text-gray-500">View and manage your menu</p>
          </Link>

          <Link
            href="/pricing"
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-200 group"
          >
            <div className="bg-purple-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-lg">Upgrade</h3>
            <p className="text-sm text-gray-500">View all plans</p>
          </Link>

          <Link
            href="/dashboard/settings"
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-200 group"
          >
            <div className="bg-gray-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Settings className="w-7 h-7 text-gray-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-lg">Settings</h3>
            <p className="text-sm text-gray-500">Profile & Billing</p>
          </Link>

          <Link
            href="/dashboard/order-summary"
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-200 group"
          >
            <div className="bg-green-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Receipt className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-lg">Order Summary</h3>
            <p className="text-sm text-gray-500">View orders & payments</p>
          </Link>

          {/* Admin Panel - Only visible for admin role */}
          {userRole === 'admin' && (
            <Link
              href="/dashboard/admin"
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 border-purple-200 group"
            >
              <div className="bg-purple-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-lg">Admin Panel</h3>
              <p className="text-sm text-gray-500">Manage users & system</p>
            </Link>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h4 className="text-3xl font-bold text-gray-900 mb-1">{usage.menusThisMonth}</h4>
            <p className="text-gray-600">Menus Uploaded</p>
            <p className="text-xs text-gray-500 mt-2">This month</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-xl">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h4 className="text-3xl font-bold text-gray-900 mb-1">Active</h4>
            <p className="text-gray-600">Account Status</p>
            <p className="text-xs text-green-600 mt-2">● All systems operational</p>
          </div>
        </div>
      </main>
    </div>
  );
}
