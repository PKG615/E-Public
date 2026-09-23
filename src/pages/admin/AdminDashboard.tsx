import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  BarChart3,
  Package, 
  Users, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  Zap, 
  TrendingUp, 
  ArrowRight,
  Boxes,
  Truck,
  RotateCcw,
  CreditCard,
  Star,
  LifeBuoy,
  Tag,
  Calendar,
  Layers,
  ChevronRight,
  XCircle,
  Clock,
  ArrowUpRight,
  HelpCircle,
  Percent
} from 'lucide-react';
import { 
  DashboardOverviewResponse, 
  Product, 
  OperationalAlert, 
  SalesChartPoint 
} from '../../types';
import { api } from '../../services/api';

interface AdminDashboardProps {
  onNavigateToTab: (tab: any) => void;
  onNavigateToStorefront: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToTab,
  onNavigateToStorefront
}) => {
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<string>('7days');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [showCustomRange, setShowCustomRange] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<SalesChartPoint | null>(null);

  // Section 19 Verification State
  const [testProduct, setTestProduct] = useState<Product | null>(null);
  const [newTestPrice, setNewTestPrice] = useState<string>('27990');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle');
  const [syncLog, setSyncLog] = useState<string[]>([]);

  const fetchDashboardData = async (selectedPeriod = period, start = customStart, end = customEnd) => {
    setLoading(true);
    try {
      const params: any = { period: selectedPeriod };
      if (selectedPeriod === 'custom' && start && end) {
        params.start_date = start;
        params.end_date = end;
      }
      const res = await api.admin.getDashboardOverview(params);
      if (res.success && res.data) {
        setData(res.data);
      }

      // Fetch sample product for Section 19 demonstration
      const prodRes = await api.products.getAll({ limit: 1 });
      if (prodRes.success && prodRes.data && prodRes.data.items.length > 0) {
        setTestProduct(prodRes.data.items[0]);
        setNewTestPrice(prodRes.data.items[0].price.toString());
      }
    } catch (err) {
      console.error('Failed to load comprehensive admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(period);
  }, [period]);

  const handlePeriodChange = (p: string) => {
    setPeriod(p);
    if (p === 'custom') {
      setShowCustomRange(true);
    } else {
      setShowCustomRange(false);
    }
  };

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      fetchDashboardData('custom', customStart, customEnd);
    }
  };

  const handleExecutePriceSync = async () => {
    if (!testProduct) return;
    setSyncStatus('updating');
    const logs = [
      `[1/4] Initiating PUT /api/v1/admin/products/${testProduct.id}/price`,
      `[2/4] Payload: { price: ${newTestPrice}, mrp: ${testProduct.mrp} }`,
    ];
    setSyncLog(logs);

    try {
      const res = await api.admin.updatePrice(testProduct.id, parseFloat(newTestPrice), testProduct.mrp);
      if (res.success && res.data) {
        setTestProduct(res.data);
        setSyncLog((prev) => [
          ...prev,
          `[3/4] PostgreSQL COMMIT executed: Row ID ${testProduct.id} updated to ₹${res.data.price}`,
          `[4/4] SUCCESS: Source of truth persisted. Storefront and cart reflect ₹${res.data.price} instantly!`,
        ]);
        setSyncStatus('success');
        // Refresh metrics
        fetchDashboardData();
      } else {
        setSyncStatus('error');
      }
    } catch (err: any) {
      setSyncLog((prev) => [...prev, `[ERROR] Failed: ${err.message}`]);
      setSyncStatus('error');
    }
  };

  // Chart rendering helpers
  const chartPoints = data?.chart?.points || [];
  const maxSales = Math.max(...chartPoints.map(p => p.sales), 1000);
  const chartHeight = 160;
  const chartWidth = 600;

  return (
    <div className="space-y-6">
      
      {/* Top Header & Period Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
            <span>Executive Operations Dashboard</span>
            
          </h2>
          <p className="text-xs text-neutral-500">
            Cheque the real time data sales order customer Account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector buttons */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs font-semibold">
            {[
              { id: 'today', label: 'Today' },
              { id: '7days', label: '7 Days' },
              { id: '30days', label: '30 Days' },
              { id: '90days', label: '90 Days' },
              { id: 'custom', label: 'Custom' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handlePeriodChange(p.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  period === p.id 
                    ? 'bg-white text-neutral-950 font-bold shadow-xs' 
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchDashboardData()}
            disabled={loading}
            className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => onNavigateToTab('analytics')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shrink-0 shadow-xs"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics & Reports</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {showCustomRange && (
        <form onSubmit={handleApplyCustomRange} className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <span className="font-bold text-neutral-700">Custom Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-neutral-500">From:</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 font-medium"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-neutral-500">To:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 font-medium"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-neutral-900 text-white font-bold px-4 py-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Apply Range
          </button>
        </form>
      )}

      {/* Operational Attention Alerts (Section 25) */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                alert.type === 'danger'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : alert.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  alert.type === 'danger' ? 'bg-rose-200/70 text-rose-700' : 'bg-amber-200/70 text-amber-700'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">{alert.title}</h4>
                  <p className="text-xs opacity-90">{alert.message}</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateToTab(alert.action_tab)}
                className="self-start sm:self-auto flex items-center gap-1 bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-bold px-3.5 py-1.5 rounded-xl border border-neutral-300 transition-colors shrink-0 shadow-xs"
              >
                <span>{alert.action_label}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Primary KPI Grid (Sales, Orders, Products, Customers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Gross Sales */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Gross Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900">
              ₹{(data?.sales?.gross_sales || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Net Order Value: <strong className="text-neutral-800">₹{(data?.sales?.net_order_value || 0).toLocaleString('en-IN')}</strong>
            </p>
          </div>
          <div className="pt-2 border-t border-neutral-100 grid grid-cols-2 gap-2 text-[10px] text-neutral-500">
            <div>Discounts: <span className="font-semibold text-neutral-800">₹{(data?.sales?.discounts || 0).toLocaleString('en-IN')}</span></div>
            <div>Tax: <span className="font-semibold text-neutral-800">₹{(data?.sales?.tax || 0).toLocaleString('en-IN')}</span></div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900">
              {data?.orders?.total || 0}
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              Delivered: <strong className="text-emerald-800">{data?.orders?.delivered || 0}</strong> • Pending: <strong className="text-amber-800">{data?.orders?.pending || 0}</strong>
            </p>
          </div>
          <div className="pt-2 border-t border-neutral-100 grid grid-cols-2 gap-2 text-[10px] text-neutral-500">
            <div>Processing: <span className="font-semibold text-neutral-800">{data?.orders?.processing || 0}</span></div>
            <div>Cancelled: <span className="font-semibold text-neutral-800">{data?.orders?.cancelled || 0}</span></div>
          </div>
        </div>

        {/* Catalog & Live Inventory */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Catalog & Stock</span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900">
              {data?.products?.total_products || 0} Products
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Total Units: <strong className="text-neutral-800">{data?.products?.total_inventory_units || 0}</strong>
            </p>
          </div>
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px]">
            <span className={`font-semibold ${data?.products?.low_stock_products ? 'text-amber-600' : 'text-neutral-500'}`}>
              Low Stock: {data?.products?.low_stock_products || 0}
            </span>
            <span className={`font-semibold ${data?.products?.out_of_stock_products ? 'text-rose-600' : 'text-neutral-500'}`}>
              Out of Stock: {data?.products?.out_of_stock_products || 0}
            </span>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Customers</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900">
              {data?.customers?.total_customers || 0}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Active: <strong className="text-neutral-800">{data?.customers?.active_customers || 0}</strong> • New: <strong className="text-neutral-800">+{data?.customers?.new_customers_in_period || 0}</strong>
            </p>
          </div>
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500">
            <div>With Orders: <span className="font-semibold text-neutral-800">{data?.customers?.customers_with_orders || 0}</span></div>
            <button onClick={() => onNavigateToTab('customers')} className="text-amber-700 font-bold hover:underline">
              Directory →
            </button>
          </div>
        </div>

      </div>

      {/* Interactive Sales & Orders Chart Panel */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Sales & Order Revenue Timeline ({period})</span>
            </h3>
            <p className="text-xs text-neutral-400"> And this is for that trending sales item. </p>
          </div>
          {hoveredPoint ? (
            <div className="bg-neutral-900 text-white px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-3">
              <span>{hoveredPoint.date}</span>
              <span className="text-emerald-400 font-bold">₹{hoveredPoint.sales.toLocaleString('en-IN')}</span>
              <span className="text-amber-400">{hoveredPoint.orders} orders</span>
            </div>
          ) : (
            <div className="text-xs text-neutral-400 italic">Hover points to inspect exact figures</div>
          )}
        </div>

        {chartPoints.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400">No sales recorded in this period.</div>
        ) : (
          <div className="relative pt-4">
            {/* SVG Visualizer */}
            <div className="w-full overflow-x-auto">
              <div className="min-w-[500px]">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                    <line
                      key={i}
                      x1="40"
                      y1={chartHeight - ratio * (chartHeight - 30)}
                      x2={chartWidth - 20}
                      y2={chartHeight - ratio * (chartHeight - 30)}
                      stroke="#f0f0f0"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Sparkline Path */}
                  {chartPoints.length > 1 && (
                    <path
                      d={chartPoints.map((pt, idx) => {
                        const x = 50 + (idx / (chartPoints.length - 1)) * (chartWidth - 80);
                        const y = (chartHeight - 20) - (pt.sales / maxSales) * (chartHeight - 40);
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                    />
                  )}

                  {/* Interactive Points */}
                  {chartPoints.map((pt, idx) => {
                    const x = chartPoints.length === 1 
                      ? chartWidth / 2 
                      : 50 + (idx / (chartPoints.length - 1)) * (chartWidth - 80);
                    const y = (chartHeight - 20) - (pt.sales / maxSales) * (chartHeight - 40);
                    const isHovered = hoveredPoint?.date === pt.date;

                    return (
                      <g key={pt.date} className="cursor-pointer" onMouseEnter={() => setHoveredPoint(pt)}>
                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered ? 6 : 4}
                          fill={isHovered ? '#059669' : '#10b981'}
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        <text
                          x={x}
                          y={chartHeight + 14}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#737373"
                          fontFamily="sans-serif"
                        >
                          {pt.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Operational Modules Breakdown Grid (Orders, Fulfillment, Payments, Moderation) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Order Lifecycle Pipeline */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>Order Lifecycle Pipeline</span>
            </h3>
            <button onClick={() => onNavigateToTab('orders')} className="text-xs font-semibold text-blue-700 hover:underline">
              Manage Orders →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Pending</span>
              <span className="text-lg font-black text-neutral-900">{data?.orders?.pending || 0}</span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Confirmed</span>
              <span className="text-lg font-black text-neutral-900">{data?.orders?.confirmed || 0}</span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Processing</span>
              <span className="text-lg font-black text-neutral-900">{data?.orders?.processing || 0}</span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Shipped</span>
              <span className="text-lg font-black text-neutral-900">{data?.orders?.shipped || 0}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
              <span className="text-[10px] text-emerald-700 uppercase font-bold block">Delivered</span>
              <span className="text-lg font-black">{data?.orders?.delivered || 0}</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900">
              <span className="text-[10px] text-rose-700 uppercase font-bold block">Cancelled</span>
              <span className="text-lg font-black">{data?.orders?.cancelled || 0}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
              <span className="text-[10px] text-amber-700 uppercase font-bold block">Returned</span>
              <span className="text-lg font-black">{data?.orders?.returned || 0}</span>
            </div>
            <div className="p-3 bg-neutral-900 text-white rounded-xl">
              <span className="text-[10px] text-neutral-400 uppercase font-bold block">All Total</span>
              <span className="text-lg font-black">{data?.orders?.total || 0}</span>
            </div>
          </div>
        </div>

        {/* Shipping & Fulfillment Pipeline */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Logistics & Fulfillment Hub</span>
            </h3>
            <button onClick={() => onNavigateToTab('shipments')} className="text-xs font-semibold text-emerald-700 hover:underline">
              Shipments Center →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Pending</span>
              <span className="text-lg font-black text-neutral-900">{data?.shipments?.pending || 0}</span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Packed</span>
              <span className="text-lg font-black text-neutral-900">{data?.shipments?.packed || 0}</span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">In Transit</span>
              <span className="text-lg font-black text-neutral-900">{data?.shipments?.in_transit || 0}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
              <span className="text-[10px] text-emerald-700 uppercase font-bold block">Delivered</span>
              <span className="text-lg font-black">{data?.shipments?.delivered || 0}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Total shipments generated in PostgreSQL: <strong>{data?.shipments?.total_shipments || 0}</strong></span>
            <span className="text-rose-600 font-semibold">Failed/Cancelled: {data?.shipments?.failed_cancelled || 0}</span>
          </div>
        </div>

        {/* Payments & Refunds Health */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <span>Payments & Financial Ledger</span>
            </h3>
            <span className="text-xs text-neutral-500 font-mono">
              Total Recorded: {data?.payments?.total_payments || 0}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Settled (Paid)</span>
              <p className="text-base font-black">₹{(data?.payments?.paid_amount || 0).toLocaleString('en-IN')}</p>
              <span className="text-[10px] opacity-75">{data?.payments?.paid_count || 0} transactions</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Pending</span>
              <p className="text-base font-black">₹{(data?.payments?.pending_amount || 0).toLocaleString('en-IN')}</p>
              <span className="text-[10px] opacity-75">{data?.payments?.pending_count || 0} transactions</span>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-950">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Refunded</span>
              <p className="text-base font-black">₹{(data?.payments?.refunded_amount || 0).toLocaleString('en-IN')}</p>
              <span className="text-[10px] opacity-75">{data?.payments?.refunded_count || 0} refunds</span>
            </div>
          </div>
        </div>

        {/* Moderation & Support Queue */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <LifeBuoy className="w-4 h-4 text-rose-600" />
              <span>Moderation & Support Queues</span>
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={() => onNavigateToTab('reviews')} className="text-xs font-semibold text-neutral-700 hover:underline">
                Reviews →
              </button>
              <span>•</span>
              <button onClick={() => onNavigateToTab('support')} className="text-xs font-semibold text-neutral-700 hover:underline">
                Tickets →
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Reviews Pending</span>
              <span className={`text-lg font-black ${data?.moderation?.pending_reviews ? 'text-amber-600' : 'text-neutral-900'}`}>
                {data?.moderation?.pending_reviews || 0}
              </span>
              <span className="text-[10px] text-neutral-400 block">{data?.moderation?.total_reviews || 0} total</span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Q&A Unanswered</span>
              <span className={`text-lg font-black ${data?.moderation?.pending_questions ? 'text-amber-600' : 'text-neutral-900'}`}>
                {data?.moderation?.pending_questions || 0}
              </span>
              <span className="text-[10px] text-neutral-400 block">{data?.moderation?.total_questions || 0} questions</span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Open Tickets</span>
              <span className={`text-lg font-black ${data?.moderation?.open_support_tickets ? 'text-rose-600' : 'text-neutral-900'}`}>
                {data?.moderation?.open_support_tickets || 0}
              </span>
              <span className="text-[10px] text-rose-600 font-semibold block">{data?.moderation?.urgent_support_tickets || 0} urgent</span>
            </div>
          </div>
        </div>

      </div>

      {/* Top Products & Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Selling Products */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>Top Selling Products</span>
            </h3>
            <button onClick={() => onNavigateToTab('products')} className="text-xs font-semibold text-emerald-700 hover:underline">
              View Catalog →
            </button>
          </div>
          {data?.top_products && data.top_products.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {data.top_products.map((p, idx) => (
                <div key={p.product_id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-700 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-neutral-900">{p.product_name}</p>
                      <p className="text-[11px] text-neutral-400">SKU: {p.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-neutral-900">₹{p.revenue.toLocaleString('en-IN')}</p>
                    <p className="text-[11px] text-neutral-500">{p.units_sold} units sold</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-400 py-6 text-center">No product sales logged yet.</p>
          )}
        </div>

        {/* Category Performance */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Category Revenue Share</span>
            </h3>
            <button onClick={() => onNavigateToTab('categories')} className="text-xs font-semibold text-blue-700 hover:underline">
              Manage Categories →
            </button>
          </div>
          {data?.category_performance && data.category_performance.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {data.category_performance.map((c) => (
                <div key={c.category_id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-neutral-900">{c.category_name}</p>
                    <p className="text-[11px] text-neutral-400">{c.product_count} products listed</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-neutral-900">₹{c.revenue.toLocaleString('en-IN')}</p>
                    <p className="text-[11px] text-neutral-500">{c.units_sold} items ordered</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-400 py-6 text-center">No category sales recorded yet.</p>
          )}
        </div>

      </div>

      {/* SECTION 19 INTERACTIVE VERIFICATION WORKBENCH (PRESERVED & EXPANDED) */}
      <div className="bg-white rounded-2xl border-2 border-emerald-500/30 p-6 shadow-sm space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
          Saie Iten Iist here
        </div>

        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-600" />
          <h3 className="font-extrabold text-base text-neutral-900">
            Eligible products can be returned according to our return policy and applicable product conditions
          </h3>
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed max-w-3xl">
          <strong></strong> Eligible products can be returned according to our return policy and applicable product conditions<code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-800 font-mono">Eligible products can be returned according to our return policy and applicable product conditions</code>, and immediately verify that the Customer Storefront, Product Detail, and Cart reflect the new price.
        </p>

        {testProduct && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-neutral-50 p-4 rounded-xl border border-neutral-200 items-center">
            
            {/* Product overview */}
            <div className="lg:col-span-5 flex items-center gap-3">
              <img
                src={testProduct.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&q=80'}
                alt=""
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-lg object-cover bg-white border border-neutral-200 shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">{testProduct.sku}</span>
                <p className="font-bold text-xs text-neutral-900 truncate">{testProduct.name}</p>
                <p className="text-xs text-neutral-500">
                  Current Database Price: <strong className="text-neutral-900">₹{testProduct.price.toLocaleString('en-IN')}</strong> (MRP: ₹{testProduct.mrp.toLocaleString('en-IN')})
                </p>
              </div>
            </div>

            {/* Input and trigger */}
            <div className="lg:col-span-7 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-700">New Price (₹):</label>
                <input
                  type="number"
                  value={newTestPrice}
                  onChange={(e) => setNewTestPrice(e.target.value)}
                  className="w-28 bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Quick test buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setNewTestPrice('27990')}
                  className="text-[11px] font-semibold bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 px-2 py-1 rounded"
                >
                  Set ₹27,990
                </button>
                <button
                  type="button"
                  onClick={() => setNewTestPrice('29990')}
                  className="text-[11px] font-semibold bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 px-2 py-1 rounded"
                >
                  Set ₹29,990
                </button>
              </div>

              <button
                type="button"
                onClick={handleExecutePriceSync}
                disabled={syncStatus === 'updating'}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'updating' ? 'animate-spin' : ''}`} />
                <span>Execute PostgreSQL Update</span>
              </button>

              <button
                type="button"
                onClick={onNavigateToStorefront}
                className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
              >
                <span>Verify on Storefront</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        )}

        {/* Live sync output terminal */}
        {syncLog.length > 0 && (
          <div className="bg-neutral-950 text-neutral-300 rounded-xl p-3.5 text-[11px] font-mono space-y-1">
            <div className="flex items-center justify-between text-neutral-500 text-[10px] pb-1 border-b border-neutral-800">
              <span>SQLAlchemy Transaction Log</span>
              <span className="text-emerald-400">STATUS: {syncStatus.toUpperCase()}</span>
            </div>
            {syncLog.map((log, idx) => (
              <div key={idx} className={log.includes('SUCCESS') ? 'text-emerald-400 font-bold' : log.includes('ERROR') ? 'text-red-400' : 'text-neutral-300'}>
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders in PostgreSQL */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-800">
            Recent Orders in PostgreSQL
          </h3>
          <button
            onClick={() => onNavigateToTab('orders')}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            View all orders →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 uppercase text-[10px] tracking-wider">
                <th className="pb-2">Order #</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Order Status</th>
                <th className="pb-2">Payment</th>
                <th className="pb-2">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data?.recent_orders && data.recent_orders.length > 0 ? (
                data.recent_orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-neutral-50">
                    <td className="py-3 font-bold text-neutral-900">{ord.order_number}</td>
                    <td className="py-3 text-neutral-700">
                      <div>{ord.customer_name}</div>
                      <div className="text-[10px] text-neutral-400">{ord.customer_email}</div>
                    </td>
                    <td className="py-3 font-bold text-neutral-900">₹{ord.total_amount.toLocaleString('en-IN')}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-neutral-100 text-neutral-700">
                        {ord.payment_status}
                      </span>
                    </td>
                    <td className="py-3 text-neutral-400">
                      {new Date(ord.created_at).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-neutral-500">
                    No orders recorded yet. Place an order on the storefront to test!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
