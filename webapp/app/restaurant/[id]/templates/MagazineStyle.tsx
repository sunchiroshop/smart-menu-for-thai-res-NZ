import { Plus, Star, Flame } from 'lucide-react';

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

interface MagazineStyleProps {
  menus: MenuItem[];
  groupedMenus: Record<string, MenuItem[]>;
  themeColor: string;
  onItemClick: (item: MenuItem) => void;
}

export default function MagazineStyle({ menus, groupedMenus, themeColor, onItemClick }: MagazineStyleProps) {
  const isBestsellerCategory = (category: string) => category.toLowerCase() === 'bestseller';

  return (
    <div className="space-y-12">
      {Object.entries(groupedMenus).map(([category, items]) => {
        // For Bestseller category, show all items as featured
        const isBestseller = isBestsellerCategory(category);
        // Separate best sellers and regular items (only for non-bestseller categories)
        const bestSellers = isBestseller ? items : items.filter(item => item.is_best_seller);
        const regularItems = isBestseller ? [] : items.filter(item => !item.is_best_seller);

        return (
          <div key={category} id={`category-${category.replace(/\s+/g, '-')}`} className="scroll-mt-20">
            {/* Category Header - Special style for Bestseller */}
            <div
              className={`mb-6 pb-2 border-b-2 ${isBestseller ? 'bg-gradient-to-r from-orange-50 to-red-50 -mx-4 px-4 py-4 rounded-xl border-orange-400' : ''}`}
              style={{ borderColor: isBestseller ? '#f97316' : themeColor }}
            >
              <h2 className={`text-3xl font-bold flex items-center gap-3 ${isBestseller ? 'text-orange-600' : 'text-gray-900'}`}>
                {isBestseller && <Flame className="w-8 h-8 text-orange-500 fill-orange-500" />}
                {isBestseller ? 'Bestseller' : category}
                {isBestseller && <span className="text-lg font-normal text-orange-500">Popular dishes</span>}
              </h2>
            </div>
            
            {/* Best Sellers - Featured (Large) */}
            {bestSellers.length > 0 && (
              <div className="mb-8">
                {/* Only show sub-header for non-bestseller categories */}
                {!isBestseller && (
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 fill-orange-500 text-orange-500" />
                    <h3 className="text-xl font-bold text-orange-600">Best Sellers This Week</h3>
                  </div>
                )}

                <div className="grid lg:grid-cols-2 gap-6">
                  {bestSellers.map((menu) => (
                    <div
                      key={menu.menu_id}
                      className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all cursor-pointer border-2 border-orange-300"
                      onClick={() => onItemClick(menu)}
                    >
                      {/* Large Photo for Best Sellers */}
                      {menu.photo_url && (
                        <div className="relative w-full h-64 bg-gray-200">
                          <img
                            src={menu.photo_url}
                            alt={menu.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Best Seller Badge */}
                          <div className="absolute top-4 left-4">
                            <span className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-bold shadow-xl">
                              <Star className="w-4 h-4 mr-1 fill-current" />
                              BEST SELLER
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {menu.name}
                        </h3>

                        {menu.description && (
                          <p className="text-gray-700 mb-4 leading-relaxed">
                            {menu.description}
                          </p>
                        )}
                        
                        {/* Price & Button */}
                        <div className="flex items-center justify-between">
                          <span className="text-3xl font-bold" style={{ color: themeColor }}>
                            ${menu.price}
                            <span className="text-lg ml-1 text-gray-500">NZD</span>
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemClick(menu);
                            }}
                            className="px-6 py-3 text-white rounded-lg font-bold transition-all hover:scale-105 shadow-lg flex items-center gap-2"
                            style={{ backgroundColor: themeColor }}
                          >
                            <Plus className="w-5 h-5" />
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Regular Items - Smaller Grid */}
            {regularItems.length > 0 && (
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {regularItems.map((menu) => (
                  <div
                    key={menu.menu_id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden cursor-pointer"
                    onClick={() => onItemClick(menu)}
                  >
                    {/* Photo */}
                    {menu.photo_url && (
                      <div className="w-full h-32 bg-gray-200">
                        <img
                          src={menu.photo_url}
                          alt={menu.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-3">
                      <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">
                        {menu.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold" style={{ color: themeColor }}>
                          ${menu.price}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onItemClick(menu);
                          }}
                          className="p-1.5 text-white rounded-lg transition-all"
                          style={{ backgroundColor: themeColor }}
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
        );
      })}
    </div>
  );
}

