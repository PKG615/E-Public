import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Check, 
  Star, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  MapPin, 
  Layers, 
  Sparkles,
  AlertCircle,
  Heart,
  ArrowLeftRight,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Share2,
  Eye
} from 'lucide-react';
import { Product, ProductVariant, ProductImage } from '../../types';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useWishlistCompare } from '../../context/WishlistCompareContext';
import { ProductReviewsSection } from '../../components/reviews/ProductReviewsSection';

export const ProductDetailPage: React.FC = () => {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const navigate = useNavigate();
  const { addToCart, pincode, checkPincode, pincodeDeliveryInfo } = useCart();
  const { 
    isInWishlist, 
    toggleWishlist, 
    isInCompare, 
    toggleCompare, 
    recordProductView, 
    recentlyViewedIds 
  } = useWishlistCompare();

  // Core Data States
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);
  const [pincodeInput, setPincodeInput] = useState<string>(pincode);
  
  // Gallery & UI States
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false });
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'shipping' | 'warranty'>('overview');
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Recommendations & Foundations
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState<boolean>(false);

  // Fetch Main Product
  useEffect(() => {
    const fetchProduct = async () => {
      if (!slugOrId) return;
      setLoading(true);
      try {
        const res = await api.products.getByIdOrSlug(slugOrId);
        if (res.success && res.data) {
          const prod = res.data;
          setProduct(prod);
          document.title = `${prod.seo_title || prod.meta_title || prod.name} | Nexus Enterprise`;
          
          // Select default variant
          if (prod.variants && prod.variants.length > 0) {
            const defaultV = prod.variants.find(v => v.is_active && v.stock > 0) || prod.variants[0];
            setSelectedVariant(defaultV);
          } else {
            setSelectedVariant(null);
          }

          // Select primary image
          if (prod.images && prod.images.length > 0) {
            const primaryIdx = prod.images.findIndex(img => img.is_primary);
            setSelectedImageIdx(primaryIdx >= 0 ? primaryIdx : 0);
          } else {
            setSelectedImageIdx(0);
          }

          // Record in Recently Viewed foundation
          recordProductView(prod.id);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slugOrId, recordProductView]);

  // Fetch Related Products (Foundation)
  useEffect(() => {
    const fetchRelated = async () => {
      if (!product) return;
      setLoadingRelated(true);
      try {
        const res = await api.products.getRelated(product.id, 6);
        if (res.success && res.data) {
          setRelatedProducts(res.data);
        }
      } catch (e) {
        console.error('Failed to fetch related products:', e);
      } finally {
        setLoadingRelated(false);
      }
    };
    fetchRelated();
  }, [product]);

  // Fetch Recently Viewed Products (Foundation)
  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      if (!product) return;
      // Filter out current product id
      const otherIds = recentlyViewedIds.filter(id => id !== product.id).slice(0, 6);
      if (otherIds.length === 0) {
        setRecentlyViewedProducts([]);
        return;
      }
      try {
        const res = await api.products.getRecentlyViewed(otherIds);
        if (res.success && res.data) {
          setRecentlyViewedProducts(res.data);
        }
      } catch (e) {
        console.error('Failed to fetch recently viewed:', e);
      }
    };
    fetchRecentlyViewed();
  }, [product, recentlyViewedIds]);

  // Dynamic calculations
  const currentPrice = selectedVariant?.price ?? product?.price ?? 0;
  const currentMrp = selectedVariant?.mrp ?? product?.mrp ?? 0;
  const currentStock = selectedVariant?.stock ?? product?.stock ?? 0;
  const currentSku = selectedVariant?.sku ?? product?.sku ?? '';
  const savingsAmount = Math.max(0, currentMrp - currentPrice);
  const discountPercent = currentMrp > 0 ? Math.round((savingsAmount / currentMrp) * 100) : 0;
  const inStock = currentStock > 0;
  const isLowStock = inStock && currentStock <= 5;

  const fallbackImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
  const images: ProductImage[] = useMemo(() => {
    if (product?.images && product.images.length > 0) {
      return product.images;
    }
    return [{ 
      image_url: product?.image_url || fallbackImage, 
      is_primary: true, 
      sort_order: 0, 
      alt_text: product?.name || 'Product Image', 
      display_order: 1 
    }];
  }, [product]);

  const activeImage = images[selectedImageIdx] || images[0];

  // Image Magnifier Handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y, show: true });
  };

  const handleMouseLeave = () => {
    setZoomPos((prev) => ({ ...prev, show: false }));
  };

  const handleAdd = () => {
    if (!product || !inStock) return;
    addToCart(product, selectedVariant || undefined, quantity);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2200);
  };

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    checkPincode(pincodeInput);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-10 h-10 border-4 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-neutral-600">Retrieving live product specifications and inventory from database...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-neutral-900">Product Not Found</h2>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
          The requested product does not exist in PostgreSQL or is not currently marked active.
        </p>
        <Link
          to="/shop"
          className="inline-block bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-xs"
        >
          Return to Shop Catalog
        </Link>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumbs Navigation */}
      <div className="flex items-center justify-between gap-4 text-xs text-neutral-500">
        <div className="flex items-center gap-2 truncate">
          <Link to="/" className="hover:text-neutral-900 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-neutral-900 transition-colors">Shop</Link>
          <span>/</span>
          {product.category_name && (
            <>
              <Link 
                to={`/shop?category=${product.category_name.toLowerCase().replace(/\s+/g, '-')}`} 
                className="hover:text-neutral-900 transition-colors capitalize truncate max-w-32"
              >
                {product.category_name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-neutral-900 font-semibold truncate max-w-xs">{product.name}</span>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1.5 rounded-md transition-colors shrink-0"
          title="Share Product"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold">{copiedShare ? 'Link Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Main Product Presentation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: PRODUCT GALLERY WITH ZOOM & LIGHTBOX        */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col-reverse md:flex-row gap-4">
            
            {/* Vertical / Horizontal Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto max-h-[500px] shrink-0 scrollbar-thin">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-neutral-100 relative ${
                      selectedImageIdx === idx 
                        ? 'border-neutral-900 shadow-md ring-2 ring-neutral-900/10' 
                        : 'border-neutral-200 hover:border-neutral-400 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={img.image_url} 
                      alt={img.alt_text || `Thumbnail ${idx + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                    {img.is_primary && (
                      <span className="absolute bottom-0 inset-x-0 bg-neutral-900/80 text-[8px] text-white font-bold py-0.5 text-center">
                        MAIN
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image with Zoom Lens */}
            <div className="flex-1 relative aspect-square rounded-2xl bg-neutral-100 border border-neutral-200 overflow-hidden group shadow-xs">
              <div 
                className="w-full h-full cursor-crosshair overflow-hidden relative"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  src={activeImage.image_url}
                  alt={activeImage.alt_text || product.name}
                  className="w-full h-full object-cover object-center transition-transform duration-200"
                />

                {/* Magnifier zoom overlay */}
                {zoomPos.show && (
                  <div 
                    className="hidden lg:block absolute inset-0 pointer-events-none bg-no-repeat z-10"
                    style={{
                      backgroundImage: `url(${activeImage.image_url})`,
                      backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                      backgroundSize: '250%',
                    }}
                  />
                )}
              </div>

              {/* Badges on Gallery */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none z-20">
                {product.is_featured && (
                  <span className="bg-neutral-900 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Featured
                  </span>
                )}
                {product.is_best_seller && (
                  <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Best Seller
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Lightbox Trigger & Wishlist Toggle */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs text-neutral-600 hover:text-neutral-900 hover:bg-white flex items-center justify-center transition-colors shadow-xs"
                  title="Expand Fullscreen Lightbox"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product, selectedVariant?.id)}
                  className={`w-9 h-9 rounded-full backdrop-blur-xs flex items-center justify-center transition-all shadow-xs ${
                    isWishlisted 
                      ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                      : 'bg-white/90 text-neutral-400 hover:text-rose-600 hover:bg-white'
                  }`}
                  title={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                </button>
              </div>

              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-neutral-900/70 text-white text-[10px] font-bold px-2.5 py-1 rounded-full pointer-events-none backdrop-blur-xs">
                  {selectedImageIdx + 1} / {images.length}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: DYNAMIC PRICING, VARIANTS, STOCK & ACTIONS */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Header Brand & Title */}
          <div>
            {product.brand_name && (
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                {product.brand_name}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
              {product.name}
            </h1>
            
            {/* Rating and Reviews */}
            <div className="flex items-center gap-3 mt-2.5">
              <a
                href="#product-reviews-section"
                className="flex items-center gap-2 group hover:opacity-85 transition-opacity"
              >
                <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md text-xs font-bold border border-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{typeof product.average_rating === 'number' ? product.average_rating.toFixed(1) : '0.0'}</span>
                </div>
                <span className="text-xs text-neutral-600 underline group-hover:text-neutral-900">
                  {product.total_reviews ?? 0} customer reviews
                </span>
              </a>
              <span className="text-neutral-300">•</span>
              <span className="text-xs text-neutral-500 font-mono">
                SKU: <strong className="text-neutral-800">{currentSku}</strong>
              </span>
            </div>
          </div>

          {/* Pricing Display */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-neutral-900 tracking-tight">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {currentMrp > currentPrice && (
                <span className="text-base text-neutral-400 line-through">
                  ₹{currentMrp.toLocaleString('en-IN')}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  Save ₹{savingsAmount.toLocaleString('en-IN')} ({discountPercent}% off)
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-500 font-medium">
              Inclusive of {product.tax_percent ?? 18}% GST • Free delivery available on prepaid orders
            </p>
          </div>

          {/* Live Inventory Status */}
          <div className="flex items-center gap-2 text-xs">
            {inStock ? (
              isLowStock ? (
                <div className="flex items-center gap-2 text-amber-700 font-bold bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>Hurry! Only {currentStock} left in stock</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>In Stock ({currentStock} available in warehouse)</span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2 text-rose-700 font-bold bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Currently Out of Stock</span>
              </div>
            )}
          </div>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Select Model / Variant:
                </label>
                {selectedVariant && (
                  <span className="text-xs font-semibold text-emerald-700">
                    {selectedVariant.title}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id ? selectedVariant.id === v.id : selectedVariant?.sku === v.sku;
                  return (
                    <button
                      key={v.sku}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm ring-1 ring-neutral-900'
                          : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold truncate">{v.title}</span>
                        {v.stock <= 0 && (
                          <span className="text-[9px] uppercase px-1 rounded bg-red-100 text-red-700">
                            Sold Out
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] font-semibold ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        ₹{v.price.toLocaleString('en-IN')}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Stepper & Add to Cart & Buy Now */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              {/* Stepper */}
              <div className={`flex items-center border rounded-xl bg-white overflow-hidden ${!inStock ? 'border-neutral-200 opacity-50 cursor-not-allowed' : 'border-neutral-300'}`}>
                <button
                  type="button"
                  disabled={!inStock || quantity <= 1}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-2.5 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 text-sm font-bold transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-2.5 text-xs font-bold text-neutral-900 min-w-8 text-center">
                  {!inStock ? 0 : quantity}
                </span>
                <button
                  type="button"
                  disabled={!inStock || quantity >= currentStock}
                  onClick={() => setQuantity(Math.min(currentStock || 10, quantity + 1))}
                  className="px-3.5 py-2.5 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 text-sm font-bold transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAdd}
                disabled={!inStock}
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed text-white text-sm font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Buy Now & Compare Actions */}
            <div className="grid grid-cols-2 gap-3">
              {inStock ? (
                <button
                  type="button"
                  onClick={() => {
                    handleAdd();
                    navigate('/cart');
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-4 rounded-xl transition-colors text-center shadow-xs"
                >
                  Buy Now
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-neutral-200 text-neutral-400 text-xs font-bold py-3 px-4 rounded-xl cursor-not-allowed text-center"
                >
                  Temporarily Unavailable
                </button>
              )}

              {/* Compare Toggle Button */}
              <button
                type="button"
                onClick={() => toggleCompare(product)}
                className={`w-full text-xs font-semibold py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-colors ${
                  isCompared
                    ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                    : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>{isCompared ? 'In Compare (View)' : 'Add to Compare'}</span>
              </button>
            </div>
          </div>

          {/* Delivery Pincode Checker */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-neutral-500" />
              <span>Delivery Availability & Slots</span>
            </span>

            <form onSubmit={handlePincodeCheck} className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit delivery pincode"
                  className="w-full bg-white border border-neutral-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-900 font-medium focus:outline-none focus:ring-1 focus:ring-neutral-900 shadow-xs"
                />
              </div>
              <button
                type="submit"
                className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors shrink-0 shadow-xs"
              >
                Verify
              </button>
            </form>

            {pincodeDeliveryInfo && (
              <p className={`text-xs font-medium ${pincodeDeliveryInfo.serviceable ? 'text-emerald-700' : 'text-rose-600'}`}>
                {pincodeDeliveryInfo.message}
              </p>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-3 text-xs text-neutral-600">
            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 bg-white">
              <RotateCcw className="w-4 h-4 text-neutral-500 shrink-0" />
              <span>{product.return_policy || '7-Day Replacement Policy'}</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 bg-white">
              <ShieldCheck className="w-4 h-4 text-neutral-500 shrink-0" />
              <span>{product.warranty_info || product.warranty || '1 Year Brand Warranty'}</span>
            </div>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* PRODUCT INFORMATION TABS: SPECS, OVERVIEW, POLICY, FAQ    */}
      {/* ======================================================== */}
      <div className="border-t border-neutral-200 pt-10 space-y-6">
        <div className="flex items-center gap-2 border-b border-neutral-200 overflow-x-auto scrollbar-thin">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors shrink-0 ${
              activeTab === 'overview'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Overview & Description
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors shrink-0 ${
              activeTab === 'specs'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Technical Specifications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shipping')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors shrink-0 ${
              activeTab === 'shipping'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Shipping & Delivery
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('warranty')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors shrink-0 ${
              activeTab === 'warranty'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Warranty & Returns
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 space-y-4">
            <h3 className="text-base font-bold text-neutral-900">Product Highlights</h3>
            <div className="text-xs text-neutral-700 leading-relaxed space-y-3 max-w-3xl">
              <p>{product.description}</p>
              {product.short_description && (
                <p className="text-neutral-500 font-medium">{product.short_description}</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Specifications */}
        {activeTab === 'specs' && (
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200">
              <h3 className="text-sm font-bold text-neutral-900">Verified Technical Specifications</h3>
            </div>
            <div className="divide-y divide-neutral-100 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 px-6 py-3">
                <span className="font-semibold text-neutral-500">SKU Code</span>
                <span className="md:col-span-2 font-mono text-neutral-800">{product.sku}</span>
              </div>
              {product.brand_name && (
                <div className="grid grid-cols-1 md:grid-cols-3 px-6 py-3">
                  <span className="font-semibold text-neutral-500">Brand</span>
                  <span className="md:col-span-2 text-neutral-800 font-semibold">{product.brand_name}</span>
                </div>
              )}
              {product.category_name && (
                <div className="grid grid-cols-1 md:grid-cols-3 px-6 py-3">
                  <span className="font-semibold text-neutral-500">Category</span>
                  <span className="md:col-span-2 text-neutral-800">{product.category_name}</span>
                </div>
              )}
              {product.weight && (
                <div className="grid grid-cols-1 md:grid-cols-3 px-6 py-3">
                  <span className="font-semibold text-neutral-500">Item Weight</span>
                  <span className="md:col-span-2 text-neutral-800">{product.weight} kg</span>
                </div>
              )}
              {(product.length || product.width || product.height) && (
                <div className="grid grid-cols-1 md:grid-cols-3 px-6 py-3">
                  <span className="font-semibold text-neutral-500">Physical Dimensions</span>
                  <span className="md:col-span-2 text-neutral-800">
                    {[product.length, product.width, product.height].filter(Boolean).join(' × ')} cm
                  </span>
                </div>
              )}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="grid grid-cols-1 md:grid-cols-3 px-6 py-3">
                    <span className="font-semibold text-neutral-500">{key}</span>
                    <span className="md:col-span-2 text-neutral-800">{String(val)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Shipping & Delivery */}
        {activeTab === 'shipping' && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 space-y-4 text-xs text-neutral-700">
            <h3 className="text-base font-bold text-neutral-900">Logistics & Fulfilment Information</h3>
            <div className="space-y-3 max-w-2xl">
              <p>
                All orders are dispatched from our centralized climate-controlled fulfilment hubs within 24 hours of verification.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-neutral-600">
                <li>Metro cities: Delivered in 2 to 3 business days.</li>
                <li>Rest of India: Delivered in 4 to 6 business days.</li>
                <li>Real-time tracking links will be shared via email and SMS upon dispatch.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 4: Warranty & Returns */}
        {activeTab === 'warranty' && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 space-y-4 text-xs text-neutral-700">
            <h3 className="text-base font-bold text-neutral-900">Warranty Coverage & Policies</h3>
            <div className="space-y-3 max-w-2xl">
              <p>
                <strong>Warranty:</strong> {product.warranty_info || product.warranty || '1 Year Brand Manufacturer Warranty covers manufacturing defects.'}
              </p>
              <p>
                <strong>Returns:</strong> {product.return_policy || '7-day replacement guaranteed for damaged, defective, or incorrect products.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* CHECKPOINT 15: REVIEWS, RATINGS & PRODUCT Q&A            */}
      {/* ======================================================== */}
      <ProductReviewsSection product={product} />

      {/* ======================================================== */}
      {/* RELATED PRODUCTS SECTION (FOUNDATION)                    */}
      {/* ======================================================== */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-neutral-200 pt-10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
                Related Products
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Customers also viewed these items in {product.category_name || 'this collection'}
              </p>
            </div>
            <Link
              to={product.category_name ? `/shop?category=${product.category_name.toLowerCase().replace(/\s+/g, '-')}` : '/shop'}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              View More →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {relatedProducts.map((rel) => {
              const relImg = rel.images?.[0]?.image_url || rel.image_url || fallbackImage;
              return (
                <div
                  key={rel.id}
                  className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                >
                  <Link to={`/product/${rel.slug || rel.id}`} className="aspect-square bg-neutral-50 overflow-hidden block">
                    <img
                      src={relImg}
                      alt={rel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </Link>
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      {rel.brand_name && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block truncate">
                          {rel.brand_name}
                        </span>
                      )}
                      <Link
                        to={`/product/${rel.slug || rel.id}`}
                        className="text-xs font-bold text-neutral-900 hover:text-emerald-700 line-clamp-1 transition-colors block"
                        title={rel.name}
                      >
                        {rel.name}
                      </Link>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-extrabold text-neutral-900">
                        ₹{rel.price.toLocaleString('en-IN')}
                      </span>
                      {rel.mrp > rel.price && (
                        <span className="text-[10px] text-neutral-400 line-through">
                          ₹{rel.mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* RECENTLY VIEWED PRODUCTS (FOUNDATION)                    */}
      {/* ======================================================== */}
      {recentlyViewedProducts.length > 0 && (
        <div className="border-t border-neutral-200 pt-10 space-y-6">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-neutral-500" />
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
              Recently Viewed
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentlyViewedProducts.map((rv) => {
              const rvImg = rv.images?.[0]?.image_url || rv.image_url || fallbackImage;
              return (
                <div
                  key={rv.id}
                  className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                >
                  <Link to={`/product/${rv.slug || rv.id}`} className="aspect-square bg-neutral-50 overflow-hidden block">
                    <img
                      src={rvImg}
                      alt={rv.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </Link>
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      {rv.brand_name && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block truncate">
                          {rv.brand_name}
                        </span>
                      )}
                      <Link
                        to={`/product/${rv.slug || rv.id}`}
                        className="text-xs font-bold text-neutral-900 hover:text-emerald-700 line-clamp-1 transition-colors block"
                        title={rv.name}
                      >
                        {rv.name}
                      </Link>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-extrabold text-neutral-900">
                        ₹{rv.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FULLSCREEN IMAGE LIGHTBOX MODAL                         */}
      {/* ======================================================== */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
            <span className="text-xs text-neutral-400">
              {selectedImageIdx + 1} of {images.length}
            </span>
            <button
              onClick={() => setLightboxOpen(false)}
              className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setSelectedImageIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white flex items-center justify-center transition-colors z-40"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setSelectedImageIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white flex items-center justify-center transition-colors z-40"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Lightbox Center Image */}
          <div className="max-w-4xl max-h-[80vh] w-full h-full flex items-center justify-center">
            <img
              src={activeImage.image_url}
              alt={activeImage.alt_text || product.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Bottom Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto max-w-xl pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImageIdx === idx ? 'border-white scale-105' : 'border-neutral-700 opacity-60'
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
