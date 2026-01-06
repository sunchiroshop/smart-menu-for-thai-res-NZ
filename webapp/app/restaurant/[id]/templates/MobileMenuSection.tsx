'use client';

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, List, LayoutGrid, X, Star, Plus } from 'lucide-react';

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

// Translations for UI elements
const translations: Record<string, Record<string, string>> = {
  viewAll: {
    'original': 'ดูทั้งหมด', 'th': 'ดูทั้งหมด', 'en': 'View All', 'zh': '查看全部',
    'ja': 'すべて見る', 'ko': '전체 보기', 'vi': 'Xem tất cả', 'hi': 'सभी देखें',
    'es': 'Ver todo', 'fr': 'Voir tout', 'de': 'Alle anzeigen', 'id': 'Lihat Semua', 'ms': 'Lihat Semua',
  },
  bestSellerBadge: {
    'original': 'ขายดี', 'th': 'ขายดี', 'en': 'Bestseller', 'zh': '热卖',
    'ja': '人気', 'ko': '인기', 'vi': 'Bán chạy', 'hi': 'बेस्ट सेलर',
    'es': 'Más vendido', 'fr': 'Best-seller', 'de': 'Bestseller', 'id': 'Terlaris', 'ms': 'Terlaris',
  },
  items: {
    'original': 'รายการ', 'th': 'รายการ', 'en': 'items', 'zh': '项目',
    'ja': '件', 'ko': '개', 'vi': 'món', 'hi': 'आइटम',
    'es': 'artículos', 'fr': 'articles', 'de': 'Artikel', 'id': 'item', 'ms': 'item',
  },
};

interface MobileMenuSectionProps {
  categories: string[];
  groupedMenus: Record<string, MenuItem[]>;
  themeColor: string;
  onItemClick: (item: MenuItem) => void;
  selectedLanguage?: string;
  itemsPerCategory?: number; // How many items to show per category (default 2)
}

