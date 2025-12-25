'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, Users, Utensils, Truck, Store, Plus, Trash2, Edit2, Save, X, Loader2, Globe, ExternalLink, MapPin, Navigation, CreditCard, Building2, QrCode } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface ServiceOptions {
  dine_in: boolean;
  pickup: boolean;
  delivery: boolean;
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

interface DeliveryRate {
  id: string;
  distance_km: number;
  price: number;
}

interface DeliverySettings {
  pricing_mode: 'tier' | 'per_km';  // tier = ตามระยะทาง, per_km = ต่อกิโลเมตร
  price_per_km: number;             // ราคาต่อกิโลเมตร
  base_fee: number;                 // ค่าส่งขั้นต่ำ
  max_distance_km: number;          // ระยะทางสูงสุดที่จัดส่ง
  free_delivery_above: number;      // ส่งฟรีเมื่อยอดสั่งซื้อเกิน (0 = ไม่มี)
}

interface Staff {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'owner' | 'manager' | 'chef' | 'waiter' | 'cashier';
  pin_code?: string;
  is_active: boolean;
  created_at?: string;
}

interface Restaurant {
  restaurant_id: string;
  id?: string; // Alternative field name from some API responses
  name: string;
  phone: string;
  email: string;
  address: string;
  logo_url: string | null;
  theme_color: string;
  cover_image_url: string | null;
  menu_template?: string;
  service_options?: ServiceOptions;
  delivery_rates?: DeliveryRate[];
}

interface Subscription {
  plan: string;
  status: string;
  is_subscribed: boolean;
  trial_days_remaining: number;
  current_period_end: string | null;
  next_billing_date: string | null;
  cancel_at_period_end: boolean;
  role?: string; // User role from some API responses
}

interface UserProfile {
  user_id: string;
  restaurant: Restaurant;
  subscription: Subscription;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';

  const [activeTab, setActiveTab] = useState<'profile' | 'services' | 'staff' | 'payments' | 'billing'>(initialTab as any);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    theme_color: '#000000',
    menu_template: 'grid',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('free_trial');

  // Service Options state
  const [serviceOptions, setServiceOptions] = useState<ServiceOptions>({
    dine_in: true,
    pickup: true,
    delivery: true
  });

  // Delivery Rates state
  const [deliveryRates, setDeliveryRates] = useState<DeliveryRate[]>([]);
  const [editingRate, setEditingRate] = useState<DeliveryRate | null>(null);
  const [newRate, setNewRate] = useState({ distance_km: '', price: '' });
  const [showAddRate, setShowAddRate] = useState(false);

  // Delivery Settings state (per-km pricing)
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({
    pricing_mode: 'per_km',
    price_per_km: 1.50,
    base_fee: 3.00,
    max_distance_km: 15,
    free_delivery_above: 0
  });

  // Restaurant Location state (for delivery distance calculation)
  const [restaurantLocation, setRestaurantLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    address: string;
  }>({ latitude: null, longitude: null, address: '' });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Restaurant Primary Language (for translating customer messages)
  const [primaryLanguage, setPrimaryLanguage] = useState<string>('th');
  const AVAILABLE_LANGUAGES = [
    { code: 'th', name: 'ไทย (Thai)', flag: '🇹🇭' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'zh', name: '中文 (Chinese)', flag: '🇨🇳' },
    { code: 'ja', name: '日本語 (Japanese)', flag: '🇯🇵' },
    { code: 'ko', name: '한국어 (Korean)', flag: '🇰🇷' },
    { code: 'vi', name: 'Tiếng Việt (Vietnamese)', flag: '🇻🇳' },
    { code: 'hi', name: 'हिंदी (Hindi)', flag: '🇮🇳' },
    { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' },
    { code: 'fr', name: 'Français (French)', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch (German)', flag: '🇩🇪' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
  ];

  // Staff Management state
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'waiter' as Staff['role'],
    pin_code: ''
  });

