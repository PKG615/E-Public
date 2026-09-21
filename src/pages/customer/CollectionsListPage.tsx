import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Collection } from '../../types';
import { Sparkles, ArrowRight, Layers, RefreshCw, Package } from 'lucide-react';

export const CollectionsListPage: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await api.collections.getAll();
        if (res.success && res.data) {
          setCollections(res.data);
        }
      } catch (err) {
        console.error('Failed to load collections:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Curated Catalogs</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
          Curated Product Collections
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl">
          Discover themed selections of enterprise hardware, synergistic components, and hand-tested computing ecosystems.
        </p>
      </div>

      {/* Grid of Collections */}
      {loading ? (
        <div className="py-20 text-center text-neutral-400">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
          <span className="text-xs font-mono">Loading curated collections...</span>
        </div>
      ) : collections.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center text-neutral-500 space-y-2">
          <Layers className="w-8 h-8 text-neutral-300 mx-auto" />
          <p className="text-sm font-semibold">No active collections found.</p>
          <p className="text-xs text-neutral-400">Check back soon for new curated selections.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map(coll => (
            <Link
              key={coll.id}
              to={`/collections/${coll.slug}`}
              className="group bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
            >
              <div className="aspect-16/9 bg-neutral-100 overflow-hidden relative">
                {coll.image_url ? (
                  <img
                    src={coll.image_url}
                    alt={coll.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-300">
                    <Layers className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-neutral-900/80 backdrop-blur-xs text-white text-[11px] font-mono px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Package className="w-3 h-3 text-amber-400" />
                  <span>{coll.products_count || 0} Products</span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-neutral-900 group-hover:text-amber-600 transition-colors">
                    {coll.title}
                  </h3>
                  <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                    {coll.description || 'Synergistic enterprise hardware and accessories.'}
                  </p>
                </div>

                <div className="flex items-center text-xs font-semibold text-neutral-900 group-hover:text-amber-600 transition-colors pt-2 border-t border-neutral-100">
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
};
