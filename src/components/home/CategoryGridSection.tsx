import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers } from 'lucide-react';

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url: string;
  subcategories_count?: number;
  subcategories?: Array<{ id: number; name: string; slug: string }>;
}

interface CategoryGridSectionProps {
  title: string;
  subtitle?: string;
  categories: CategoryItem[];
}

export const CategoryGridSection: React.FC<CategoryGridSectionProps> = ({
  title,
  subtitle,
  categories
}) => {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
        </div>
        <Link
          to="/shop"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
        >
          <span>Browse all categories</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/shop?category=${cat.slug}`}
            className="group relative rounded-xl border border-neutral-200 overflow-hidden bg-white hover:shadow-md transition-all flex flex-col"
          >
            <div className="aspect-16/9 w-full bg-neutral-100 overflow-hidden relative">
              <img
                src={cat.image_url || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80'}
                alt={cat.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <h3 className="font-bold text-lg leading-snug">{cat.name}</h3>
                <p className="text-xs text-neutral-200 line-clamp-1">
                  {cat.description || 'Verified enterprise gear'}
                </p>
              </div>
            </div>

            {cat.subcategories && cat.subcategories.length > 0 && (
              <div className="p-3 bg-neutral-50 border-t border-neutral-100 flex flex-wrap gap-1.5 text-[11px]">
                {cat.subcategories.map((sub) => (
                  <span
                    key={sub.id}
                    className="bg-white border border-neutral-200 px-2 py-0.5 rounded text-neutral-600 group-hover:border-neutral-300 transition-colors"
                  >
                    {sub.name}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
};