  // Payment Settings state
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    accept_card: true,
    accept_bank_transfer: false,
    bank_accounts: []
  });
  const [savingPayment, setSavingPayment] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  const [newBankAccount, setNewBankAccount] = useState<BankAccount>({
    bank_name: '',
    account_name: '',
    account_number: ''
  });

  // Image optimization helper
  const optimizeImage = async (file: File, maxSize: number = 512): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        let width = img.width;
        let height = img.height;
        
        // Resize to max size (maintain aspect ratio)
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to WebP (quality 85)
        canvas.toBlob((blob) => {
          if (blob) {
            console.log(`✅ Image optimized: ${file.size / 1024}KB → ${blob.size / 1024}KB`);
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image to WebP'));
          }
        }, 'image/webp', 0.85);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      // Get user_id from Supabase auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ Settings: No session found');
        return;
      }
      const userId = session.user.id;
      console.log('✅ Settings: Loading profile for user:', userId);
      
      const response = await fetch(`${BACKEND_URL}/api/user/profile?user_id=${userId}`, {
        cache: 'no-store', // Always fetch fresh data
      });
      const data = await response.json();
      
      console.log('✅ Settings: Profile loaded:', data);
      
      if (data.success) {
        setProfile(data);
        // Update userRole from profile if available
        if (data.subscription?.role) {
          console.log('✅ Settings: Setting role from profile:', data.subscription.role);
          setUserRole(data.subscription.role);
          localStorage.setItem('user_role', data.subscription.role);
        }
      }
    } catch (error) {
      console.error('❌ Settings: Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserRole = useCallback(async () => {
    try {
      // Get user_id from Supabase auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ Settings: No session found');
        setUserRole('free_trial');
        return;
      }
      const userId = session.user.id;
      console.log('✅ Settings: Loading role for user:', userId);
      
      const response = await fetch(`${BACKEND_URL}/api/user/role?user_id=${userId}`, {
        cache: 'no-store', // Always fetch fresh data
      });
      const data = await response.json();
      if (data.success) {
        console.log('✅ Settings: User role loaded:', data.role);
        setUserRole(data.role);
        localStorage.setItem('user_role', data.role);
      } else {
        console.warn('⚠️ Settings: Failed to load role, using default');
        setUserRole('admin'); // Default to admin for testing
      }
    } catch (error) {
      console.error('❌ Settings: Failed to load user role:', error);
      // Default to admin for testing
      setUserRole('admin');
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadUserRole();
  }, [loadProfile, loadUserRole]);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.restaurant.name || '',
        phone: profile.restaurant.phone || '',
        email: profile.restaurant.email || '',
        address: profile.restaurant.address || '',
        theme_color: profile.restaurant.theme_color || '#000000',
        menu_template: profile.restaurant.menu_template || 'grid',
      });
      setLogoPreview(profile.restaurant.logo_url);
      setBannerPreview(profile.restaurant.cover_image_url);

      // Load service options
      if (profile.restaurant.service_options) {
        setServiceOptions(profile.restaurant.service_options);
      }

      // Load delivery rates
      if ((profile.restaurant as any).delivery_rates) {
        setDeliveryRates((profile.restaurant as any).delivery_rates);
      }

      // Load delivery settings (per-km pricing)
      if ((profile.restaurant as any).delivery_settings) {
        setDeliverySettings((profile.restaurant as any).delivery_settings);
      }

      // Load primary language
      if ((profile.restaurant as any).primary_language) {
        setPrimaryLanguage((profile.restaurant as any).primary_language);
      }

      // Load restaurant location
      loadRestaurantLocation(profile.restaurant.restaurant_id);

      // Load staff list
      loadStaff(profile.restaurant.restaurant_id);

      // Load payment settings
      loadPaymentSettings(profile.restaurant.restaurant_id);
    }
  }, [profile]);

  // ============================================================
  // Restaurant Location Functions (for Delivery Distance Calculation)
  // ============================================================

  const loadRestaurantLocation = async (restaurantId: string) => {
    if (!restaurantId) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/restaurant/${restaurantId}/location`);
      const data = await response.json();
      if (data.success && data.location) {
        setRestaurantLocation({
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          address: data.location.address || ''
        });
      }
    } catch (error) {
      console.error('Failed to load restaurant location:', error);
    }
  };

  const updateRestaurantLocation = async () => {
    if (!profile?.restaurant?.restaurant_id) return;

    // Validate - need either address or coordinates
    if (!restaurantLocation.address && (!restaurantLocation.latitude || !restaurantLocation.longitude)) {
      setLocationError('กรุณากรอกที่อยู่ร้านหรือพิกัด');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/restaurant/update-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: profile.restaurant.restaurant_id,
          address: restaurantLocation.address || undefined,
          latitude: restaurantLocation.latitude || undefined,
          longitude: restaurantLocation.longitude || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setRestaurantLocation({
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          address: restaurantLocation.address
        });
        alert('บันทึกพิกัดร้านสำเร็จ!');
      } else {
        setLocationError(data.detail || 'ไม่สามารถบันทึกพิกัดได้');
      }
    } catch (error) {
      console.error('Failed to update restaurant location:', error);
      setLocationError('เกิดข้อผิดพลาดในการบันทึกพิกัด');
    } finally {
      setLocationLoading(false);
    }
  };

  // ============================================================
  // Payment Settings Functions
  // ============================================================

  const loadPaymentSettings = async (restaurantId: string) => {
    if (!restaurantId) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/restaurant/${restaurantId}/payment-settings`);
      const data = await response.json();
      if (data.success && data.payment_settings) {
        setPaymentSettings(data.payment_settings);
      }
    } catch (error) {
      console.error('Failed to load payment settings:', error);
    }
  };

  const savePaymentSettings = async () => {
    if (!profile?.restaurant?.restaurant_id) return;

    // Validate: at least one payment method must be enabled
    if (!paymentSettings.accept_card && !paymentSettings.accept_bank_transfer) {
      alert('ต้องเปิดใช้งานอย่างน้อย 1 วิธีการชำระเงิน');
      return;
    }

    // Validate: if bank transfer enabled, must have at least one bank account
    if (paymentSettings.accept_bank_transfer && paymentSettings.bank_accounts.length === 0) {
      alert('กรุณาเพิ่มบัญชีธนาคารอย่างน้อย 1 บัญชี');
      return;
    }

    setSavingPayment(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/restaurant/${profile.restaurant.restaurant_id}/payment-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentSettings)
      });

      const data = await response.json();
      if (data.success) {
        alert('บันทึกการตั้งค่าการชำระเงินสำเร็จ');
      } else {
        alert(data.detail || 'Failed to save payment settings');
      }
    } catch (error) {
      console.error('Failed to save payment settings:', error);
      alert('Failed to save payment settings');
    } finally {
      setSavingPayment(false);
    }
  };

  const addBankAccount = () => {
    if (!newBankAccount.bank_name || !newBankAccount.account_name || !newBankAccount.account_number) {
      alert('กรุณากรอกข้อมูลบัญชีธนาคารให้ครบถ้วน');
      return;
    }

    setPaymentSettings({
      ...paymentSettings,
      bank_accounts: [...paymentSettings.bank_accounts, { ...newBankAccount }]
    });

    setNewBankAccount({ bank_name: '', account_name: '', account_number: '' });
    setShowAddBank(false);
  };

  const removeBankAccount = (index: number) => {
    const newAccounts = paymentSettings.bank_accounts.filter((_, i) => i !== index);
    setPaymentSettings({
      ...paymentSettings,
      bank_accounts: newAccounts
    });
  };

  // ============================================================
  // Staff Management Functions
  // ============================================================

  const loadStaff = async (restaurantId: string) => {
    if (!restaurantId) return;
    setLoadingStaff(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/staff/list?restaurant_id=${restaurantId}`);
      const data = await response.json();
      if (data.success) {
        setStaffList(data.staff || []);
      }
    } catch (error) {
      console.error('Failed to load staff:', error);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleAddStaff = async () => {
    if (!profile?.restaurant?.restaurant_id || !newStaff.name) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${BACKEND_URL}/api/staff/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: profile.restaurant.restaurant_id,
          user_id: session.user.id,
          name: newStaff.name,
          email: newStaff.email || null,
          phone: newStaff.phone || null,
          role: newStaff.role,
          pin_code: newStaff.pin_code || null
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('พนักงานถูกเพิ่มเรียบร้อย!');
        setShowAddStaff(false);
        setNewStaff({ name: '', email: '', phone: '', role: 'waiter', pin_code: '' });
        loadStaff(profile.restaurant.restaurant_id);
      } else {
        alert(data.detail || 'Failed to add staff');
      }
    } catch (error) {
      console.error('Failed to add staff:', error);
      alert('Failed to add staff');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStaff = async (staffId: string, updates: Partial<Staff>) => {
    if (!profile?.restaurant?.restaurant_id) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${BACKEND_URL}/api/staff/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.user.id,
          ...updates
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('อัปเดตข้อมูลพนักงานเรียบร้อย!');
        setEditingStaff(null);
        loadStaff(profile.restaurant.restaurant_id);
      }
    } catch (error) {
      console.error('Failed to update staff:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบพนักงานคนนี้?')) return;
    if (!profile?.restaurant?.restaurant_id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${BACKEND_URL}/api/staff/${staffId}?user_id=${session.user.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        alert('ลบพนักงานเรียบร้อย!');
        loadStaff(profile.restaurant.restaurant_id);
      }
    } catch (error) {
      console.error('Failed to delete staff:', error);
    }
  };

  // ============================================================
  // Service Options Functions
  // ============================================================

  const handleSaveServiceOptions = async () => {
    if (!profile?.restaurant?.restaurant_id) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${BACKEND_URL}/api/restaurant/service-options`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: profile.restaurant.restaurant_id,
          user_id: session.user.id,
          service_options: serviceOptions,
          primary_language: primaryLanguage,
          delivery_rates: deliveryRates,
          delivery_settings: deliverySettings
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('บันทึกตัวเลือกบริการเรียบร้อย!');
      } else {
        alert(data.detail || 'Failed to save service options');
      }
    } catch (error) {
      console.error('Failed to save service options:', error);
      alert('Failed to save service options');
    } finally {
      setSaving(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      owner: 'เจ้าของร้าน (Owner)',
      manager: 'ผู้จัดการ (Manager)',
      chef: 'พ่อครัว (Chef)',
      waiter: 'พนักงานเสิร์ฟ (Waiter)',
      cashier: 'แคชเชียร์ (Cashier)'
    };
    return roleNames[role] || role;
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      // Get user_id from Supabase auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please login first');
        return;
      }
      const userId = session.user.id;
      
      // Get restaurant_id from profile
      const restaurantId = profile?.restaurant?.restaurant_id || profile?.restaurant?.id;
      if (!restaurantId) {
        alert('Restaurant ID not found. Please refresh the page and try again.');
        setSaving(false);
        return;
      }
      
      console.log('💾 Saving profile:', {
        restaurant_id: restaurantId,
        user_id: userId,
        formData: formData
      });
      
      const response = await fetch(`${BACKEND_URL}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          user_id: userId,
          name: formData.name || undefined,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          address: formData.address || undefined,
          theme_color: formData.theme_color || undefined,
          menu_template: formData.menu_template || undefined,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.detail?.message || data.detail || 'Failed to update profile';
        alert(errorMsg);
        console.error('Profile update error:', data);
        return;
      }
      
      if (data.success) {
        alert('Profile updated successfully!');
        // Refresh profile to get updated data
        await loadProfile();
      } else {
        const errorMsg = data.detail?.message || data.detail || 'Failed to update profile';
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      const errorMsg = error.message || 'Failed to save profile. Please check your connection and try again.';
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setSaving(true);
      // Get user_id from Supabase auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please login first');
        return;
      }
      const userId = session.user.id;
      
      // Optimize image before upload (resize + WebP)
      console.log(`🔧 Optimizing logo: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      const optimizedBlob = await optimizeImage(file, 512);
      const optimizedFile = new File([optimizedBlob], 'logo.webp', { type: 'image/webp' });
      console.log(`✅ Logo optimized: ${(optimizedFile.size / 1024).toFixed(2)} KB`);
      
      const formData = new FormData();
      formData.append('restaurant_id', profile?.restaurant.restaurant_id || '');
      formData.append('file', optimizedFile);
      formData.append('user_id', userId);
      
      const response = await fetch(`${BACKEND_URL}/api/customization/logo`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.detail?.message || data.detail || 'Failed to upload logo';
        alert(errorMsg);
        console.error('Logo upload error:', data);
        return;
      }
      
      if (data.success) {
        alert('Logo uploaded successfully!');
        // Refresh profile to get updated logo URL
        await loadProfile();
        // Clear preview
        setLogoFile(null);
        setLogoPreview(null);
      } else {
        const errorMsg = data.detail?.message || data.detail || 'Failed to upload logo';
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error('Failed to upload logo:', error);
      const errorMsg = error.message || 'Failed to upload logo. Please check your connection and try again.';
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleBannerUpload = async (file: File) => {
    try {
      setSaving(true);
      // Get user_id from Supabase auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please login first');
        return;
      }
      const userId = session.user.id;
      
      // Optimize banner image before upload (resize to 1920x1080 max + WebP)
      console.log(`🔧 Optimizing banner: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      const optimizedBlob = await optimizeImage(file, 1920);
      const optimizedFile = new File([optimizedBlob], 'banner.webp', { type: 'image/webp' });
      console.log(`✅ Banner optimized: ${(optimizedFile.size / 1024).toFixed(2)} KB`);
      
      const formData = new FormData();
      formData.append('restaurant_id', profile?.restaurant.restaurant_id || '');
      formData.append('file', optimizedFile);
      formData.append('user_id', userId);
      
      const response = await fetch(`${BACKEND_URL}/api/customization/cover-image`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.detail?.message || data.detail || 'Failed to upload banner';
        alert(errorMsg);
        console.error('Banner upload error:', data);
        return;
      }
      
      if (data.success) {
        alert('Banner uploaded successfully!');
        // Refresh profile to get updated banner URL
        await loadProfile();
        // Clear preview
        setBannerFile(null);
        setBannerPreview(null);
      } else {
        const errorMsg = data.detail?.message || data.detail || 'Failed to upload banner';
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error('Failed to upload banner:', error);
      const errorMsg = error.message || 'Failed to upload banner. Please check your connection and try again.';
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      // Get user_id from Supabase auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please login first');
        return;
      }
      const userId = session.user.id;
      
      // TODO: Get customer_id from subscription data
      const customerId = 'cus_xxx'; // Replace with actual Stripe Customer ID
      
      const response = await fetch(`${BACKEND_URL}/api/billing/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          customer_id: customerId,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.portal_url) {
        window.location.href = data.portal_url;
      } else {
        alert('Failed to create portal session');
      }
    } catch (error) {
      console.error('Failed to create portal session:', error);
      alert('Failed to open billing portal');
    }
  };

  const handleRoleChange = useCallback(async (newRole: string) => {
    try {
      setSaving(true);
      // Get user_id from Supabase auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please login first');
        return;
      }
      const userId = session.user.id;
      
      const response = await fetch(`${BACKEND_URL}/api/user/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          role: newRole,
          admin_user_id: userId, // Admin changing their own role
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setUserRole(newRole);
        console.log('✅ Settings: Role changed to:', newRole);
        
        // Update localStorage to trigger Dashboard refresh
        localStorage.setItem('user_role', newRole);
        localStorage.setItem('user_role_changed', Date.now().toString());
        
        // Trigger custom event for same-tab sync
        window.dispatchEvent(new CustomEvent('userRoleChanged', {
          detail: { role: newRole }
        }));
        
        // Trigger storage event for cross-tab sync
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'user_role_changed',
          newValue: Date.now().toString()
        }));
        
        alert(`Package changed to ${newRole === 'admin' ? 'Admin' :
               newRole === 'enterprise' ? 'Enterprise' :
               newRole === 'professional' ? 'Professional' :
               newRole === 'starter' ? 'Starter' :
               'Free Trial'} successfully!`);
        
        // Reload profile to get updated limits
        await loadProfile();
        await loadUserRole();
        
        // Redirect to Dashboard to see changes
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        alert(data.error || 'Failed to change package');
      }
    } catch (error) {
      console.error('Failed to change role:', error);
      alert('Failed to change package');
    } finally {
      setSaving(false);
    }
  }, [loadProfile]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getPlanDisplayName = (plan: string) => {
    const planNames: Record<string, string> = {
      trial: 'Free Trial',
      free_trial: 'Free Trial',
      starter: 'Starter',
      pro: 'Professional',
      professional: 'Professional',
      premium: 'Enterprise',
      enterprise: 'Enterprise',
      admin: 'Admin',
    };
    return planNames[plan] || plan;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      active: { text: '✅ Active', className: 'bg-green-100 text-green-800' },
      trial: { text: '🆓 Trial', className: 'bg-blue-100 text-blue-800' },
      expired: { text: '❌ Expired', className: 'bg-red-100 text-red-800' },
      canceled: { text: '⚠️ Canceled', className: 'bg-yellow-100 text-yellow-800' },
      past_due: { text: '⚠️ Past Due', className: 'bg-orange-100 text-orange-800' },
    };
    
    const badge = badges[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  // Check permissions based on role (not just subscription plan)
  const roleForPermissions = userRole || profile?.subscription?.role || profile?.subscription?.plan || 'free_trial';
  const canCustomizeTheme = !['free_trial', 'starter'].includes(roleForPermissions);
  const canUploadBanner = ['enterprise', 'admin'].includes(roleForPermissions);
  const isAdmin = userRole === 'admin' || roleForPermissions === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Header */}
        <div className="mb-6">
          <a
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
          >
            ← Back to Dashboard
          </a>
        </div>
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <div className="flex items-center space-x-4">
            {/* View Menu Button */}
            {profile?.restaurant?.restaurant_id && (
              <a
                href={`/restaurant/${profile.restaurant.restaurant_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View Menu
              </a>
            )}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Role:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                userRole === 'admin' ? 'bg-red-100 text-red-800' :
                userRole === 'enterprise' ? 'bg-indigo-100 text-indigo-800' :
                userRole === 'professional' ? 'bg-purple-100 text-purple-800' :
                userRole === 'starter' ? 'bg-gray-100 text-gray-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {userRole === 'admin' ? 'Admin' :
                 userRole === 'enterprise' ? 'Enterprise' :
                 userRole === 'professional' ? 'Professional' :
                 userRole === 'starter' ? 'Starter' :
                 'Free Trial'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {['enterprise', 'premium', 'admin'].includes(roleForPermissions) && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">🏢 Multi-Restaurant Management</h3>
                <p className="text-xs text-gray-600">Manage multiple restaurant branches</p>
                {/* Currently Selected Branch */}
                {profile?.restaurant?.name && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">สาขาที่เลือก:</span>
                    <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                      {profile.restaurant.name}
                    </span>
                  </div>
                )}
              </div>
              <a
                href="/dashboard/settings/restaurants"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors text-sm"
              >
                Manage Branches →
              </a>
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile & Branding
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'services'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Utensils className="w-4 h-4" />
              Service Options
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'staff'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4" />
              Staff Management
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Payment Settings
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'billing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Subscription & Billing
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Restaurant Information</h2>

            {/* Basic Info Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>

            {/* Branding Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Branding</h2>

              {/* Theme Color */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Theme Color
                  </label>
                  {!canCustomizeTheme && (
                    <span className="text-xs text-gray-500">🔒 Upgrade to Pro or Premium</span>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="color"
                    value={formData.theme_color}
                    onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                    disabled={!canCustomizeTheme}
                    className={`h-10 w-20 border border-gray-300 rounded cursor-pointer ${
                      !canCustomizeTheme ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                  <input
                    type="text"
                    value={formData.theme_color}
                    onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                    disabled={!canCustomizeTheme}
                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white ${
                      !canCustomizeTheme ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''
                    }`}
                  />
                  {/* Preview */}
                  <div
                    className="w-16 h-10 rounded border border-gray-300"
                    style={{ backgroundColor: formData.theme_color }}
                  />
                </div>
              </div>

              {/* Menu Template */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Menu Template
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { id: 'list', name: 'Classic List', emoji: '📋', desc: 'Simple list view with descriptions' },
                    { id: 'grid', name: 'Grid View', emoji: '🔲', desc: 'Card-based grid layout' },
                    { id: 'magazine', name: 'Magazine', emoji: '📰', desc: 'Best sellers featured prominently' },
                    { id: 'elegant', name: 'Elegant', emoji: '✨', desc: 'Sophisticated restaurant style' },
                    { id: 'casual', name: 'Casual', emoji: '🎨', desc: 'Fun and colorful design' },
                  ].map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, menu_template: template.id })}
                      className={`p-4 border-2 rounded-xl transition-all text-left ${
                        formData.menu_template === template.id
                          ? 'border-orange-500 bg-orange-50 shadow-lg'
                          : 'border-gray-300 hover:border-orange-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{template.emoji}</div>
                      <div className="font-semibold text-sm text-gray-900 mb-1">
                        {template.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {template.desc}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Choose how your menu appears to customers
                </p>
              </div>

              {/* Logo Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  📏 Recommended: 200x200px to 500x500px, Max 4MB (PNG, JPG, WebP)
                </p>
                <div className="flex items-center space-x-4">
                  {logoPreview && (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-20 h-20 object-cover rounded border border-gray-300"
                      />
                      <button
                        onClick={() => {
                          setLogoPreview(null);
                          setLogoFile(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                        title="Remove logo"
                      >
                        <span className="text-xs font-bold">×</span>
                      </button>
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Check file size (4MB)
                          const maxSize = 4 * 1024 * 1024; // 4MB
                          if (file.size > maxSize) {
                            alert(`File is too large. Maximum size is 4MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
                            e.target.value = ''; // Clear input
                            return;
                          }
                          setLogoFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setLogoPreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-sm text-gray-900 bg-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {logoFile && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 mb-1">
                          File: {logoFile.name} ({(logoFile.size / 1024).toFixed(2)} KB)
                        </p>
                        <button
                          onClick={() => handleLogoUpload(logoFile)}
                          disabled={saving}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? 'Uploading...' : 'Upload Logo'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Banner Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Banner / Cover Image
                  </label>
                  {!canUploadBanner && (
                    <span className="text-xs text-gray-500">🔒 Enterprise / Admin only</span>
                  )}
                </div>
                {canUploadBanner ? (
                  <>
                    <p className="text-xs text-gray-500 mb-2">
                      📏 Recommended: 1200x400px to 1920x600px, Max 4MB (PNG, JPG, WebP)
                    </p>
                    <div className="flex items-center space-x-4">
                      {bannerPreview && (
                        <img
                          src={bannerPreview}
                          alt="Banner preview"
                          className="w-32 h-20 object-cover rounded border border-gray-300"
                        />
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Check file size (4MB)
                              const maxSize = 4 * 1024 * 1024; // 4MB
                              if (file.size > maxSize) {
                                alert(`File is too large. Maximum size is 4MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
                                e.target.value = ''; // Clear input
                                return;
                              }
                              setBannerFile(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setBannerPreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="text-sm text-gray-900 bg-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {bannerFile && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 mb-1">
                              File: {bannerFile.name} ({(bannerFile.size / 1024).toFixed(2)} KB)
                            </p>
                            <button
                              onClick={() => handleBannerUpload(bannerFile)}
                              disabled={saving}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {saving ? 'Uploading...' : 'Upload Banner'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">
                      Upgrade to Enterprise to upload custom banner images
                    </p>
                    <a href="/pricing" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm inline-block">
                      Upgrade to Enterprise
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Role Management Section */}
            {isAdmin && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Shield className="w-6 h-6 mr-2 text-red-500" />
                  Admin: Change Package/Role
                </h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ As an admin, you can change your package/role to test different features. Changes take effect immediately.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Package/Role
                    </label>
                    <select
                      value={userRole}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setUserRole(newRole);
                        handleRoleChange(newRole);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    >
                      <option value="free_trial">Free Trial</option>
                      <option value="starter">Starter</option>
                      <option value="professional">Professional</option>
                      <option value="enterprise">Enterprise</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Current Role:</strong> {userRole === 'admin' ? 'Admin' :
                         userRole === 'enterprise' ? 'Enterprise' :
                         userRole === 'professional' ? 'Professional' :
                         userRole === 'starter' ? 'Starter' :
                         'Free Trial'}
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      Changing your role allows you to test different package features and limits.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Utensils className="w-6 h-6 text-orange-500" />
              Service Options
            </h2>
            <p className="text-gray-600 mb-6">
              เลือกประเภทบริการที่ต้องการเปิดให้ลูกค้า เมื่อปิดบริการใด ลูกค้าจะไม่สามารถเลือกได้ในหน้าสั่งอาหาร
            </p>

            <div className="space-y-4">
              {/* Dine-in Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-orange-300 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Utensils className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">กินที่ร้าน (Dine-in)</h3>
                    <p className="text-sm text-gray-500">ลูกค้าสามารถสั่งอาหารและนั่งทานที่ร้านได้</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serviceOptions.dine_in}
                    onChange={(e) => setServiceOptions({...serviceOptions, dine_in: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              {/* Pickup Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Store className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">รับเอง (Pickup)</h3>
                    <p className="text-sm text-gray-500">ลูกค้าสั่งล่วงหน้าและมารับที่ร้าน</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serviceOptions.pickup}
                    onChange={(e) => setServiceOptions({...serviceOptions, pickup: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>

              {/* Delivery Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-green-300 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Truck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">ส่ง Delivery</h3>
                    <p className="text-sm text-gray-500">ลูกค้าสั่งอาหารและให้ร้านจัดส่ง</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serviceOptions.delivery}
                    onChange={(e) => setServiceOptions({...serviceOptions, delivery: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              {/* Restaurant Location Section - Only show when delivery is enabled */}
              {serviceOptions.delivery && (
                <div className="mt-4 ml-16 p-4 bg-blue-50 rounded-xl border border-blue-200 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    พิกัดร้าน (สำหรับคำนวณระยะทาง)
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    กรอกที่อยู่ร้านเพื่อใช้คำนวณระยะทางและค่าส่งอัตโนมัติ
                  </p>

                  {/* Current Location Status */}
                  {restaurantLocation.latitude && restaurantLocation.longitude ? (
                    <div className="flex items-center gap-2 p-3 bg-green-100 rounded-lg mb-4">
                      <Navigation className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-800">
                        พิกัดปัจจุบัน: {restaurantLocation.latitude.toFixed(6)}, {restaurantLocation.longitude.toFixed(6)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-yellow-100 rounded-lg mb-4">
                      <MapPin className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        ยังไม่ได้ตั้งค่าพิกัดร้าน - ระบบจะไม่สามารถคำนวณค่าส่งอัตโนมัติได้
                      </span>
                    </div>
                  )}

                  {/* Address Input */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ที่อยู่ร้าน (Google จะแปลงเป็นพิกัดให้อัตโนมัติ)
                      </label>
                      <input
                        type="text"
                        value={restaurantLocation.address}
                        onChange={(e) => setRestaurantLocation({...restaurantLocation, address: e.target.value})}
                        placeholder="เช่น 123 Queen Street, Auckland CBD, New Zealand"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Or Manual Coordinates */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="flex-1 border-t border-gray-300"></span>
                      <span>หรือกรอกพิกัดเอง</span>
                      <span className="flex-1 border-t border-gray-300"></span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          value={restaurantLocation.latitude || ''}
                          onChange={(e) => setRestaurantLocation({...restaurantLocation, latitude: parseFloat(e.target.value) || null})}
                          placeholder="-36.8485"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={restaurantLocation.longitude || ''}
                          onChange={(e) => setRestaurantLocation({...restaurantLocation, longitude: parseFloat(e.target.value) || null})}
                          placeholder="174.7633"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Error Message */}
                    {locationError && (
                      <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                        {locationError}
                      </div>
                    )}

                    {/* Save Button */}
                    <button
                      onClick={updateRestaurantLocation}
                      disabled={locationLoading}
                      className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {locationLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          บันทึกพิกัดร้าน
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Delivery Settings Section - Only show when delivery is enabled */}
              {serviceOptions.delivery && (
                <div className="mt-4 ml-16 p-4 bg-green-50 rounded-xl border border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-green-600" />
                    การตั้งค่าค่าส่ง Delivery
                  </h4>

                  {/* Pricing Mode Toggle */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-3">เลือกวิธีคำนวณค่าส่ง:</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setDeliverySettings({...deliverySettings, pricing_mode: 'per_km'})}
                        className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                          deliverySettings.pricing_mode === 'per_km'
                            ? 'border-green-500 bg-green-100'
                            : 'border-gray-200 bg-white hover:border-green-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900">คิดตามกิโลเมตร</div>
                        <div className="text-xs text-gray-500 mt-1">ค่าพื้นฐาน + (ระยะทาง × ราคาต่อ km)</div>
                      </button>
                      <button
                        onClick={() => setDeliverySettings({...deliverySettings, pricing_mode: 'tier'})}
                        className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                          deliverySettings.pricing_mode === 'tier'
                            ? 'border-green-500 bg-green-100'
                            : 'border-gray-200 bg-white hover:border-green-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900">คิดตามระยะทาง (ขั้นบันได)</div>
                        <div className="text-xs text-gray-500 mt-1">กำหนดราคาตามช่วงระยะทาง</div>
                      </button>
                    </div>
                  </div>

                  {/* Per-KM Pricing Settings */}
                  {deliverySettings.pricing_mode === 'per_km' && (
                    <div className="space-y-4 p-4 bg-white rounded-lg border border-green-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ค่าส่งพื้นฐาน (Base Fee)
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">$</span>
                            <input
                              type="number"
                              value={deliverySettings.base_fee}
                              onChange={(e) => setDeliverySettings({...deliverySettings, base_fee: parseFloat(e.target.value) || 0})}
                              className="flex-1 px-3 py-2 border rounded-lg text-gray-900 bg-white"
                              step="0.5"
                              min="0"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">ค่าส่งขั้นต่ำที่เก็บทุกออเดอร์</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ราคาต่อกิโลเมตร
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">$</span>
                            <input
                              type="number"
                              value={deliverySettings.price_per_km}
                              onChange={(e) => setDeliverySettings({...deliverySettings, price_per_km: parseFloat(e.target.value) || 0})}
                              className="flex-1 px-3 py-2 border rounded-lg text-gray-900 bg-white"
                              step="0.1"
                              min="0"
                            />
                            <span className="text-gray-500">/km</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ระยะทางสูงสุดที่จัดส่ง
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={deliverySettings.max_distance_km}
                              onChange={(e) => setDeliverySettings({...deliverySettings, max_distance_km: parseFloat(e.target.value) || 0})}
                              className="flex-1 px-3 py-2 border rounded-lg text-gray-900 bg-white"
                              step="1"
                              min="1"
                            />
                            <span className="text-gray-500">km</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ส่งฟรีเมื่อยอดสั่งเกิน
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">$</span>
                            <input
                              type="number"
                              value={deliverySettings.free_delivery_above}
                              onChange={(e) => setDeliverySettings({...deliverySettings, free_delivery_above: parseFloat(e.target.value) || 0})}
                              className="flex-1 px-3 py-2 border rounded-lg text-gray-900 bg-white"
                              step="5"
                              min="0"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">0 = ไม่มีส่งฟรี</p>
                        </div>
                      </div>

                      {/* Preview Calculation */}
                      <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm font-medium text-green-800 mb-2">ตัวอย่างการคำนวณ:</p>
                        <div className="text-sm text-green-700 space-y-1">
                          <p>• 5 km = ${(deliverySettings.base_fee + (5 * deliverySettings.price_per_km)).toFixed(2)} (${deliverySettings.base_fee} + 5 × ${deliverySettings.price_per_km})</p>
                          <p>• 10 km = ${(deliverySettings.base_fee + (10 * deliverySettings.price_per_km)).toFixed(2)} (${deliverySettings.base_fee} + 10 × ${deliverySettings.price_per_km})</p>
                          {deliverySettings.free_delivery_above > 0 && (
                            <p className="text-green-600 font-medium">• ส่งฟรีเมื่อยอดสั่งเกิน ${deliverySettings.free_delivery_above}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tier-based Pricing Settings */}
                  {deliverySettings.pricing_mode === 'tier' && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        กำหนดค่าส่งตามช่วงระยะทาง (กิโลเมตร) จากร้านถึงลูกค้า
                      </p>

                      {/* Delivery Rates List */}
                      {deliveryRates.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {deliveryRates.sort((a, b) => a.distance_km - b.distance_km).map((rate) => (
                            <div key={rate.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                              {editingRate?.id === rate.id ? (
                                <>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        value={editingRate.distance_km}
                                        onChange={(e) => setEditingRate({...editingRate, distance_km: parseFloat(e.target.value) || 0})}
                                        className="w-20 px-2 py-1 border rounded text-center text-gray-900 bg-white"
                                        step="0.5"
                                        min="0"
                                      />
                                      <span className="text-sm text-gray-500">km</span>
                                    </div>
                                    <span className="text-gray-400">=</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-sm text-gray-500">$</span>
                                      <input
                                        type="number"
                                        value={editingRate.price}
                                        onChange={(e) => setEditingRate({...editingRate, price: parseFloat(e.target.value) || 0})}
                                        className="w-20 px-2 py-1 border rounded text-center text-gray-900 bg-white"
                                        step="0.5"
                                        min="0"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        setDeliveryRates(deliveryRates.map(r => r.id === editingRate.id ? editingRate : r));
                                        setEditingRate(null);
                                      }}
                                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                                    >
                                      <Save className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingRate(null)}
                                      className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-700">
                                      ระยะทางไม่เกิน <span className="text-green-600 font-bold">{rate.distance_km}</span> km
                                    </span>
                                    <span className="text-gray-400">=</span>
                                    <span className="text-sm font-bold text-green-600">
                                      ${rate.price.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setEditingRate(rate)}
                                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setDeliveryRates(deliveryRates.filter(r => r.id !== rate.id))}
                                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add New Rate Form */}
                      {showAddRate ? (
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-dashed border-green-300">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={newRate.distance_km}
                              onChange={(e) => setNewRate({...newRate, distance_km: e.target.value})}
                              placeholder="5"
                              className="w-20 px-2 py-1 border rounded text-center text-gray-900 bg-white"
                              step="0.5"
                              min="0"
                            />
                            <span className="text-sm text-gray-500">km</span>
                          </div>
                          <span className="text-gray-400">=</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-500">$</span>
                            <input
                              type="number"
                              value={newRate.price}
                              onChange={(e) => setNewRate({...newRate, price: e.target.value})}
                              placeholder="3.50"
                              className="w-20 px-2 py-1 border rounded text-center text-gray-900 bg-white"
                              step="0.5"
                              min="0"
                            />
                          </div>
                          <div className="flex items-center gap-2 ml-auto">
                            <button
                              onClick={() => {
                                if (newRate.distance_km && newRate.price) {
                                  setDeliveryRates([...deliveryRates, {
                                    id: crypto.randomUUID(),
                                    distance_km: parseFloat(newRate.distance_km),
                                    price: parseFloat(newRate.price)
                                  }]);
                                  setNewRate({ distance_km: '', price: '' });
                                  setShowAddRate(false);
                                }
                              }}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              เพิ่ม
                            </button>
                            <button
                              onClick={() => {
                                setNewRate({ distance_km: '', price: '' });
                                setShowAddRate(false);
                              }}
                              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddRate(true)}
                          className="flex items-center gap-2 px-4 py-2 text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          เพิ่มอัตราค่าส่ง
                        </button>
                      )}

                      {deliveryRates.length === 0 && (
                        <p className="text-sm text-gray-500 mt-3 italic">
                          ยังไม่มีการกำหนดค่าส่ง กรุณาเพิ่มอัตราค่าส่งเพื่อให้ลูกค้าเห็นค่าส่งเมื่อสั่ง Delivery
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Warning if all disabled */}
            {!serviceOptions.dine_in && !serviceOptions.pickup && !serviceOptions.delivery && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  ⚠️ คำเตือน: คุณปิดบริการทั้งหมดแล้ว ลูกค้าจะไม่สามารถสั่งอาหารได้
                </p>
              </div>
            )}

            {/* Divider */}
            <div className="my-8 border-t border-gray-200"></div>

            {/* Primary Language Setting */}
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="w-6 h-6 text-indigo-500" />
              ภาษาหลักของร้าน (Primary Language)
            </h2>
            <p className="text-gray-600 mb-6">
              เลือกภาษาที่ใช้ในร้านของคุณ ระบบจะแปลข้อความและคำขอจากลูกค้าเป็นภาษานี้โดยอัตโนมัติ
              เพื่อให้พนักงานและครัวเข้าใจได้ง่าย
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {AVAILABLE_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setPrimaryLanguage(lang.code)}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    primaryLanguage === lang.code
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-3xl">{lang.flag}</span>
                  <span className={`text-sm font-medium ${
                    primaryLanguage === lang.code ? 'text-indigo-700' : 'text-gray-700'
                  }`}>
                    {lang.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-indigo-800 text-sm">
                💡 <strong>ตัวอย่าง:</strong> ถ้าเลือก "ไทย" เมื่อลูกค้าพิมพ์ "No spicy please" ในช่อง Special Instructions
                ระบบจะแปลเป็น "ไม่เผ็ดครับ" แสดงในหน้าครัวและพนักงาน
              </p>
            </div>

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSaveServiceOptions}
                disabled={saving}
                className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Service Options'}
              </button>
            </div>
          </div>
        )}

        {/* Staff Tab */}
        {activeTab === 'staff' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-500" />
                  Staff Management
                </h2>
                <p className="text-sm text-gray-500 mt-1">จัดการพนักงานในร้านของคุณ</p>
              </div>
              <button
                onClick={() => setShowAddStaff(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Staff
              </button>
            </div>

            {/* Add Staff Modal */}
            {showAddStaff && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-4">เพิ่มพนักงานใหม่</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ *</label>
                    <input
                      type="text"
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                      placeholder="ชื่อพนักงาน"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง</label>
                    <select
                      value={newStaff.role}
                      onChange={(e) => setNewStaff({...newStaff, role: e.target.value as Staff['role']})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                    >
                      <option value="waiter">พนักงานเสิร์ฟ (Waiter)</option>
                      <option value="chef">พ่อครัว (Chef)</option>
                      <option value="cashier">แคชเชียร์ (Cashier)</option>
                      <option value="manager">ผู้จัดการ (Manager)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                    <input
                      type="email"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                    <input
                      type="tel"
                      value={newStaff.phone}
                      onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                      placeholder="0xx-xxx-xxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code (6 หลัก)</label>
                    <input
                      type="text"
                      value={newStaff.pin_code}
                      onChange={(e) => setNewStaff({...newStaff, pin_code: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                      placeholder="123456"
                      maxLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">สำหรับ login เข้าระบบ POS</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleAddStaff}
                    disabled={saving || !newStaff.name}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddStaff(false);
                      setNewStaff({ name: '', email: '', phone: '', role: 'waiter', pin_code: '' });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Staff List */}
            {loadingStaff ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : staffList.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">ยังไม่มีพนักงาน</p>
                <p className="text-gray-500 text-sm mt-1">เพิ่มพนักงานเพื่อเริ่มต้นใช้งาน</p>
              </div>
            ) : (
              <div className="space-y-3">
                {staffList.map((staff) => (
                  <div
                    key={staff.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg">
                          {staff.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{staff.name}</h3>
                        <p className="text-sm text-gray-500">{getRoleDisplayName(staff.role)}</p>
                        {staff.email && <p className="text-xs text-gray-400">{staff.email}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {staff.pin_code && (
                        <span className="px-2 py-1 bg-gray-200 rounded text-xs text-gray-600">
                          PIN: {staff.pin_code}
                        </span>
                      )}
                      <button
                        onClick={() => setEditingStaff(staff)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit staff"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(staff.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete staff"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Edit Staff Modal */}
            {editingStaff && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Edit Staff</h3>
                    <button
                      onClick={() => setEditingStaff(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={editingStaff.name}
                        onChange={(e) => setEditingStaff({...editingStaff, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={editingStaff.role}
                        onChange={(e) => setEditingStaff({...editingStaff, role: e.target.value as Staff['role']})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      >
                        <option value="owner">Owner</option>
                        <option value="manager">Manager</option>
                        <option value="chef">Chef</option>
                        <option value="waiter">Waiter</option>
                        <option value="cashier">Cashier</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={editingStaff.email || ''}
                        onChange={(e) => setEditingStaff({...editingStaff, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={editingStaff.phone || ''}
                        onChange={(e) => setEditingStaff({...editingStaff, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code (6 หลัก)</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={editingStaff.pin_code || ''}
                        onChange={(e) => setEditingStaff({...editingStaff, pin_code: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                        placeholder="เช่น 123456"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => handleUpdateStaff(editingStaff.id, {
                        name: editingStaff.name,
                        email: editingStaff.email,
                        phone: editingStaff.phone,
                        role: editingStaff.role,
                        pin_code: editingStaff.pin_code
                      })}
                      disabled={saving || !editingStaff.name}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingStaff(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Settings Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              Payment Settings
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              ตั้งค่าวิธีการชำระเงินที่ร้านของคุณรองรับ ลูกค้าจะเห็นเฉพาะตัวเลือกที่คุณเปิดใช้งาน
            </p>

            {/* Card Payments (Stripe) */}
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Card Payments</h3>
                    <p className="text-sm text-gray-600">
                      รับชำระผ่าน Visa, Mastercard, Amex, Apple Pay, Google Pay
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentSettings.accept_card}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      accept_card: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              {paymentSettings.accept_card && (
                <div className="mt-3 ml-13 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    ✓ ลูกค้าจะสามารถชำระเงินผ่าน Stripe Checkout ได้
                  </p>
                </div>
              )}
            </div>

            {/* Bank Transfer */}
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Bank Transfer</h3>
                    <p className="text-sm text-gray-600">
                      รับชำระผ่านการโอนเงิน + QR Code
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentSettings.accept_bank_transfer}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      accept_bank_transfer: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {/* Bank Accounts List */}
              {paymentSettings.accept_bank_transfer && (
                <div className="mt-4 ml-13">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Bank Accounts</h4>
                    <button
                      onClick={() => setShowAddBank(true)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add Account
                    </button>
                  </div>

                  {/* Bank Accounts */}
                  {paymentSettings.bank_accounts.length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">ยังไม่มีบัญชีธนาคาร</p>
                      <p className="text-xs text-gray-400">กรุณาเพิ่มบัญชีธนาคารเพื่อรับการโอนเงิน</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {paymentSettings.bank_accounts.map((account, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{account.bank_name}</p>
                            <p className="text-sm text-gray-600">{account.account_name}</p>
                            <p className="text-sm font-mono text-gray-600">{account.account_number}</p>
                          </div>
                          <button
                            onClick={() => removeBankAccount(index)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Bank Account Form */}
                  {showAddBank && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h5 className="font-medium text-gray-900 mb-3">Add Bank Account</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Bank Name</label>
                          <input
                            type="text"
                            value={newBankAccount.bank_name}
                            onChange={(e) => setNewBankAccount({ ...newBankAccount, bank_name: e.target.value })}
                            placeholder="e.g., ANZ, ASB, Westpac, BNZ"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Account Name</label>
                          <input
                            type="text"
                            value={newBankAccount.account_name}
                            onChange={(e) => setNewBankAccount({ ...newBankAccount, account_name: e.target.value })}
                            placeholder="e.g., Thai Kitchen Ltd"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Account Number</label>
                          <input
                            type="text"
                            value={newBankAccount.account_number}
                            onChange={(e) => setNewBankAccount({ ...newBankAccount, account_number: e.target.value })}
                            placeholder="e.g., 06-0000-0000000-00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white font-mono focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={addBankAccount}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                          >
                            Add Account
                          </button>
                          <button
                            onClick={() => {
                              setShowAddBank(false);
                              setNewBankAccount({ bank_name: '', account_name: '', account_number: '' });
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-yellow-800 mb-2">📋 How it works</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• ลูกค้าต้องชำระเงินก่อนที่ออร์เดอร์จะเข้าครัว</li>
                <li>• หากเปิด Bank Transfer ลูกค้าจะเห็น QR Code และเลขบัญชี</li>
                <li>• คุณต้องตรวจสอบการโอนเงินด้วยตัวเองใน Orders Dashboard</li>
                <li>• ต้องเปิดใช้งานอย่างน้อย 1 วิธีการชำระเงิน</li>
              </ul>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={savePaymentSettings}
                disabled={savingPayment}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingPayment ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Payment Settings
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Subscription & Billing</h2>

            {/* Current Plan Card */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Current Plan</p>
                  <h3 className="text-2xl font-bold">
                    {getPlanDisplayName(profile.subscription.plan)}
                  </h3>
                  {getStatusBadge(profile.subscription.status)}
                </div>
                <div className="text-right">
                  {profile.subscription.is_subscribed ? (
                    <>
                      {profile.subscription.next_billing_date && (
                        <p className="text-blue-100 text-sm mb-1">Next Billing</p>
                      )}
                      <p className="text-lg font-semibold">
                        {profile.subscription.next_billing_date
                          ? formatDate(profile.subscription.next_billing_date)
                          : profile.subscription.current_period_end
                          ? `Expires: ${formatDate(profile.subscription.current_period_end)}`
                          : 'N/A'}
                      </p>
                    </>
                  ) : (
                    <>
                      {profile.subscription.trial_days_remaining > 0 && (
                        <>
                          <p className="text-blue-100 text-sm mb-1">Trial Days Left</p>
                          <p className="text-lg font-semibold">
                            {profile.subscription.trial_days_remaining} days
                          </p>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Subscription Details */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Plan Status</span>
                <span className="font-medium">{getStatusBadge(profile.subscription.status)}</span>
              </div>
              
              {profile.subscription.is_subscribed && (
                <>
                  {profile.subscription.next_billing_date && (
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-600">Next Billing Date</span>
                      <span className="font-medium">
                        {formatDate(profile.subscription.next_billing_date)}
                      </span>
                    </div>
                  )}
                  
                  {profile.subscription.current_period_end && (
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-600">Current Period Ends</span>
                      <span className="font-medium">
                        {formatDate(profile.subscription.current_period_end)}
                      </span>
                    </div>
                  )}
                  
                  {profile.subscription.cancel_at_period_end && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Your subscription will be canceled at the end of the current billing period.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Manage Billing Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={handleManageBilling}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Manage Payment Method / Cancel Subscription
              </button>
            </div>

            {/* Upgrade/Downgrade (Optional) */}
            {!profile.subscription.is_subscribed && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-4">
                  Upgrade to unlock all features and remove limitations
                </p>
                <a
                  href="/pricing"
                  className="inline-block px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  View Plans & Upgrade
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
