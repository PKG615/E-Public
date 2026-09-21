import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Search, 
  Truck, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ChevronRight, 
  ShoppingBag,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { orderService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const OrdersPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await orderService.list(1, 50);
      if (res.success && res.data) {
        setOrders(res.data.items || []);
      } else {
        setError(res.message || 'Failed to load orders');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to connect to order server');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, loadOrders]);

  // Filter orders based on active tab and search query
  const filteredOrders = orders.filter((order) => {
    // Tab match
    if (activeTab === 'active' && (order.status === 'delivered' || order.status === 'cancelled')) {
      return false;
    }
    if (activeTab === 'delivered' && order.status !== 'delivered') {
      return false;
    }
    if (activeTab === 'cancelled' && order.status !== 'cancelled') {
      return false;
    }

    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrderNum = order.order_number.toLowerCase().includes(q);
      const matchItem = order.items?.some((i) => i.product_name.toLowerCase().includes(q));
      return matchOrderNum || matchItem;
    }

    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Delivered</span>
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3 h-3" />
            <span>Shipped</span>
          </span>
        );
      case 'processing':
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3 h-3" />
            <span className="capitalize">{status}</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
            Order History
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Track, return, or buy again from your authoritative PostgreSQL order records
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-xl text-xs font-semibold text-neutral-700 transition-colors shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Controls Bar: Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'active', label: 'In Progress' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order # or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
          />
        </div>

      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-neutral-500">Querying orders database...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900">Failed to load orders</h3>
          <p className="text-xs text-red-700 mt-1">{error}</p>
          <button
            onClick={loadOrders}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-neutral-900">No orders found</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No orders matching "${searchQuery}". Try a different search term.`
              : activeTab !== 'all'
              ? `You do not have any ${activeTab} orders at this moment.`
              : "You haven't placed any orders yet. Discover our latest collection and start shopping!"}
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore Catalog</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const placed = order.placed_at ? new Date(order.placed_at) : new Date(order.created_at);
            return (
              <div
                key={order.id}
                className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs hover:border-neutral-300 transition-all"
              >
                {/* Order Card Header */}
                <div className="bg-neutral-50/80 px-6 py-4 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Order Placed</span>
                      <span className="font-bold text-neutral-800">
                        {placed.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Total Amount</span>
                      <span className="font-bold text-neutral-900">
                        ₹{order.total_amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Ship To</span>
                      <span className="font-semibold text-neutral-700">
                        {order.shipping_address?.full_name || 'Customer'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <span className="text-xs font-mono font-bold text-neutral-500">
                      #{order.order_number}
                    </span>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="p-6">
                  <div className="divide-y divide-neutral-100">
                    {order.items?.map((item) => (
                      <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-xl bg-neutral-100 border border-neutral-200 shrink-0 overflow-hidden flex items-center justify-center">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-neutral-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-neutral-900 truncate">
                              {item.product_name}
                            </h4>
                            {item.variant_title && (
                              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                                Option: {item.variant_title}
                              </p>
                            )}
                            <p className="text-[11px] text-neutral-400 mt-0.5">
                              Qty: {item.quantity} • ₹{item.unit_price.toLocaleString('en-IN')} each
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-neutral-900 shrink-0">
                          ₹{item.line_total.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] text-neutral-500 flex items-center gap-2">
                      <span>Payment: <strong>{order.payment_method.toUpperCase()}</strong></span>
                      <span>•</span>
                      <span className={`capitalize font-bold ${
                        order.payment_status === 'paid' ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {order.payment_status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.status !== 'cancelled' && (
                        <Link
                          to={`/orders/${order.id}/tracking`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-colors border border-emerald-200"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Track Package</span>
                        </Link>
                      )}
                      <Link
                        to={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                      >
                        <span>View Order Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
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
