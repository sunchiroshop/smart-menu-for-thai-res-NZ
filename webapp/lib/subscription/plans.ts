// Subscription Plans Configuration

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  description: string;
  features: string[];
  limits: {
    menusPerMonth: number;
    qrCodes: number;
    translations: number;
    photoEnhancements: number;
    languages: number | string;
    storage: string;
    aiAssistant: boolean;
  };
  // Feature access flags
  featuresAccess: {
    canUseEnhancement: boolean;
    imageGenerationLimit: number; // per month
  };
  popular?: boolean;
  color: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Trial',
    price: 0,
    currency: 'NZD',
    interval: 'month',
    description: '14-day free trial - Test all features risk-free',
    color: 'blue',
    features: [
      '✅ 14 days full access',
      '✅ Up to 20 menu items',
      '✅ 5 AI image generations',
      '✅ 5 AI photo enhancements',
      '✅ Smart QR Menu',
      '✅ Original + English (2 languages)',
      '✅ Basic POS System',
      '⚠️ "Powered by Smart Menu" branding',
    ],
    limits: {
      menusPerMonth: 20,
      qrCodes: 1,
      translations: -1,
      photoEnhancements: 5,
      languages: 2,
      storage: '1GB',
      aiAssistant: false,
    },
    featuresAccess: {
      canUseEnhancement: true,
      imageGenerationLimit: 5,
    },
  },
  {
    id: 'basic',
    name: 'Starter',
    price: 39,
    currency: 'NZD',
    interval: 'month',
    description: 'Perfect for small takeaway shops',
    color: 'blue',
    features: [
      '✅ Up to 30 menu items',
      '✅ 30 AI image generations/month',
      '✅ 30 AI photo enhancements/month',
      '✅ Smart QR Menu',
      '✅ Original + English (2 languages)',
      '✅ Custom logo (small size)',
      '✅ Basic POS System',
      '⚠️ "Powered by Smart Menu" branding',
      '❌ Theme color customization',
      '❌ Cover image',
    ],
    limits: {
      menusPerMonth: 30,
      qrCodes: 1,
      translations: -1,
      photoEnhancements: 30,
      languages: 2,
      storage: '5GB',
      aiAssistant: false,
    },
    featuresAccess: {
      canUseEnhancement: true,
      imageGenerationLimit: 30,
    },
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 89,
    currency: 'NZD',
    interval: 'month',
    description: 'Most Popular - Casual dining restaurants',
    color: 'orange',
    popular: true,
    features: [
      '✅ Unlimited menu items',
      '✅ 200 AI image generations/month',
      '✅ 200 AI photo enhancements/month',
      '✅ Smart QR Menu',
      '✅ Original + English (2 languages)',
      '✅ Custom logo (prominent header)',
      '✅ Theme color customization',
      '✅ Cover image',
      '✅ Full POS System',
      '⚠️ "Powered by Smart Menu" branding',
    ],
    limits: {
      menusPerMonth: -1,
      qrCodes: 1,
      translations: -1,
      photoEnhancements: 200,
      languages: 2,
      storage: '20GB',
      aiAssistant: false,
    },
    featuresAccess: {
      canUseEnhancement: true,
      imageGenerationLimit: 200,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    currency: 'NZD',
    interval: 'month',
    description: 'Fine dining & Restaurant chains',
    color: 'purple',
    features: [
      '✅ Unlimited menu items',
      '✅ 500 AI image generations/month',
      '✅ 500 AI photo enhancements/month',
      '✅ Smart QR Menu',
      '✅ 13+ languages (Thai, Chinese, Japanese, Korean, etc.)',
      '✅ White label (remove branding)',
      '✅ Full logo customization',
      '✅ Theme color customization',
      '✅ Cover image',
      '✅ Full POS + Multi-branch support',
      '✅ Priority support',
    ],
    limits: {
      menusPerMonth: -1,
      qrCodes: 1,
      translations: -1,
      photoEnhancements: 500,
      languages: 13,
      storage: '100GB',
      aiAssistant: true,
    },
    featuresAccess: {
      canUseEnhancement: true,
      imageGenerationLimit: 500,
    },
  },
];

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'zh', name: 'Chinese (Mandarin)', flag: '🇨🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾' },
];

export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
}

export function getDefaultPlan(): SubscriptionPlan {
  return SUBSCRIPTION_PLANS[0]; // Free trial
}
