import { Plus, Star, Sparkles, Flame } from 'lucide-react';

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

interface ElegantProps {
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
    'original': 'ขายดี', 'th': 'ขายดี', 'en': 'BEST SELLER', 'zh': '热卖',
    'ja': '人気', 'ko': '인기', 'vi': 'BÁN CHẠY', 'hi': 'बेस्ट सेलर',
    'es': 'MÁS VENDIDO', 'fr': 'BEST SELLER', 'de': 'BESTSELLER', 'id': 'TERLARIS', 'ms': 'TERLARIS',
  },
  price: {
    'original': 'ราคา', 'th': 'ราคา', 'en': 'Price', 'zh': '价格',
    'ja': '価格', 'ko': '가격', 'vi': 'Giá', 'hi': 'मूल्य',
    'es': 'Precio', 'fr': 'Prix', 'de': 'Preis', 'id': 'Harga', 'ms': 'Harga',
  },
  addToOrder: {
    'original': 'เพิ่มในรายการ', 'th': 'เพิ่มในรายการ', 'en': 'Add to Order', 'zh': '加入订单',
    'ja': '注文に追加', 'ko': '주문에 추가', 'vi': 'Thêm vào đơn', 'hi': 'ऑर्डर में जोड़ें',
    'es': 'Añadir al pedido', 'fr': 'Ajouter à la commande', 'de': 'Zur Bestellung', 'id': 'Tambah ke Pesanan', 'ms': 'Tambah ke Pesanan',
  },
};

export default function Elegant({ menus, groupedMenus, themeColor, onItemClick, selectedLanguage = 'original' }: ElegantProps) {
  const isBestsellerCategory = (category: string) => category.toLowerCase() === 'bestseller';
  const t = (key: keyof typeof translations) => translations[key][selectedLanguage] || translations[key]['en'];

  return (
    <div className="max-w-4xl mx-auto space-y-16">
      {Object.entries(groupedMenus).map(([category, items]) => (
        <div key={category} id={`category-${category.replace(/\s+/g, '-')}`} className="scroll-mt-20">
          {/* Category Header - Elegant Style / Special for Bestseller */}
          {isBestsellerCategory(category) ? (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 -mx-4 px-4 py-6 rounded-xl border-2 border-orange-400 mb-10">
              <h2 className="text-4xl font-serif font-bold text-orange-600 flex items-center justify-center gap-4">
                <Flame className="w-10 h-10 text-orange-500 fill-orange-500" />
                {t('bestseller')}
                <span className="text-xl font-normal text-orange-500">{t('popularDishes')}</span>
              </h2>
            </div>
          ) : (
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-4 mb-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <Sparkles className="w-5 h-5" style={{ color: themeColor }} />
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              </div>
              <h2 className="text-4xl font-serif font-bold text-gray-900">
                {category}
              </h2>
            </div>
          )}
          
          {/* Items */}
          <div className="space-y-8">
            {items.map((menu) => (
              <div
                key={menu.menu_id}
                className={`bg-white rounded-xl overflow-hidden transition-all cursor-pointer ${
                  menu.is_best_seller 
                    ? 'shadow-xl border-2 border-orange-300 hover:shadow-2xl' 
                    : 'shadow-md hover:shadow-lg'
                }`}
                onClick={() => onItemClick(menu)}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Photo - Larger for Best Sellers */}
                  {menu.photo_url && (
                    <div className={`relative bg-gray-200 ${
                      menu.is_best_seller ? 'md:w-1/2' : 'md:w-1/3'
                    }`}>
                      <div className={menu.is_best_seller ? 'h-80' : 'h-64'}>
                        <img
                          src={menu.photo_url}
                          alt={menu.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Best Seller Ribbon */}
                      {menu.is_best_seller && (
                        <div className="absolute top-4 left-0">
                          <div
                            className="px-6 py-2 text-white font-bold text-sm shadow-lg flex items-center gap-2"
                            style={{
                              backgroundColor: themeColor,
                              clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0% 100%)'
                            }}
                          >
                            <Star className="w-4 h-4 fill-current" />
                            {t('bestSellerBadge')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className={`p-8 flex-1 flex flex-col justify-center ${
                    menu.is_best_seller ? 'bg-gradient-to-br from-orange-50 to-transparent' : ''
                  }`}>
                    {/* Name */}
                    <h3 className={`font-serif font-bold text-gray-900 mb-2 ${
                      menu.is_best_seller ? 'text-3xl' : 'text-2xl'
                    }`}>
                      {selectedLanguage === 'en' && menu.nameEn ? menu.nameEn : menu.name}
                    </h3>

                    {/* Description */}
                    {menu.description && (
                      <p className="text-gray-600 leading-relaxed mb-6">
                        {selectedLanguage === 'en' && menu.descriptionEn ? menu.descriptionEn : menu.description}
                      </p>
                    )}

                    {/* Price & Button */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-500 block mb-1">{t('price')}</span>
                        <span className="text-3xl font-bold" style={{ color: themeColor }}>
                          ${menu.price}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemClick(menu);
                        }}
                        className="px-6 py-3 text-white rounded-full font-semibold transition-all hover:scale-105 shadow-md flex items-center gap-2"
                        style={{ backgroundColor: themeColor }}
                      >
                        <Plus className="w-5 h-5" />
                        {t('addToOrder')}
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

