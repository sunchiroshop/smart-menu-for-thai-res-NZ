'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Download,
  Share2,
  Loader2,
  Copy,
  Check,
  Printer,
  QrCode
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase/client';

// Dynamic import for QR code (no SSR)
const QRCodeSVG = dynamic(() => import('qrcode.react').then(mod => mod.QRCodeSVG), {
  ssr: false,
  loading: () => <div className="w-[300px] h-[300px] bg-gray-200 animate-pulse rounded-xl" />
});

export default function RestaurantQRCodePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string>('default');
  const qrRef = useRef<HTMLDivElement>(null);
  
  const publicMenuUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/restaurant/${restaurantId}`
    : '';

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);
      
      // Check localStorage for selected restaurant (for multi-branch support)
      const savedRestaurantId = localStorage.getItem(`selected_restaurant_${session.user.id}`);
      
      // Fetch real restaurant slug (or ID as fallback) from user profile
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        // If there's a saved selection, use it; otherwise fetch from profile
        const targetRestaurantId = savedRestaurantId || '';
        const url = targetRestaurantId 
          ? `${API_URL}/api/user/profile?user_id=${session.user.id}&restaurant_id=${targetRestaurantId}`
          : `${API_URL}/api/user/profile?user_id=${session.user.id}`;
        
        const profileResponse = await fetch(url);
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.success && profileData.restaurant) {
            // Use slug if available, otherwise fallback to restaurant_id
            const identifier = profileData.restaurant.slug || profileData.restaurant.restaurant_id;
            if (identifier) {
              setRestaurantId(identifier);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch restaurant identifier:', error);
      }
      
      setLoading(false);
    };

    checkUser();
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicMenuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = async () => {
    if (!qrRef.current) return;
    
    try {
      const svg = qrRef.current.querySelector('svg');
      if (!svg) return;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const link = document.createElement('a');
        link.download = `restaurant-menu-qr.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error('Failed to download QR code:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Restaurant Menu',
          text: 'Scan this QR code to view our menu and order!',
          url: publicMenuUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Link
          href="/menus"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Menu
        </Link>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Restaurant Menu QR Code
            </h1>
            <p className="text-gray-600">
              Customers can scan this QR code to view your complete menu and place orders
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-8">
            <div 
              ref={qrRef}
              className="bg-white p-6 rounded-xl border-4 border-gray-200"
            >
              <QRCodeSVG
                value={publicMenuUrl}
                size={300}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Menu URL */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <p className="text-sm font-semibold text-gray-700 mb-2">Menu URL:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={publicMenuUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
            >
              <Download className="w-5 h-5" />
              Download QR
            </button>
            
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-colors"
            >
              <Printer className="w-5 h-5" />
              Print
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>

          {/* Preview Link */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Preview your public menu:
            </p>
            <Link
              href={`/restaurant/${restaurantId}`}
              target="_blank"
              className="inline-flex items-center text-orange-500 hover:text-orange-600 font-semibold"
            >
              View Public Menu →
            </Link>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">📱 How to use this QR code:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Print this QR code and place it on your tables or at the entrance</li>
            <li>Customers scan the QR code with their phone camera</li>
            <li>They'll see your complete menu with all items, prices, and photos</li>
            <li>Customers can add items to cart and place orders directly</li>
            <li>No app download required - works with any smartphone!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

