'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Store, 
  Loader2,
  Check,
  X,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  theme_color?: string;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function RestaurantsManagementPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentRestaurantId, setCurrentRestaurantId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      
      setUserId(session.user.id);
      
      // Fetch all restaurants for this user
      const response = await fetch(`${API_URL}/api/restaurants?user_id=${session.user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setRestaurants(data.restaurants || []);
        
        // Get current restaurant from profile
        const profileResponse = await fetch(`${API_URL}/api/user/profile?user_id=${session.user.id}`);
        const profileData = await profileResponse.json();
        if (profileData.success && profileData.restaurant?.id) {
          setCurrentRestaurantId(profileData.restaurant.id);
        }
      }
    } catch (error) {
      console.error('Failed to load restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestaurant = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
    });
    setEditingRestaurant(null);
    setShowAddModal(true);
  };

  const handleEditRestaurant = (restaurant: Restaurant) => {
    setFormData({
      name: restaurant.name || '',
      description: restaurant.description || '',
      address: restaurant.address || '',
      phone: restaurant.phone || '',
      email: restaurant.email || '',
    });
    setEditingRestaurant(restaurant);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert('Please enter restaurant name');
      return;
    }

    try {
      setSaving(true);
      
      if (editingRestaurant) {
        // Update existing restaurant
        const response = await fetch(`${API_URL}/api/restaurant/${editingRestaurant.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            ...formData,
          }),
        });
        
        const data = await response.json();
        if (data.success) {
          alert('Restaurant updated successfully!');
          await loadRestaurants();
          setShowAddModal(false);
        } else {
          alert(data.error || 'Failed to update restaurant');
        }
      } else {
        // Create new restaurant
        const response = await fetch(`${API_URL}/api/restaurant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            ...formData,
          }),
        });
        
        const data = await response.json();
        if (data.success) {
          alert('Restaurant created successfully!');
          await loadRestaurants();
          setShowAddModal(false);
        } else {
          alert(data.error || 'Failed to create restaurant');
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save restaurant');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (restaurantId: string) => {
    if (!confirm('Are you sure you want to delete this restaurant? All menus and data will be lost!')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/restaurant/${restaurantId}?user_id=${userId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Restaurant deleted successfully!');
        await loadRestaurants();
      } else {
        alert(data.error || 'Failed to delete restaurant');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete restaurant');
    }
  };

  const handleSetActive = async (restaurantId: string) => {
    try {
      // Update current restaurant in user profile
      const response = await fetch(`${API_URL}/api/user/set-restaurant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          restaurant_id: restaurantId,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        // Update state without reloading page - keeps card positions
        setCurrentRestaurantId(restaurantId);
        
        // Show success message
        const restaurantName = restaurants.find(r => r.id === restaurantId)?.name;
        alert(`✅ Active restaurant changed to: ${restaurantName}`);
      } else {
        alert(data.error || 'Failed to change restaurant');
      }
    } catch (error) {
      console.error('Set active error:', error);
      alert('Failed to change restaurant');
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
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center text-gray-600 hover:text-orange-500 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Restaurant Management
            </h1>
            <p className="text-gray-600">
              Manage all your restaurant branches
            </p>
          </div>
          
          <button
            onClick={handleAddRestaurant}
            className="inline-flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Restaurant
          </button>
        </div>

        {/* Restaurants Grid */}
        {restaurants.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              No restaurants yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first restaurant to get started
            </p>
            <button
              onClick={handleAddRestaurant}
              className="inline-flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Restaurant
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border-2 ${
                  currentRestaurantId === restaurant.id 
                    ? 'border-orange-500 ring-2 ring-orange-200' 
                    : 'border-transparent'
                }`}
              >
                {/* Logo */}
                {restaurant.logo_url && (
                  <div className="h-32 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center p-4">
                    <img
                      src={restaurant.logo_url}
                      alt={restaurant.name}
                      className="h-24 w-24 object-contain rounded-full border-2 border-white shadow-lg"
                    />
                  </div>
                )}
                
                {/* Content */}
                <div className="p-6">
                  {/* Active Badge */}
                  {currentRestaurantId === restaurant.id && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        <Check className="w-3 h-3 mr-1" />
                        Active
                      </span>
                    </div>
                  )}
                  
                  {/* Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {restaurant.name}
                  </h3>
                  
                  {/* Slug */}
                  <p className="text-sm text-gray-500 mb-3">
                    /{restaurant.slug}
                  </p>
                  
                  {/* Description */}
                  {restaurant.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {restaurant.description}
                    </p>
                  )}
                  
                  {/* Contact Info */}
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    {restaurant.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{restaurant.address}</span>
                      </div>
                    )}
                    {restaurant.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{restaurant.phone}</span>
                      </div>
                    )}
                    {restaurant.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="line-clamp-1">{restaurant.email}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    {currentRestaurantId !== restaurant.id && (
                      <button
                        onClick={() => handleSetActive(restaurant.id)}
                        className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => handleEditRestaurant(restaurant)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {restaurants.length > 1 && (
                      <button
                        onClick={() => handleDelete(restaurant.id)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Restaurant Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Wok Express Bangkok"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Will auto-generate URL slug: {formData.name ? formData.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-') : 'restaurant-name'}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of your restaurant"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street, Auckland"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+64 21 123 4567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="info@restaurant.nz"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingRestaurant ? 'Save Changes' : 'Create Restaurant'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

