'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CreditCard, Building2, Loader2, CheckCircle, AlertCircle, ArrowLeft, QrCode, Upload, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe/config';
import QRCode from 'react-qr-code';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  restaurant_id: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total_price: number;
  delivery_fee?: number;
  service_type: 'dine_in' | 'pickup' | 'delivery';
  table_no?: string;
  customer_name?: string;
  status: string;
  payment_status: string;
}

interface BankAccount {
  bank_name: string;
  account_name: string;
  account_number: string;
}

interface PaymentSettings {
  accept_card: boolean;
  accept_bank_transfer: boolean;
  bank_accounts: BankAccount[];
}

interface Restaurant {
  id: string;
  name: string;
  payment_settings?: PaymentSettings;
}

// Stripe Payment Form Component
function StripePaymentForm({
  clientSecret,
  orderId,
  onSuccess
}: {
  clientSecret: string;
  orderId: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setProcessing(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/${orderId}/success`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      setProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Confirm payment on backend
      try {
        await fetch(`${API_URL}/api/payments/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_intent_id: paymentIntent.id,
            order_id: orderId,
          }),
        });
        onSuccess();
      } catch (err) {
        console.error('Failed to confirm payment:', err);
        onSuccess(); // Still proceed to success
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay Now
          </>
        )}
      </button>
    </form>
  );
}

