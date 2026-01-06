'use client';

import { useState, useRef } from 'react';
import { Plus, Star, Flame, ChevronLeft, ChevronRight } from 'lucide-react';

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

interface GridViewProps {
  menus: MenuItem[];
  groupedMenus: Record<string, MenuItem[]>;
  themeColor: string;
  onItemClick: (item: MenuItem) => void;
  selectedLanguage?: string;
}

// Translations for UI elements
const translations: Record<string, Record<string, string>> = {
  viewAll: {
    'original': 'ดูทั้งหมด',
    'th': 'ดูทั้งหมด',
    'en': 'View All',
    'zh': '查看全部',
    'ja': 'すべて見る',
    'ko': '전체 보기',
    'vi': 'Xem tất cả',
    'hi': 'सभी देखें',
    'es': 'Ver todo',
    'fr': 'Voir tout',
    'de': 'Alle anzeigen',
    'id': 'Lihat Semua',
    'ms': 'Lihat Semua',
  },
  collapse: {
    'original': 'ย่อ',
    'th': 'ย่อ',
    'en': 'Collapse',
    'zh': '收起',
    'ja': '折りたたむ',
    'ko': '접기',
    'vi': 'Thu gọn',
    'hi': 'छुपाएं',
    'es': 'Colapsar',
    'fr': 'Réduire',
    'de': 'Einklappen',
    'id': 'Tutup',
    'ms': 'Tutup',
  },
  bestseller: {
    'original': 'สินค้าขายดี',
    'th': 'สินค้าขายดี',
    'en': 'Bestseller',
    'zh': '畅销品',
    'ja': 'ベストセラー',
    'ko': '베스트셀러',
    'vi': 'Bán chạy nhất',
    'hi': 'बेस्टसेलर',
    'es': 'Más vendido',
    'fr': 'Meilleures ventes',
    'de': 'Bestseller',
    'id': 'Terlaris',
    'ms': 'Terlaris',
  },
  popularDishes: {
    'original': 'เมนูยอดนิยม',
    'th': 'เมนูยอดนิยม',
    'en': 'Popular dishes',
    'zh': '热门菜品',
    'ja': '人気料理',
    'ko': '인기 메뉴',
    'vi': 'Món phổ biến',
    'hi': 'लोकप्रिय व्यंजन',
    'es': 'Platos populares',
    'fr': 'Plats populaires',
    'de': 'Beliebte Gerichte',
    'id': 'Hidangan Populer',
    'ms': 'Hidangan Popular',
  },
  bestSellerBadge: {
    'original': 'ขายดี',
    'th': 'ขายดี',
    'en': 'BEST SELLER',
    'zh': '热卖',
    'ja': '人気',
    'ko': '인기',
    'vi': 'BÁN CHẠY',
    'hi': 'बेस्ट सेलर',
    'es': 'MÁS VENDIDO',
    'fr': 'BEST SELLER',
    'de': 'BESTSELLER',
    'id': 'TERLARIS',
    'ms': 'TERLARIS',
  },
  add: {
    'original': 'เพิ่ม',
    'th': 'เพิ่ม',
    'en': 'Add',
    'zh': '添加',
    'ja': '追加',
    'ko': '추가',
    'vi': 'Thêm',
    'hi': 'जोड़ें',
    'es': 'Añadir',
    'fr': 'Ajouter',
    'de': 'Hinzufügen',
    'id': 'Tambah',
    'ms': 'Tambah',
  },
};

