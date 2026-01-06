/**
 * AI Service Client - Real AI Enhancement & Generation
 * Connects to Smart Menu AI Backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================
// Types
// ============================================================

export interface EnhancementResult {
  status: 'analysis_complete' | 'error';
  style: string;
  analysis: string;
  note?: string;
  error?: string;
  message?: string;
}

export interface GenerationResult {
  status: 'prompt_ready' | 'error';
  menu_item: {
    name: string;
    description: string;
    category: string;
  };
  generation_prompt: string;
  note?: string;
  alternative?: string;
  error?: string;
  message?: string;
}

export interface FoodAnalysisResult {
  status: 'analysis_complete' | 'error';
  analysis: string;
  note?: string;
  error?: string;
  message?: string;
}

export interface MenuExtractionResult {
  status: 'extraction_complete' | 'error';
  extracted_text: string;
  note?: string;
  error?: string;
  message?: string;
}

export type EnhancementStyle = 'natural' | 'vivid' | 'professional';

// ============================================================
// AI Service
// ============================================================

export class AIService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Enhance food photo with AI analysis
   */
  async enhancePhoto(
    file: File,
    style: EnhancementStyle = 'professional'
  ): Promise<EnhancementResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('style', style);

      const response = await fetch(`${this.baseURL}/api/ai/enhance-photo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Enhancement failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Photo enhancement error:', error);
      throw error;
    }
  }

  /**
   * Analyze food image and get suggestions
   */
  async analyzeFoodImage(file: File): Promise<FoodAnalysisResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseURL}/api/ai/analyze-food`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Analysis failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Food analysis error:', error);
      throw error;
    }
  }

  /**
   * Generate photo prompt from menu item description
   */
  async generatePhotoPrompt(menuItem: {
    name: string;
    description: string;
    category?: string;
    language?: string;
  }): Promise<GenerationResult> {
    try {
      const response = await fetch(`${this.baseURL}/api/ai/generate-photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: menuItem.name,
          description: menuItem.description,
          category: menuItem.category || 'Main Course',
          language: menuItem.language || 'English',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Generation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Photo generation error:', error);
      throw error;
    }
  }

  /**
   * Extract menu items from image/PDF
   */
  async extractMenu(file: File): Promise<MenuExtractionResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseURL}/api/ai/extract-menu`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Extraction failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Menu extraction error:', error);
      throw error;
    }
  }

  /**
   * Batch process menu (extract + translate)
   */
  async processMenuBatch(
    file: File,
    targetLanguage: string = 'English',
    generateImages: boolean = false
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_language', targetLanguage);
      formData.append('generate_images', generateImages.toString());

      const response = await fetch(`${this.baseURL}/api/ai/process-menu-batch`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Batch processing failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Batch processing error:', error);
      throw error;
    }
  }

  /**
   * Get available features and pricing
   */
  async getFeatures(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/features`);
      if (!response.ok) throw new Error('Failed to fetch features');
      return await response.json();
    } catch (error) {
      console.error('Features fetch error:', error);
      throw error;
    }
  }

  /**
   * Get pricing information
   */
  async getPricing(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/pricing`);
      if (!response.ok) throw new Error('Failed to fetch pricing');
      return await response.json();
    } catch (error) {
      console.error('Pricing fetch error:', error);
      throw error;
    }
  }

  /**
   * Check API health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export for use in components
export default aiService;

