import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeftRight, 
  Trash2, 
  ShoppingBag, 
  Check, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  RotateCcw,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useWishlistCompare } from '../../context/WishlistCompareContext';
import { useCart } from '../../context/CartContext';

export const ComparePage: React.FC = () => {
  const { compareItems, removeFromCompare, clearCompare, compareCount } = useWishlistCompare();
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = React.useState<number[]>([]);

  const handleAddToCart = (item: typeof compareItems[0]) => {
    addToCart(item.product, undefined, 1);
    setAddedIds((prev) => [...prev, item.product_id]);
    setTimeout(() => {
      setAddedIds((prev) => prev.filter((id) => id !== item.product_id));
    }, 2000);
  };

  // Extract all unique specification keys across compared products
  const allSpecKeys = React.useMemo(() => {
    const keys = new Set<string>();
    compareItems.forEach((item) => {
      if (item.product.specifications && typeof item.product.specifications === 'object') {
        Object.keys(item.product.specifications).forEach((k) => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [compareItems]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
            <Link to="/" className="hover:text-neutral-900 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-neutral-900 font-semibold">Compare Products</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              Product Comparison
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              {compareCount} / 4 Products
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Side-by-side technical specification, pricing, and live inventory comparison.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {compareCount > 0 && (
            <button
              onClick={clearCompare}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-lg transition-colors shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-300 hover:bg-neutral-50 px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            <span>Add More Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Empty State */}
      {compareItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
            <ArrowLeftRight className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900">No products to compare</h2>
          <p className="text-xs text-neutral-500 leading-relaxed max-w-sm mx-auto">
            Select up to 4 items from product detail pages or catalog cards to compare technical specifications, live pricing, and inventory status.
          </p>
          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-colors shadow-md"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Catalog</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Comparison Matrix */
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70">
                  <th className="p-4 w-48 min-w-40 text-xs font-bold uppercase tracking-wider text-neutral-500 sticky left-0 bg-neutral-50/95 backdrop-blur-xs z-10 border-r border-neutral-200">
                    Product Overview
                  </th>
                  {compareItems.map((item) => {
                    const prod = item.product;
                    const primaryImg = prod.images?.find((img) => img.is_primary)?.image_url ||
                      prod.images?.[0]?.image_url ||
                      prod.image_url ||
                      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
                    const inStock = (prod.stock ?? prod.stock_quantity ?? 0) > 0;
                    const isAdded = addedIds.includes(prod.id);

                    return (
                      <th
                        key={item.id}
                        className="p-4 min-w-64 max-w-72 align-top border-r border-neutral-100 last:border-r-0"
                      >
                        <div className="relative space-y-3">
                          <button
                            onClick={() => removeFromCompare(prod.id)}
                            className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-neutral-100 hover:bg-rose-50 text-neutral-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                            title="Remove from comparison"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="aspect-square w-full rounded-xl bg-neutral-100 overflow-hidden">
                            <Link to={`/product/${prod.slug || prod.id}`}>
                              <img
                                src={primaryImg}
                                alt={prod.name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                              />
                            </Link>
                          </div>

                          <div>
                            {prod.brand_name && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                                {prod.brand_name}
                              </span>
                            )}
                            <Link
                              to={`/product/${prod.slug || prod.id}`}
                              className="text-xs font-bold text-neutral-900 hover:text-emerald-700 line-clamp-2 transition-colors block mt-0.5"
                            >
                              {prod.name}
                            </Link>
                          </div>

                          <div className="pt-1">
                            <button
                              disabled={!inStock}
                              onClick={() => handleAddToCart(item)}
                              className={`w-full text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                                isAdded
                                  ? 'bg-emerald-600 text-white'
                                  : inStock
                                  ? 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs'
                                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-white" />
                                  <span>Added!</span>
                                </>
                              ) : inStock ? (
                                <>
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>Add to Cart</span>
                                </>
                              ) : (
                                <span>Out of Stock</span>
                              )}
                            </button>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                  {/* Empty Slot Placeholder if < 4 */}
                  {Array.from({ length: 4 - compareItems.length }).map((_, idx) => (
                    <th key={`empty-${idx}`} className="p-4 min-w-64 max-w-72 align-middle text-center border-r border-neutral-100 last:border-r-0 bg-neutral-50/30">
                      <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 flex flex-col items-center justify-center space-y-2">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                          <Plus className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-bold text-neutral-500">Empty Slot</p>
                        <Link
                          to="/shop"
                          className="text-[11px] font-semibold text-emerald-700 hover:underline"
                        >
                          Select product
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-200 text-xs">
                {/* Price Row */}
                <tr className="hover:bg-neutral-50/50">
                  <td className="p-4 font-bold text-neutral-700 sticky left-0 bg-white border-r border-neutral-200">
                    Selling Price & MRP
                  </td>
                  {compareItems.map((item) => {
                    const p = item.product;
                    return (
                      <td key={item.id} className="p-4 border-r border-neutral-100 last:border-r-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-extrabold text-neutral-900">
                            ₹{p.price.toLocaleString('en-IN')}
                          </span>
                          {p.mrp > p.price && (
                            <span className="text-xs text-neutral-400 line-through">
                              ₹{p.mrp.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        {p.discount_percent > 0 && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            {Math.round(p.discount_percent)}% Savings
                          </span>
                        )}
                      </td>
                    );
                  })}
                  {Array.from({ length: 4 - compareItems.length }).map((_, idx) => (
                    <td key={`empty-price-${idx}`} className="p-4 border-r border-neutral-100 last:border-r-0 text-neutral-400">—</td>
                  ))}
                </tr>

                {/* Stock & Availability */}
                <tr className="hover:bg-neutral-50/50">
                  <td className="p-4 font-bold text-neutral-700 sticky left-0 bg-white border-r border-neutral-200">
                    Availability
                  </td>
                  {compareItems.map((item) => {
                    const inStock = (item.product.stock ?? item.product.stock_quantity ?? 0) > 0;
                    return (
                      <td key={item.id} className="p-4 border-r border-neutral-100 last:border-r-0">
                        {inStock ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>In Stock ({item.product.stock ?? item.product.stock_quantity} available)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-red-600 font-semibold">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span>Currently Out of Stock</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  {Array.from({ length: 4 - compareItems.length }).map((_, idx) => (
                    <td key={`empty-stock-${idx}`} className="p-4 border-r border-neutral-100 last:border-r-0 text-neutral-400">—</td>
                  ))}
                </tr>

                {/* Category & Brand */}
                <tr className="hover:bg-neutral-50/50">
                  <td className="p-4 font-bold text-neutral-700 sticky left-0 bg-white border-r border-neutral-200">
                    Brand & Category
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-4 border-r border-neutral-100 last:border-r-0 space-y-1">
                      <div className="font-semibold text-neutral-900">{item.product.brand_name || 'Generic'}</div>
                      <div className="text-neutral-500 text-[11px]">{item.product.category_name || 'Standard'}</div>
                    </td>
                  ))}
                  {Array.from({ length: 4 - compareItems.length }).map((_, idx) => (
                    <td key={`empty-brand-${idx}`} className="p-4 border-r border-neutral-100 last:border-r-0 text-neutral-400">—</td>
                  ))}
                </tr>

                {/* SKU */}
                <tr className="hover:bg-neutral-50/50">
                  <td className="p-4 font-bold text-neutral-700 sticky left-0 bg-white border-r border-neutral-200">
                    SKU Code
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-4 border-r border-neutral-100 last:border-r-0 font-mono text-neutral-800">
                      {item.product.sku}
                    </td>
                  ))}
                  {Array.from({ length: 4 - compareItems.length }).map((_, idx) => (
                    <td key={`empty-sku-${idx}`} className="p-4 border-r border-neutral-100 last:border-r-0 text-neutral-400">—</td>
                  ))}
                </tr>

                {/* Warranty & Return Policy */}
                <tr className="hover:bg-neutral-50/50">
                  <td className="p-4 font-bold text-neutral-700 sticky left-0 bg-white border-r border-neutral-200">
                    Warranty & Returns
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-4 border-r border-neutral-100 last:border-r-0 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-neutral-800">
                        <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{item.product.warranty_info || item.product.warranty || '1 Year Warranty'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-600">
                        <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{item.product.return_policy || '7-Day Return Policy'}</span>
                      </div>
                    </td>
                  ))}
                  {Array.from({ length: 4 - compareItems.length }).map((_, idx) => (
                    <td key={`empty-policy-${idx}`} className="p-4 border-r border-neutral-100 last:border-r-0 text-neutral-400">—</td>
                  ))}
                </tr>

                {/* Available Variants count */}
                <tr className="hover:bg-neutral-50/50">
                  <td className="p-4 font-bold text-neutral-700 sticky left-0 bg-white border-r border-neutral-200">
                    Active Variants
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-4 border-r border-neutral-100 last:border-r-0">
                      {item.product.variants && item.product.variants.length > 0 ? (
                        <span className="font-semibold text-neutral-800">
                          {item.product.variants.length} option{item.product.variants.length > 1 ? 's' : ''} available
                        </span>
                      ) : (
                        <span className="text-neutral-500">Standard model</span>
                      )}
                    </td>
                  ))}
                  {Array.from({ length: 4 - compareItems.length }).map((_, idx) => (
                    <td key={`empty-var-${idx}`} className="p-4 border-r border-neutral-100 last:border-r-0 text-neutral-400">—</td>
                  ))}
                </tr>

                {/* Dynamic Specifications Rows */}
                {allSpecKeys.map((key) => (
                  <tr key={key} className="hover:bg-neutral-50/50">
                    <td className="p-4 font-bold text-neutral-700 sticky left-0 bg-white border-r border-neutral-200">
                      {key}
                    </td>
                    {compareItems.map((item) => {
                      const specVal = item.product.specifications?.[key];
                      return (
                        <td key={item.id} className="p-4 border-r border-neutral-100 last:border-r-0 text-neutral-800">
                          {specVal ? String(specVal) : <span className="text-neutral-400">—</span>}
                        </td>
                      );
                    })}
                    {Array.from({ length: 4 - compareItems.length }).map((_, idx) => (
                      <td key={`empty-spec-${key}-${idx}`} className="p-4 border-r border-neutral-100 last:border-r-0 text-neutral-400">—</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
