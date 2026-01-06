'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Star,
  ArrowLeft,
  Loader2,
  ChefHat,
  Clock,
  Calendar,
  BarChart3,
  Download,
  FileText,
  Printer
} from 'lucide-react';
import { 
  exportToCSV, 
  exportToPDF, 
  printReport, 
  formatReportData 
} from '@/lib/utils/exportReports';

interface RevenueStats {
  summary: {
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
  };
  daily_data: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  service_breakdown: Array<{
    type: string;
    revenue: number;
    orders: number;
    percentage: number;
  }>;
}

interface PopularItem {
  menu_id: string;
  name: string;
  orders_count: number;
  revenue: number;
}

interface TrendData {
  hourly_distribution: Array<{ hour: number; orders: number }>;
  daily_distribution: Array<{ day: string; orders: number }>;
  peak_times: {
    hour: number;
    day: string;
  };
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30); // days

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      setUserId(session.user.id);
      await fetchRestaurant(session.user.id);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (restaurantId) {
      fetchAnalytics();
    }
  }, [restaurantId, selectedPeriod]);

  const fetchRestaurant = async (uid: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/user/profile?user_id=${uid}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.restaurant?.restaurant_id) {
          setRestaurantId(data.restaurant.restaurant_id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch restaurant:', error);
    }
  };

  const fetchAnalytics = async () => {
    if (!restaurantId) return;
    
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Fetch revenue stats
      const revenueResponse = await fetch(
        `${API_URL}/api/analytics/revenue?restaurant_id=${restaurantId}&days=${selectedPeriod}`
      );
      if (revenueResponse.ok) {
        const revenueData = await revenueResponse.json();
        if (revenueData.success) {
          setRevenueStats(revenueData);
        }
      }

      // Fetch popular items
      const popularResponse = await fetch(
        `${API_URL}/api/analytics/popular-items?restaurant_id=${restaurantId}&days=${selectedPeriod}&limit=10`
      );
      if (popularResponse.ok) {
        const popularData = await popularResponse.json();
        if (popularData.success) {
          setPopularItems(popularData.items || []);
        }
      }

      // Fetch trends
      const trendsResponse = await fetch(
        `${API_URL}/api/analytics/trends?restaurant_id=${restaurantId}&days=${selectedPeriod}`
      );
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json();
        if (trendsData.success) {
          setTrends(trendsData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-gray-600 hover:text-orange-500 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600">Insights and performance metrics for your restaurant</p>
            </div>
            
            {/* Period Selector */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-md">
                <button
                  onClick={() => setSelectedPeriod(7)}
                  className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                    selectedPeriod === 7
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setSelectedPeriod(30)}
                  className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                    selectedPeriod === 30
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  30 Days
                </button>
                <button
                  onClick={() => setSelectedPeriod(90)}
                  className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                    selectedPeriod === 90
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  90 Days
                </button>
              </div>
              
              {/* Export Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const reportData = formatReportData(
                      revenueStats,
                      popularItems,
                      `Last ${selectedPeriod} Days`
                    );
                    exportToCSV(reportData);
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 shadow-md"
                  title="Export to CSV"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
                
                <button
                  onClick={() => {
                    const reportData = formatReportData(
                      revenueStats,
                      popularItems,
                      `Last ${selectedPeriod} Days`
                    );
                    exportToPDF(reportData);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 shadow-md"
                  title="Export to PDF"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
                
                <button
                  onClick={() => {
                    const reportData = formatReportData(
                      revenueStats,
                      popularItems,
                      `Last ${selectedPeriod} Days`
                    );
                    printReport(reportData);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-md"
                  title="Print Report"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Print</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Revenue</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              ${revenueStats?.summary?.total_revenue?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-gray-500">Last {selectedPeriod} days</p>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {revenueStats?.summary?.total_orders || 0}
            </p>
            <p className="text-xs text-gray-500">Last {selectedPeriod} days</p>
          </div>

          {/* Average Order Value */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Average Order Value</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              ${revenueStats?.summary?.average_order_value?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-gray-500">Per order</p>
          </div>
        </div>

        {/* Daily Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-orange-500" />
            Daily Revenue
          </h2>
          
          {revenueStats && revenueStats.daily_data && revenueStats.daily_data.length > 0 ? (
            <div className="space-y-3">
              {revenueStats.daily_data.slice(-14).map((day) => {
                const maxRevenue = Math.max(...revenueStats.daily_data.map(d => d.revenue), 1);
                const percentage = (day.revenue / maxRevenue) * 100;
                
                return (
                  <div key={day.date} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-medium">{day.date}</span>
                      <span className="text-gray-900 font-bold">${day.revenue.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{day.orders} orders</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No revenue data available for this period</p>
            </div>
          )}
        </div>

        {/* Service Type Breakdown & Popular Items */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Service Type Breakdown */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <ChefHat className="w-6 h-6 mr-2 text-orange-500" />
              Revenue by Service Type
            </h2>
            
            {revenueStats && revenueStats.service_breakdown && revenueStats.service_breakdown.length > 0 ? (
              <div className="space-y-4">
                {revenueStats.service_breakdown.map((service) => (
                  <div key={service.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-medium capitalize">
                        {service.type.replace('_', ' ')}
                      </span>
                      <span className="text-gray-900 font-bold">
                        ${service.revenue.toFixed(2)} ({service.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ width: `${service.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{service.orders} orders</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ChefHat className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No service data available</p>
              </div>
            )}
          </div>

          {/* Popular Items */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Star className="w-6 h-6 mr-2 text-yellow-500" />
              Top 10 Popular Items
            </h2>
            
            {popularItems && popularItems.length > 0 ? (
              <div className="space-y-3">
                {popularItems.map((item, index) => (
                  <div key={item.menu_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.orders_count} orders</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600">
                      ${item.revenue.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No popular items data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Trends */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Peak Hours */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Clock className="w-6 h-6 mr-2 text-blue-500" />
              Orders by Hour
            </h2>
            
            {trends && trends.hourly_distribution && trends.hourly_distribution.length > 0 ? (
              <div className="space-y-2">
                {trends.hourly_distribution.map((hour) => {
                  const maxOrders = Math.max(...trends.hourly_distribution.map(h => h.orders), 1);
                  const percentage = (hour.orders / maxOrders) * 100;
                  const isPeakHour = hour.hour === trends.peak_times?.hour;
                  
                  return (
                    <div key={hour.hour} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className={`font-medium ${isPeakHour ? 'text-orange-600' : 'text-gray-600'}`}>
                          {hour.hour.toString().padStart(2, '0')}:00 {isPeakHour && '🔥'}
                        </span>
                        <span className="text-gray-900 font-bold">{hour.orders} orders</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isPeakHour ? 'bg-orange-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No hourly data available</p>
              </div>
            )}
          </div>

          {/* Peak Days */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-purple-500" />
              Orders by Day of Week
            </h2>
            
            {trends && trends.daily_distribution && trends.daily_distribution.length > 0 ? (
              <div className="space-y-2">
                {trends.daily_distribution.map((day) => {
                  const maxOrders = Math.max(...trends.daily_distribution.map(d => d.orders), 1);
                  const percentage = (day.orders / maxOrders) * 100;
                  const isPeakDay = day.day === trends.peak_times?.day;
                  
                  return (
                    <div key={day.day} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className={`font-medium ${isPeakDay ? 'text-purple-600' : 'text-gray-600'}`}>
                          {day.day} {isPeakDay && '🔥'}
                        </span>
                        <span className="text-gray-900 font-bold">{day.orders} orders</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isPeakDay ? 'bg-purple-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No daily data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Insights Section */}
        {trends && trends.peak_times && (
          <div className="mt-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">📊 Key Insights</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-orange-100 mb-2">Peak Hour</p>
                <p className="text-3xl font-bold">
                  {trends.peak_times.hour.toString().padStart(2, '0')}:00
                </p>
                <p className="text-sm text-orange-100 mt-1">Most orders received at this time</p>
              </div>
              <div>
                <p className="text-orange-100 mb-2">Busiest Day</p>
                <p className="text-3xl font-bold">{trends.peak_times.day}</p>
                <p className="text-sm text-orange-100 mt-1">Most orders on this day</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

