import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Product } from '../../types';
import { ProductCard } from '../../components/product/ProductCard';
import { ArrowLeft, Sparkles, Layers, RefreshCw, AlertCircle, Package } from 'lucide-react';

export const CollectionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [collection, setCollection] = useState<{
    id: number;
    title: string;
    slug: string;
    description?: string;
    image_url?: string;
    seo_title?: string;
    seo_description?: string;
    products_count: number;
    products: Product[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollection = async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.collections.getBySlug(slug);
      if (res.success && res.data) {
        setCollection(res.data);
        
        // Dynamic SEO injection
        if (res.data.seo_title) {
          document.title = res.data.seo_title;
        } else if (res.data.title) {
          document.title = `${res.data.title} | Curated Hardware Collection`;
        }
        
        if (res.data.seo_description) {
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) {
            metaDesc.setAttribute('content', res.data.seo_description);
          }
        }
      } else {
        setError(res.message || 'Collection could not be found.');
      }
    } catch (err: any) {
      console.error('Failed to load collection:', err);
      setError(err.response?.data?.detail || 'Curated collection not found or inactive.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollection();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
        <p className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
          Retrieving curated collection architecture...
        </p>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-neutral-200 rounded-2xl text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900">Collection Unavailable</h2>
        <p className="text-xs text-neutral-500">{error || 'This collection might have been archived or scheduled for a future date.'}</p>
        <div className="pt-2">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-neutral-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Browse Full Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      
      {/* Hero Banner with Collection Info */}
      <div className="relative bg-neutral-950 text-white overflow-hidden border-b border-neutral-800">
        {collection.image_url && (
          <div className="absolute inset-0 z-0">
            <img
              src={collection.image_url}
              alt={collection.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-4">
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Storefront</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Collection</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            {collection.title}
          </h1>

          {collection.description && (
            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
              {collection.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-neutral-400 pt-2 font-mono">
            <span className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>{collection.products?.length || collection.products_count || 0} Hardware Items</span>
            </span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h2 className="text-base font-bold text-neutral-900">Included Hardware & Components</h2>
          </div>
          <span className="text-xs text-neutral-500">
            Real-time warehouse inventory availability
          </span>
        </div>

        {(!collection.products || collection.products.length === 0) ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center text-neutral-500 space-y-2">
            <Package className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="text-sm font-semibold">No products currently assigned to this collection.</p>
            <p className="text-xs text-neutral-400">Products may be updated shortly by catalog administrators.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {collection.products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
