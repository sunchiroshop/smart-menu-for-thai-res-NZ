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
}

export default function Elegant({ menus, groupedMenus, themeColor, onItemClick }: ElegantProps) {
  const isBestsellerCategory = (category: string) => category.toLowerCase() === 'bestseller';

  return (
    <div className="max-w-4xl mx-auto space-y-16">
      {Object.entries(groupedMenus).map(([category, items]) => (
        <div key={category} id={`category-${category.replace(/\s+/g, '-')}`} className="scroll-mt-20">
          {/* Category Header - Elegant Style / Special for Bestseller */}
          {isBestsellerCategory(category) ? (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 -mx-4 px-4 py-6 rounded-xl border-2 border-orange-400 mb-10">
              <h2 className="text-4xl font-serif font-bold text-orange-600 flex items-center justify-center gap-4">
                <Flame className="w-10 h-10 text-orange-500 fill-orange-500" />
                Bestseller
                <span className="text-xl font-normal text-orange-500">Popular dishes</span>
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
                            BEST SELLER
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
                      {menu.name}
                    </h3>

                    {/* Description */}
                    {menu.description && (
                      <p className="text-gray-600 leading-relaxed mb-6">
                        {menu.description}
                      </p>
                    )}
                    
                    {/* Price & Button */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-500 block mb-1">Price</span>
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
                        Add to Order
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

