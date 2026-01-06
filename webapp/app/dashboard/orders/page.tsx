'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Utensils,
  RefreshCw,
  MapPin,
  Store
} from 'lucide-react';

interface OrderItem {
  menu_id: string;
  name: string;
  nameEn?: string;
  price: number;
  quantity: number;
  selectedMeat?: string;
  selectedAddOns?: string[];
  notes?: string;
  itemTotal: number;
}

interface Order {
  id: string;
  restaurant_id: string;
  table_no?: string;
  service_type?: 'dine_in' | 'pickup' | 'delivery';
  customer_details?: {
    table_no?: string;
    name?: string;
    phone?: string;
    pickup_time?: string;
    address?: string;
  };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  delivery_fee: number;
  total_price: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  customer_name?: string;
  customer_phone?: string;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [previousOrderCount, setPreviousOrderCount] = useState(0);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Get restaurant ID for current user
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const userId = session.user.id;
      
      try {
        const response = await fetch(`${API_URL}/api/user/profile?user_id=${userId}`);
        const data = await response.json();
        
        if (data.success && data.restaurant?.restaurant_id) {
          setRestaurantId(data.restaurant.restaurant_id);
          await loadOrders(data.restaurant.restaurant_id);
        }
      } catch (error) {
        console.error('Failed to get restaurant ID:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const loadOrders = async (rid: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const statusParam = filterStatus === 'all' ? '' : filterStatus;
      const url = `${API_URL}/api/orders?restaurant_id=${rid}${statusParam ? `&status=${statusParam}` : ''}`;
      
      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json();
      
      if (data.success) {
        const newOrders = data.orders || [];
        const pendingOrders = newOrders.filter((o: Order) => o.status === 'pending');
        const previousPendingCount = orders.filter((o: Order) => o.status === 'pending').length;
        
        // Play sound alert if new pending order arrives
        if (pendingOrders.length > previousPendingCount && previousPendingCount > 0) {
          playOrderAlert();
        }
        
        setOrders(newOrders);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const playOrderAlert = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Higher pitch
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Failed to play alert sound:', error);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      loadOrders(restaurantId);
      
      // Set up Supabase Realtime subscription for KDS
      if (supabase) {
        const channel = supabase
          .channel('orders-changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',  // Only listen for new orders
              schema: 'public',
              table: 'orders',
              filter: `restaurant_id=eq.${restaurantId}`
            },
            (payload) => {
              console.log('🔄 New order detected:', payload);
              // Play sound alert for new order
              playOrderAlert();
              // Reload orders when new order arrives
              loadOrders(restaurantId);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',  // Also listen for status updates
              schema: 'public',
              table: 'orders',
              filter: `restaurant_id=eq.${restaurantId}`
            },
            (payload) => {
              console.log('🔄 Order updated:', payload);
              // Reload orders when status changes
              loadOrders(restaurantId);
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }
  }, [restaurantId, filterStatus]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Reload orders
        if (restaurantId) {
          await loadOrders(restaurantId);
        }
      } else {
        alert('Failed to update order status');
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'preparing':
        return <Utensils className="w-5 h-5" />;
      case 'ready':
        return <CheckCircle className="w-5 h-5" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
              <p className="text-gray-600 mt-1">Manage customer orders in real-time</p>
            </div>
            <button
              onClick={() => restaurantId && loadOrders(restaurantId)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['all', 'pending', 'preparing', 'ready', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  filterStatus === status
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {filterStatus === 'all' 
                ? 'No orders have been placed yet.' 
                : `No ${filterStatus} orders at the moment.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-lg p-6 border-l-4"
                style={{
                  borderLeftColor: 
                    order.status === 'pending' ? '#fbbf24' :
                    order.status === 'preparing' ? '#3b82f6' :
                    order.status === 'ready' ? '#10b981' :
                    order.status === 'completed' ? '#6b7280' :
                    '#ef4444'
                }}
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-gray-900">
                        Order #{order.id.slice(0, 8)}
                      </h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Time: {formatTime(order.created_at)}</p>
                    {/* Service Type Badge */}
                    {order.service_type && (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        order.service_type === 'dine_in' 
                          ? 'bg-blue-100 text-blue-800'
                          : order.service_type === 'pickup'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {order.service_type === 'dine_in' && <Utensils className="w-3 h-3" />}
                        {order.service_type === 'pickup' && <Store className="w-3 h-3" />}
                        {order.service_type === 'delivery' && <MapPin className="w-3 h-3" />}
                        {order.service_type === 'dine_in' ? 'Dine-in' : order.service_type === 'pickup' ? 'Pickup' : 'Delivery'}
                      </span>
                    )}
                    {order.service_type === 'dine_in' && (
                      <>
                        {order.customer_details?.table_no && <p className="font-medium text-blue-700">🍽️ Table: {order.customer_details.table_no}</p>}
                        {order.table_no && !order.customer_details?.table_no && <p className="font-medium text-blue-700">🍽️ Table: {order.table_no}</p>}
                      </>
                    )}
                    {order.service_type === 'pickup' && (
                      <>
                        {order.customer_details?.name && <p className="font-medium text-orange-700">🛍️ {order.customer_details.name}</p>}
                        {order.customer_details?.phone && <p className="text-orange-600">📞 {order.customer_details.phone}</p>}
                        {order.customer_details?.pickup_time && <p className="text-orange-600">⏰ {new Date(order.customer_details.pickup_time).toLocaleString()}</p>}
                        {order.customer_name && !order.customer_details?.name && <p className="font-medium text-orange-700">🛍️ {order.customer_name}</p>}
                        {order.customer_phone && !order.customer_details?.phone && <p className="text-orange-600">📞 {order.customer_phone}</p>}
                      </>
                    )}
                    {order.service_type === 'delivery' && (
                      <>
                        {order.customer_details?.name && <p className="font-medium text-green-700">🛵 {order.customer_details.name}</p>}
                        {order.customer_details?.phone && <p className="text-green-600">📞 {order.customer_details.phone}</p>}
                        {order.customer_details?.address && <p className="text-green-600">📍 {order.customer_details.address}</p>}
                        {order.customer_name && !order.customer_details?.name && <p className="font-medium text-green-700">🛵 {order.customer_name}</p>}
                        {order.customer_phone && !order.customer_details?.phone && <p className="text-green-600">📞 {order.customer_phone}</p>}
                      </>
                    )}
                    {/* Fallback for old orders without service_type */}
                    {!order.service_type && (
                      <>
                        {order.table_no && <p>Table: {order.table_no}</p>}
                        {order.customer_name && <p>Customer: {order.customer_name}</p>}
                        {order.customer_phone && <p>Phone: {order.customer_phone}</p>}
                      </>
                    )}
                  </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-500">
                      ${order.total_price.toFixed(2)} NZD
                    </p>
                    <p className="text-sm text-gray-500">
                      Subtotal: ${order.subtotal.toFixed(2)}
                    </p>
                    {order.delivery_fee > 0 && (
                      <p className="text-sm text-gray-500">
                        Delivery: ${order.delivery_fee.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4 border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Items:</h3>
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {item.quantity}x {item.nameEn || item.name}
                            </p>
                            {item.selectedMeat && (
                              <p className="text-sm text-gray-600">Meat: {item.selectedMeat}</p>
                            )}
                            {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                              <p className="text-sm text-gray-600">
                                Add-ons: {item.selectedAddOns.join(', ')}
                              </p>
                            )}
                            {item.notes && (
                              <p className="text-sm text-gray-500 italic mt-1">
                                Note: {item.notes}
                              </p>
                            )}
                          </div>
                          <p className="font-semibold text-gray-900">
                            ${item.itemTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Instructions */}
                {order.special_instructions && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-semibold text-yellow-800 mb-1">Special Instructions:</p>
                    <p className="text-sm text-yellow-700">{order.special_instructions}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                      >
                        Start Preparing
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                    >
                      Mark as Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
                    >
                      Complete Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

