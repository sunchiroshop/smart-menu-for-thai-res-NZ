'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Utensils,
  CheckCircle2,
  Package
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
  items: OrderItem[];
  subtotal: number;
  tax: number;
  delivery_fee: number;
  total_price: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  service_type?: 'dine_in' | 'pickup' | 'delivery';
  customer_name?: string;
  customer_phone?: string;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const order_id = params.order_id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estimatedTime, setEstimatedTime] = useState<string>('');

  useEffect(() => {
    if (order_id) {
      fetchOrder();
      setupRealtimeSubscription();
    }
  }, [order_id]);

  const fetchOrder = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/orders/${order_id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Order not found');
        } else {
          throw new Error('Failed to fetch order');
        }
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setOrder(data.order);
        // Calculate estimated time based on status
        calculateEstimatedTime(data.order);
      } else {
        setError('Failed to fetch order');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimatedTime = (order: Order) => {
    const now = new Date();
    const createdAt = new Date(order.created_at);
    const elapsed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60)); // minutes
    
    let estimatedMinutes = 0;
    switch (order.status) {
      case 'pending':
        estimatedMinutes = 15 - elapsed; // 15 mins total
        break;
      case 'preparing':
        estimatedMinutes = 10 - elapsed; // 10 mins remaining
        break;
      case 'ready':
        setEstimatedTime('Ready now!');
        return;
      case 'completed':
        setEstimatedTime('Completed');
        return;
      case 'cancelled':
        setEstimatedTime('Cancelled');
        return;
    }
    
    if (estimatedMinutes <= 0) {
      setEstimatedTime('Almost ready!');
    } else {
      setEstimatedTime(`~${estimatedMinutes} minutes`);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!supabase || !order_id) return;

    const channel = supabase
      .channel(`order-${order_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order_id}`
        },
        (payload) => {
          console.log('🔄 Order status updated:', payload);
          // Reload order when status changes
          fetchOrder();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-6 h-6" />,
          text: 'Order Received',
          description: 'Your order has been received and is waiting to be prepared',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-300'
        };
      case 'preparing':
        return {
          icon: <Utensils className="w-6 h-6" />,
          text: 'Preparing',
          description: 'The kitchen is preparing your order',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-300'
        };
      case 'ready':
        return {
          icon: <Package className="w-6 h-6" />,
          text: 'Ready for Pickup',
          description: 'Your order is ready! Please come to collect it',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300'
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="w-6 h-6" />,
          text: 'Completed',
          description: 'Your order has been completed. Thank you!',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-300'
        };
      case 'cancelled':
        return {
          icon: <XCircle className="w-6 h-6" />,
          text: 'Cancelled',
          description: 'This order has been cancelled',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-300'
        };
      default:
        return {
          icon: <Clock className="w-6 h-6" />,
          text: 'Unknown',
          description: 'Unknown status',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-300'
        };
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Loading order status...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The order you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Status</h1>
          <p className="text-gray-600">Order #{order.id.slice(0, 8)}</p>
        </div>

        {/* Status Card */}
        <div className={`bg-white rounded-2xl shadow-xl p-8 mb-6 border-2 ${statusInfo.borderColor}`}>
          <div className="flex items-center justify-center mb-4">
            <div className={`p-4 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
              {statusInfo.icon}
            </div>
          </div>
          <h2 className={`text-2xl font-bold text-center mb-2 ${statusInfo.color}`}>
            {statusInfo.text}
          </h2>
          <p className="text-center text-gray-600 mb-4">
            {statusInfo.description}
          </p>
          
          {/* Estimated Time */}
          {estimatedTime && order.status !== 'completed' && order.status !== 'cancelled' && (
            <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">
                Estimated time: {estimatedTime}
              </span>
            </div>
          )}
          
          <div className="text-center text-sm text-gray-500">
            Placed on {formatTime(order.created_at)}
          </div>
          
          {/* Real-time indicator */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Updates automatically</span>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Order Details</h3>
          
          {order.table_no && (
            <div className="mb-4 pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600">Table Number</p>
              <p className="text-lg font-semibold text-gray-900">{order.table_no}</p>
            </div>
          )}

          <div className="space-y-4 mb-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
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
                    <p className="text-sm text-gray-500 italic mt-1">Note: {item.notes}</p>
                  )}
                </div>
                <p className="font-bold text-gray-900">
                  ${item.itemTotal.toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {order.special_instructions && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-semibold text-yellow-800 mb-1">Special Instructions:</p>
              <p className="text-sm text-yellow-700">{order.special_instructions}</p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold text-gray-900">${order.subtotal.toFixed(2)}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Delivery Fee:</span>
                <span className="font-semibold text-gray-900">${order.delivery_fee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-lg font-bold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-orange-500">${order.total_price.toFixed(2)} NZD</span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between items-center text-sm text-gray-500 mt-1">
                <span>Incl. GST (15%):</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Order Timeline</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full ${order.status === 'pending' ? statusInfo.bgColor : 'bg-gray-100'}`}>
                <Clock className={`w-5 h-5 ${order.status === 'pending' ? statusInfo.color : 'text-gray-400'}`} />
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${order.status === 'pending' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Order Received
                </p>
                <p className="text-sm text-gray-500">{formatTime(order.created_at)}</p>
              </div>
              {order.status !== 'pending' && (
                <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
              )}
            </div>

            {['preparing', 'ready', 'completed'].includes(order.status) && (
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${order.status === 'preparing' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Utensils className={`w-5 h-5 ${order.status === 'preparing' ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${order.status === 'preparing' ? 'text-gray-900' : 'text-gray-500'}`}>
                    Preparing
                  </p>
                  <p className="text-sm text-gray-500">Kitchen is working on your order</p>
                </div>
                {['ready', 'completed'].includes(order.status) && (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                )}
              </div>
            )}

            {['ready', 'completed'].includes(order.status) && (
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${order.status === 'ready' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Package className={`w-5 h-5 ${order.status === 'ready' ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${order.status === 'ready' ? 'text-gray-900' : 'text-gray-500'}`}>
                    Ready for Pickup
                  </p>
                  <p className="text-sm text-gray-500">Your order is ready!</p>
                </div>
                {order.status === 'completed' && (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                )}
              </div>
            )}

            {order.status === 'completed' && (
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-full bg-gray-100">
                  <CheckCircle2 className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Completed</p>
                  {order.completed_at && (
                    <p className="text-sm text-gray-500">{formatTime(order.completed_at)}</p>
                  )}
                </div>
                <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

