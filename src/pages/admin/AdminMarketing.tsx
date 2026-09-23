import React, { useEffect, useState } from 'react';
import { 
  Ticket, 
  Percent, 
  Zap, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Calendar, 
  Tag,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';

export const AdminMarketing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'coupons' | 'offers' | 'flash_sales'>('coupons');
  const [coupons, setCoupons] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Coupon Form Modal state
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponName, setNewCouponName] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [discountValue, setDiscountValue] = useState('10');
  const [minCartValue, setMinCartValue] = useState('500');
  const [usageLimit, setUsageLimit] = useState('100');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchMarketingData = async () => {
    setLoading(true);
    try {
      const [couponsRes, offersRes, flashRes] = await Promise.all([
        api.admin.getCoupons(),
        api.admin.getOffers(),
        api.admin.getFlashSales()
      ]);
      if (couponsRes.success && couponsRes.data) setCoupons(couponsRes.data);
      if (offersRes.success && offersRes.data) setOffers(offersRes.data);
      if (flashRes.success && flashRes.data) setFlashSales(flashRes.data);
    } catch (err) {
      console.error('Failed to load marketing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketingData();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const payload = {
        code: newCouponCode.toUpperCase().trim(),
        name: newCouponName.trim(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        minimum_cart_value: parseFloat(minCartValue),
        usage_limit: parseInt(usageLimit, 10),
        per_customer_limit: 1,
        is_active: true
      };
      const res = await api.admin.createCoupon(payload);
      if (res.success) {
        setShowCreateCouponModal(false);
        setNewCouponCode('');
        setNewCouponName('');
        fetchMarketingData();
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create coupon');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await api.admin.deleteCoupon(id);
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to delete coupon:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Marketing & Promotions</h2>
            <p className="text-xs text-neutral-500">Live coupons, cart-level offers, and timed flash sales</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'coupons' && (
            <button
              onClick={() => setShowCreateCouponModal(true)}
              className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Coupon</span>
            </button>
          )}
          <button
            onClick={fetchMarketingData}
            disabled={loading}
            className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'coupons'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-200/60'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Discount Coupons ({coupons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'offers'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-200/60'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>Category & Cart Offers ({offers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('flash_sales')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'flash_sales'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-200/60'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Flash Sales ({flashSales.length})</span>
        </button>
      </div>

      {/* Create Coupon Modal */}
      {showCreateCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="font-bold text-neutral-900 text-sm">Create New Coupon</h3>
              <button onClick={() => setShowCreateCouponModal(false)} className="text-neutral-400 text-xs">✕</button>
            </div>
            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME20"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  className="w-full uppercase font-mono px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Coupon Title / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 20% off on first order"
                  value={newCouponName}
                  onChange={(e) => setNewCouponName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-semibold text-neutral-800"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Min. Cart Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={minCartValue}
                    onChange={(e) => setMinCartValue(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowCreateCouponModal(false)}
                  className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl"
                >
                  {createLoading ? 'Saving...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === 'coupons' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-12 flex justify-center"><RefreshCw className="w-6 h-6 animate-spin text-neutral-400" /></div>
          ) : coupons.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs">No active coupons found. Click "Create Coupon" to add one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="bg-neutral-50 text-[11px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4">Coupon Code</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Min. Cart</th>
                    <th className="py-3 px-4">Used / Limit</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-50">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-1 rounded border border-neutral-200">
                          {c.code}
                        </span>
                        <p className="text-[11px] text-neutral-500 mt-1">{c.name}</p>
                      </td>
                      <td className="py-3 px-4 font-bold text-neutral-900">
                        {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                      </td>
                      <td className="py-3 px-4 text-neutral-600">
                        ₹{c.minimum_cart_value || 0}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-neutral-900">{c.used_count || 0}</span>
                        <span className="text-neutral-400"> / {c.usage_limit || '∞'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${c.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-600'}`}>
                          {c.is_active ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                          <span>{c.is_active ? 'Active' : 'Inactive'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteCoupon(c.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'offers' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-5">
          {offers.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs">No active promotional offers currently configured.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map((o) => (
                <div key={o.id} className="p-4 border border-neutral-200 rounded-xl space-y-2 bg-neutral-50/50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 text-xs">{o.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Active</span>
                  </div>
                  <p className="text-xs text-neutral-600">{o.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                    <span>Discount: <strong>{o.discount_value}%</strong></span>
                    <span>•</span>
                    <span>Min Cart: <strong>₹{o.minimum_cart_value || 0}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'flash_sales' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-5">
          {flashSales.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs">No flash sales scheduled.</div>
          ) : (
            <div className="space-y-4">
              {flashSales.map((fs) => (
                <div key={fs.id} className="p-4 border border-neutral-200 rounded-xl flex items-center justify-between bg-neutral-50/50">
                  <div>
                    <h4 className="font-bold text-neutral-900 text-sm flex items-center gap-2">
                      <span>{fs.name}</span>
                      <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                        {fs.is_active ? 'Live Now' : 'Scheduled'}
                      </span>
                    </h4>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Ends at: {new Date(fs.ends_at).toLocaleString('en-IN')} • {fs.items?.length || 0} items on sale
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
