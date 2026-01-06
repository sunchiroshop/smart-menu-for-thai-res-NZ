import { Plus, Star, Heart, Utensils, Flame } from 'lucide-react';

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
  is_best_seller?: boolean;
  meats?: Array<{name: string; nameEn?: string; price: string}>;
  addOns?: Array<{name: string; nameEn?: string; price: string}>;
}

interface CasualProps {
  menus: MenuItem[];
  groupedMenus: Record<string, MenuItem[]>;
  themeColor: string;
  onItemClick: (item: MenuItem) => void;
  selectedLanguage?: string;
}

// Translations for UI elements
const translations: Record<string, Record<string, string>> = {
  bestseller: {
    'original': 'สินค้าขายดี', 'th': 'สินค้าขายดี', 'en': 'Bestseller', 'zh': '畅销品',
    'ja': 'ベストセラー', 'ko': '베스트셀러', 'vi': 'Bán chạy nhất', 'hi': 'बेस्टसेलर',
    'es': 'Más vendido', 'fr': 'Meilleures ventes', 'de': 'Bestseller', 'id': 'Terlaris', 'ms': 'Terlaris',
  },
  popularDishes: {
    'original': 'เมนูยอดนิยม', 'th': 'เมนูยอดนิยม', 'en': 'Popular dishes', 'zh': '热门菜品',
    'ja': '人気料理', 'ko': '인기 메뉴', 'vi': 'Món phổ biến', 'hi': 'लोकप्रिय व्यंजन',
    'es': 'Platos populares', 'fr': 'Plats populaires', 'de': 'Beliebte Gerichte', 'id': 'Hidangan Populer', 'ms': 'Hidangan Popular',
  },
  add: {
    'original': 'เพิ่ม', 'th': 'เพิ่ม', 'en': 'Add', 'zh': '添加',
    'ja': '追加', 'ko': '추가', 'vi': 'Thêm', 'hi': 'जोड़ें',
    'es': 'Añadir', 'fr': 'Ajouter', 'de': 'Hinzufügen', 'id': 'Tambah', 'ms': 'Tambah',
  },
};

export default function Casual({ menus, groupedMenus, themeColor, onItemClick, selectedLanguage = 'original' }: CasualProps) {
  const isBestsellerCategory = (category: string) => category.toLowerCase() === 'bestseller';
  const t = (key: keyof typeof translations) => translations[key][selectedLanguage] || translations[key]['en'];

  const categoryColors = [
    'from-orange-100 to-red-100',
    'from-blue-100 to-purple-100',
    'from-green-100 to-teal-100',
    'from-pink-100 to-rose-100',
    'from-yellow-100 to-orange-100',
  ];

  return (
    <div className="space-y-10">
      {Object.entries(groupedMenus).map(([category, items], categoryIndex) => (
        <div key={category} id={`category-${category.replace(/\s+/g, '-')}`} className="scroll-mt-20">
          {/* Category Header - Fun Style / Special for Bestseller */}
          {isBestsellerCategory(category) ? (
            <div className="bg-gradient-to-r from-orange-200 to-red-200 rounded-2xl p-6 mb-6 shadow-lg border-2 border-orange-400">
              <h2 className="text-3xl font-bold text-orange-700 text-center flex items-center justify-center gap-3">
                <Flame className="w-8 h-8 text-orange-600 fill-orange-600" />
                {t('bestseller')}
                <span className="text-lg font-normal text-orange-600">{t('popularDishes')}</span>
              </h2>
            </div>
          ) : (
            <div className={`bg-gradient-to-r ${categoryColors[categoryIndex % categoryColors.length]} rounded-2xl p-6 mb-6 shadow-lg`}>
              <h2 className="text-3xl font-bold text-gray-900 text-center">
                🍽️ {category}
              </h2>
            </div>
          )}
          
          {/* Items Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((menu) => (
              <div
                key={menu.menu_id}
                className={`bg-white rounded-2xl overflow-hidden transition-all cursor-pointer transform hover:-translate-y-2 ${
                  menu.is_best_seller 
                    ? 'shadow-2xl ring-4 ring-orange-300 ring-opacity-50' 
                    : 'shadow-lg hover:shadow-xl'
                }`}
                onClick={() => onItemClick(menu)}
              >
                {/* Photo with Fun Overlay */}
                {menu.photo_url ? (
                  <div className="relative w-full h-48 bg-gray-200">
                    <img
                      src={menu.photo_url}
                      alt={menu.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Best Seller Starburst */}
                    {menu.is_best_seller && (
                      <div className="absolute top-2 right-2">
                        <div className="relative">
                          {/* Starburst effect */}
                          <div className="absolute inset-0 animate-ping opacity-50">
                            <Star className="w-12 h-12 fill-yellow-400 text-yellow-400" />
                          </div>
                          <div className="relative">
                            <Star className="w-12 h-12 fill-yellow-400 text-orange-500" />
                            <span className="absolute inset-0 flex items-center justify-center text-orange-600 text-xs font-black">
                              #1
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="w-full h-48 flex items-center justify-center bg-gradient-to-br"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${themeColor}33, ${themeColor}11)`
                    }}
                  >
                    <Utensils className="w-16 h-16 opacity-30" style={{ color: themeColor }} />
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  {/* Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                    {selectedLanguage === 'en' && menu.nameEn ? menu.nameEn : menu.name}
                    {menu.is_best_seller && (
                      <Heart className="w-4 h-4 fill-red-500 text-red-500 animate-pulse" />
                    )}
                  </h3>

                  {/* Description */}
                  {menu.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {selectedLanguage === 'en' && menu.descriptionEn ? menu.descriptionEn : menu.description}
                    </p>
                  )}

                  {/* Price & Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black" style={{ color: themeColor }}>
                      ${menu.price}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick(menu);
                      }}
                      className="px-4 py-2 text-white rounded-full font-bold transition-all hover:scale-110 shadow-md flex items-center gap-1"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Plus className="w-4 h-4" />
                      {t('add')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

