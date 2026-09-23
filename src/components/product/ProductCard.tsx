import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag, Check, AlertCircle } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState<boolean>(false);

  const isOutOfStock = (product.stock ?? 0) <= 0;
  const isLowStock = !isOutOfStock && (product.stock ?? 0) <= 5;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    const primaryVariant = product.variants && product.variants.length > 0 ? product.variants[0] : undefined;
    addToCart(product, primaryVariant, 1).then((result) => {
      if (!result.success) return;
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1800);
    });
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Product Image & Badges */}
        <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 mb-3">
          <img
            src={product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80'}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Discount percentage tag */}
          {product.discount_percent > 0 && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
              {Math.round(product.discount_percent)}% OFF
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
                Only {product.stock} Left!
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
            {product.brand_name || product.category_name || 'Hardware'}
          </span>
          {product.average_rating > 0 && (
            <div className="flex items-center gap-0.5 text-amber-500 text-[11px] font-semibold">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>{product.average_rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <Link
          to={`/product/${product.slug || product.id}`}
          className="text-sm font-semibold text-neutral-900 hover:text-emerald-700 line-clamp-2 leading-snug"
        >
          {product.name}
        </Link>

        {product.short_description && (
          <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{product.short_description}</p>
        )}
      </div>

      {/* Pricing & CTA */}
      <div className="mt-4 pt-3 border-t border-neutral-100">
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-extrabold text-neutral-900">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.mrp > product.price && (
            <span className="text-xs text-neutral-400 line-through">
              ₹{product.mrp.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`w-full text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            isOutOfStock
              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              : isAdded
              ? 'bg-emerald-600 text-white'
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
          }`}
        >
          {isOutOfStock ? (
            'Unavailable'
          ) : isAdded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Added to Cart</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
