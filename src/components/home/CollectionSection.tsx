import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { ProductGridSection } from './ProductGridSection';

interface CollectionData {
  id: number;
  title: string;
  slug: string;
  description?: string;
  image_url?: string;
  products: Product[];
}

interface CollectionSectionProps {
  title?: string;
  subtitle?: string;
  collection: CollectionData | null;
}

export const CollectionSection: React.FC<CollectionSectionProps> = ({
  title,
  subtitle,
  collection
}) => {
  if (!collection || !collection.products || collection.products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="bg-neutral-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-neutral-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Curated Collection</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold">{collection.title || title}</h3>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-xl">
            {collection.description || subtitle || 'A curated grouping of high-performance components tested for synergy.'}
          </p>
        </div>
        <Link
          to={`/shop?collection=${collection.slug}`}
          className="shrink-0 bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs px-5 py-3 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
        >
          <span>Explore Full Collection</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <ProductGridSection
        title={`Included in ${collection.title}`}
        subtitle="Authoritative products in this curated ecosystem"
        products={collection.products}
        viewAllUrl={`/shop?collection=${collection.slug}`}
      />
    </section>
  );
};
