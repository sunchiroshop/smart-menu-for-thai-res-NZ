/**
 * API Client for Smart Menu Backend
 * Connects Frontend to Python Backend API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Translation API
 */
export interface TranslateRequest {
  text: string;
  source_lang: string;
  target_lang?: string;
}

export interface TranslateResponse {
  original_text: string;
  translated_text: string;
  source_lang: string;
  target_lang: string;
}

/**
 * Translate text using Gemini AI
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string = 'English'
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        source_lang: sourceLang,
        target_lang: targetLang,
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    const data: TranslateResponse = await response.json();
    return data.translated_text;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Failed to translate text. Please try again.');
  }
}

/**
 * Translate multiple texts in batch
 */
export async function translateBatch(
  texts: string[],
  sourceLang: string,
  targetLang: string = 'English'
): Promise<Array<{ original: string; translated: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/translate/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts,
        source_lang: sourceLang,
      }),
    });

    if (!response.ok) {
      throw new Error(`Batch translation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.translations;
  } catch (error) {
    console.error('Batch translation error:', error);
    throw new Error('Failed to translate texts. Please try again.');
  }
}

/**
 * Health check
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

/**
 * Detect language of text (helper function)
 */
export function detectLanguage(text: string): string {
  // Simple language detection based on character patterns
  if (/[\u0E00-\u0E7F]/.test(text)) return 'Thai';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'Chinese';
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'Japanese';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'Korean';
  if (/[\u0600-\u06FF]/.test(text)) return 'Arabic';
  if (/^[a-zA-Z\s]+$/.test(text)) return 'English';
  
  return 'Unknown';
}

/**
 * Generate food image from description using Imagen 3 API
 */
export interface GenerateImageRequest {
  dish_name: string;
  description: string;
  cuisine_type?: string;
  style?: 'professional' | 'rustic' | 'elegant' | 'casual' | 'modern' | 'portrait';
  user_id?: string; // Required for tracking usage limits
  logo_overlay?: {
    enabled: boolean;
    logo_url: string;
    position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    size?: 'small' | 'medium' | 'large'; // Logo size: small=12%, medium=18%, large=25%
  };
}

export interface GenerateImageResponse {
  success: boolean;
  generated_image?: string; // data URL
  generated_image_url?: string; // Supabase public URL
  generated_image_base64?: string;
  generation_prompt?: string;
  error?: string;
  note?: string;
}

export async function generateFoodImage(
  request: GenerateImageRequest
): Promise<GenerateImageResponse> {
  try {
    console.log('🎨 Generating image with request:', request);
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    console.log('📡 API URL:', `${API_BASE_URL}/api/ai/generate-image`);
    
    const response = await fetch(`${API_BASE_URL}/api/ai/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dish_name: request.dish_name,
        description: request.description,
        cuisine_type: request.cuisine_type || 'general',
        style: request.style || 'professional',
        user_id: request.user_id || 'default', // Include user_id for usage tracking (default if not provided)
        logo_overlay: request.logo_overlay, // Include logo overlay settings
      }),
    });

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || response.statusText };
      }
      
      throw new Error(errorData.detail || errorData.error || `Image generation failed: ${response.statusText}`);
    }

    const data: GenerateImageResponse = await response.json();
    console.log('✅ Response data:', { 
      success: data.success, 
      hasImage: !!data.generated_image,
      error: data.error,
      note: data.note 
    });
    
    return data;
  } catch (error) {
    console.error('❌ Image generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate image. Please try again.',
    };
  }
}

/**
 * Enhance food image using AI
 */
export interface EnhanceImageResponse {
  success: boolean;
  enhanced_image_url?: string; // Public URL from Supabase
  enhanced_image?: string; // Base64 data URL for preview
  enhanced_image_base64?: string;
  style?: string;
  model_used?: string;
  note?: string;
  error?: string;
}

export async function enhanceImage(
  imageFile: File,
  style: 'professional' | 'natural' | 'vibrant' = 'professional',
  userInstruction?: string,
  logoOverlay?: {
    enabled: boolean;
    logo_url: string;
    position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    size?: 'small' | 'medium' | 'large'; // Logo size: small=12%, medium=18%, large=25%
  },
  userId?: string // Required for tracking usage limits
): Promise<EnhanceImageResponse> {
  try {
    console.log('🎨 Enhancing image with AI...');
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    console.log('📡 API URL:', `${API_BASE_URL}/api/ai/enhance-image-upload`);
    
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('style', style);
    if (userInstruction && userInstruction.trim()) {
      formData.append('user_instruction', userInstruction.trim());
    }
    if (logoOverlay) {
      formData.append('logo_overlay', JSON.stringify(logoOverlay));
    }
    // Always pass user_id for usage tracking (default if not provided)
    formData.append('user_id', userId || 'default');
    
    const response = await fetch(`${API_BASE_URL}/api/ai/enhance-image-upload`, {
      method: 'POST',
      body: formData,
    });

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || response.statusText };
      }
      
      throw new Error(errorData.detail || errorData.error || `Image enhancement failed: ${response.statusText}`);
    }

    const data: EnhanceImageResponse = await response.json();
    console.log('✅ Response data:', { 
      success: data.success, 
      hasImage: !!data.enhanced_image_url || !!data.enhanced_image,
      publicUrl: data.enhanced_image_url,
      error: data.error,
      note: data.note 
    });
    
    return data;
  } catch (error) {
    console.error('❌ Image enhancement error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enhance image. Please try again.',
    };
  }
}

/**
 * Apply logo overlay ONLY (no AI enhancement)
 * This is for users who just want to add their restaurant logo without modifying the image
 */
export interface ApplyLogoResponse {
  success: boolean;
  image_url?: string; // Public URL from Supabase
  image?: string; // Base64 data URL for preview
  image_base64?: string;
  note?: string;
  error?: string;
}

export async function applyLogoOnly(
  imageFile: File,
  logoUrl: string,
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' = 'top-right',
  logoSize: 'small' | 'medium' | 'large' = 'medium' // Logo size: small=12%, medium=18%, large=25%
): Promise<ApplyLogoResponse> {
  try {
    console.log('🎨 Applying logo only (no AI enhancement)...');

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    console.log('📡 API URL:', `${API_BASE_URL}/api/image/apply-logo`);

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('logo_url', logoUrl);
    formData.append('position', position);
    formData.append('logo_size', logoSize);

    const response = await fetch(`${API_BASE_URL}/api/image/apply-logo`, {
      method: 'POST',
      body: formData,
    });

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || response.statusText };
      }

      throw new Error(errorData.detail || errorData.error || `Failed to apply logo: ${response.statusText}`);
    }

    const data: ApplyLogoResponse = await response.json();
    console.log('✅ Response data:', {
      success: data.success,
      hasImage: !!data.image_url || !!data.image,
      publicUrl: data.image_url,
      error: data.error,
      note: data.note
    });

    return data;
  } catch (error) {
    console.error('❌ Apply logo error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply logo. Please try again.',
    };
  }
}

export default {
  translateText,
  translateBatch,
  checkBackendHealth,
  detectLanguage,
  enhanceImage,
  applyLogoOnly,
};

