'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Eye,
  Trash2,
  Calendar,
  Loader2,
  Menu as MenuIcon,
  Plus,
  QrCode,
  Edit,
  X,
  Copy,
  Star,
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Upload,
  ToggleLeft,
  ToggleRight,
  EyeOff
} from 'lucide-react';
import RestaurantSelector from '@/components/RestaurantSelector';
import ImageGallery from '@/components/ImageGallery';
import { generateFoodImage, enhanceImage, applyLogoOnly } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';

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
  image_url?: string;  // Backend uses image_url
  meats?: Array<{name: string; nameEn?: string; price: string; is_available?: boolean}>;
  addOns?: Array<{name: string; nameEn?: string; price: string; is_available?: boolean}>;
  is_best_seller?: boolean;
  is_active?: boolean;  // For temporarily hiding menu items
  created_at: string;
  updated_at?: string;
  restaurant_id?: string;
}

export default function MenusPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);  // For toggling menu active status
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('free_trial');
  const [userRestaurants, setUserRestaurants] = useState<any[]>([]);
  const [copyingMenu, setCopyingMenu] = useState<MenuItem | null>(null);
  const [copying, setCopying] = useState(false);
  const [selectedTargetRestaurant, setSelectedTargetRestaurant] = useState<string>('');
  const [editForm, setEditForm] = useState({
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    price: '',
    category: '',
    photo_url: '',
    meats: [] as Array<{name: string; nameEn?: string; price: string; is_available?: boolean}>,
    addOns: [] as Array<{name: string; nameEn?: string; price: string; is_available?: boolean}>,
    is_best_seller: false,
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Edit Image AI features
  const [userId, setUserId] = useState<string | null>(null);
  const [showEditImageGallery, setShowEditImageGallery] = useState(false);
  const [editImageMode, setEditImageMode] = useState<'upload' | 'gallery' | 'generate' | 'enhance' | 'logo'>('upload');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [enhancingImage, setEnhancingImage] = useState(false);
  const [applyingLogoOnly, setApplyingLogoOnly] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [enhancePrompt, setEnhancePrompt] = useState('');
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null);
  const [logoOverlay, setLogoOverlay] = useState(false);
  const [logoPosition, setLogoPosition] = useState<'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'>('top-right');
  const [logoSize, setLogoSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null); // Store original image before logo

  // Auto-translate states
  const [translatingMeatIdx, setTranslatingMeatIdx] = useState<number | null>(null);
  const [translatingAddOnIdx, setTranslatingAddOnIdx] = useState<number | null>(null);

  // Function to translate text to English
  const translateToEnglish = async (text: string): Promise<string> => {
    if (!text || text.trim() === '') return '';

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          source_lang: 'auto',
          target_lang: 'en'
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.translated_text || data.translation || text;
      }
    } catch (err) {
      console.error('Translation failed:', err);
    }
    return text;
  };

  // Auto-translate meat name when user leaves the field
  const handleMeatNameBlur = async (idx: number, name: string) => {
    // Only translate if there's text and English field is empty
    const currentEnglish = editForm.meats[idx]?.nameEn || '';
    if (!name || name.trim() === '' || currentEnglish.trim() !== '') return;

    setTranslatingMeatIdx(idx);
    try {
      const translated = await translateToEnglish(name);
      if (translated && translated !== name) {
        const newMeats = [...editForm.meats];
        newMeats[idx].nameEn = translated;
        setEditForm({ ...editForm, meats: newMeats });
      }
    } finally {
      setTranslatingMeatIdx(null);
    }
  };

  // Auto-translate add-on name when user leaves the field
  const handleAddOnNameBlur = async (idx: number, name: string) => {
    // Only translate if there's text and English field is empty
    const currentEnglish = editForm.addOns[idx]?.nameEn || '';
    if (!name || name.trim() === '' || currentEnglish.trim() !== '') return;

    setTranslatingAddOnIdx(idx);
    try {
      const translated = await translateToEnglish(name);
      if (translated && translated !== name) {
        const newAddOns = [...editForm.addOns];
        newAddOns[idx].nameEn = translated;
        setEditForm({ ...editForm, addOns: newAddOns });
      }
    } finally {
      setTranslatingAddOnIdx(null);
    }
  };

  useEffect(() => {
    fetchRestaurantIdAndMenus();
    fetchUserRoleAndRestaurants();
  }, []);

  const fetchRestaurantIdAndMenus = async () => {
    try {
      // Get restaurant ID first
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        // Store userId for AI features
        setUserId(session.user.id);

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        // Check localStorage for previously selected restaurant (multi-branch support)
        const savedRestaurantId = localStorage.getItem(`selected_restaurant_${session.user.id}`);

        // Build URL with optional restaurant_id parameter
        const url = savedRestaurantId
          ? `${API_URL}/api/user/profile?user_id=${session.user.id}&restaurant_id=${savedRestaurantId}`
          : `${API_URL}/api/user/profile?user_id=${session.user.id}`;

        const profileResponse = await fetch(url);

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.success && profileData.restaurant?.restaurant_id) {
            const restId = profileData.restaurant.restaurant_id;
            setRestaurantId(restId);
            // Store restaurant logo for AI image overlay
            if (profileData.restaurant.logo_url) {
              setRestaurantLogo(profileData.restaurant.logo_url);
            }
            // Store restaurant slug for public view links
            if (profileData.restaurant.slug) {
              setRestaurantSlug(profileData.restaurant.slug);
            }
            await fetchMenus(restId);
            return;
          }
        }
      }
      
      // Fallback to 'default' if no restaurant found
      setRestaurantId('default');
      await fetchMenus('default');
    } catch (err: any) {
      console.error('Failed to fetch restaurant ID:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchUserRoleAndRestaurants = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        // Get user profile to check role
        const profileResponse = await fetch(`${API_URL}/api/user/profile?user_id=${session.user.id}`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const role = profileData.subscription?.role || 'free_trial';
          setUserRole(role);
          
          // Only fetch restaurants if user is Enterprise/Premium
          if (role === 'enterprise' || role === 'premium' || role === 'admin') {
            const restaurantsResponse = await fetch(`${API_URL}/api/restaurants?user_id=${session.user.id}`);
            if (restaurantsResponse.ok) {
              const restaurantsData = await restaurantsResponse.json();
              if (restaurantsData.success) {
                setUserRestaurants(restaurantsData.restaurants || []);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch user role and restaurants:', err);
    }
  };

  const fetchMenus = async (restId?: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const restaurant_id = restId || restaurantId || 'default';
      const response = await fetch(`${API_URL}/api/menus?restaurant_id=${restaurant_id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch menus');
      }
      
      const data = await response.json();
      setMenus(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (menuId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    setDeleting(menuId);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/menu/${menuId}?restaurant_id=${restaurantId || 'default'}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete menu item');
      }

      // Invalidate translation cache for this menu item (deleted)
      if (restaurantId && menuId) {
        try {
          await fetch(`${API_URL}/api/translations/menu/${restaurantId}/${menuId}`, {
            method: 'DELETE',
          });
          console.log('Translation cache invalidated for deleted menu');
        } catch (cacheErr) {
          console.log('Cache invalidation skipped:', cacheErr);
        }
      }

      // Remove from state immediately for better UX
      setMenus(menus.filter(menu => menu.menu_id !== menuId));

      // Optionally refresh from server
      // await fetchMenus();
    } catch (err: any) {
      alert('Failed to delete menu item: ' + err.message);
      console.error('Delete error:', err);
    } finally {
      setDeleting(null);
    }
  };

  // Toggle menu item active status (temporarily hide/show)
  const handleToggleActive = async (menu: MenuItem) => {
    setToggling(menu.menu_id);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const newActiveStatus = !menu.is_active;

      const response = await fetch(`${API_URL}/api/menu/${menu.menu_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...menu,
          is_active: newActiveStatus,
          restaurant_id: menu.restaurant_id || restaurantId || 'default',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update menu status');
      }

      // Update state immediately for better UX
      setMenus(menus.map(m =>
        m.menu_id === menu.menu_id
          ? { ...m, is_active: newActiveStatus }
          : m
      ));
    } catch (err: any) {
      alert('Failed to toggle menu status: ' + err.message);
      console.error('Toggle error:', err);
    } finally {
      setToggling(null);
    }
  };

  const handleEdit = (menu: MenuItem) => {
    setEditing(menu);
    const imageUrl = menu.photo_url || menu.image_url || '';
    setEditForm({
      name: menu.name || '',
      nameEn: menu.nameEn || '',
      description: menu.description || '',
      descriptionEn: menu.descriptionEn || '',
      price: menu.price || '',
      category: menu.category || '',
      photo_url: imageUrl,
      meats: (menu as any).meats || [],
      addOns: (menu as any).addOns || [],
      is_best_seller: menu.is_best_seller || false,
    });
    setOriginalImageUrl(imageUrl); // Store original image for logo application
    setEditImageFile(null);
    setEditImageMode('upload');
    setAiPrompt('');
    setEnhancePrompt('');
    setLogoOverlay(false);
  };

  // AI Generate Image for Edit
  const handleEditGenerateImage = async () => {
    if (!aiPrompt && !editForm.name) {
      alert('Please enter a description or menu name for image generation');
      return;
    }

    setGeneratingImage(true);
    try {
      const logoConfig = logoOverlay && restaurantLogo ? {
        enabled: true,
        logo_url: restaurantLogo,
        position: logoPosition,
        size: logoSize
      } : undefined;

      const result = await generateFoodImage({
        dish_name: editForm.name || 'Food',
        description: aiPrompt || editForm.description || editForm.name,
        cuisine_type: 'thai',
        style: 'professional',
        user_id: userId || undefined,
        logo_overlay: logoConfig
      });

      if (result.success && result.generated_image) {
        const imageUrl = (result as any).generated_image_url || result.generated_image;
        setEditForm({ ...editForm, photo_url: imageUrl });
        setOriginalImageUrl(imageUrl); // Update original for logo application
        setEditImageFile(null);
      } else {
        alert(result.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Generate image error:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setGeneratingImage(false);
    }
  };

  // AI Enhance Image for Edit
  const handleEditEnhanceImage = async () => {
    if (!editForm.photo_url && !editImageFile) {
      alert('Please upload or select an image first');
      return;
    }

    setEnhancingImage(true);
    try {
      let imageFile: File;

      if (editImageFile) {
        imageFile = editImageFile;
      } else if (editForm.photo_url) {
        // Fetch existing image and convert to File
        const response = await fetch(editForm.photo_url);
        const blob = await response.blob();
        imageFile = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' });
      } else {
        throw new Error('No image to enhance');
      }

      const logoConfig = logoOverlay && restaurantLogo ? {
        enabled: true,
        logo_url: restaurantLogo,
        position: logoPosition,
        size: logoSize
      } : undefined;

      const result = await enhanceImage(
        imageFile,
        'professional',
        enhancePrompt || undefined,
        logoConfig,
        userId || undefined
      );

      if (result.success && (result.enhanced_image_url || result.enhanced_image)) {
        const imageUrl = result.enhanced_image_url || result.enhanced_image || '';
        setEditForm({ ...editForm, photo_url: imageUrl });
        setOriginalImageUrl(imageUrl); // Update original for logo application
        setEditImageFile(null);
      } else {
        alert(result.error || 'Failed to enhance image');
      }
    } catch (error) {
      console.error('Enhance image error:', error);
      alert('Failed to enhance image. Please try again.');
    } finally {
      setEnhancingImage(false);
    }
  };

  // Apply Logo Only (No AI Enhancement) for Edit
  const handleApplyLogoOnlyEdit = async () => {
    // Use original image URL to avoid stacking logos
    const sourceImageUrl = originalImageUrl || editForm.photo_url;

    if (!sourceImageUrl && !editImageFile) {
      alert('Please upload or select an image first');
      return;
    }

    if (!restaurantLogo) {
      alert('No restaurant logo found. Please upload a logo in Settings first.');
      return;
    }

    setApplyingLogoOnly(true);
    try {
      let imageFile: File;

      if (editImageFile) {
        imageFile = editImageFile;
        // Update original image when new file is uploaded
        const reader = new FileReader();
        reader.onloadend = () => {
          setOriginalImageUrl(reader.result as string);
        };
        reader.readAsDataURL(editImageFile);
      } else if (sourceImageUrl) {
        // Fetch ORIGINAL image (without logo) and convert to File
        const response = await fetch(sourceImageUrl);
        const blob = await response.blob();
        imageFile = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' });
      } else {
        throw new Error('No image to apply logo');
      }

      const result = await applyLogoOnly(
        imageFile,
        restaurantLogo,
        logoPosition,
        logoSize
      );

      if (result.success && (result.image_url || result.image)) {
        const imageUrl = result.image_url || result.image || '';
        setEditForm({ ...editForm, photo_url: imageUrl });
        setEditImageFile(null);
        // Keep originalImageUrl unchanged so subsequent logo applications use clean image
      } else {
        alert(result.error || 'Failed to apply logo');
      }
    } catch (error) {
      console.error('Apply logo error:', error);
      alert('Failed to apply logo. Please try again.');
    } finally {
      setApplyingLogoOnly(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;

    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Handle image upload if new image selected
      let imageUrl = editForm.photo_url;
      if (editImageFile) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('file', editImageFile);
        formData.append('restaurant_id', editing.restaurant_id || restaurantId || '');

        const uploadResponse = await fetch(`${API_URL}/api/upload-image`, {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.image_url || uploadData.url || imageUrl;
        }
        setUploadingImage(false);
      }

      // Debug: Log the request data
      const requestData = {
        ...editForm,
        photo_url: imageUrl,
        restaurant_id: editing.restaurant_id || 'default',
        meats: editForm.meats,
        addOns: editForm.addOns,
        is_best_seller: editForm.is_best_seller,
      };
      console.log('🔄 Saving menu item:', editing.menu_id);
      console.log('🔄 API URL:', `${API_URL}/api/menu/${editing.menu_id}`);
      console.log('🔄 Request data:', requestData);
      console.log('🔄 is_best_seller value:', editForm.is_best_seller);

      const response = await fetch(`${API_URL}/api/menu/${editing.menu_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('🔄 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update menu item');
      }

      // Invalidate translation cache for this menu item (content changed)
      const menuRestaurantId = editing.restaurant_id || restaurantId;
      if (menuRestaurantId && editing.menu_id) {
        try {
          await fetch(`${API_URL}/api/translations/menu/${menuRestaurantId}/${editing.menu_id}`, {
            method: 'DELETE',
          });
          console.log('Translation cache invalidated for edited menu');
        } catch (cacheErr) {
          console.log('Cache invalidation skipped:', cacheErr);
        }
      }

      // Refresh the menu list
      await fetchMenus();
      setEditing(null);
      setEditImageFile(null);
      alert('Menu item updated successfully!');
    } catch (err: any) {
      alert('Failed to update menu item: ' + err.message);
      console.error('Update error:', err);
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const handleCopyMenu = (menu: MenuItem) => {
    setCopyingMenu(menu);
    setSelectedTargetRestaurant('');
  };

  const handleConfirmCopy = async () => {
    if (!copyingMenu || !selectedTargetRestaurant) {
      alert('Please select a target restaurant');
      return;
    }

    setCopying(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/menus/copy-to-restaurant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: session.user.id,
          menu_id: copyingMenu.menu_id,
          target_restaurant_id: selectedTargetRestaurant,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to copy menu');
      }

      alert('Menu copied successfully to the selected restaurant!');
      setCopyingMenu(null);
      setSelectedTargetRestaurant('');
    } catch (err: any) {
      alert('Failed to copy menu: ' + err.message);
      console.error('Copy error:', err);
    } finally {
      setCopying(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-gray-600 hover:text-orange-500 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              My Menu
            </h1>
            <p className="text-gray-600">
              Manage all your restaurant menu items
            </p>
          </div>
          
          <div className="flex gap-3">
            <Link
              href="/qr"
              className="inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
            >
              <QrCode className="w-5 h-5 mr-2" />
              View QR Code
            </Link>
            <Link
              href="/upload"
              className="inline-flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Upload New Menu
            </Link>
          </div>
        </div>

        {/* Restaurant Selector (Enterprise only) */}
        <RestaurantSelector
          onRestaurantChange={(id, slug) => {
            setRestaurantId(id);
            if (slug) {
              setRestaurantSlug(slug);
            }
            fetchMenus(id);
          }}
          currentRestaurantId={restaurantId || undefined}
        />

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center">
            <p>{error}</p>
          </div>
        ) : menus.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MenuIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              No menus yet
            </h3>
            <p className="text-gray-600 mb-6">
              Upload your first menu to get started
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Upload Your First Menu
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menus.map((menu) => (
              <div
                key={menu.menu_id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden"
              >
                {/* Photo */}
                {(menu.photo_url || menu.image_url) ? (
                  <div className="aspect-video overflow-hidden bg-gray-100 relative">
                    <img
                      src={menu.photo_url || menu.image_url}
                      alt={menu.nameEn || menu.name}
                      className={`w-full h-full object-contain ${menu.is_active === false ? 'opacity-50 grayscale' : ''}`}
                    />
                    {/* Best Seller Badge */}
                    {menu.is_best_seller && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <Star className="w-3 h-3 fill-current" />
                        Best Seller
                      </div>
                    )}
                    {/* Hidden Badge */}
                    {menu.is_active === false && (
                      <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <EyeOff className="w-3 h-3" />
                        Hidden
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`aspect-video bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center relative ${menu.is_active === false ? 'opacity-50 grayscale' : ''}`}>
                    <FileText className="w-16 h-16 text-white/50" />
                    {/* Best Seller Badge */}
                    {menu.is_best_seller && (
                      <div className="absolute top-2 right-2 bg-white text-orange-500 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <Star className="w-3 h-3 fill-current" />
                        Best Seller
                      </div>
                    )}
                    {/* Hidden Badge */}
                    {menu.is_active === false && (
                      <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <EyeOff className="w-3 h-3" />
                        Hidden
                      </div>
                    )}
                  </div>
                )}

                {/* Active Toggle - Top Bar */}
                <div className={`flex items-center justify-between px-4 py-2 ${menu.is_active !== false ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2">
                    {menu.is_active !== false ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${menu.is_active !== false ? 'text-green-600' : 'text-red-500'}`}>
                      {menu.is_active !== false ? 'Visible on menu' : 'Hidden from menu'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleActive(menu)}
                    disabled={toggling === menu.menu_id}
                    className="focus:outline-none"
                    title={menu.is_active !== false ? 'Click to hide' : 'Click to show'}
                  >
                    {toggling === menu.menu_id ? (
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    ) : menu.is_active !== false ? (
                      <ToggleRight className="w-8 h-8 text-green-500 hover:text-green-600 transition-colors" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-red-400 hover:text-red-500 transition-colors" />
                    )}
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Name */}
                  <h3 className="font-bold text-xl text-gray-900 mb-2 truncate">
                    {menu.nameEn || menu.name}
                  </h3>
                  {menu.nameEn && menu.name !== menu.nameEn && (
                    <p className="text-sm text-gray-600 mb-3">{menu.name}</p>
                  )}

                  {/* Description */}
                  {menu.descriptionEn && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {menu.descriptionEn}
                    </p>
                  )}

                  {/* Price & Category */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-orange-600">
                      ${menu.price} <span className="text-sm">NZD</span>
                    </div>
                    <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                      {menu.categoryEn || menu.category}
                    </span>
                  </div>

                  {/* Add-ons count */}
                  {menu.addOns && menu.addOns.length > 0 && (
                    <div className="text-xs text-gray-500 mb-4">
                      {menu.addOns.length} add-on{menu.addOns.length > 1 ? 's' : ''}
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center text-xs text-gray-500 mb-4">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(menu.created_at)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/restaurant/${restaurantSlug || restaurantId || menu.restaurant_id}`}
                      target="_blank"
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Public
                    </Link>
                    {(userRole === 'enterprise' || userRole === 'premium' || userRole === 'admin') && userRestaurants.length > 1 && (
                      <button
                        onClick={() => handleCopyMenu(menu)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors"
                        title="Copy to another restaurant"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(menu)}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors"
                      title="Edit menu item"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(menu.menu_id)}
                      disabled={deleting === menu.menu_id}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
                      title="Delete menu item"
                    >
                      {deleting === menu.menu_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {menus.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{menus.length}</div>
                <div className="text-sm text-gray-600">Total Menu Items</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {new Set(menus.map(m => m.category)).size}
                </div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {menus.reduce((sum, menu) => sum + (menu.addOns?.length || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Add-ons</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Edit Menu Item</h2>
              <button
                onClick={() => setEditing(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Image Preview */}
              {editForm.photo_url && (
                <div className="aspect-video overflow-hidden bg-gray-100 rounded-lg mb-4">
                  <img
                    src={editForm.photo_url}
                    alt="Menu item"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Name (Original) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name (Original)
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter menu item name"
                />
              </div>

              {/* Name (English) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name (English)
                </label>
                <input
                  type="text"
                  value={editForm.nameEn}
                  onChange={(e) => setEditForm({ ...editForm, nameEn: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter English name"
                />
              </div>

              {/* Description (Original) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Original)
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter description"
                />
              </div>

              {/* Description (English) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (English)
                </label>
                <textarea
                  value={editForm.descriptionEn}
                  onChange={(e) => setEditForm({ ...editForm, descriptionEn: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter English description"
                />
              </div>

              {/* Price and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price (NZD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Main Course"
                  />
                </div>
              </div>

              {/* Best Seller Checkbox */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_best_seller}
                    onChange={(e) => setEditForm({ ...editForm, is_best_seller: e.target.checked })}
                    className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500 focus:ring-2"
                  />
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-orange-500 fill-orange-500" />
                    <span className="font-semibold text-gray-900">Mark as Bestseller</span>
                  </div>
                </label>
                <p className="text-sm text-gray-600 mt-2 ml-8">
                  This item will be featured in the Bestseller category on your public menu
                </p>
              </div>

              {/* Image Change Section - Tabbed UI */}
              <div className="border-t pt-4 mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Change Image
                </label>

                {/* Tab Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setEditImageMode('upload')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                      editImageMode === 'upload'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditImageGallery(true)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Gallery
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditImageMode('generate')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                      editImageMode === 'generate'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Generate
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditImageMode('enhance')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                      editImageMode === 'enhance'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Wand2 className="w-4 h-4" />
                    AI Enhance
                  </button>
                  {restaurantLogo && (
                    <button
                      type="button"
                      onClick={() => setEditImageMode('logo')}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                        editImageMode === 'logo'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      Add Logo
                    </button>
                  )}
                </div>

                {/* Tab Content */}
                <div className="bg-gray-50 rounded-lg p-4">
                  {/* Upload Tab */}
                  {editImageMode === 'upload' && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditImageFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const dataUrl = reader.result as string;
                              setEditForm({ ...editForm, photo_url: dataUrl });
                              setOriginalImageUrl(dataUrl); // Update original for logo application
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white"
                      />
                      {editImageFile && (
                        <p className="text-sm text-green-600 mt-2">
                          New image selected: {editImageFile.name}
                        </p>
                      )}
                    </div>
                  )}

                  {/* AI Generate Tab */}
                  {editImageMode === 'generate' && (
                    <div className="space-y-3">
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Describe the dish (e.g., Pad Thai with shrimp, garnished with lime and peanuts)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                        rows={3}
                      />
                      <button
                        type="button"
                        onClick={handleEditGenerateImage}
                        disabled={generatingImage}
                        className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {generatingImage ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Generate Image
                          </>
                        )}
                      </button>
                      <p className="text-xs text-gray-500">
                        Uses AI to create a professional food image based on description
                      </p>
                    </div>
                  )}

                  {/* AI Enhance Tab */}
                  {editImageMode === 'enhance' && (
                    <div className="space-y-3">
                      {!editForm.photo_url ? (
                        <p className="text-sm text-amber-600">
                          Upload or select an image first to enhance
                        </p>
                      ) : (
                        <>
                          <textarea
                            value={enhancePrompt}
                            onChange={(e) => setEnhancePrompt(e.target.value)}
                            placeholder="Optional: Add instructions (e.g., Make it brighter, Add steam effect)"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                            rows={2}
                          />
                          <button
                            type="button"
                            onClick={handleEditEnhanceImage}
                            disabled={enhancingImage}
                            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {enhancingImage ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Enhancing...
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-4 h-4" />
                                Enhance Image
                              </>
                            )}
                          </button>
                        </>
                      )}
                      <p className="text-xs text-gray-500">
                        AI will improve lighting, colors, and composition
                      </p>
                    </div>
                  )}

                  {/* Add Logo Only Tab */}
                  {editImageMode === 'logo' && (
                    <div className="space-y-3">
                      {!editForm.photo_url ? (
                        <p className="text-sm text-amber-600">
                          Upload or select an image first to add logo
                        </p>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600 mb-3">
                            Add your restaurant logo to the current image without any AI modifications
                          </p>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Position</label>
                            <select
                              value={logoPosition}
                              onChange={(e) => setLogoPosition(e.target.value as any)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                            >
                              <option value="top-left">Top Left</option>
                              <option value="top-center">Top Center</option>
                              <option value="top-right">Top Right</option>
                              <option value="bottom-left">Bottom Left</option>
                              <option value="bottom-center">Bottom Center</option>
                              <option value="bottom-right">Bottom Right</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Logo Size</label>
                            <select
                              value={logoSize}
                              onChange={(e) => setLogoSize(e.target.value as any)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                            >
                              <option value="small">Small (12%)</option>
                              <option value="medium">Medium (18%) - Recommended</option>
                              <option value="large">Large (25%)</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleApplyLogoOnlyEdit}
                              disabled={applyingLogoOnly}
                              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {applyingLogoOnly ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Applying...
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="w-4 h-4" />
                                  Apply Logo
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (originalImageUrl) {
                                  setEditForm({ ...editForm, photo_url: originalImageUrl });
                                }
                              }}
                              disabled={!originalImageUrl}
                              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Remove logo and restore original image"
                            >
                              <X className="w-4 h-4" />
                              No Logo
                            </button>
                          </div>
                        </>
                      )}
                      <p className="text-xs text-gray-500">
                        Only adds logo - no image enhancement or modifications
                      </p>
                    </div>
                  )}

                  {/* Logo Overlay Option - Show for AI Generate/Enhance */}
                  {(editImageMode === 'generate' || editImageMode === 'enhance') && restaurantLogo && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <label className="flex items-center gap-2 cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          checked={logoOverlay}
                          onChange={(e) => setLogoOverlay(e.target.checked)}
                          className="w-4 h-4 rounded text-orange-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Add Restaurant Logo</span>
                      </label>
                      {logoOverlay && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Position</label>
                            <select
                              value={logoPosition}
                              onChange={(e) => setLogoPosition(e.target.value as any)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                            >
                              <option value="top-left">Top Left</option>
                              <option value="top-center">Top Center</option>
                              <option value="top-right">Top Right</option>
                              <option value="bottom-left">Bottom Left</option>
                              <option value="bottom-center">Bottom Center</option>
                              <option value="bottom-right">Bottom Right</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Logo Size</label>
                            <select
                              value={logoSize}
                              onChange={(e) => setLogoSize(e.target.value as any)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                            >
                              <option value="small">Small (12%)</option>
                              <option value="medium">Medium (18%) - Recommended</option>
                              <option value="large">Large (25%)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {uploadingImage && (
                  <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading image...
                  </p>
                )}
              </div>

              {/* Meats Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Add Meats (Choose Protein)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditForm({
                      ...editForm,
                      meats: [...editForm.meats, { name: '', nameEn: '', price: '0', is_available: true }]
                    })}
                    className="text-sm px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg"
                  >
                    + Add Meat
                  </button>
                </div>
                {editForm.meats.length > 0 ? (
                  <div className="space-y-2">
                    {editForm.meats.map((meat, idx) => (
                      <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg ${meat.is_available !== false ? 'bg-gray-50' : 'bg-red-50 border border-red-200'}`}>
                        {/* Availability Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            const newMeats = [...editForm.meats];
                            newMeats[idx].is_available = newMeats[idx].is_available === false ? true : false;
                            setEditForm({ ...editForm, meats: newMeats });
                          }}
                          className="flex-shrink-0"
                          title={meat.is_available !== false ? 'Click to mark as unavailable' : 'Click to mark as available'}
                        >
                          {meat.is_available !== false ? (
                            <ToggleRight className="w-6 h-6 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-red-400" />
                          )}
                        </button>
                        <input
                          type="text"
                          value={meat.name}
                          onChange={(e) => {
                            const newMeats = [...editForm.meats];
                            newMeats[idx].name = e.target.value;
                            setEditForm({ ...editForm, meats: newMeats });
                          }}
                          onBlur={(e) => handleMeatNameBlur(idx, e.target.value)}
                          placeholder="Name (e.g., หมู)"
                          className={`flex-1 px-3 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white ${meat.is_available === false ? 'opacity-50' : ''}`}
                        />
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={meat.nameEn || ''}
                            onChange={(e) => {
                              const newMeats = [...editForm.meats];
                              newMeats[idx].nameEn = e.target.value;
                              setEditForm({ ...editForm, meats: newMeats });
                            }}
                            placeholder={translatingMeatIdx === idx ? "Translating..." : "English (e.g., Pork)"}
                            className={`w-full px-3 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white ${translatingMeatIdx === idx ? 'bg-gray-100' : ''} ${meat.is_available === false ? 'opacity-50' : ''}`}
                            disabled={translatingMeatIdx === idx}
                          />
                          {translatingMeatIdx === idx && (
                            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-orange-500" />
                          )}
                        </div>
                        <input
                          type="text"
                          value={meat.price}
                          onChange={(e) => {
                            const newMeats = [...editForm.meats];
                            newMeats[idx].price = e.target.value;
                            setEditForm({ ...editForm, meats: newMeats });
                          }}
                          placeholder="Price (0=free)"
                          className={`w-24 px-3 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white ${meat.is_available === false ? 'opacity-50' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newMeats = editForm.meats.filter((_, i) => i !== idx);
                            setEditForm({ ...editForm, meats: newMeats });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No meats added. Click "+ Add Meat" to add options.</p>
                )}
                <p className="text-xs text-gray-400 mt-2">Toggle switch to mark meat as unavailable (e.g., out of stock)</p>
              </div>

              {/* Add-ons Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Add-ons (Extra Toppings)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditForm({
                      ...editForm,
                      addOns: [...editForm.addOns, { name: '', nameEn: '', price: '', is_available: true }]
                    })}
                    className="text-sm px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg"
                  >
                    + Add Add-on
                  </button>
                </div>
                {editForm.addOns.length > 0 ? (
                  <div className="space-y-2">
                    {editForm.addOns.map((addon, idx) => (
                      <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg ${addon.is_available !== false ? 'bg-gray-50' : 'bg-red-50 border border-red-200'}`}>
                        {/* Availability Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            const newAddOns = [...editForm.addOns];
                            newAddOns[idx].is_available = newAddOns[idx].is_available === false ? true : false;
                            setEditForm({ ...editForm, addOns: newAddOns });
                          }}
                          className="flex-shrink-0"
                          title={addon.is_available !== false ? 'Click to mark as unavailable' : 'Click to mark as available'}
                        >
                          {addon.is_available !== false ? (
                            <ToggleRight className="w-6 h-6 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-red-400" />
                          )}
                        </button>
                        <input
                          type="text"
                          value={addon.name}
                          onChange={(e) => {
                            const newAddOns = [...editForm.addOns];
                            newAddOns[idx].name = e.target.value;
                            setEditForm({ ...editForm, addOns: newAddOns });
                          }}
                          onBlur={(e) => handleAddOnNameBlur(idx, e.target.value)}
                          placeholder="Name (e.g., ไข่ดาว)"
                          className={`flex-1 px-3 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white ${addon.is_available === false ? 'opacity-50' : ''}`}
                        />
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={addon.nameEn || ''}
                            onChange={(e) => {
                              const newAddOns = [...editForm.addOns];
                              newAddOns[idx].nameEn = e.target.value;
                              setEditForm({ ...editForm, addOns: newAddOns });
                            }}
                            placeholder={translatingAddOnIdx === idx ? "Translating..." : "English (e.g., Fried Egg)"}
                            className={`w-full px-3 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white ${translatingAddOnIdx === idx ? 'bg-gray-100' : ''} ${addon.is_available === false ? 'opacity-50' : ''}`}
                            disabled={translatingAddOnIdx === idx}
                          />
                          {translatingAddOnIdx === idx && (
                            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-orange-500" />
                          )}
                        </div>
                        <input
                          type="text"
                          value={addon.price}
                          onChange={(e) => {
                            const newAddOns = [...editForm.addOns];
                            newAddOns[idx].price = e.target.value;
                            setEditForm({ ...editForm, addOns: newAddOns });
                          }}
                          placeholder="Price"
                          className={`w-24 px-3 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white ${addon.is_available === false ? 'opacity-50' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newAddOns = editForm.addOns.filter((_, i) => i !== idx);
                            setEditForm({ ...editForm, addOns: newAddOns });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No add-ons added. Click "+ Add Add-on" to add extras.</p>
                )}
                <p className="text-xs text-gray-400 mt-2">Toggle switch to mark add-on as unavailable (e.g., out of stock)</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Menu Modal */}
      {copyingMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">Copy Menu to Branch</h2>
              <button
                onClick={() => setCopyingMenu(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Menu Info */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 mb-1">
                  {copyingMenu.nameEn || copyingMenu.name}
                </p>
                <p className="text-sm text-gray-600">{copyingMenu.categoryEn || copyingMenu.category}</p>
              </div>

              {/* Target Restaurant Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Target Restaurant
                </label>
                <select
                  value={selectedTargetRestaurant}
                  onChange={(e) => setSelectedTargetRestaurant(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Choose a restaurant...</option>
                  {userRestaurants
                    .filter(r => r.id !== restaurantId) // Exclude current restaurant
                    .map(restaurant => (
                      <option key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </option>
                    ))}
                </select>
              </div>

              {userRestaurants.filter(r => r.id !== restaurantId).length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    You don't have any other restaurants to copy this menu to.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setCopyingMenu(null)}
                className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
                disabled={copying}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCopy}
                disabled={copying || !selectedTargetRestaurant}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                {copying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Copying...
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Menu
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Image Gallery Modal */}
      {showEditImageGallery && userId && restaurantId && (
        <ImageGallery
          userId={userId}
          currentRestaurantId={restaurantId}
          allowCrossRestaurant={true}
          onSelectImage={(imageUrl) => {
            setEditForm({ ...editForm, photo_url: imageUrl });
            setOriginalImageUrl(imageUrl); // Update original for logo application
            setEditImageFile(null);
            setShowEditImageGallery(false);
          }}
          onClose={() => setShowEditImageGallery(false)}
        />
      )}
    </div>
  );
}