export default function GridView({ menus, groupedMenus, themeColor, onItemClick, selectedLanguage = 'original' }: GridViewProps) {
  const isBestsellerCategory = (category: string) => category.toLowerCase() === 'bestseller';
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const scroll = (category: string, direction: 'left' | 'right') => {
    const container = scrollRefs.current[category];
    if (container) {
      const scrollAmount = 320; // Approximate card width + gap
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const t = (key: keyof typeof translations) => translations[key][selectedLanguage] || translations[key]['en'];

  return (
    <div className="space-y-12">
      {Object.entries(groupedMenus).map(([category, items]) => {
        const isExpanded = expandedCategories.has(category);
        const showScrollView = !isExpanded && items.length > 3;

        return (
          <div key={category} id={`category-${category.replace(/\s+/g, '-')}`} className="scroll-mt-20">
            {/* Category Header - Special style for Bestseller */}
            <div
              className={`mb-6 pb-2 border-b-2 flex items-center justify-between ${isBestsellerCategory(category) ? 'bg-gradient-to-r from-orange-50 to-red-50 -mx-4 px-4 py-4 rounded-xl border-orange-400' : ''}`}
              style={{ borderColor: isBestsellerCategory(category) ? '#f97316' : themeColor }}
            >
              <h2 className={`text-3xl font-bold flex items-center gap-3 ${isBestsellerCategory(category) ? 'text-orange-600' : 'text-gray-900'}`}>
                {isBestsellerCategory(category) && <Flame className="w-8 h-8 text-orange-500 fill-orange-500" />}
                {isBestsellerCategory(category) ? t('bestseller') : category}
                {isBestsellerCategory(category) && <span className="text-lg font-normal text-orange-500">{t('popularDishes')}</span>}
                <span className="text-lg font-normal text-gray-500">({items.length})</span>
              </h2>

              {/* View All / Collapse button */}
              {items.length > 3 && (
                <button
                  onClick={() => toggleCategory(category)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all hover:scale-105"
                  style={{
                    backgroundColor: isExpanded ? `${themeColor}20` : themeColor,
                    color: isExpanded ? themeColor : 'white'
                  }}
                >
                  {isExpanded ? t('collapse') : t('viewAll')}
                </button>
              )}
            </div>

            {/* Items - Horizontal Scroll or Grid */}
            {showScrollView ? (
              <div className="relative group">
                {/* Left Arrow */}
                <button
                  onClick={() => scroll(category, 'left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 -ml-5"
                  style={{ color: themeColor }}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Scrollable Container */}
                <div
                  ref={(el) => { scrollRefs.current[category] = el; }}
                  className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {items.map((menu) => (
                    <div
                      key={menu.menu_id}
                      className="flex-shrink-0 w-[300px] bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
                      onClick={() => onItemClick(menu)}
                    >
                      {/* Photo - Fixed aspect ratio */}
                      <div className="relative w-full aspect-[4/3] bg-gray-200">
                        {menu.photo_url ? (
                          <img
                            src={menu.photo_url}
                            alt={menu.nameEn || menu.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: `${themeColor}22` }}
                          >
                            <span className="text-gray-400 text-sm">No Image</span>
                          </div>
                        )}
                        {/* Best Seller Badge */}
                        {menu.is_best_seller && (
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-bold shadow-lg">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              {t('bestSellerBadge')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                          {selectedLanguage === 'en' && menu.nameEn ? menu.nameEn : menu.name}
                        </h3>
                        {menu.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {selectedLanguage === 'en' && menu.descriptionEn ? menu.descriptionEn : menu.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold" style={{ color: themeColor }}>
                            ${menu.price}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemClick(menu);
                            }}
                            className="px-3 py-1.5 text-white rounded-lg font-semibold transition-all hover:scale-105 flex items-center gap-1 text-sm"
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

                {/* Right Arrow */}
                <button
                  onClick={() => scroll(category, 'right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 -mr-5"
                  style={{ color: themeColor }}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            ) : (
              /* Grid View - When expanded or <= 3 items */
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((menu) => (
                  <div
                    key={menu.menu_id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
                    onClick={() => onItemClick(menu)}
                  >
                    {/* Photo - Fixed aspect ratio */}
                    <div className="relative w-full aspect-[4/3] bg-gray-200">
                      {menu.photo_url ? (
                        <img
                          src={menu.photo_url}
                          alt={menu.nameEn || menu.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: `${themeColor}22` }}
                        >
                          <span className="text-gray-400 text-sm">No Image</span>
                        </div>
                      )}
                      {/* Best Seller Badge */}
                      {menu.is_best_seller && (
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-bold shadow-lg">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            {t('bestSellerBadge')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="mb-2">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          {selectedLanguage === 'en' && menu.nameEn ? menu.nameEn : menu.name}
                          {menu.is_best_seller && !menu.photo_url && (
                            <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
                          )}
                        </h3>
                      </div>
                      {menu.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {selectedLanguage === 'en' && menu.descriptionEn ? menu.descriptionEn : menu.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold" style={{ color: themeColor }}>
                          ${menu.price}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onItemClick(menu);
                          }}
                          className="px-4 py-2 text-white rounded-lg font-semibold transition-all hover:scale-105 flex items-center gap-2"
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
            )}
          </div>
        );
      })}
    </div>
  );
}
