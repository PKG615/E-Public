import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Trash2, 
  ArrowRight, 
  Tag, 
  ShieldCheck, 
  Truck,
  AlertCircle,
  RefreshCw,
  Sparkles,
  MapPin,
  CheckCircle2,
  X
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    cart,
    items, 
    isLoading,
    isUpdating,
    error,
    clearError,
    removeFromCart, 
    updateQuantity, 
    clearCart,
    totalItemsCount,
    totalMrp,
    totalSellingPrice,
    productDiscount,
    couponCode,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    shippingAmount,
    taxAmount,
    finalTotal,
    pincode,
    checkPincode,
    pincodeDeliveryInfo
  } = useCart();

  const { isAuthenticated } = useAuth();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [inputPincode, setInputPincode] = useState(pincode || '110001');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    const res = applyCoupon(inputCoupon);
    setCouponMsg({ success: res.success, text: res.message });
    if (res.success) setInputCoupon('');
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    checkPincode(inputPincode);
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-neutral-400 mx-auto" />
        <p className="text-xs font-semibold text-neutral-500">Retrieving your shopping cart from server...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto shadow-xs">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Your Shopping Cart is Empty</h1>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
          Looks like you haven't added anything to your cart yet. Explore our top electronics, apparel, and gadgets catalog.
        </p>
        <div className="pt-2">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all shadow-xs"
          >
            <span>Start Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Free shipping threshold calculation
  const freeShippingThreshold = 999;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - totalSellingPrice);
  const freeShippingProgress = Math.min(100, (totalSellingPrice / freeShippingThreshold) * 100);

  // Check if any items have stock errors
  const hasStockIssues = items.some((item) => !item.in_stock || item.available_quantity < item.quantity);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-neutral-900" />
            <span>Shopping Cart</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {totalItemsCount} authoritative item{totalItemsCount > 1 ? 's' : ''} saved in your session
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => clearCart()}
            disabled={isUpdating}
            className="text-xs font-semibold text-neutral-500 hover:text-red-600 transition-colors"
          >
            Clear Entire Cart
          </button>
          <Link
            to="/shop"
            className="text-xs font-semibold text-neutral-900 hover:underline"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={clearError} className="p-1 text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Free Delivery Banner */}
      <div className="mb-6 p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            {amountToFreeShipping > 0 ? (
              <span className="font-semibold text-neutral-800">
                Add <strong className="text-neutral-900 font-extrabold">₹{amountToFreeShipping.toLocaleString('en-IN')}</strong> more to enjoy <span className="text-emerald-700 font-bold uppercase">Free Shipping</span>!
              </span>
            ) : (
              <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>You unlocked FREE Delivery for this order!</span>
              </span>
            )}
          </div>
          <span className="font-extrabold text-neutral-500">{Math.round(freeShippingProgress)}%</span>
        </div>
        <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-emerald-600 h-2 rounded-full transition-all duration-500" 
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => {
            const isOutOfStock = !item.in_stock || item.available_quantity < item.quantity;
            const isLowStock = item.available_quantity <= 3 && item.available_quantity >= item.quantity;

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isOutOfStock 
                    ? 'border-red-200 bg-red-50/30' 
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                } shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
              >
                {/* Product details */}
                <div className="flex items-start sm:items-center gap-4">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80'}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-xl object-cover bg-neutral-100 shrink-0 border border-neutral-200"
                  />
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                      {item.product.brand_name || 'Brand'}
                    </span>
                    <Link
                      to={`/product/${item.product.slug || item.product.id}`}
                      className="text-sm font-bold text-neutral-900 hover:text-emerald-700 block leading-tight"
                    >
                      {item.product.name}
                    </Link>

                    {item.variant && (
                      <span className="inline-block text-[11px] text-neutral-600 font-semibold bg-neutral-100 px-2 py-0.5 rounded-md">
                        {item.variant.title}
                      </span>
                    )}

                    {/* Stock status indicator */}
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600">
                        <AlertCircle className="w-3 h-3" />
                        <span>Only {item.available_quantity} available in stock</span>
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                        <span>Only {item.available_quantity} units remaining!</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <span>In Stock ({item.available_quantity} available)</span>
                      </span>
                    )}

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="text-sm font-extrabold text-neutral-900">
                        ₹{item.unit_price.toLocaleString('en-IN')}
                      </span>
                      {item.mrp > item.unit_price && (
                        <span className="text-xs text-neutral-400 line-through">
                          ₹{item.mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right controls: Quantity and Line Total */}
                <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-neutral-300 rounded-xl bg-neutral-50 overflow-hidden">
                    <button
                      disabled={isUpdating || item.quantity <= 1}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-40 font-bold transition-colors"
                      title="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="px-3 py-1.5 text-xs font-bold text-neutral-900 min-w-[28px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      disabled={isUpdating || item.quantity >= item.available_quantity || item.quantity >= 50}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-40 font-bold transition-colors"
                      title={item.quantity >= item.available_quantity ? 'Max stock reached' : 'Increase quantity'}
                    >
                      +
                    </button>
                  </div>

                  {/* Line Total & Remove */}
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-neutral-900 block">
                      ₹{item.line_subtotal.toLocaleString('en-IN')}
                    </span>
                    <button
                      disabled={isUpdating}
                      onClick={() => removeFromCart(item.id)}
                      className="text-neutral-400 hover:text-red-600 text-xs flex items-center gap-1 mt-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Delivery Pincode Checker Box */}
          <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
              <MapPin className="w-4 h-4 text-neutral-700" />
              <span>Check Delivery Pincode & Serviceability</span>
            </div>
            <form onSubmit={handleCheckPincode} className="flex gap-2 max-w-sm">
              <input
                type="text"
                maxLength={6}
                value={inputPincode}
                onChange={(e) => setInputPincode(e.target.value)}
                placeholder="Enter 6-digit pincode"
                className="flex-1 px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
              >
                Check
              </button>
            </form>
            {pincodeDeliveryInfo && (
              <p className={`text-xs font-medium ${pincodeDeliveryInfo.serviceable ? 'text-emerald-700' : 'text-red-600'}`}>
                {pincodeDeliveryInfo.message}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout Action */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-5 sticky top-24">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800 pb-3 border-b border-neutral-100">
              Price & Tax Details
            </h2>

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-700">Apply Promo / Coupon</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SAVE10"
                  value={inputCoupon}
                  onChange={(e) => setInputCoupon(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs uppercase border border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
                >
                  Apply
                </button>
              </div>
              {couponCode && (
                <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg font-semibold">
                  <span>Coupon Applied: {couponCode}</span>
                  <button onClick={removeCoupon} className="text-red-500 hover:text-red-700 text-[11px] underline">
                    Remove
                  </button>
                </div>
              )}
              {couponMsg && !couponCode && (
                <p className={`text-[11px] font-medium ${couponMsg.success ? 'text-emerald-600' : 'text-red-500'}`}>
                  {couponMsg.text}
                </p>
              )}
            </form>

            {/* Price Calculations */}
            <div className="space-y-3 text-xs border-t border-b border-neutral-100 py-4">
              <div className="flex justify-between text-neutral-600">
                <span>Total MRP ({totalItemsCount} items)</span>
                <span className="font-semibold text-neutral-900">
                  ₹{totalMrp.toLocaleString('en-IN')}
                </span>
              </div>

              {productDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Product Discount</span>
                  <span>-₹{productDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600">
                <span>Selling Subtotal</span>
                <span className="font-semibold text-neutral-900">
                  ₹{totalSellingPrice.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>Estimated GST Tax</span>
                <span className="font-semibold text-neutral-900">
                  ₹{taxAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>Delivery Fee</span>
                <span className="font-semibold text-neutral-900">
                  {shippingAmount === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase text-[11px]">Free</span>
                  ) : (
                    `₹${shippingAmount.toLocaleString('en-IN')}`
                  )}
                </span>
              </div>
            </div>

            {/* Total Payable */}
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-sm font-extrabold text-neutral-900 block">Total Payable</span>
                <span className="text-[10px] text-neutral-400">Includes all duties & GST</span>
              </div>
              <span className="text-xl font-extrabold text-neutral-900 tracking-tight">
                ₹{finalTotal.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Warning if stock issues exist */}
            {hasStockIssues && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                One or more items in your cart exceed current available inventory. Please adjust quantities before checkout.
              </div>
            )}

            {/* Proceed to Checkout Button */}
            <button
              onClick={() => navigate('/checkout')}
              disabled={hasStockIssues || isUpdating}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/addresses"
                className="text-xs text-neutral-500 hover:text-neutral-900 font-medium hover:underline"
              >
                Manage Saved Delivery Addresses
              </Link>
            </div>

            {/* Safe Shopping Guarantee */}
            <div className="pt-3 border-t border-neutral-100 flex items-center gap-2 text-[11px] text-neutral-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Authoritative PostgreSQL calculation & secure data privacy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
