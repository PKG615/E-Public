import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  RotateCcw, 
  Package, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Truck, 
  CreditCard,
  Ban,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Return } from '../../types';
import { returnService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ReturnDetailModal } from '../../components/returns/ReturnDetailModal';

export const CustomerReturnsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [returns, setReturns] = useState<Return[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'inspection' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);

  const loadReturns = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await returnService.list({ page: 1, page_size: 50 });
      if (res.success && res.data) {
        setReturns(res.data.items || []);
      } else {
        setError(res.message || 'Failed to retrieve return history');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to load return requests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadReturns();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, loadReturns]);

  const filteredReturns = returns.filter((ret) => {
    // Tab filter
    if (activeTab === 'pending' && !['requested', 'approved', 'pickup_pending'].includes(ret.status)) {
      return false;
    }
    if (activeTab === 'inspection' && !['in_transit', 'received', 'inspection'].includes(ret.status)) {
      return false;
    }
    if (activeTab === 'completed' && !['approved_for_refund', 'approved_for_replacement', 'refunded', 'replaced', 'completed'].includes(ret.status)) {
      return false;
    }
    if (activeTab === 'cancelled' && !['cancelled', 'rejected', 'closed'].includes(ret.status)) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = ret.return_number.toLowerCase().includes(q);
      const matchOrder = (ret.order_number || String(ret.order_id)).toLowerCase().includes(q);
      const matchItem = ret.items?.some((i) => i.product_name.toLowerCase().includes(q));
      return matchNumber || matchOrder || matchItem;
    }

    return true;
  });

  const handleReturnCancelled = (updated: Return) => {
    setReturns((prev) => prev.map((r) => r.id === updated.id ? updated : r));
    setSelectedReturn(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Top Banner & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
            <Link to="/orders" className="hover:text-neutral-900 transition-colors">Orders</Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">Returns & Replacements</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <span>Returns & Refunds</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded-full border border-emerald-200">
              PostgreSQL Ledger
            </span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Track return pickups, warehouse inspection results, and refund settlements in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/orders"
            className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Package className="w-3.5 h-3.5" />
            <span>View Delivered Orders</span>
          </Link>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex border-b sm:border-b-0 border-neutral-200 gap-1 overflow-x-auto pb-2 sm:pb-0">
          {[
            { key: 'all', label: 'All Requests' },
            { key: 'pending', label: 'Pending & Pickup' },
            { key: 'inspection', label: 'In Inspection' },
            { key: 'completed', label: 'Resolved & Refunded' },
            { key: 'cancelled', label: 'Cancelled / Rejected' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search return # or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-neutral-500">Loading your return records...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-xs text-red-700">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
          <p className="font-bold">{error}</p>
          <button
            onClick={loadReturns}
            className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
            <RotateCcw className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900">No Return Requests Found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-6">
            {searchQuery
              ? 'No returns match your search filter.'
              : 'You have not submitted any return or replacement requests yet. Returns can be initiated from any delivered order.'}
          </p>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <span>Go to My Orders</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReturns.map((ret) => (
            <div
              key={ret.id}
              className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs hover:border-neutral-300 transition-all space-y-4"
            >
              {/* Top Row: Return Number, Order, Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-neutral-900">
                        {ret.return_number}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase bg-neutral-50 text-neutral-700 border-neutral-200">
                        {ret.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Order: <Link to={`/orders/${ret.order_id}`} className="text-emerald-700 font-bold hover:underline">#{ret.order_number || ret.order_id}</Link> • Requested on {new Date(ret.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-neutral-500 block uppercase font-medium">
                    Resolution: <strong className="text-neutral-900">{ret.resolution_type}</strong>
                  </span>
                  {ret.total_refund_amount > 0 && (
                    <span className="text-sm font-bold text-emerald-700 block mt-0.5">
                      ₹{ret.total_refund_amount.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Row: Items preview */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex -space-x-2 overflow-hidden py-1">
                  {ret.items?.map((item) => (
                    <div
                      key={item.id}
                      className="inline-block w-10 h-10 rounded-lg ring-2 ring-white bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center"
                      title={`${item.product_name} (Qty: ${item.quantity})`}
                    >
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Package className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-neutral-800 truncate">
                    {ret.items?.[0]?.product_name}
                    {ret.items && ret.items.length > 1 && ` and ${ret.items.length - 1} more item(s)`}
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Reason: {ret.reason.replace(/_/g, ' ')}
                  </p>
                </div>

                {/* Status-specific badges */}
                {ret.refund && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-xs text-emerald-800 flex items-center gap-1.5 shrink-0">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Refund {ret.refund.status}: <strong>₹{ret.refund.amount.toLocaleString('en-IN')}</strong></span>
                  </div>
                )}

                {ret.replacement && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 text-xs text-blue-800 flex items-center gap-1.5 shrink-0">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Replacement {ret.replacement.status}</span>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                <span className="text-[11px] text-neutral-400">
                  {ret.status_history && ret.status_history.length > 0 ? `Last updated: ${new Date(ret.status_history[ret.status_history.length - 1].created_at).toLocaleTimeString('en-IN')}` : ''}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReturn(ret)}
                    className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>View Status Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedReturn && (
        <ReturnDetailModal
          returnRecord={selectedReturn}
          isOpen={Boolean(selectedReturn)}
          onClose={() => setSelectedReturn(null)}
          onCancelled={handleReturnCancelled}
        />
      )}

    </div>
  );
};
