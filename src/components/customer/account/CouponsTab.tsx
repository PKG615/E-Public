import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Tag, 
  Copy, 
  Check, 
  Clock, 
  ShoppingBag, 
  Sparkles,
  Percent,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AvailableCouponItem } from '../../../types';
import { accountService } from '../../../services/api';

export const CouponsTab: React.FC = () => {
  const [coupons, setCoupons] = useState<AvailableCouponItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await accountService.getCoupons();
      if (res.data) {
        setCoupons(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800">
            <Sparkles className="w-3 h-3" />
            Member Privileges
          </div>
          <h2 className="text-xl font-bold tracking-tight">Coupons & Exclusive Discounts</h2>
          <p className="text-xs text-neutral-300 max-w-xl">
            Save on your next order with available platform coupons. Codes are applied instantly at checkout.
          </p>
        </div>

        <Link
          to="/shop"
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Shop & Redeem</span>
        </Link>
      </div>

      {/* Coupons Grid */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-neutral-200">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-neutral-500">Checking for available promotions...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-neutral-200">
          <Tag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-neutral-800">No active coupons right now</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
            Check back soon during festive flash sales and seasonal promotions!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map(coupon => {
            const isCopied = copiedCode === coupon.code;
            const expiryStr = coupon.expires_at 
              ? new Date(coupon.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'No expiration date';

            return (
              <div 
                key={coupon.id}
                className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col justify-between hover:border-neutral-300 hover:shadow-sm transition-all relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-100">
                        {coupon.discount_type === 'percentage' ? '%' : '₹'}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-neutral-900">{coupon.name}</h3>
                        <p className="text-[11px] text-neutral-500">{coupon.description || 'Promotional Discount'}</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      coupon.is_usable 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {coupon.is_usable ? 'ELIGIBLE' : 'LIMIT REACHED'}
                    </span>
                  </div>

                  {/* Discount Highlight */}
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-neutral-400 block uppercase">Benefit</span>
                      <span className="font-bold text-neutral-900 text-sm">
                        {coupon.discount_type === 'percentage' 
                          ? `${coupon.discount_value}% OFF` 
                          : `₹${coupon.discount_value.toLocaleString()} FLAT OFF`}
                      </span>
                      {coupon.max_discount_amount && (
                        <span className="text-[10px] text-neutral-500 block">
                          Up to ₹{coupon.max_discount_amount.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 block uppercase">Min Purchase</span>
                      <span className="font-semibold text-neutral-700">
                        ₹{coupon.minimum_cart_value.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-neutral-500 space-y-1">
                    <div className="flex items-center gap-1 text-neutral-400">
                      <Clock className="w-3 h-3" />
                      <span>Valid until: {expiryStr}</span>
                    </div>
                    <div>
                      Usage: <strong>{coupon.user_used_count}</strong> of {coupon.per_customer_limit} times used
                    </div>
                  </div>
                </div>

                {/* Voucher Code Box */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-neutral-100 border border-dashed border-neutral-300 font-mono font-bold text-xs text-neutral-800 tracking-wider">
                    {coupon.code}
                  </div>

                  <button
                    onClick={() => handleCopyCode(coupon.code)}
                    disabled={!coupon.is_usable}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : coupon.is_usable
                          ? 'bg-neutral-900 hover:bg-neutral-800 text-white'
                          : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
