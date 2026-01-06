'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Search,
  Image as ImageIcon,
  Check,
  Loader2,
  Calendar,
  Store,
  RefreshCw,
  ChevronDown,
  Building2
} from 'lucide-react';
import OptimizedImage from './OptimizedImage';

interface ImageItem {
  image_id: string;
  image_url: string;
  menu_name: string;
  restaurant_id: string;
  restaurant_name: string;
  created_at: string;
}

interface Restaurant {
  id: string;
  name: string;
}

interface ImageGalleryProps {
  userId: string;
  onSelectImage: (imageUrl: string) => void;
  onClose: () => void;
  currentRestaurantId: string;
  allowCrossRestaurant?: boolean; // Enterprise feature
}

export default function ImageGallery({
  userId,
  onSelectImage,
  onClose,
  currentRestaurantId,
  allowCrossRestaurant = false
}: ImageGalleryProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // Default to 'all' to show all images from all branches
  const [filterMode, setFilterMode] = useState<'all' | 'current' | 'recent'>('all');

  // Restaurant dropdown - available for all users
  const [userRestaurants, setUserRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(currentRestaurantId);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);

  // Fetch user's restaurants for dropdown
  useEffect(() => {
    fetchUserRestaurants();
  }, [userId]);

  useEffect(() => {
    fetchImages();
  }, [userId, filterMode, selectedRestaurantId]);

  useEffect(() => {
    filterImages();
  }, [searchTerm, images, filterMode]);

  const fetchUserRestaurants = async () => {
    setLoadingRestaurants(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/restaurants?user_id=${userId}`);

      if (response.ok) {
        const data = await response.json();
        if (data.restaurants && Array.isArray(data.restaurants)) {
          const restaurants = data.restaurants.map((r: any) => ({
            id: r.id,
            name: r.name
          }));

          // Ensure current restaurant is in the list
          const hasCurrentRestaurant = restaurants.some((r: Restaurant) => r.id === currentRestaurantId);
          if (!hasCurrentRestaurant && currentRestaurantId) {
            restaurants.unshift({
              id: currentRestaurantId,
              name: 'สาขาปัจจุบัน (Current Branch)'
            });
          }

          setUserRestaurants(restaurants);
          console.log('📍 Loaded restaurants for Enterprise:', restaurants.length);
        }
      } else {
        console.error('Failed to fetch restaurants, status:', response.status);
        // Fallback: at least show current restaurant
        if (currentRestaurantId) {
          setUserRestaurants([{
            id: currentRestaurantId,
            name: 'สาขาปัจจุบัน (Current Branch)'
          }]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
      // Fallback: at least show current restaurant
      if (currentRestaurantId) {
        setUserRestaurants([{
          id: currentRestaurantId,
          name: 'สาขาปัจจุบัน (Current Branch)'
        }]);
      }
    } finally {
      setLoadingRestaurants(false);
    }
  };

  const fetchImages = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      let url = '';
      if (filterMode === 'current') {
        // Use selected restaurant from dropdown
        url = `${API_URL}/api/images/restaurant/${selectedRestaurantId}?user_id=${userId}&limit=50`;
      } else if (filterMode === 'recent') {
        // Recent uploads across all restaurants
        url = `${API_URL}/api/images/recent?user_id=${userId}&days=7&limit=50`;
      } else if (filterMode === 'all') {
        // All restaurants - image library
        url = `${API_URL}/api/images/library?user_id=${userId}&limit=100`;
      } else {
        // Fallback to current restaurant
        url = `${API_URL}/api/images/restaurant/${currentRestaurantId}?user_id=${userId}&limit=50`;
      }

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setImages(data.images || []);
        }
      } else if (response.status === 403) {
        // Permission denied - show message
        const error = await response.json();
        console.warn('Permission denied:', error.detail);
        // Fallback to current restaurant only
        if (filterMode !== 'current') {
          setFilterMode('current');
        }
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterImages = () => {
    if (!searchTerm) {
      setFilteredImages(images);
      return;
    }

    const filtered = images.filter(img => 
      img.menu_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredImages(filtered);
  };

  const handleSelectImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleConfirmSelection = () => {
    if (selectedImage) {
      onSelectImage(selectedImage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-7 h-7 text-orange-500" />
                {allowCrossRestaurant ? 'Image Library (All Restaurants)' : 'My Restaurant Images'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {allowCrossRestaurant 
                  ? 'เลือกรูปจากคลังทุกสาขา 🌟 Enterprise Feature' 
                  : 'เลือกรูปที่เคยสร้างไว้ในร้านนี้'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Restaurant Dropdown - Available for all users */}
            <div className="flex-1 flex gap-2">
              {/* Restaurant Dropdown */}
              <div className="relative flex-1">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                <select
                  value={filterMode === 'all' ? '_all_' : selectedRestaurantId}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '_all_') {
                      setFilterMode('all');
                      setSelectedRestaurantId(currentRestaurantId);
                    } else {
                      setSelectedRestaurantId(value);
                      setFilterMode('current');
                    }
                  }}
                  disabled={loadingRestaurants}
                  className="w-full pl-10 pr-10 py-2.5 border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:outline-none appearance-none bg-white text-gray-900 font-medium cursor-pointer"
                >
                  <option value="_all_">📸 รวมทุกสาขา (All Branches)</option>
                  {userRestaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name} {restaurant.id === currentRestaurantId ? '(สาขาปัจจุบัน)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500 pointer-events-none" />
              </div>

              {/* Search within selected */}
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาเมนู..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              {/* Recent uploads button */}
              <button
                onClick={() => setFilterMode('recent')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                  filterMode === 'recent'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                ล่าสุด 7 วัน
              </button>

              <button
                onClick={fetchImages}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <ImageIcon className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-semibold">
                {searchTerm ? 'ไม่พบรูปที่ค้นหา' : 'ยังไม่มีรูปในคลัง'}
              </p>
              <p className="text-sm mt-2">
                {searchTerm 
                  ? 'ลองค้นหาด้วยคำอื่น' 
                  : 'อัปโหลดรูปเมนูเพื่อเริ่มต้นใช้งาน'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredImages.map((image) => (
                <div
                  key={image.image_id}
                  onClick={() => handleSelectImage(image.image_url)}
                  className={`group relative cursor-pointer rounded-xl overflow-hidden border-4 transition-all hover:shadow-xl ${
                    selectedImage === image.image_url
                      ? 'border-orange-500 shadow-lg scale-105'
                      : 'border-transparent hover:border-orange-200'
                  }`}
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-100">
                    <OptimizedImage
                      src={image.image_url}
                      alt={image.menu_name}
                      className="w-full h-full object-cover"
                      priority={false}
                    />
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-semibold text-sm truncate">
                        {image.menu_name}
                      </p>
                      <p className="text-white/80 text-xs truncate flex items-center gap-1 mt-1">
                        <Store className="w-3 h-3" />
                        {image.restaurant_name}
                      </p>
                    </div>
                  </div>

                  {/* Selected Checkmark */}
                  {selectedImage === image.image_url && (
                    <div className="absolute top-2 right-2 bg-orange-500 rounded-full p-1.5 shadow-lg">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedImage ? (
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  รูปที่เลือก: 1 รูป
                </span>
              ) : (
                <span>
                  {filteredImages.length} รูปในคลัง
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={!selectedImage}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  selectedImage
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Use This Image
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

