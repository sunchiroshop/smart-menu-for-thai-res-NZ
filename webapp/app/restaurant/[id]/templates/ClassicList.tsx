import { Utensils, Plus, Star, Flame } from 'lucide-react';

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

interface ClassicListProps {
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
  bestSellerBadge: {
    'original': 'ขายดี', 'th': 'ขายดี', 'en': 'Best Seller', 'zh': '热卖',
    'ja': '人気', 'ko': '인기', 'vi': 'Bán chạy', 'hi': 'बेस्ट सेलर',
    'es': 'Más vendido', 'fr': 'Best Seller', 'de': 'Bestseller', 'id': 'Terlaris', 'ms': 'Terlaris',
  },
  add: {
    'original': 'เพิ่ม', 'th': 'เพิ่ม', 'en': 'Add', 'zh': '添加',
    'ja': '追加', 'ko': '추가', 'vi': 'Thêm', 'hi': 'जोड़ें',
    'es': 'Añadir', 'fr': 'Ajouter', 'de': 'Hinzufügen', 'id': 'Tambah', 'ms': 'Tambah',
  },
  choiceOfMeats: {
    'original': 'เลือกเนื้อ', 'th': 'เลือกเนื้อ', 'en': 'Choice of meats', 'zh': '可选肉类',
    'ja': '肉の選択', 'ko': '고기 선택', 'vi': 'Chọn thịt', 'hi': 'मांस का चयन',
    'es': 'Elección de carnes', 'fr': 'Choix de viandes', 'de': 'Fleischauswahl', 'id': 'Pilihan daging', 'ms': 'Pilihan daging',
  },
  addOnsAvailable: {
    'original': 'เพิ่มเติม', 'th': 'เพิ่มเติม', 'en': 'add-ons available', 'zh': '可加配料',
    'ja': '追加可能', 'ko': '추가 가능', 'vi': 'có thể thêm', 'hi': 'ऐड-ऑन उपलब्ध',
    'es': 'complementos disponibles', 'fr': 'suppléments disponibles', 'de': 'Extras verfügbar', 'id': 'tersedia tambahan', 'ms': 'tambahan tersedia',
  },
};

export default function ClassicList({ menus, groupedMenus, themeColor, onItemClick, selectedLanguage = 'original' }: ClassicListProps) {
  const isBestsellerCategory = (category: string) => category.toLowerCase() === 'bestseller';
  const t = (key: keyof typeof translations) => translations[key][selectedLanguage] || translations[key]['en'];

  return (
    <div className="space-y-12">
      {Object.entries(groupedMenus).map(([category, items]) => (
        <div key={category} id={`category-${category.replace(/\s+/g, '-')}`} className="scroll-mt-20">
          {/* Category Header - Special style for Bestseller */}
          <div
            className={`mb-6 pb-2 border-b-2 ${isBestsellerCategory(category) ? 'bg-gradient-to-r from-orange-50 to-red-50 -mx-4 px-4 py-4 rounded-xl border-orange-400' : ''}`}
            style={{ borderColor: isBestsellerCategory(category) ? '#f97316' : themeColor }}
          >
            <h2 className={`text-3xl font-bold flex items-center gap-3 ${isBestsellerCategory(category) ? 'text-orange-600' : 'text-gray-900'}`}>
              {isBestsellerCategory(category) && <Flame className="w-8 h-8 text-orange-500 fill-orange-500" />}
              {isBestsellerCategory(category) ? t('bestseller') : category}
              {isBestsellerCategory(category) && <span className="text-lg font-normal text-orange-500">{t('popularDishes')}</span>}
            </h2>
          </div>

          {/* Items List */}
          <div className="space-y-4">
            {items.map((menu) => (
              <div
                key={menu.menu_id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden cursor-pointer"
                onClick={() => onItemClick(menu)}
              >
                <div className="flex">
                  {/* Photo */}
                  {menu.photo_url && (
                    <div className="w-32 h-32 flex-shrink-0 bg-gray-200">
                      <img
                        src={menu.photo_url}
                        alt={menu.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 p-4 flex items-center justify-between">
                    <div className="flex-1">
                      {/* Name with Best Seller Badge */}
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          {selectedLanguage === 'en' && menu.nameEn ? menu.nameEn : menu.name}
                        </h3>
                        {menu.is_best_seller && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            {t('bestSellerBadge')}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {menu.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {selectedLanguage === 'en' && menu.descriptionEn ? menu.descriptionEn : menu.description}
                        </p>
                      )}

                      {/* Add-ons indicator */}
                      {(menu.meats && menu.meats.length > 0) || (menu.addOns && menu.addOns.length > 0) ? (
                        <p className="text-xs text-gray-500">
                          {menu.meats && menu.meats.length > 0 && `${t('choiceOfMeats')} (${menu.meats.length})`}
                          {menu.meats && menu.meats.length > 0 && menu.addOns && menu.addOns.length > 0 && ' • '}
                          {menu.addOns && menu.addOns.length > 0 && `${menu.addOns.length} ${t('addOnsAvailable')}`}
                        </p>
                      ) : null}
                    </div>
                    
                    {/* Price & Add Button */}
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <span className="text-2xl font-bold" style={{ color: themeColor }}>
                        ${menu.price}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemClick(menu);
                        }}
                        className="px-4 py-2 text-white rounded-lg font-semibold transition-all hover:scale-105 text-sm flex items-center gap-1"
                        style={{ backgroundColor: themeColor }}
                      >
                        <Plus className="w-4 h-4" />
                        {t('add')}
                      </button>
                    </div>
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

