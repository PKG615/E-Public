import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Sparkles, Flame } from 'lucide-react';
import { Category } from '../../types';
import { api } from '../../services/api';

export const Navbar: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.categories.getTree();
        if (res.success && res.data) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error('Failed to load dynamic categories:', err);
      }
    };
    loadCategories();
  }, []);

  return (
    <nav className="bg-neutral-50 border-b border-neutral-200 text-xs font-medium text-neutral-700 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between overflow-x-auto scrollbar-none py-2 gap-6">
          
          {/* All Products & Categories */}
          <div className="flex items-center gap-6 shrink-0">
            <Link
              to="/shop"
              className="text-neutral-900 font-semibold hover:text-emerald-700 transition-colors flex items-center gap-1.5 py-1"
            >
              <span>All Catalog</span>
            </Link>

            {categories.map((cat) => (
              <div
                key={cat.id}
                className="relative py-1 group"
                onMouseEnter={() => setHoveredCategory(cat.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <Link
                  to={`/shop?category=${cat.slug}`}
                  className="hover:text-neutral-900 flex items-center gap-1 transition-colors"
                >
                  <span>{cat.name}</span>
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:text-neutral-700 transition-transform group-hover:rotate-180" />
                  )}
                </Link>

                {/* Dropdown Mega-Menu for Hierarchical Subcategories */}
                {cat.subcategories && cat.subcategories.length > 0 && hoveredCategory === cat.id && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      {cat.name} Categories
                    </div>
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/shop?category=${sub.slug}`}
                        className="block px-3 py-1.5 hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 transition-colors text-xs"
                      >
                        {sub.name}
                      </Link>
                    ))}
                    <div className="border-t border-neutral-100 mt-1 pt-1">
                      <Link
                        to={`/shop?category=${cat.slug}`}
                        className="block px-3 py-1 text-emerald-600 font-semibold hover:underline text-[11px]"
                      >
                        View All in {cat.name} →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Highlight Links */}
          <div className="flex items-center gap-4 shrink-0">
            <Link
              to="/shop?flash=true"
              className="flex items-center gap-1 text-amber-700 font-semibold hover:text-amber-800 transition-colors"
            >
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>Flash Deals</span>
            </Link>
            <Link
              to="/shop?featured=true"
              className="flex items-center gap-1 text-indigo-700 font-semibold hover:text-indigo-800 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Featured Picks</span>
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
};
