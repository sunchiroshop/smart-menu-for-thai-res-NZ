'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, ChevronDown, Plus, Check } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  logo_url?: string;
  theme_color?: string;
}

interface RestaurantSwitcherProps {
  userId: string;
  currentRestaurantId?: string;
  onSwitch?: (restaurantId: string) => void;
}

export default function RestaurantSwitcher({ 
  userId, 
  currentRestaurantId,
  onSwitch 
}: RestaurantSwitcherProps) {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedId, setSelectedId] = useState(currentRestaurantId || '');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_URL}/api/restaurants/list?user_id=${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setRestaurants(data.restaurants || []);
            
            // Set first restaurant as selected if none selected
            if (!selectedId && data.restaurants && data.restaurants.length > 0) {
              setSelectedId(data.restaurants[0].id);
              if (onSwitch) {
                onSwitch(data.restaurants[0].id);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchRestaurants();
    }
  }, [userId]);

  const handleSwitch = (restaurantId: string) => {
    setSelectedId(restaurantId);
    setShowDropdown(false);
    
    // Save to localStorage
    localStorage.setItem(`selected_restaurant_${userId}`, restaurantId);
    
    // Callback
    if (onSwitch) {
      onSwitch(restaurantId);
    }
    
    // Reload page to refresh data
    window.location.reload();
  };

  const currentRestaurant = restaurants.find(r => r.id === selectedId);

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-10 w-48 rounded-lg"></div>
    );
  }

  // Single restaurant - don't show switcher
  if (restaurants.length <= 1) {
    return null;
  }

  return (
    <div className="relative">
      {/* Current Restaurant Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-all shadow-sm"
      >
        {currentRestaurant?.logo_url ? (
          <img 
            src={currentRestaurant.logo_url} 
            alt={currentRestaurant.name}
            className="w-6 h-6 rounded object-cover"
          />
        ) : (
          <Store className="w-5 h-5 text-gray-600" />
        )}
        <span className="font-semibold text-gray-900 max-w-[150px] truncate">
          {currentRestaurant?.name || 'Select Restaurant'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${
          showDropdown ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full mt-2 right-0 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 px-3 py-2">
                YOUR RESTAURANTS ({restaurants.length})
              </p>
            </div>
            
            <div className="max-h-80 overflow-y-auto p-2">
              {restaurants.map((restaurant) => (
                <button
                  key={restaurant.id}
                  onClick={() => handleSwitch(restaurant.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-orange-50 transition-colors ${
                    restaurant.id === selectedId ? 'bg-orange-50' : ''
                  }`}
                >
                  {restaurant.logo_url ? (
                    <img 
                      src={restaurant.logo_url} 
                      alt={restaurant.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                      <Store className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900 text-sm">
                      {restaurant.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      ID: {restaurant.id.slice(0, 8)}...
                    </p>
                  </div>
                  
                  {restaurant.id === selectedId && (
                    <Check className="w-5 h-5 text-orange-500" />
                  )}
                </button>
              ))}
            </div>
            
            {/* Add New Restaurant */}
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  router.push('/dashboard/settings?tab=restaurants&action=add');
                }}
                className="w-full flex items-center gap-2 px-3 py-3 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm">Add New Restaurant</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

