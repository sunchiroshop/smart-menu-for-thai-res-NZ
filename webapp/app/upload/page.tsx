'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Upload as UploadIcon, 
  X,
  Check,
  Loader2,
  ArrowLeft,
  Sparkles,
  Camera,
  Wand2,
  Plus,
  Trash2,
  Eye
} from 'lucide-react';
import { translateText as translateTextAPI, detectLanguage, generateFoodImage, enhanceImage, applyLogoOnly } from '@/lib/api-client';
import ImageGallery from '@/components/ImageGallery';
import RestaurantSelector from '@/components/RestaurantSelector';

interface AddOn {
  id: string;
  name: string;
  nameEn: string;
  price: string;
}

interface Meat {
  id: string;
  name: string;
  nameEn: string;
  price: string; // "0" means free
}

interface Category {
  id: string;
  name: string;
  nameEn: string;
}

export default function AddMenuItemPage() {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  // Trial Limits (NEW!)
  const [trialLimits, setTrialLimits] = useState<any>(null);
  const [loadingLimits, setLoadingLimits] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('free_trial');
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  
  // Step 1: Photo Upload & Enhancement
  const [originalPhoto, setOriginalPhoto] = useState<File | null>(null);
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string>('');
  const [enhancedPhotoUrl, setEnhancedPhotoUrl] = useState<string>('');
  const [useEnhancement, setUseEnhancement] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [applyingLogo, setApplyingLogo] = useState(false); // NEW: For adding logo only without enhancement
  const [photoAccepted, setPhotoAccepted] = useState(false);
  const [enhancementStyle, setEnhancementStyle] = useState<'professional' | 'natural' | 'vibrant'>('professional');
  const [showImageGallery, setShowImageGallery] = useState(false); // Image Library
  const [userInstruction, setUserInstruction] = useState<string>(''); // User's custom instruction for enhancement
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  
  // AI Image Generation (NEW!)
  const [useAIGeneration, setUseAIGeneration] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [imageGenerationStyle, setImageGenerationStyle] = useState<'professional' | 'rustic' | 'elegant' | 'casual' | 'modern' | 'portrait'>('professional');
  const [cuisineType, setCuisineType] = useState<string>('Thai');
  const [aiDishName, setAiDishName] = useState<string>('');
  const [aiDescription, setAiDescription] = useState<string>('');
  
  // Logo Overlay (NEW!)
  const [logoOverlay, setLogoOverlay] = useState<boolean>(false);
  const [logoPosition, setLogoPosition] = useState<'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'>('top-right');
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null);
  
  // Step 2: Menu Name
  const [menuName, setMenuName] = useState('');
  const [translateName, setTranslateName] = useState(true);
  const [showBothLanguagesName, setShowBothLanguagesName] = useState(true);
  const [primaryLanguageName, setPrimaryLanguageName] = useState<'original' | 'english'>('original');
  const [menuNameEn, setMenuNameEn] = useState('');
  
  // Step 3: Description
  const [description, setDescription] = useState('');
  const [translateDescription, setTranslateDescription] = useState(true);
  const [showBothLanguagesDesc, setShowBothLanguagesDesc] = useState(true);
  const [primaryLanguageDesc, setPrimaryLanguageDesc] = useState<'original' | 'english'>('original');
  const [descriptionEn, setDescriptionEn] = useState('');
  
  // Step 4: Price
  const [price, setPrice] = useState('');
  const [isBestSeller, setIsBestSeller] = useState(false);
  
  // Step 5: Categories (with localStorage persistence)
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryNameEn, setNewCategoryNameEn] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryNameEn, setEditCategoryNameEn] = useState('');
  const [translatingCategory, setTranslatingCategory] = useState(false);

  // Menu Type Selection (NEW!) - before all steps
  const [menuType, setMenuType] = useState<'food' | 'snack' | 'beverage'>('food');

  // Step 5.5: Choose Meats (NEW!)
  const [hasMeats, setHasMeats] = useState(false);
  const [meats, setMeats] = useState<Meat[]>([]);
  const [translatingMeat, setTranslatingMeat] = useState<string | null>(null);
  
  // Step 6: Add-ons
  const [hasAddOns, setHasAddOns] = useState(false);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [translatingAddOn, setTranslatingAddOn] = useState<string | null>(null);
  
  // Fetch trial limits on mount
  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.id) {
          setUserId(session.user.id);
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          
          // Fetch trial limits
          const response = await fetch(`${API_URL}/api/trial/status/${session.user.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setTrialLimits(data);
              setUserPlan(data.plan || 'free_trial');
            }
          }
          
          // Fetch restaurant ID and logo
          const profileResponse = await fetch(`${API_URL}/api/user/profile?user_id=${session.user.id}`);
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.success && profileData.restaurant?.restaurant_id) {
              setRestaurantId(profileData.restaurant.restaurant_id);
              // Get restaurant logo if available
              if (profileData.restaurant?.logo_url) {
                setRestaurantLogo(profileData.restaurant.logo_url);
                // Auto-enable logo overlay when logo exists
                setLogoOverlay(true);
                console.log('🖼️ Restaurant logo loaded, auto-enabling logo overlay');
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch trial limits:', error);
      } finally {
        setLoadingLimits(false);
      }
    };
    
    fetchLimits();
  }, []);
  
  // Load categories from localStorage on mount
  useEffect(() => {
    const savedCategories = localStorage.getItem('menu_categories');
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
        } else {
          // Use default categories
          const defaultCategories = [
            { id: '1', name: 'อาหารจานหลัก', nameEn: 'Main Dishes' },
            { id: '2', name: 'อาหารทอด', nameEn: 'Fried Dishes' },
            { id: '3', name: 'ของหวาน', nameEn: 'Desserts' },
          ];
          setCategories(defaultCategories);
          localStorage.setItem('menu_categories', JSON.stringify(defaultCategories));
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
        const defaultCategories = [
          { id: '1', name: 'อาหารจานหลัก', nameEn: 'Main Dishes' },
          { id: '2', name: 'อาหารทอด', nameEn: 'Fried Dishes' },
          { id: '3', name: 'ของหวาน', nameEn: 'Desserts' },
        ];
        setCategories(defaultCategories);
      }
    } else {
      // First time - set default categories
      const defaultCategories = [
        { id: '1', name: 'อาหารจานหลัก', nameEn: 'Main Dishes' },
        { id: '2', name: 'อาหารทอด', nameEn: 'Fried Dishes' },
        { id: '3', name: 'ของหวาน', nameEn: 'Desserts' },
      ];
      setCategories(defaultCategories);
      localStorage.setItem('menu_categories', JSON.stringify(defaultCategories));
    }
  }, []);
  
  // Save categories to localStorage whenever they change
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem('menu_categories', JSON.stringify(categories));
    }
  }, [categories]);

  // Auto-select portrait style for snack/beverage menu types
  useEffect(() => {
    if (menuType === 'snack' || menuType === 'beverage') {
      // Suggest portrait style for non-food items
      if (imageGenerationStyle === 'professional') {
        setImageGenerationStyle('portrait');
      }
      // Also clear meats if any were selected
      setHasMeats(false);
      setMeats([]);
    }
  }, [menuType]);

  // UI State
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Photo handling
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOriginalPhoto(file);
      setOriginalPhotoUrl(URL.createObjectURL(file));
      setEnhancedPhotoUrl('');
      setPhotoAccepted(false);
    }
  };

  const handleEnhancePhoto = async () => {
    // Check if we have an image to enhance (either File or URL)
    if (!originalPhoto && !originalPhotoUrl && !enhancedPhotoUrl) {
      setError('⚠️ No image to enhance. Please upload or select an image first.');
      return;
    }

    // Check if user is authenticated
    if (!userId) {
      setError('⚠️ Please wait for authentication to load or try refreshing the page.');
      return;
    }

    // Check trial limits first
    if (trialLimits && !loadingLimits) {
      const enhancementCount = trialLimits.image_enhancement_count || 0;
      const enhancementLimit = trialLimits.limits?.image_enhancement || 0;

      if (enhancementLimit !== 999999 && enhancementCount >= enhancementLimit) {
        setError(`🚫 You've reached your AI Enhancement limit (${enhancementLimit}/${enhancementLimit}). Please upgrade your plan to continue.`);
        return;
      }
    }

    setEnhancing(true);
    setError('');
    setAiAnalysis('');

    try {
      // Get the image file to enhance
      let imageFile: File = originalPhoto as File;

      // If we don't have an original File but have a URL (from gallery/generation/previous enhancement)
      if (!originalPhoto && (originalPhotoUrl || enhancedPhotoUrl)) {
        const imageUrl = enhancedPhotoUrl || originalPhotoUrl;
        try {
          // Fetch the image and convert to File
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          imageFile = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' });
        } catch (fetchError) {
          console.error('Failed to fetch image for re-enhancement:', fetchError);
          setError('Failed to process image for re-enhancement. Please try uploading a new image.');
          setEnhancing(false);
          return;
        }
      }

      if (!imageFile) {
        setError('⚠️ No valid image to enhance.');
        setEnhancing(false);
        return;
      }

      // Prepare logo overlay config
      const logoConfig = logoOverlay && restaurantLogo ? {
        enabled: true,
        logo_url: restaurantLogo,
        position: logoPosition
      } : undefined;

      console.log('🎨 Image Enhancement - Logo Settings:', {
        logoOverlay,
        restaurantLogo: restaurantLogo ? 'SET' : 'NOT SET',
        logoPosition,
        logoConfig
      });

      // Call AI Enhancement API (enhance_image_with_ai)
      const result = await enhanceImage(
        imageFile,
        enhancementStyle,
        userInstruction,
        logoConfig,
        userId // Pass userId for usage tracking
      );
      
      if (result.success && (result.enhanced_image_url || result.enhanced_image)) {
        // Use Supabase public URL if available, otherwise use base64 data URL
        const enhancedUrl = result.enhanced_image_url || result.enhanced_image || '';
        setEnhancedPhotoUrl(enhancedUrl);
        setUseEnhancement(true);
        setError('');
        
        // Refresh limits after successful enhancement
        if (userId) {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const response = await fetch(`${API_URL}/api/trial/status/${userId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) setTrialLimits(data);
          }
        }
        
        console.log('✅ Image enhanced successfully!');
        if (result.enhanced_image_url) {
          console.log('📸 Public URL:', result.enhanced_image_url);
        }
      } else {
        setError(result.error || 'Enhancement failed');
      }
    } catch (err: any) {
      console.error('Enhancement error:', err);
      setError(err.message || 'AI Enhancement failed. Please try again.');
    } finally {
      setEnhancing(false);
    }
  };

  // NEW: Apply Logo Only (no AI enhancement)
  const handleApplyLogoOnly = async () => {
    // Prioritize: enhanced > generated > original (use the best available image)
    const imageUrl = enhancedPhotoUrl || generatedImageUrl || originalPhotoUrl;

    if (!originalPhoto && !imageUrl) {
      setError('⚠️ No image to add logo. Please upload or select an image first.');
      return;
    }

    if (!restaurantLogo) {
      setError('⚠️ No restaurant logo found. Please upload a logo in Settings first.');
      return;
    }

    setApplyingLogo(true);
    setError('');

    try {
      let imageFile: File | null = null;

      // IMPORTANT: Always prefer URL (enhanced/generated) over original file
      // This ensures we use the enhanced/generated image, not the original upload
      if (imageUrl) {
        // Fetch image from URL and convert to File
        console.log('📥 Fetching image from URL:', imageUrl.substring(0, 100) + '...');
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        imageFile = new File([blob], 'image.png', { type: blob.type || 'image/png' });
      } else if (originalPhoto) {
        // Only use originalPhoto if no URL is available (first time upload without enhancement)
        imageFile = originalPhoto;
      }

      if (!imageFile) {
        setError('⚠️ Could not process image file.');
        setApplyingLogo(false);
        return;
      }

      console.log('🎨 Applying Logo Only (No Enhancement)...');
      console.log('   Logo URL:', restaurantLogo);
      console.log('   Position:', logoPosition);
      console.log('   Source:', imageUrl ? (enhancedPhotoUrl ? 'Enhanced' : generatedImageUrl ? 'Generated' : 'Original URL') : 'Original File');

      // Call Apply Logo Only API
      const result = await applyLogoOnly(
        imageFile,
        restaurantLogo,
        logoPosition
      );

      if (result.success && (result.image_url || result.image)) {
        // Use Supabase public URL if available, otherwise use base64 data URL
        const resultUrl = result.image_url || result.image;
        if (resultUrl) {
          // Update all URLs so preview and save use the new image with logo
          setEnhancedPhotoUrl(resultUrl);
          setOriginalPhotoUrl(resultUrl);
          if (generatedImageUrl) {
            setGeneratedImageUrl(resultUrl);
          }
          setUseEnhancement(true);
          setError('');
        }

        console.log('✅ Logo applied successfully!');
        if (result.image_url) {
          console.log('📸 Public URL:', result.image_url);
        }
      } else {
        setError(result.error || 'Failed to apply logo');
      }
    } catch (err: any) {
      console.error('Apply logo error:', err);
      setError(err.message || 'Failed to apply logo. Please try again.');
    } finally {
      setApplyingLogo(false);
    }
  };

  const acceptPhoto = () => {
    // If user is accepting enhanced photo, clear generated image URL
    // so that Preview shows the enhanced version instead
    if (enhancedPhotoUrl && useEnhancement) {
      setGeneratedImageUrl('');
    }
    setPhotoAccepted(true);
  };

  // Accept photo with logo overlay (if enabled)
  const handleAcceptWithLogo = async () => {
    // If logo overlay is enabled, apply logo first
    if (logoOverlay && restaurantLogo && !enhancedPhotoUrl) {
      setApplyingLogo(true);
      setError('');

      try {
        let imageFile = originalPhoto;

        if (!imageFile && originalPhotoUrl) {
          const response = await fetch(originalPhotoUrl);
          const blob = await response.blob();
          imageFile = new File([blob], 'image.png', { type: blob.type || 'image/png' });
        }

        if (!imageFile) {
          setError('⚠️ Could not process image file.');
          setApplyingLogo(false);
          return;
        }

        console.log('🎨 Applying Logo before accepting...');
        const result = await applyLogoOnly(imageFile, restaurantLogo, logoPosition);

        if (result.success && (result.image_url || result.image)) {
          const resultUrl = result.image_url || result.image;
          if (resultUrl) {
            setOriginalPhotoUrl(resultUrl);
            setPhotoAccepted(true);
            console.log('✅ Logo applied and photo accepted!');
          }
        } else {
          setError(result.error || 'Failed to apply logo');
        }
      } catch (err: any) {
        console.error('Apply logo error:', err);
        setError(err.message || 'Failed to apply logo.');
      } finally {
        setApplyingLogo(false);
      }
    } else {
      // No logo overlay or already enhanced, just accept
      acceptPhoto();
    }
  };

  const rejectEnhancement = () => {
    setEnhancedPhotoUrl('');
    setUseEnhancement(false);
  };

  // AI Image Generation Handler
  const handleGenerateImage = async () => {
    // Use AI-specific fields if filled, otherwise use main form fields
    const dishName = aiDishName || menuName;
    const dishDescription = aiDescription || description || dishName;

    if (!dishName) {
      setError('Please enter dish name to generate image');
      return;
    }
    
    // Check if user is authenticated
    if (!userId) {
      setError('⚠️ Please wait for authentication to load or try refreshing the page.');
      return;
    }

    // Check trial limits first
    if (trialLimits && !loadingLimits) {
      const generationCount = trialLimits.image_generation_count || 0;
      const generationLimit = trialLimits.limits?.image_generation || 0;
      
      if (generationLimit !== 999999 && generationCount >= generationLimit) {
        setError(`🚫 You've reached your AI Image Generation limit (${generationLimit}/${generationLimit}). Please upgrade your plan to continue.`);
        return;
      }
    }

    setGeneratingImage(true);
    setError('');

    try {
      // Prepare logo overlay config
      const logoConfig = logoOverlay && restaurantLogo ? {
        enabled: true,
        logo_url: restaurantLogo,
        position: logoPosition
      } : undefined;

      console.log('🎨 Image Generation - Logo Settings:', {
        logoOverlay,
        restaurantLogo: restaurantLogo ? 'SET' : 'NOT SET',
        logoPosition,
        logoConfig
      });

      const result = await generateFoodImage({
        dish_name: dishName,
        description: dishDescription,
        cuisine_type: cuisineType,
        style: imageGenerationStyle,
        user_id: userId,
        logo_overlay: logoConfig
      });

      if (result.success && result.generated_image) {
        // Prefer Supabase public URL if available, otherwise use base64 data URL
        const imageUrl = result.generated_image_url || result.generated_image;
        setGeneratedImageUrl(imageUrl);
        setUseAIGeneration(true);
        // Don't auto-accept - let user review and accept manually
        // setPhotoAccepted(true);
        // Also set as original photo URL for consistency
        setOriginalPhotoUrl(imageUrl);
        setError('');
        
        // Refresh limits after successful generation
        if (userId) {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const response = await fetch(`${API_URL}/api/trial/status/${userId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) setTrialLimits(data);
          }
        }
      } else {
        setError(result.error || 'Failed to generate image. Please try again.');
      }
    } catch (err: any) {
      console.error('Image generation error:', err);
      setError(err.message || 'Failed to generate image. Please try again.');
    } finally {
      setGeneratingImage(false);
    }
  };

  const useGeneratedImage = () => {
    if (generatedImageUrl) {
      setOriginalPhotoUrl(generatedImageUrl);
      setPhotoAccepted(true);
      setUseAIGeneration(true);
    }
  };

  const rejectGeneratedImage = () => {
    setGeneratedImageUrl('');
    setUseAIGeneration(false);
    setPhotoAccepted(false);
  };

  // Translation with loading state
  const [translatingName, setTranslatingName] = useState(false);
  const [translatingDesc, setTranslatingDesc] = useState(false);

  const translateText = async (text: string): Promise<string> => {
    try {
      // Auto-detect language
      const sourceLang = detectLanguage(text);
      
      // Call Backend API for translation
      const translated = await translateTextAPI(text, sourceLang, 'English');
      return translated;
    } catch (error) {
      console.error('Translation failed:', error);
      // Fallback: return original text if translation fails
      throw error;
    }
  };

  const handleTranslateName = async () => {
    if (!menuName || translatingName) return;
    setTranslatingName(true);
    try {
      const translated = await translateText(menuName);
      setMenuNameEn(translated);
    } catch (err) {
      setError('Translation failed');
    } finally {
      setTranslatingName(false);
    }
  };

  const handleTranslateDescription = async () => {
    if (!description || translatingDesc) return;
    setTranslatingDesc(true);
    try {
      const translated = await translateText(description);
      setDescriptionEn(translated);
    } catch (err) {
      setError('Translation failed');
    } finally {
      setTranslatingDesc(false);
    }
  };

  // Category management
  const handleTranslateCategory = async () => {
    if (!newCategoryName || translatingCategory) return;
    setTranslatingCategory(true);
    try {
      const translated = await translateText(newCategoryName);
      setNewCategoryNameEn(translated);
    } catch (err) {
      console.error('Category translation failed:', err);
    } finally {
      setTranslatingCategory(false);
    }
  };

  const addCategory = async () => {
    if (!newCategoryName) return;
    
    // Auto-translate if not already translated
    let categoryNameEn = newCategoryNameEn;
    if (!categoryNameEn && newCategoryName) {
      setTranslatingCategory(true);
      try {
        categoryNameEn = await translateText(newCategoryName);
      } catch (err) {
        console.error('Auto-translation failed:', err);
        categoryNameEn = newCategoryName;
      } finally {
        setTranslatingCategory(false);
      }
    }

    const newCat: Category = {
      id: Date.now().toString(),
      name: newCategoryName,
      nameEn: categoryNameEn || newCategoryName,
    };
    setCategories([...categories, newCat]);
    setSelectedCategory(newCat.id);
    setNewCategoryName('');
    setNewCategoryNameEn('');
    setShowAddCategory(false);
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory(category.id);
    setEditCategoryName(category.name);
    setEditCategoryNameEn(category.nameEn);
  };

  const saveEditCategory = async () => {
    if (!editingCategory || !editCategoryName) return;
    
    // Auto-translate if changed
    let updatedNameEn = editCategoryNameEn;
    if (editCategoryName && !editCategoryNameEn) {
      setTranslatingCategory(true);
      try {
        updatedNameEn = await translateText(editCategoryName);
      } catch (err) {
        console.error('Auto-translation failed:', err);
        updatedNameEn = editCategoryName;
      } finally {
        setTranslatingCategory(false);
      }
    }

    setCategories(categories.map(cat => 
      cat.id === editingCategory 
        ? { ...cat, name: editCategoryName, nameEn: updatedNameEn }
        : cat
    ));
    setEditingCategory(null);
    setEditCategoryName('');
    setEditCategoryNameEn('');
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryName('');
    setEditCategoryNameEn('');
  };

  const deleteCategory = (id: string) => {
    if (categories.length <= 1) {
      setError('ต้องมีอย่างน้อย 1 Category');
      return;
    }
    setCategories(categories.filter(cat => cat.id !== id));
    if (selectedCategory === id) {
      setSelectedCategory('');
    }
  };

  // Add-on management
  // Meat management (NEW!)
  const addMeat = () => {
    const newMeat: Meat = {
      id: Date.now().toString(),
      name: '',
      nameEn: '',
      price: '0', // Free by default
    };
    setMeats([...meats, newMeat]);
  };

  const updateMeat = (id: string, field: 'name' | 'nameEn' | 'price', value: string) => {
    setMeats(meats.map(meat => 
      meat.id === id ? { ...meat, [field]: value } : meat
    ));
  };

  const translateMeat = async (id: string, name: string) => {
    if (!name || translatingMeat === id) return;
    setTranslatingMeat(id);
    try {
      const translated = await translateText(name);
      updateMeat(id, 'nameEn', translated);
    } catch (err) {
      console.error('Meat translation failed:', err);
    } finally {
      setTranslatingMeat(null);
    }
  };

  const removeMeat = (id: string) => {
    setMeats(meats.filter(meat => meat.id !== id));
  };

  // Add-on management
  const addAddOn = () => {
    const newAddOn: AddOn = {
      id: Date.now().toString(),
      name: '',
      nameEn: '',
      price: '',
    };
    setAddOns([...addOns, newAddOn]);
  };

  const updateAddOn = (id: string, field: 'name' | 'nameEn' | 'price', value: string) => {
    setAddOns(addOns.map(addon => 
      addon.id === id ? { ...addon, [field]: value } : addon
    ));
  };

  const translateAddOn = async (id: string, name: string) => {
    if (!name || translatingAddOn === id) return;
    setTranslatingAddOn(id);
    try {
      const translated = await translateText(name);
      updateAddOn(id, 'nameEn', translated);
    } catch (err) {
      console.error('Add-on translation failed:', err);
    } finally {
      setTranslatingAddOn(null);
    }
  };

  const removeAddOn = (id: string) => {
    setAddOns(addOns.filter(addon => addon.id !== id));
  };

  // Save menu item
  const handleSave = async () => {
    // Photo is now optional - only require Name and Category
    if (!menuName || !selectedCategory) {
      setError('Please fill in all required fields (Name and Category). Photo is optional.');
      return;
    }

    // Check plan limits
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const statsResponse = await fetch(`${API_URL}/api/menu-stats?restaurant_id=${restaurantId || 'default'}`);
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        const totalItems = statsData.stats.total_items || 0;
        
        // Load current plan from localStorage
        const savedPlanId = localStorage.getItem('selected_plan') || 'pro';
        const plans = [
          { id: 'basic', limit: 20 },
          { id: 'pro', limit: 100 },
          { id: 'enterprise', limit: -1 }
        ];
        const currentPlanLimit = plans.find(p => p.id === savedPlanId)?.limit || 100;
        
        // Check if limit is reached
        if (currentPlanLimit !== -1 && totalItems >= currentPlanLimit) {
          setError(`You've reached your plan limit (${currentPlanLimit} menus). Please upgrade your plan!`);
          setSaving(false);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to check plan limits:', err);
      // Continue anyway if stats check fails
    }

    setSaving(true);
    setError('');
    
    try {
      // Convert photo to base64 URL (prioritize: generated URL from Supabase > generated base64 > enhanced > original)
      // If generated image has a Supabase URL, use that; otherwise use base64
      let photoUrl = generatedImageUrl || enhancedPhotoUrl || originalPhotoUrl;

      // Debug logging
      console.log('📝 Saving menu item...');
      console.log('   Generated URL:', generatedImageUrl ? 'Yes' : 'No');
      console.log('   Enhanced URL:', enhancedPhotoUrl ? 'Yes' : 'No');
      console.log('   Original URL:', originalPhotoUrl ? 'Yes' : 'No');
      console.log('   Final Photo URL:', photoUrl ? (photoUrl.startsWith('data:') ? 'Base64 (length: ' + photoUrl.length + ')' : photoUrl.substring(0, 100)) : 'None');
      
      // If generated image has a public URL (from Supabase), prefer that over base64
      // The backend should return generated_image_url in the response
      
      // Find selected category info
      const selectedCat = categories.find(c => c.id === selectedCategory);
      
      // Prepare menu item data
      const menuItemData = {
        name: menuName,
        nameEn: menuNameEn || menuName,
        description: description || '',
        descriptionEn: descriptionEn || description || '',
        price: price,
        category: selectedCat?.name || '',
        categoryEn: selectedCat?.nameEn || '',
        photo_url: photoUrl,
        meats: (menuType === 'food' && hasMeats) ? meats.filter(m => m.name).map(m => ({
          name: m.name,
          nameEn: m.nameEn || m.name,
          price: m.price
        })) : [],
        menu_type: menuType, // NEW: Include menu type in saved data
        addOns: hasAddOns ? addOns.filter(a => a.name).map(a => ({
          name: a.name,
          nameEn: a.nameEn || a.name,
          price: a.price
        })) : [],
        showBothLanguages: showBothLanguagesName,
        primaryLanguage: primaryLanguageName,
        is_best_seller: isBestSeller,
        restaurant_id: restaurantId || 'default' // Use real restaurant ID
      };

      // Call API to save
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(menuItemData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save menu item');
      }

      const result = await response.json();
      console.log('✅ Menu item saved:', result);
      console.log('   Menu ID:', result.menu_item?.menu_id);
      console.log('   Success:', result.success);

      if (!result.success) {
        throw new Error(result.message || 'Failed to save menu item');
      }

      // Invalidate translation cache for this restaurant (new menu added)
      if (restaurantId && result.menu_id) {
        try {
          await fetch(`${API_URL}/api/translations/menu/${restaurantId}/${result.menu_id}`, {
            method: 'DELETE',
          });
          console.log('Translation cache invalidated for new menu');
        } catch (cacheErr) {
          console.log('Cache invalidation skipped:', cacheErr);
        }
      }

      // Success! Navigate to menus page
      router.push('/menus');
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save menu item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-gray-600 hover:text-orange-500 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="text-center mb-8">
          <div className="inline-block bg-orange-500 p-4 rounded-full mb-4">
            <Camera className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Add Menu Item
          </h1>
          <p className="text-gray-600">
            Create a new menu item with photo, details, and translations
          </p>
        </div>

        {/* Restaurant Selector (Enterprise only) */}
        <RestaurantSelector
          onRestaurantChange={(id) => setRestaurantId(id)}
          currentRestaurantId={restaurantId || undefined}
        />

        {/* Trial Limits Indicator */}
        {trialLimits && !loadingLimits && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 mb-6 border-2 border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-orange-500" />
                AI Features Usage
              </h3>
              <Link
                href="/pricing"
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Upgrade Plan
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Image Generation */}
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">AI Image Generation</span>
                  <span className={`text-sm font-bold ${
                    (trialLimits.limits.image_generation === 999999) 
                      ? 'text-green-600'
                      : (trialLimits.image_generation_count >= trialLimits.limits.image_generation) 
                        ? 'text-red-600' 
                        : (trialLimits.image_generation_count / trialLimits.limits.image_generation >= 0.7)
                          ? 'text-orange-600'
                          : 'text-green-600'
                  }`}>
                    {trialLimits.limits.image_generation === 999999 
                      ? 'Unlimited'
                      : `${Math.max(0, trialLimits.limits.image_generation - trialLimits.image_generation_count)} left`
                    }
                  </span>
                </div>
                {trialLimits.limits.image_generation !== 999999 && (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div
                        className={`h-full rounded-full transition-all ${
                          (trialLimits.image_generation_count >= trialLimits.limits.image_generation) 
                            ? 'bg-red-500'
                            : (trialLimits.image_generation_count / trialLimits.limits.image_generation >= 0.7)
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, (trialLimits.image_generation_count / trialLimits.limits.image_generation) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {trialLimits.image_generation_count} / {trialLimits.limits.image_generation} used
                    </p>
                  </>
                )}
              </div>

              {/* Image Enhancement */}
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">AI Image Enhancement</span>
                  <span className={`text-sm font-bold ${
                    (trialLimits.limits.image_enhancement === 999999) 
                      ? 'text-green-600'
                      : (trialLimits.image_enhancement_count >= trialLimits.limits.image_enhancement) 
                        ? 'text-red-600' 
                        : (trialLimits.image_enhancement_count / trialLimits.limits.image_enhancement >= 0.7)
                          ? 'text-orange-600'
                          : 'text-green-600'
                  }`}>
                    {trialLimits.limits.image_enhancement === 999999 
                      ? 'Unlimited'
                      : `${Math.max(0, trialLimits.limits.image_enhancement - trialLimits.image_enhancement_count)} left`
                    }
                  </span>
                </div>
                {trialLimits.limits.image_enhancement !== 999999 && (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div
                        className={`h-full rounded-full transition-all ${
                          (trialLimits.image_enhancement_count >= trialLimits.limits.image_enhancement) 
                            ? 'bg-red-500'
                            : (trialLimits.image_enhancement_count / trialLimits.limits.image_enhancement >= 0.7)
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, (trialLimits.image_enhancement_count / trialLimits.limits.image_enhancement) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {trialLimits.image_enhancement_count} / {trialLimits.limits.image_enhancement} used
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Upgrade Warning */}
            {trialLimits.role === 'free_trial' && trialLimits.trial_days_remaining <= 3 && (
              <div className="mt-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                <p className="text-sm text-orange-800 font-medium">
                  ⚠️ Your trial expires in {trialLimits.trial_days_remaining} days. Upgrade to keep using AI features!
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Menu Type Selection - Before all steps */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            What type of menu item are you adding?
          </h2>
          <p className="text-gray-600 mb-6">
            Select the type of item to customize the form for your needs
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Food Option */}
            <button
              onClick={() => setMenuType('food')}
              className={`p-6 rounded-xl border-2 transition-all ${
                menuType === 'food'
                  ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                  : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
              }`}
            >
              <div className="text-4xl mb-3">🍛</div>
              <h3 className={`font-bold text-lg mb-2 ${menuType === 'food' ? 'text-orange-600' : 'text-gray-900'}`}>
                Main Dish
              </h3>
              <p className="text-sm text-gray-600">
                Food items with meat options (e.g., Pad Thai, Fried Rice, Curry)
              </p>
              {menuType === 'food' && (
                <div className="mt-3 inline-flex items-center text-orange-600 text-sm font-semibold">
                  <Check className="w-4 h-4 mr-1" /> Selected
                </div>
              )}
            </button>

            {/* Snack/Dessert Option */}
            <button
              onClick={() => setMenuType('snack')}
              className={`p-6 rounded-xl border-2 transition-all ${
                menuType === 'snack'
                  ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-200'
                  : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'
              }`}
            >
              <div className="text-4xl mb-3">🍰</div>
              <h3 className={`font-bold text-lg mb-2 ${menuType === 'snack' ? 'text-pink-600' : 'text-gray-900'}`}>
                Snack / Dessert
              </h3>
              <p className="text-sm text-gray-600">
                Appetizers, snacks, desserts (e.g., Spring Rolls, Mango Sticky Rice)
              </p>
              {menuType === 'snack' && (
                <div className="mt-3 inline-flex items-center text-pink-600 text-sm font-semibold">
                  <Check className="w-4 h-4 mr-1" /> Selected
                </div>
              )}
            </button>

            {/* Beverage Option */}
            <button
              onClick={() => setMenuType('beverage')}
              className={`p-6 rounded-xl border-2 transition-all ${
                menuType === 'beverage'
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <div className="text-4xl mb-3">🥤</div>
              <h3 className={`font-bold text-lg mb-2 ${menuType === 'beverage' ? 'text-blue-600' : 'text-gray-900'}`}>
                Beverage
              </h3>
              <p className="text-sm text-gray-600">
                Drinks, smoothies, coffee (e.g., Thai Tea, Coconut Juice)
              </p>
              {menuType === 'beverage' && (
                <div className="mt-3 inline-flex items-center text-blue-600 text-sm font-semibold">
                  <Check className="w-4 h-4 mr-1" /> Selected
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Step 1: Photo Upload & Enhancement */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Camera className="w-6 h-6 mr-2 text-orange-500" />
              1. Food Photo <span className="text-sm font-normal text-gray-500 ml-2">(Optional - Skip if you want)</span>
            </h2>
            <button
              onClick={() => {
                setPhotoAccepted(true);
              }}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
            >
              Skip Photo →
            </button>
          </div>
          
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              💡 <strong>You can skip this step!</strong> Fill in the menu details below first (Name, Description, Price, etc.) and translate them. 
              You can add a photo later or skip it entirely. Photo is optional.
            </p>
          </div>

          {/* AI Image Generation Option */}
          <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Sparkles className="w-6 h-6 text-purple-600 mr-2" />
                <h3 className="text-lg font-bold text-gray-900">Generate Image with AI</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAIGeneration}
                  onChange={(e) => {
                    setUseAIGeneration(e.target.checked);
                    if (!e.target.checked) {
                      setGeneratedImageUrl('');
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            
            {useAIGeneration && (
              <div className="space-y-4">
                {/* Dish Name Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dish Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={aiDishName}
                    onChange={(e) => {
                      setAiDishName(e.target.value);
                      // Auto-sync to main form if empty
                      if (!menuName) {
                        setMenuName(e.target.value);
                      }
                    }}
                    placeholder="e.g., ผัดไทย, 宫保鸡丁, Spaghetti Carbonara"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {menuName && menuName !== aiDishName && `Or use: "${menuName}" from form below`}
                  </p>
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={aiDescription}
                    onChange={(e) => {
                      setAiDescription(e.target.value);
                      // Auto-sync to main form if empty
                      if (!description) {
                        setDescription(e.target.value);
                      }
                    }}
                    placeholder="e.g., เส้นก๋วยเตี๋ยวผัดกับกุ้ง ถั่วงอก และถั่วลิสง / 炒米粉配虾仁、豆芽和花生 / Stir-fried rice noodles with shrimp, bean sprouts, and peanuts"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {description && description !== aiDescription && `Or use: "${description.substring(0, 50)}..." from form below`}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cuisine Type
                    </label>
                    <select
                      value={cuisineType}
                      onChange={(e) => setCuisineType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                    >
                      <option value="Thai">Thai</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Korean">Korean</option>
                      <option value="Vietnamese">Vietnamese</option>
                      <option value="Indian">Indian</option>
                      <option value="Western">Western</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Image Style
                    </label>
                    <select
                      value={imageGenerationStyle}
                      onChange={(e) => setImageGenerationStyle(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                    >
                      <option value="professional">Professional</option>
                      <option value="portrait">Portrait {menuType !== 'food' ? '(Recommended for Snack/Beverage)' : ''}</option>
                      <option value="rustic">Rustic</option>
                      <option value="elegant">Elegant</option>
                      <option value="casual">Casual</option>
                      <option value="modern">Modern</option>
                    </select>
                    {menuType !== 'food' && (
                      <p className="text-xs text-purple-600 mt-1">
                        Tip: Portrait style is recommended for snacks, desserts, and beverages to match typical menu layouts
                      </p>
                    )}
                  </div>
                </div>

                {/* Logo Overlay Option */}
                {restaurantLogo && (
                  <div className="mt-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                    <label className="flex items-center cursor-pointer mb-3">
                      <input
                        type="checkbox"
                        checked={logoOverlay}
                        onChange={(e) => setLogoOverlay(e.target.checked)}
                        className="w-5 h-5 rounded text-purple-500 mr-3"
                      />
                      <span className="text-gray-900 font-semibold">Add Restaurant Logo Overlay</span>
                    </label>
                    
                    {logoOverlay && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Logo Position
                        </label>
                        <select
                          value={logoPosition}
                          onChange={(e) => setLogoPosition(e.target.value as any)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                        >
                          <option value="top-left">Top Left</option>
                          <option value="top-center">Top Center</option>
                          <option value="top-right">Top Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="bottom-center">Bottom Center</option>
                          <option value="bottom-right">Bottom Right</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleGenerateImage}
                  disabled={generatingImage || (!aiDishName && !menuName)}
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {generatingImage ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Image...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Image with AI
                    </>
                  )}
                </button>

                {generatedImageUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-purple-600 mb-2 flex items-center">
                      <Sparkles className="w-4 h-4 mr-1" />
                      AI Generated Image
                    </p>
                    <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl overflow-hidden border-2 border-purple-500 mb-3">
                      <img
                        src={generatedImageUrl}
                        alt="AI Generated"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={useGeneratedImage}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Use This Image
                      </button>
                      <button
                        onClick={rejectGeneratedImage}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mb-4 text-center text-gray-500 font-semibold">OR</div>

          {!originalPhoto && !generatedImageUrl && !originalPhotoUrl ? (
            <>
              <div
                onClick={() => photoInputRef.current?.click()}
                className="border-3 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors"
              >
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  Upload Food Photo
                </p>
                <p className="text-gray-600">
                  Click to select or drag and drop
                </p>
                <input
                  ref={photoInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                />
              </div>

              {/* Choose from Image Library */}
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500 mb-3">หรือเลือกรูปจากรูปที่มีอยู่แล้ว</p>
                
                {/* All Plans: Can select from own restaurant */}
                <button
                  onClick={() => setShowImageGallery(true)}
                  disabled={!restaurantId}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  เลือกจากรูปที่สร้างไว้แล้ว
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  💡 ใช้รูปที่เคยสร้างหรือ enhancement ไว้ในร้านนี้
                </p>
                
                {/* Enterprise: Additional option for cross-restaurant */}
                {userPlan === 'enterprise' && (
                  <div className="mt-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 text-gray-500">
                          🌟 Enterprise Feature
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-purple-600 font-semibold mb-2 mt-3">
                      หรือเลือกจากทุกสาขา (ข้ามร้าน):
                    </p>
                    <button
                      onClick={() => {
                        setShowImageGallery(true);
                        // Will show "All Restaurants" mode in gallery
                      }}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                    >
                      <UploadIcon className="w-5 h-5 mr-2" />
                      เลือกจากคลังทุกสาขา
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      ✨ แชร์รูปข้ามสาขาได้ - ไม่ต้องอัปโหลดซ้ำ!
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Photo comparison */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Original Photo */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Original</p>
                  <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                    <img
                      src={originalPhotoUrl}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Enhanced Photo */}
                {enhancedPhotoUrl && (
                  <div>
                    <p className="text-sm font-semibold text-orange-600 mb-2 flex items-center">
                      <Sparkles className="w-4 h-4 mr-1" />
                      AI Enhanced
                    </p>
                    <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 rounded-xl overflow-hidden border-2 border-orange-500">
                      <img
                        src={enhancedPhotoUrl}
                        alt="Enhanced"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Enhancement Options - Always show so user can re-enhance */}
              <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                {enhancedPhotoUrl && (
                  <div className="mb-3 p-2 bg-green-100 rounded-lg">
                    <p className="text-sm text-green-700 font-medium">
                      ✅ Image enhanced! You can modify settings below and re-enhance to adjust further.
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Enhancement Style
                  </label>
                  <select
                    value={enhancementStyle}
                    onChange={(e) => setEnhancementStyle(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                  >
                    <option value="professional">Professional</option>
                    <option value="natural">Natural</option>
                    <option value="vibrant">Vibrant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Instructions (Optional)
                  </label>
                  <textarea
                    value={userInstruction}
                    onChange={(e) => setUserInstruction(e.target.value)}
                    placeholder="E.g., Make it brighter, Change plate to white, Add more contrast..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tell AI how you want the image enhanced
                  </p>
                </div>

                {/* Logo Overlay for Enhancement */}
                {restaurantLogo && (
                  <div className="pt-3 border-t border-purple-300">
                    <label className="flex items-center cursor-pointer mb-3">
                      <input
                        type="checkbox"
                        checked={logoOverlay}
                        onChange={(e) => setLogoOverlay(e.target.checked)}
                        className="w-5 h-5 rounded text-purple-500 mr-3"
                      />
                      <span className="text-gray-900 font-semibold">Add Restaurant Logo Overlay</span>
                    </label>

                    {logoOverlay && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Logo Position
                          </label>
                          <select
                            value={logoPosition}
                            onChange={(e) => setLogoPosition(e.target.value as any)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                          >
                            <option value="top-left">Top Left</option>
                            <option value="top-center">Top Center</option>
                            <option value="top-right">Top Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="bottom-center">Bottom Center</option>
                            <option value="bottom-right">Bottom Right</option>
                          </select>
                        </div>
                        {/* Update Logo Position Button - appears after enhanced/accepted photo */}
                        {(enhancedPhotoUrl || photoAccepted) && restaurantLogo && (
                          <button
                            onClick={handleApplyLogoOnly}
                            disabled={applyingLogo}
                            className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {applyingLogo ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Updating Position...
                              </>
                            ) : (
                              'Update Logo Position'
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {!enhancedPhotoUrl ? (
                  <>
                    <button
                      onClick={handleAcceptWithLogo}
                      disabled={applyingLogo}
                      className="inline-flex items-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      {applyingLogo ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {logoOverlay ? 'Adding Logo...' : 'Processing...'}
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          Use This Photo
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleEnhancePhoto}
                      disabled={enhancing || applyingLogo}
                      className="inline-flex items-center px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      {enhancing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Enhancing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5 mr-2" />
                          AI Enhance (Optional)
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={acceptPhoto}
                      className="inline-flex items-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Use Enhanced
                    </button>
                    <button
                      onClick={handleEnhancePhoto}
                      disabled={enhancing || applyingLogo}
                      className="inline-flex items-center px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      {enhancing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Re-enhancing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5 mr-2" />
                          Re-enhance (Uses Credit)
                        </>
                      )}
                    </button>
                    <button
                      onClick={rejectEnhancement}
                      className="inline-flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Use Original Instead
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setOriginalPhoto(null);
                    setOriginalPhotoUrl('');
                    setEnhancedPhotoUrl('');
                    setPhotoAccepted(false);
                  }}
                  className="inline-flex items-center px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-colors"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Remove Photo
                </button>
              </div>

              {photoAccepted && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-700 font-medium">Photo accepted! You can continue filling other fields.</span>
                </div>
              )}
              {!photoAccepted && (originalPhoto || generatedImageUrl || originalPhotoUrl) && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-700 text-sm">
                    💡 <strong>Tip:</strong> You can continue filling other fields below. Photo is optional - you can add it later or skip it.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Menu Name */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              2. Menu Name
            </h2>

            <div className="space-y-4">
              {/* Original Language Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Menu Name (Your Language) *
                </label>
                <input
                  type="text"
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  placeholder="e.g., ผัดไทย, 宫保鸡丁, Spaghetti Carbonara"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                />
              </div>

              {/* Translation Options */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={translateName}
                    onChange={(e) => setTranslateName(e.target.checked)}
                    className="w-5 h-5 rounded text-orange-500 mr-2"
                  />
                  <span className="text-gray-900">Translate to English</span>
                </label>

                {translateName && (
                  <button
                    onClick={handleTranslateName}
                    disabled={!menuName || translatingName}
                    className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {translatingName ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Translating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-1" />
                        Translate
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* English Translation */}
              {translateName && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      English Translation
                    </label>
                    <input
                      type="text"
                      value={menuNameEn}
                      onChange={(e) => setMenuNameEn(e.target.value)}
                      placeholder="English name will appear here"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                    />
                  </div>

                  {/* Show Both Languages */}
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBothLanguagesName}
                      onChange={(e) => setShowBothLanguagesName(e.target.checked)}
                      className="w-5 h-5 rounded text-orange-500 mr-2"
                    />
                    <span className="text-gray-900">Show both languages on menu</span>
                  </label>

                  {/* Primary Language Selection */}
                  {showBothLanguagesName && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Primary Language (larger text)
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="primaryName"
                            checked={primaryLanguageName === 'original'}
                            onChange={() => setPrimaryLanguageName('original')}
                            className="mr-2"
                          />
                          <span className="text-gray-900 font-medium">Original Language</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="primaryName"
                            checked={primaryLanguageName === 'english'}
                            onChange={() => setPrimaryLanguageName('english')}
                            className="mr-2"
                          />
                          <span className="text-gray-900 font-medium">English</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  {menuName && (
                    <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200">
                      <p className="text-xs font-semibold text-gray-700 mb-3 uppercase">PREVIEW:</p>
                      {showBothLanguagesName && menuNameEn ? (
                        <div key={`${primaryLanguageName}-name`}>
                          {primaryLanguageName === 'original' ? (
                            <>
                              <p className="text-2xl font-bold text-gray-900 mb-1">{menuName}</p>
                              <p className="text-base text-gray-600">{menuNameEn}</p>
                            </>
                          ) : (
                            <>
                              <p className="text-2xl font-bold text-gray-900 mb-1">{menuNameEn}</p>
                              <p className="text-base text-gray-600">{menuName}</p>
                            </>
                          )}
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">
                          {menuNameEn || menuName}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        {/* Step 3: Description */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              3. Description
            </h2>

            <div className="space-y-4">
              {/* Original Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Your Language)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., ก๋วยเตี๋ยวเส้นเล็กผัดกับไข่ กุ้งสด ถั่วงอก และถั่วลิสงป่น / 细米粉配鸡蛋、鲜虾、豆芽和碎花生 / Thin rice noodles stir-fried with egg, fresh shrimp, bean sprouts, and crushed peanuts"
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                />
              </div>

              {/* Translation Options */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={translateDescription}
                    onChange={(e) => setTranslateDescription(e.target.checked)}
                    className="w-5 h-5 rounded text-orange-500 mr-2"
                  />
                  <span className="text-gray-900">Translate to English</span>
                </label>

                {translateDescription && description && (
                  <button
                    onClick={handleTranslateDescription}
                    disabled={translatingDesc}
                    className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {translatingDesc ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Translating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-1" />
                        Translate
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* English Translation */}
              {translateDescription && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      English Translation
                    </label>
                    <textarea
                      value={descriptionEn}
                      onChange={(e) => setDescriptionEn(e.target.value)}
                      placeholder="English description will appear here"
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                    />
                  </div>

                  {/* Show Both Languages */}
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBothLanguagesDesc}
                      onChange={(e) => setShowBothLanguagesDesc(e.target.checked)}
                      className="w-5 h-5 rounded text-orange-500 mr-2"
                    />
                    <span className="text-gray-900">Show both languages on menu</span>
                  </label>

                  {/* Primary Language */}
                  {showBothLanguagesDesc && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Primary Language (larger text)
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="primaryDesc"
                            checked={primaryLanguageDesc === 'original'}
                            onChange={() => setPrimaryLanguageDesc('original')}
                            className="mr-2"
                          />
                          <span className="text-gray-900 font-medium">Original Language</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="primaryDesc"
                            checked={primaryLanguageDesc === 'english'}
                            onChange={() => setPrimaryLanguageDesc('english')}
                            className="mr-2"
                          />
                          <span className="text-gray-900 font-medium">English</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  {description && (
                    <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200">
                      <p className="text-xs font-semibold text-gray-700 mb-3 uppercase">PREVIEW:</p>
                      {showBothLanguagesDesc && descriptionEn ? (
                        <div key={`${primaryLanguageDesc}-desc`}>
                          {primaryLanguageDesc === 'original' ? (
                            <>
                              <p className="text-base font-medium text-gray-900 mb-2">{description}</p>
                              <p className="text-sm text-gray-600">{descriptionEn}</p>
                            </>
                          ) : (
                            <>
                              <p className="text-base font-medium text-gray-900 mb-2">{descriptionEn}</p>
                              <p className="text-sm text-gray-600">{description}</p>
                            </>
                          )}
                        </div>
                      ) : (
                        <p className="text-base font-medium text-gray-900">
                          {descriptionEn || description}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        {/* Step 4: Price & Category */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              4. Price & Category
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (NZD) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.50"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition text-gray-900 bg-white font-medium"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">
                    NZD
                  </span>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition text-gray-900 bg-white font-medium"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.nameEn})
                    </option>
                  ))}
                </select>
                
                {/* Existing Categories List with Edit/Delete */}
                <div className="mt-4 space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {editingCategory === cat.id ? (
                        <div className="flex-1 grid md:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editCategoryName}
                            onChange={(e) => setEditCategoryName(e.target.value)}
                            placeholder="Category name"
                            className="px-3 py-1.5 text-sm border-2 border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 bg-white"
                          />
                          <input
                            type="text"
                            value={editCategoryNameEn}
                            onChange={(e) => setEditCategoryNameEn(e.target.value)}
                            placeholder="English name"
                            className="px-3 py-1.5 text-sm border-2 border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 bg-white"
                          />
                        </div>
                      ) : (
                        <div className="flex-1">
                          <span className="text-gray-900 font-medium">{cat.name}</span>
                          <span className="text-gray-500 text-sm ml-2">({cat.nameEn})</span>
                        </div>
                      )}
                      <div className="flex gap-2 ml-3">
                        {editingCategory === cat.id ? (
                          <>
                            <button
                              onClick={saveEditCategory}
                              disabled={translatingCategory}
                              className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded font-semibold disabled:opacity-50"
                            >
                              {translatingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                            </button>
                            <button
                              onClick={cancelEditCategory}
                              className="px-3 py-1 text-sm bg-gray-300 hover:bg-gray-400 text-gray-900 rounded font-semibold"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditCategory(cat)}
                              className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteCategory(cat.id)}
                              className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded font-semibold"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  className="mt-3 text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add New Category
                </button>
              </div>
            </div>

            {/* Add Category Form */}
            {showAddCategory && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Add New Category</h3>
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name (your language)"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 bg-white"
                    />
                    {newCategoryName && (
                      <button
                        onClick={handleTranslateCategory}
                        disabled={translatingCategory}
                        className="mt-2 inline-flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        {translatingCategory ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Translating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 mr-1" />
                            Translate to English
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={newCategoryNameEn}
                    onChange={(e) => setNewCategoryNameEn(e.target.value)}
                    placeholder="English translation (or click Translate button)"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 bg-white"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={addCategory}
                    disabled={!newCategoryName || translatingCategory}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {translatingCategory ? 'Translating...' : 'Add'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategoryName('');
                      setNewCategoryNameEn('');
                    }}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {/* Best Seller Toggle */}
            <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBestSeller}
                  onChange={(e) => setIsBestSeller(e.target.checked)}
                  className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-xl">⭐</span>
                    Mark as Best Seller
                  </span>
                  <p className="text-xs text-gray-600 mt-1">
                    This item will be featured prominently in your menu (depending on template)
                  </p>
                </div>
              </label>
            </div>
          </div>

        {/* Step 5: Choose Meats (Only for Main Dish) */}
        {menuType === 'food' && (
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              5. Choose Meats
            </h2>

            <label className="flex items-center cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={hasMeats}
                onChange={(e) => setHasMeats(e.target.checked)}
                className="w-5 h-5 rounded text-orange-500 mr-2"
              />
              <span className="text-gray-900 font-medium">This menu allows customers to choose meat</span>
            </label>

            {hasMeats && (
              <div className="space-y-4">
                {meats.map((meat, index) => (
                  <div key={meat.id} className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border-2 border-orange-200">
                    <div className="flex items-start gap-3">
                      <span className="text-lg font-bold text-orange-600 mt-2">🥩 #{index + 1}</span>
                      <div className="flex-1 space-y-3">
                        {/* Meat name (original language) */}
                        <div>
                          <input
                            type="text"
                            value={meat.name}
                            onChange={(e) => updateMeat(meat.id, 'name', e.target.value)}
                            placeholder="Meat name (your language) e.g., เนื้อไก่, หมู"
                            className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 bg-white"
                          />
                          {meat.name && (
                            <button
                              onClick={() => translateMeat(meat.id, meat.name)}
                              disabled={translatingMeat === meat.id}
                              className="mt-2 inline-flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                              {translatingMeat === meat.id ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Translating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Translate
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* English translation */}
                        <input
                          type="text"
                          value={meat.nameEn}
                          onChange={(e) => updateMeat(meat.id, 'nameEn', e.target.value)}
                          placeholder="English translation e.g., Chicken, Pork, Beef"
                          className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 bg-white"
                        />

                        {/* Price or Free */}
                        <div className="space-y-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={meat.price === '0'}
                              onChange={(e) => updateMeat(meat.id, 'price', e.target.checked ? '0' : '')}
                              className="w-4 h-4 rounded text-green-500 mr-2"
                            />
                            <span className="text-gray-900 font-medium text-sm">Free (No extra charge)</span>
                          </label>
                          
                          {meat.price !== '0' && (
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">$</span>
                              <input
                                type="number"
                                step="0.50"
                                value={meat.price}
                                onChange={(e) => updateMeat(meat.id, 'price', e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-8 pr-16 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 bg-white font-medium"
                              />
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">NZD</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeMeat(meat.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove meat option"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addMeat}
                  className="w-full py-3 border-2 border-dashed border-orange-300 rounded-lg text-orange-600 hover:border-orange-500 hover:text-orange-700 hover:bg-orange-50 transition-colors font-semibold flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add More Meat Options
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 5/6: Add-ons (Step 5 for snack/beverage, Step 6 for food) */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {menuType === 'food' ? '6' : '5'}. Add-ons (Optional)
            </h2>

            <label className="flex items-center cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={hasAddOns}
                onChange={(e) => setHasAddOns(e.target.checked)}
                className="w-5 h-5 rounded text-orange-500 mr-2"
              />
              <span className="text-gray-900 font-medium">This menu has add-ons</span>
            </label>

            {hasAddOns && (
              <div className="space-y-4">
                {addOns.map((addon, index) => (
                  <div key={addon.id} className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="flex items-start gap-3">
                      <span className="text-lg font-bold text-gray-600 mt-2">#{index + 1}</span>
                      <div className="flex-1 space-y-3">
                        {/* Add-on name (original language) */}
                        <div>
                          <input
                            type="text"
                            value={addon.name}
                            onChange={(e) => updateAddOn(addon.id, 'name', e.target.value)}
                            placeholder="Add-on name (your language)"
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 bg-white"
                          />
                          {addon.name && (
                            <button
                              onClick={() => translateAddOn(addon.id, addon.name)}
                              disabled={translatingAddOn === addon.id}
                              className="mt-2 inline-flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                              {translatingAddOn === addon.id ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Translating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Translate
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* English translation */}
                        <input
                          type="text"
                          value={addon.nameEn}
                          onChange={(e) => updateAddOn(addon.id, 'nameEn', e.target.value)}
                          placeholder="English translation"
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 bg-white"
                        />

                        {/* Price */}
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">$</span>
                          <input
                            type="number"
                            step="0.50"
                            value={addon.price}
                            onChange={(e) => updateAddOn(addon.id, 'price', e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-8 pr-16 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 bg-white font-medium"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">NZD</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeAddOn(addon.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove add-on"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addAddOn}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-colors font-semibold flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add More Add-ons
                </button>
              </div>
            )}
          </div>

        {/* Preview & Save */}
        {menuName && selectedCategory && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Preview & Save
              </h2>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
              >
                <Eye className="w-5 h-5 mr-2" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </button>
            </div>

            {showPreview && (
              <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-300">
                <p className="text-xs font-semibold text-gray-700 mb-4 uppercase tracking-wide">🎨 MENU PREVIEW:</p>
                <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-auto border-2 border-gray-200">
                  {/* Photo */}
                  <div className="aspect-square rounded-xl overflow-hidden mb-6 shadow-md">
                    <img
                      src={generatedImageUrl || enhancedPhotoUrl || originalPhotoUrl}
                      alt={menuName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Name */}
                  <div className="mb-4">
                    {showBothLanguagesName && menuNameEn ? (
                      <div key={`preview-${primaryLanguageName}-name`}>
                        {primaryLanguageName === 'original' ? (
                          <>
                            <h3 className="text-3xl font-bold text-gray-900 mb-1">{menuName}</h3>
                            <p className="text-lg text-gray-600">{menuNameEn}</p>
                          </>
                        ) : (
                          <>
                            <h3 className="text-3xl font-bold text-gray-900 mb-1">{menuNameEn}</h3>
                            <p className="text-lg text-gray-600">{menuName}</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <h3 className="text-3xl font-bold text-gray-900">{menuNameEn || menuName}</h3>
                    )}
                  </div>

                  {/* Description */}
                  {description && (
                    <div className="mb-4">
                      {showBothLanguagesDesc && descriptionEn ? (
                        <div key={`preview-${primaryLanguageDesc}-desc`}>
                          {primaryLanguageDesc === 'original' ? (
                            <>
                              <p className="text-base text-gray-800 leading-relaxed mb-2">{description}</p>
                              <p className="text-sm text-gray-600 leading-relaxed">{descriptionEn}</p>
                            </>
                          ) : (
                            <>
                              <p className="text-base text-gray-800 leading-relaxed mb-2">{descriptionEn}</p>
                              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                            </>
                          )}
                        </div>
                      ) : (
                        <p className="text-base text-gray-800 leading-relaxed">{descriptionEn || description}</p>
                      )}
                    </div>
                  )}

                  {/* Price */}
                  {price && (
                    <div className="mb-4">
                      <p className="text-3xl font-bold text-orange-600">
                        ${price} <span className="text-xl">NZD</span>
                      </p>
                    </div>
                  )}

                  {/* Category */}
                  {selectedCategory && (
                    <div className="mb-3">
                      {(() => {
                        const cat = categories.find(c => c.id === selectedCategory);
                        return (
                          <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                            {cat?.nameEn || cat?.name}
                            {cat?.nameEn && cat?.name && cat.nameEn !== cat.name && (
                              <span className="text-gray-500 ml-1">({cat.name})</span>
                            )}
                          </span>
                        );
                      })()}
                    </div>
                  )}

                  {/* Choose Meats (Only for Main Dish) */}
                  {menuType === 'food' && hasMeats && meats.filter(m => m.name).length > 0 && (
                    <div className="mt-6 pt-4 border-t-2 border-orange-200">
                      <p className="text-sm font-bold text-orange-700 mb-3 uppercase tracking-wide flex items-center">
                        🥩 Choose Meats:
                      </p>
                      <div className="space-y-2">
                        {meats.map((meat) => (
                          meat.name && (
                            <div key={meat.id} className="flex justify-between items-center text-gray-800 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                              <div className="flex-1">
                                <span className="font-medium block">• {meat.nameEn || meat.name}</span>
                                {meat.nameEn && meat.name !== meat.nameEn && (
                                  <span className="text-xs text-gray-600 ml-3">({meat.name})</span>
                                )}
                              </div>
                              {meat.price === '0' ? (
                                <span className="text-green-600 font-bold whitespace-nowrap ml-3">FREE</span>
                              ) : (
                                meat.price && <span className="text-orange-600 font-bold whitespace-nowrap ml-3">+${meat.price} NZD</span>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add-ons */}
                  {hasAddOns && addOns.filter(a => a.name).length > 0 && (
                    <div className="mt-6 pt-4 border-t-2 border-gray-200">
                      <p className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Add-ons:</p>
                      <div className="space-y-2">
                        {addOns.map((addon) => (
                          addon.name && (
                            <div key={addon.id} className="flex justify-between items-center text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">
                              <div className="flex-1">
                                <span className="font-medium block">• {addon.nameEn || addon.name}</span>
                                {addon.nameEn && addon.name !== addon.nameEn && (
                                  <span className="text-xs text-gray-600 ml-3">({addon.name})</span>
                                )}
                              </div>
                              {addon.price && <span className="text-orange-600 font-bold whitespace-nowrap ml-3">+${addon.price} NZD</span>}
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center shadow-lg disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-6 h-6 mr-2" />
                  Save Menu Item
                </>
              )}
            </button>
          </div>
        )}

        {/* Image Gallery Modal */}
        {showImageGallery && userId && restaurantId && (
          <ImageGallery
            userId={userId}
            currentRestaurantId={restaurantId}
            allowCrossRestaurant={userPlan === 'enterprise'}
            onSelectImage={(imageUrl) => {
              setOriginalPhotoUrl(imageUrl);
              setPhotoAccepted(true);
              setShowImageGallery(false);
            }}
            onClose={() => setShowImageGallery(false)}
          />
        )}
      </div>
    </div>
  );
}