export default function MobileMenuSection({
  categories,
  groupedMenus,
  themeColor,
  onItemClick,
  selectedLanguage = 'original',
  itemsPerCategory = 2
}: MobileMenuSectionProps) {
  // Translation helper
  const t = (key: keyof typeof translations) => translations[key][selectedLanguage] || translations[key]['en'];

  // State for category detail modal
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Refs for horizontal scroll
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scroll = (category: string, direction: 'left' | 'right') => {
    const ref = scrollRefs.current[category];
    if (ref) {
      const scrollAmount = 200;
      ref.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getCategoryDisplayName = (category: string) => {
    // For English display, try to find categoryEn from first item
    if (selectedLanguage === 'en') {
      const items = groupedMenus[category];
      if (items && items.length > 0 && items[0].categoryEn) {
        return items[0].categoryEn;
      }
    }
    return category;
  };

  const getItemName = (item: MenuItem) => {
    return selectedLanguage === 'en' && item.nameEn ? item.nameEn : item.name;
  };

  const getItemDescription = (item: MenuItem) => {
    return selectedLanguage === 'en' && item.descriptionEn ? item.descriptionEn : item.description;
  };

  return (
    <>
      {/* Mobile Menu Sections */}
      <div className="md:hidden space-y-6">
        {categories.map((category) => {
          const items = groupedMenus[category] || [];
          if (items.length === 0) return null;

          const isBestSeller = category === 'Bestseller' || category === 'ขายดี';

          return (
            <div key={category} className="px-4">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-bold ${isBestSeller ? 'text-orange-600' : 'text-gray-800'}`}>
                  {isBestSeller && <Star className="w-5 h-5 inline mr-1 text-orange-500 fill-orange-500" />}
                  {getCategoryDisplayName(category)}
                  <span className="text-sm font-normal text-gray-500 ml-2">({items.length})</span>
                </h3>
                {items.length > itemsPerCategory && (
                  <button
                    onClick={() => setSelectedCategory(category)}
                    className="text-sm font-medium px-3 py-1 rounded-full transition-colors"
                    style={{ color: themeColor, backgroundColor: `${themeColor}15` }}
                  >
                    {t('viewAll')}
                  </button>
                )}
              </div>

              {/* Horizontal Scroll Container */}
              <div className="relative group">
                {/* Left Arrow - Always visible when scrollable */}
                {items.length > itemsPerCategory && (
                  <button
                    onClick={() => scroll(category, 'left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200"
                    style={{ marginLeft: '-4px' }}
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                )}

                {/* Items Container */}
                <div
                  ref={(el) => { scrollRefs.current[category] = el; }}
                  className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-1"
                  style={{ scrollSnapType: 'x mandatory' }}
                >
                  {items.slice(0, Math.max(itemsPerCategory + 1, items.length)).map((item, idx) => (
                    <div
                      key={item.menu_id}
                      onClick={() => onItemClick(item)}
                      className={`flex-shrink-0 bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-transform active:scale-95 ${
                        idx >= itemsPerCategory ? 'opacity-50' : ''
                      }`}
                      style={{
                        width: 'calc(50% - 6px)',
                        scrollSnapAlign: 'start',
                        minWidth: '160px',
                        maxWidth: '200px'
                      }}
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] bg-gray-100">
                        {item.photo_url ? (
                          <img
                            src={item.photo_url}
                            alt={getItemName(item)}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: `${themeColor}20` }}
                          >
                            <span className="text-3xl">🍽️</span>
                          </div>
                        )}
                        {item.is_best_seller && (
                          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-white" />
                            <span>{t('bestSellerBadge')}</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                          {getItemName(item)}
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm" style={{ color: themeColor }}>
                            ${parseFloat(item.price).toFixed(2)}
                          </span>
                          <button
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: themeColor }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemClick(item);
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Arrow - Always visible when scrollable */}
                {items.length > itemsPerCategory && (
                  <button
                    onClick={() => scroll(category, 'right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200 animate-pulse-subtle"
                    style={{ marginRight: '-4px' }}
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                )}

                {/* Scroll hint gradient overlay */}
                {items.length > itemsPerCategory && (
                  <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Detail Modal */}
      {selectedCategory && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={() => setSelectedCategory(null)}
        >
          <div
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {getCategoryDisplayName(selectedCategory)}
                </h2>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {groupedMenus[selectedCategory]?.length || 0} {t('items')}
                </span>
                <div className="flex-1" />
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === 'grid' ? 'bg-white shadow-sm' : ''
                    }`}
                  >
                    <LayoutGrid className={`w-4 h-4 ${viewMode === 'grid' ? 'text-gray-900' : 'text-gray-500'}`} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-white shadow-sm' : ''
                    }`}
                  >
                    <List className={`w-4 h-4 ${viewMode === 'list' ? 'text-gray-900' : 'text-gray-500'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(85vh - 100px)' }}>
              {viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-2 gap-3">
                  {(groupedMenus[selectedCategory] || []).map((item) => (
                    <div
                      key={item.menu_id}
                      onClick={() => {
                        onItemClick(item);
                        setSelectedCategory(null);
                      }}
                      className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-transform active:scale-95"
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] bg-gray-100">
                        {item.photo_url ? (
                          <img
                            src={item.photo_url}
                            alt={getItemName(item)}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: `${themeColor}20` }}
                          >
                            <span className="text-3xl">🍽️</span>
                          </div>
                        )}
                        {item.is_best_seller && (
                          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-white" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                          {getItemName(item)}
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm" style={{ color: themeColor }}>
                            ${parseFloat(item.price).toFixed(2)}
                          </span>
                          <button
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: themeColor }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemClick(item);
                              setSelectedCategory(null);
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="space-y-3">
                  {(groupedMenus[selectedCategory] || []).map((item) => (
                    <div
                      key={item.menu_id}
                      onClick={() => {
                        onItemClick(item);
                        setSelectedCategory(null);
                      }}
                      className="bg-white rounded-xl shadow-md p-3 flex gap-3 cursor-pointer transition-transform active:scale-98"
                    >
                      {/* Image */}
                      <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        {item.photo_url ? (
                          <img
                            src={item.photo_url}
                            alt={getItemName(item)}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: `${themeColor}20` }}
                          >
                            <span className="text-2xl">🍽️</span>
                          </div>
                        )}
                        {item.is_best_seller && (
                          <div className="absolute top-1 left-1 bg-orange-500 text-white p-1 rounded-full">
                            <Star className="w-3 h-3 fill-white" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 line-clamp-2 mb-1">
                          {getItemName(item)}
                        </h4>
                        {getItemDescription(item) && (
                          <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                            {getItemDescription(item)}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="font-bold" style={{ color: themeColor }}>
                            ${parseFloat(item.price).toFixed(2)}
                          </span>
                          <button
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: themeColor }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemClick(item);
                              setSelectedCategory(null);
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS for hiding scrollbar and animations */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-50%) scale(1.05);
          }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
