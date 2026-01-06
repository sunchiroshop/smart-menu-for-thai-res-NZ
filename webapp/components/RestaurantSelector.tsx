'use client';

import { useState, useEffect } from 'react';
import { Store, Loader2, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
}

interface RestaurantSelectorProps {
  onRestaurantChange: (restaurantId: string, slug?: string) => void;
  currentRestaurantId?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function RestaurantSelector({ onRestaurantChange, currentRestaurantId }: RestaurantSelectorProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(currentRestaurantId || '');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('free_trial');
  
  // Check if user has Enterprise plan
  const isEnterprise = ['enterprise', 'premium', 'admin'].includes(userRole);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Load user role
      const response = await fetch(`${API_URL}/api/user/role?user_id=${session.user.id}`);
      const data = await response.json();
      if (data.success) {
        setUserRole(data.role);
      }

      // Load restaurants list
      const restaurantsResponse = await fetch(`${API_URL}/api/restaurants?user_id=${session.user.id}`);
      const restaurantsData = await restaurantsResponse.json();
      
      if (restaurantsData.success && restaurantsData.restaurants) {
        setRestaurants(restaurantsData.restaurants);
        
        // Set current restaurant if not set
        if (!selectedRestaurant && restaurantsData.restaurants.length > 0) {
          // First, try to get from localStorage (for persistence across page navigations)
          const savedRestaurantId = localStorage.getItem(`selected_restaurant_${session.user.id}`);
          
          if (savedRestaurantId && restaurantsData.restaurants.some((r: Restaurant) => r.id === savedRestaurantId)) {
            // Use saved selection if it exists and is valid
            setSelectedRestaurant(savedRestaurantId);
            const savedRestaurant = restaurantsData.restaurants.find((r: Restaurant) => r.id === savedRestaurantId);
            onRestaurantChange(savedRestaurantId, savedRestaurant?.slug);
          } else {
            // Fallback: Try to get from user profile
            const profileResponse = await fetch(`${API_URL}/api/user/profile?user_id=${session.user.id}`);
            const profileData = await profileResponse.json();
            if (profileData.success && profileData.restaurant?.id) {
              setSelectedRestaurant(profileData.restaurant.id);
              const profileRestaurant = restaurantsData.restaurants.find((r: Restaurant) => r.id === profileData.restaurant.id);
              onRestaurantChange(profileData.restaurant.id, profileRestaurant?.slug || profileData.restaurant?.slug);
            } else {
              // Last fallback: Default to first restaurant
              setSelectedRestaurant(restaurantsData.restaurants[0].id);
              onRestaurantChange(restaurantsData.restaurants[0].id, restaurantsData.restaurants[0].slug);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantChange = async (restaurantId: string) => {
    setSelectedRestaurant(restaurantId);

    // Save selection to localStorage for persistence across pages
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      localStorage.setItem(`selected_restaurant_${session.user.id}`, restaurantId);
    }

    // Find slug for this restaurant
    const selectedRest = restaurants.find(r => r.id === restaurantId);
    onRestaurantChange(restaurantId, selectedRest?.slug);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  // Show nothing if not Enterprise or only 1 restaurant
  if (!isEnterprise || restaurants.length <= 1) {
    return null;
  }

  const currentRestaurant = restaurants.find(r => r.id === selectedRestaurant);

  return (
    <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
      <label className="block text-sm font-bold text-gray-900 mb-2">
        🏢 Select Restaurant Branch
      </label>
      <div className="relative">
        <select
          value={selectedRestaurant}
          onChange={(e) => handleRestaurantChange(e.target.value)}
          className="w-full appearance-none px-4 py-3 pr-10 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium cursor-pointer transition-all hover:border-blue-400"
        >
          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
      <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
        <Store className="w-3 h-3" />
        Menu items will be added to: <span className="font-semibold">{currentRestaurant?.name}</span>
      </p>
    </div>
  );
}

