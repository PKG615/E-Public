import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, ShoppingBag, Check, AlertCircle } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';

interface ProductGridSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllUrl?: string;
  badgeLabel?: string;
}

export const ProductGridSection: React.FC<ProductGridSectionProps> = ({
  title,
  subtitle,
  products,
  viewAllUrl = '/shop',
  badgeLabel
}) => {
  const { addToCart } = useCart();
  const [addedProductId, setAddedProductId] = useState<number | null>(null);

  if (!products || products.length === 0) return null;

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) return;

    const primaryVariant = product.variants && product.variants.length > 0 ? product.variants[0] : undefined;
    addToCart(product, primaryVariant, 1);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1800);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">{title}</h2>
            {badgeLabel && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {badgeLabel}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
        </div>
        <Link
          to={viewAllUrl}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((prod) => {
          const isOutOfStock = (prod.stock ?? 0) <= 0;
          const isLowStock = !isOutOfStock && (prod.stock ?? 0) <= 5;

          return (
            <div
              key={prod.id}
              className="bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Product Image & Badges */}
                <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 mb-3">
                  <img
                    src={prod.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80'}
                    alt={prod.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Discount percentage tag */}
                  {prod.discount_percent > 0 && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                      {Math.round(prod.discount_percent)}% OFF
                    </div>
                  )}

                  {/* Inventory stock status badge */}
                  <div className="absolute bottom-2 left-2">
                    {isOutOfStock ? (
                      <span className="bg-neutral-900/90 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="bg-amber-500 text-neutral-950 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                        Only {prod.stock} Left!
                      </span>
                    ) : (
                      <span className="bg-emerald-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs">
                        In Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Brand & Category */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 truncate">
                    {prod.brand_name || prod.category_name || 'Hardware'}
                  </span>
                  {prod.average_rating > 0 && (
                    <div className="flex items-center gap-0.5 text-amber-500 text-[11px] font-semibold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{prod.average_rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <Link
                  to={`/product/${prod.slug || prod.id}`}
                  className="text-sm font-semibold text-neutral-900 hover:text-emerald-700 line-clamp-2 leading-snug"
                >
                  {prod.name}
                </Link>

                {prod.short_description && (
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{prod.short_description}</p>
                )}
              </div>

              {/* Pricing & CTA */}
              <div className="mt-4 pt-3 border-t border-neutral-100">
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-lg font-extrabold text-neutral-900">
                    ₹{prod.price.toLocaleString('en-IN')}
                  </span>
                  {prod.mrp > prod.price && (
                    <span className="text-xs text-neutral-400 line-through">
                      ₹{prod.mrp.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => handleAddToCart(e, prod)}
                  disabled={isOutOfStock}
                  className={`w-full text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                    isOutOfStock
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
                      : addedProductId === prod.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                  }`}
                >
                  {isOutOfStock ? (
                    <span>Unavailable</span>
                  ) : addedProductId === prod.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
