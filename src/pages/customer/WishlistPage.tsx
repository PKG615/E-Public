import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  ShoppingBag, 
  Trash2, 
  ArrowRight, 
  Star, 
  ShieldCheck, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { useWishlistCompare } from '../../context/WishlistCompareContext';
import { useCart } from '../../context/CartContext';

export const WishlistPage: React.FC = () => {
  const { wishlistItems, removeFromWishlist, wishlistCount } = useWishlistCompare();
  const { addToCart } = useCart();
  const [movedId, setMovedId] = React.useState<number | null>(null);

  const handleMoveToCart = async (item: typeof wishlistItems[0]) => {
    addToCart(item.product, undefined, 1);
    setMovedId(item.product_id);
    setTimeout(async () => {
      await removeFromWishlist(item.product_id);
      setMovedId(null);
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
            <Link to="/" className="hover:text-neutral-900 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-neutral-900 font-semibold">Wishlist</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              My Wishlist
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
              {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Saved products with live PostgreSQL inventory and dynamic price updates.
          </p>
        </div>

        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-300 hover:bg-neutral-50 px-4 py-2 rounded-lg transition-colors shadow-xs"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Empty State */}
      {wishlistItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900">Your wishlist is empty</h2>
          <p className="text-xs text-neutral-500 leading-relaxed max-w-sm mx-auto">
            Explore our verified catalog to save items you love. You can track prices, check real stock, and move them to cart anytime.
          </p>
          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-colors shadow-md"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Shop Catalog</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Wishlist Items Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => {
            const prod = item.product;
            const primaryImg = prod.images?.find((img) => img.is_primary)?.image_url ||
              prod.images?.[0]?.image_url ||
              prod.image_url ||
              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
            const inStock = (prod.stock ?? prod.stock_quantity ?? 0) > 0;
            const isMoving = movedId === prod.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Image Section */}
                <div className="relative aspect-square bg-neutral-50 overflow-hidden">
                  <Link to={`/product/${prod.slug || prod.id}`}>
                    <img
                      src={primaryImg}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(prod.id)}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs text-neutral-400 hover:text-rose-600 hover:bg-white flex items-center justify-center transition-colors shadow-xs"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Discount Badge */}
                  {prod.discount_percent > 0 && (
                    <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                      {Math.round(prod.discount_percent)}% OFF
                    </span>
                  )}

                  {/* Stock Status Badge */}
                  <div className="absolute bottom-2.5 left-2.5">
                    {inStock ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        In Stock ({prod.stock ?? prod.stock_quantity})
                      </span>
                    ) : (
                      <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {prod.brand_name && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                        {prod.brand_name}
                      </span>
                    )}
                    <Link
                      to={`/product/${prod.slug || prod.id}`}
                      className="text-xs font-bold text-neutral-900 hover:text-emerald-700 line-clamp-2 transition-colors"
                    >
                      {prod.name}
                    </Link>
                  </div>

                  {/* Price Row */}
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-sm font-extrabold text-neutral-900">
                      ₹{prod.price.toLocaleString('en-IN')}
                    </span>
                    {prod.mrp > prod.price && (
                      <span className="text-xs text-neutral-400 line-through">
                        ₹{prod.mrp.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {/* Move to Cart Action */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
                    <button
                      disabled={!inStock || isMoving}
                      onClick={() => handleMoveToCart(item)}
                      className={`flex-1 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        isMoving
                          ? 'bg-emerald-600 text-white'
                          : inStock
                          ? 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs'
                          : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      }`}
                    >
                      {isMoving ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Moved to Cart</span>
                        </>
                      ) : inStock ? (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Move to Cart</span>
                        </>
                      ) : (
                        <span>Out of Stock</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