// Bank Transfer Component
function BankTransferPayment({
  order,
  bankAccounts,
  onSlipUpload,
}: {
  order: Order;
  bankAccounts: BankAccount[];
  onSlipUpload: (slip: File) => void;
}) {
  const [selectedBank, setSelectedBank] = useState(0);
  const [copied, setCopied] = useState(false);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const currentBank = bankAccounts[selectedBank];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!slipFile) return;
    setUploading(true);
    await onSlipUpload(slipFile);
    setUploading(false);
  };

  // Generate QR code data (simplified - just the account number)
  const qrData = `Bank: ${currentBank.bank_name}\nAccount: ${currentBank.account_number}\nName: ${currentBank.account_name}\nAmount: $${order.total_price.toFixed(2)} NZD\nRef: Order ${order.id.slice(0, 8)}`;

  return (
    <div className="space-y-6">
      {/* Bank Selection */}
      {bankAccounts.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Bank Account
          </label>
          <div className="flex flex-wrap gap-2">
            {bankAccounts.map((bank, index) => (
              <button
                key={index}
                onClick={() => setSelectedBank(index)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  selectedBank === index
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                {bank.bank_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QR Code */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <h4 className="font-semibold text-gray-900 mb-4">Scan to Pay</h4>
        <div className="bg-white p-4 inline-block rounded-lg shadow-inner">
          <QRCode value={qrData} size={180} />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Scan with your mobile banking app
        </p>
      </div>

      {/* Bank Details */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-gray-900">Bank Details</h4>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Bank</p>
            <p className="font-medium text-gray-900">{currentBank.bank_name}</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Account Name</p>
            <p className="font-medium text-gray-900">{currentBank.account_name}</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Account Number</p>
            <p className="font-mono font-medium text-gray-900">{currentBank.account_number}</p>
          </div>
          <button
            onClick={() => copyToClipboard(currentBank.account_number)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Amount</p>
            <p className="text-xl font-bold text-green-600">${order.total_price.toFixed(2)} NZD</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Reference</p>
            <p className="font-mono text-gray-900">Order {order.id.slice(0, 8)}</p>
          </div>
          <button
            onClick={() => copyToClipboard(`Order ${order.id.slice(0, 8)}`)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Upload Slip */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Payment Slip (Optional)
        </h4>
        <p className="text-sm text-blue-700 mb-3">
          Upload your transfer receipt for faster verification
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="slip-upload"
        />

        {slipPreview ? (
          <div className="space-y-3">
            <img
              src={slipPreview}
              alt="Payment slip"
              className="max-w-full max-h-48 mx-auto rounded-lg shadow"
            />
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Submit Slip
                </>
              )}
            </button>
          </div>
        ) : (
          <label
            htmlFor="slip-upload"
            className="block w-full py-4 border-2 border-dashed border-blue-300 rounded-lg text-center cursor-pointer hover:bg-blue-100 transition-colors"
          >
            <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-blue-600">Click to upload slip</p>
          </label>
        )}
      </div>

      {/* Note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Your order will be processed once the payment is verified by the restaurant staff.
        </p>
      </div>
    </div>
  );
}

// Main Payment Page
export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.order_id as string;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'bank_transfer' | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Fetch order and payment settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch order
        const orderRes = await fetch(`${API_URL}/api/orders/${orderId}`);
        const orderData = await orderRes.json();

        if (!orderData.success || !orderData.order) {
          setError('Order not found');
          setLoading(false);
          return;
        }

        const orderInfo = orderData.order;
        setOrder(orderInfo);

        // Check if already paid
        if (orderInfo.payment_status === 'paid') {
          setPaymentSuccess(true);
          setLoading(false);
          return;
        }

        // Fetch payment settings
        const settingsRes = await fetch(`${API_URL}/api/restaurant/${orderInfo.restaurant_id}/payment-settings`);
        const settingsData = await settingsRes.json();

        if (settingsData.success) {
          setPaymentSettings(settingsData.payment_settings);

          // Auto-select if only one method available
          if (settingsData.payment_settings.accept_card && !settingsData.payment_settings.accept_bank_transfer) {
            setSelectedMethod('card');
          } else if (!settingsData.payment_settings.accept_card && settingsData.payment_settings.accept_bank_transfer) {
            setSelectedMethod('bank_transfer');
          }
        }

        // Fetch restaurant info
        const restaurantRes = await fetch(`${API_URL}/api/restaurant/${orderInfo.restaurant_id}`);
        const restaurantData = await restaurantRes.json();
        if (restaurantData.success) {
          setRestaurant(restaurantData.restaurant);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching payment data:', err);
        setError('Failed to load payment information');
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

  // Create payment intent when card is selected
  useEffect(() => {
    const createIntent = async () => {
      if (selectedMethod === 'card' && order && !clientSecret) {
        try {
          const response = await fetch(`${API_URL}/api/payments/create-intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: order.id,
              amount: order.total_price,
              currency: 'nzd',
              restaurant_id: order.restaurant_id,
            }),
          });

          const data = await response.json();
          if (data.success) {
            setClientSecret(data.client_secret);
          } else {
            setError(data.detail || 'Failed to initialize payment');
          }
        } catch (err) {
          console.error('Error creating payment intent:', err);
          setError('Failed to initialize payment');
        }
      }
    };

    createIntent();
  }, [selectedMethod, order, clientSecret]);

  // Handle slip upload
  const handleSlipUpload = async (file: File) => {
    if (!order) return;

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];

        const response = await fetch(`${API_URL}/api/payments/upload-slip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: order.id,
            slip_image_base64: base64,
          }),
        });

        const data = await response.json();
        if (data.success) {
          // Redirect to order status page
          router.push(`/order-status?order=${order.id}&type=${order.service_type}`);
        } else {
          setError(data.detail || 'Failed to upload slip');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading slip:', err);
      setError('Failed to upload slip');
    }
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your order has been confirmed and sent to the kitchen.
          </p>
          <Link
            href={`/order-status?order=${order?.id}&type=${order?.service_type}`}
            className="inline-block w-full px-6 py-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
          >
            Track Your Order
          </Link>
        </div>
      </div>
    );
  }

  if (!order || !paymentSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Available</h1>
          <p className="text-gray-600 mb-6">Payment settings not configured for this restaurant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/restaurant/${order.restaurant_id}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
          <p className="text-gray-600">{restaurant?.name || 'Restaurant'}</p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>

          <div className="space-y-2 mb-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
            )}
            {order.delivery_fee && order.delivery_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Fee</span>
                <span>${order.delivery_fee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span>Total</span>
              <span className="text-blue-600">${order.total_price.toFixed(2)} NZD</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Payment Method</h2>

          <div className="space-y-3">
            {paymentSettings.accept_card && (
              <button
                onClick={() => setSelectedMethod('card')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-4 ${
                  selectedMethod === 'card'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Credit/Debit Card</h3>
                  <p className="text-sm text-gray-600">Visa, Mastercard, Amex, Apple Pay</p>
                </div>
              </button>
            )}

            {paymentSettings.accept_bank_transfer && paymentSettings.bank_accounts.length > 0 && (
              <button
                onClick={() => setSelectedMethod('bank_transfer')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-4 ${
                  selectedMethod === 'bank_transfer'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Bank Transfer</h3>
                  <p className="text-sm text-gray-600">Transfer directly to bank account</p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Payment Form */}
        {selectedMethod === 'card' && clientSecret && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <Elements
              stripe={getStripe()}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#2563eb',
                  },
                },
              }}
            >
              <StripePaymentForm
                clientSecret={clientSecret}
                orderId={order.id}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          </div>
        )}

        {selectedMethod === 'bank_transfer' && paymentSettings.bank_accounts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <BankTransferPayment
              order={order}
              bankAccounts={paymentSettings.bank_accounts}
              onSlipUpload={handleSlipUpload}
            />
          </div>
        )}

        {/* Security Note */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Your payment is secure and encrypted</p>
        </div>
      </div>
    </div>
  );
}
