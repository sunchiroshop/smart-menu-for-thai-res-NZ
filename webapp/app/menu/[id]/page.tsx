'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, MapPin, Clock, Star } from 'lucide-react';

interface MenuItem {
  menu_id: string;
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  price: string;
  category: string;
  categoryEn?: string;
  photo_url?: string;
  meats?: Array<{name: string; nameEn?: string; price: string}>;
  addOns?: Array<{name: string; nameEn?: string; price: string}>;
  showBothLanguages?: boolean;
  primaryLanguage?: string;
}

export default function PublicMenuPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchMenuItem();
    }
  }, [id]);

  const fetchMenuItem = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/menu/${id}?restaurant_id=default`);
      
      if (!response.ok) {
        throw new Error('Menu item not found');
      }
      
      const data = await response.json();
      setMenuItem(data.menu_item);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !menuItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Item Not Found</h1>
          <p className="text-gray-600">
            {error || 'This menu item could not be found'}
          </p>
        </div>
      </div>
    );
  }

  const displayName = menuItem.primaryLanguage === 'english' 
    ? (menuItem.nameEn || menuItem.name)
    : menuItem.name;
  const secondaryName = menuItem.primaryLanguage === 'english'
    ? menuItem.name
    : menuItem.nameEn;

  const displayDescription = menuItem.primaryLanguage === 'english'
    ? (menuItem.descriptionEn || menuItem.description)
    : menuItem.description;
  const secondaryDescription = menuItem.primaryLanguage === 'english'
    ? menuItem.description
    : menuItem.descriptionEn;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-orange-600">🍽️ Smart Menu</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Photo */}
          <div className="aspect-[4/3] overflow-hidden bg-gray-100">
            {menuItem.photo_url ? (
              <img 
                src={menuItem.photo_url} 
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100">
                <div className="text-center">
                  <div className="text-6xl mb-2">🍽️</div>
                  <p className="text-gray-500 text-sm">No image available</p>
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-8">
            {/* Category Badge */}
            <div className="mb-4">
              <span className="inline-block bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-semibold">
                {menuItem.categoryEn || menuItem.category}
              </span>
            </div>

            {/* Name */}
            <div className="mb-6">
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                {displayName}
              </h2>
              {menuItem.showBothLanguages && secondaryName && displayName !== secondaryName && (
                <p className="text-2xl text-gray-600">
                  {secondaryName}
                </p>
              )}
            </div>

            {/* Description */}
            {displayDescription && (
              <div className="mb-6">
                <p className="text-lg text-gray-700 leading-relaxed mb-2">
                  {displayDescription}
                </p>
                {menuItem.showBothLanguages && secondaryDescription && displayDescription !== secondaryDescription && (
                  <p className="text-base text-gray-600 leading-relaxed">
                    {secondaryDescription}
                  </p>
                )}
              </div>
            )}

            {/* Price */}
            <div className="mb-8 pb-8 border-b-2 border-gray-200">
              <div className="inline-flex items-baseline">
                <span className="text-5xl font-bold text-orange-600">
                  ${menuItem.price}
                </span>
                <span className="text-2xl text-gray-500 ml-2">NZD</span>
              </div>
            </div>

            {/* Choose Meats */}
            {menuItem.meats && menuItem.meats.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-orange-700 mb-4 uppercase tracking-wide flex items-center">
                  🥩 Choose Meats
                </h3>
                <div className="space-y-3">
                  {menuItem.meats.map((meat, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-orange-300 hover:border-orange-500 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-lg">
                          • {meat.nameEn || meat.name}
                        </p>
                        {meat.nameEn && meat.name !== meat.nameEn && (
                          <p className="text-sm text-gray-600 ml-3">
                            ({meat.name})
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        {meat.price === '0' ? (
                          <span className="text-xl font-bold text-green-600">
                            FREE
                          </span>
                        ) : (
                          <>
                            <span className="text-xl font-bold text-orange-600">
                              +${meat.price}
                            </span>
                            <p className="text-xs text-gray-500">NZD</p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons */}
            {menuItem.addOns && menuItem.addOns.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  ✨ Add-ons
                </h3>
                <div className="space-y-3">
                  {menuItem.addOns.map((addon, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-2 border-orange-200 hover:border-orange-400 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-lg">
                          • {addon.nameEn || addon.name}
                        </p>
                        {addon.nameEn && addon.name !== addon.nameEn && (
                          <p className="text-sm text-gray-600 ml-3">
                            ({addon.name})
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <span className="text-xl font-bold text-orange-600">
                          +${addon.price}
                        </span>
                        <p className="text-xs text-gray-500">NZD</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white text-center">
              <p className="text-lg font-semibold mb-2">
                Ready to order? 🎉
              </p>
              <p className="text-sm opacity-90">
                Ask your server or scan the table QR code to place your order!
              </p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Powered by Smart Menu 🍽️</p>
          <p className="text-xs mt-1">Digital menu for modern restaurants</p>
        </div>
      </div>
    </div>
  );
}

