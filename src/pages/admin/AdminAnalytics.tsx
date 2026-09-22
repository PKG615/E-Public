import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Boxes,
  RotateCcw,
  Truck,
  CreditCard,
  Star,
  LifeBuoy,
  Download,
  RefreshCw,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Tag,
  BarChart3,
  PieChart,
  Layers,
  Award,
  Eye,
  FileSpreadsheet,
} from "lucide-react";
import { api } from "../../services/api";
import {
  AnalyticsOverviewData,
  AnalyticsSalesResponse,
  AnalyticsOrdersResponse,
  AnalyticsCustomersResponse,
  AnalyticsProductsResponse,
  AnalyticsCategoriesResponse,
  AnalyticsBrandsResponse,
  AnalyticsInventoryResponse,
  AnalyticsPaymentsResponse,
  AnalyticsShippingResponse,
  AnalyticsReturnsResponse,
  AnalyticsPromotionsResponse,
  AnalyticsReviewsResponse,
  AnalyticsSupportResponse,
  AnalyticsTimeSeriesPoint,
} from "../../types";

interface AdminAnalyticsProps {
  onNavigateToTab?: (tab: string) => void;
}

type AnalyticsSubTab =
  | "overview"
  | "sales"
  | "orders"
  | "products"
  | "customers"
  | "inventory"
  | "fulfillment"
  | "returns_sentiment"
  | "exports";

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({
  onNavigateToTab,
}) => {
  const [activeTab, setActiveTab] = useState<AnalyticsSubTab>("overview");
  const [period, setPeriod] = useState<string>("30days");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [exportingReport, setExportingReport] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Tab Data States
  const [overviewData, setOverviewData] =
    useState<AnalyticsOverviewData | null>(null);
  const [salesData, setSalesData] = useState<AnalyticsSalesResponse | null>(
    null,
  );
  const [ordersData, setOrdersData] = useState<AnalyticsOrdersResponse | null>(
    null,
  );
  const [customersData, setCustomersData] =
    useState<AnalyticsCustomersResponse | null>(null);
  const [productsData, setProductsData] =
    useState<AnalyticsProductsResponse | null>(null);
  const [categoriesData, setCategoriesData] =
    useState<AnalyticsCategoriesResponse | null>(null);
  const [brandsData, setBrandsData] = useState<AnalyticsBrandsResponse | null>(
    null,
  );
  const [inventoryData, setInventoryData] =
    useState<AnalyticsInventoryResponse | null>(null);
  const [paymentsData, setPaymentsData] =
    useState<AnalyticsPaymentsResponse | null>(null);
  const [shippingData, setShippingData] =
    useState<AnalyticsShippingResponse | null>(null);
  const [returnsData, setReturnsData] =
    useState<AnalyticsReturnsResponse | null>(null);
  const [promotionsData, setPromotionsData] =
    useState<AnalyticsPromotionsResponse | null>(null);
  const [reviewsData, setReviewsData] =
    useState<AnalyticsReviewsResponse | null>(null);
  const [supportData, setSupportData] =
    useState<AnalyticsSupportResponse | null>(null);

  // Hover state for interactive SVG time-series charts
  const [hoveredPoint, setHoveredPoint] =
    useState<AnalyticsTimeSeriesPoint | null>(null);

  const formatCurrency = (val?: number | null) => {
    const num = val || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getParams = () => {
    const params: any = { period };
    if (period === "custom" && customStart && customEnd) {
      params.start_date = customStart;
      params.end_date = customEnd;
    }
    return params;
  };

  const loadActiveTabData = async () => {
    setLoading(true);
    const params = getParams();

    try {
      if (activeTab === "overview") {
        const res = await api.analytics.getOverview(params);
        if (res.success && res.data) setOverviewData(res.data);
      } else if (activeTab === "sales") {
        const res = await api.analytics.getSales(params);
        if (res.success && res.data) setSalesData(res.data);
      } else if (activeTab === "orders") {
        const [ordersRes, paymentsRes] = await Promise.all([
          api.analytics.getOrders(params),
          api.analytics.getPayments(params),
        ]);
        if (ordersRes.success && ordersRes.data) setOrdersData(ordersRes.data);
        if (paymentsRes.success && paymentsRes.data)
          setPaymentsData(paymentsRes.data);
      } else if (activeTab === "products") {
        const [prodRes, catRes, brandRes] = await Promise.all([
          api.analytics.getProducts({ ...params, limit: 20 }),
          api.analytics.getCategories(params),
          api.analytics.getBrands(params),
        ]);
        if (prodRes.success && prodRes.data) setProductsData(prodRes.data);
        if (catRes.success && catRes.data) setCategoriesData(catRes.data);
        if (brandRes.success && brandRes.data) setBrandsData(brandRes.data);
      } else if (activeTab === "customers") {
        const res = await api.analytics.getCustomers({ ...params, limit: 25 });
        if (res.success && res.data) setCustomersData(res.data);
      } else if (activeTab === "inventory") {
        const res = await api.analytics.getInventory();
        if (res.success && res.data) setInventoryData(res.data);
      } else if (activeTab === "fulfillment") {
        const res = await api.analytics.getShipping(params);
        if (res.success && res.data) setShippingData(res.data);
      } else if (activeTab === "returns_sentiment") {
        const [retRes, revRes, suppRes] = await Promise.all([
          api.analytics.getReturns(params),
          api.analytics.getReviews(params),
          api.analytics.getSupport(params),
        ]);
        if (retRes.success && retRes.data) setReturnsData(retRes.data);
        if (revRes.success && revRes.data) setReviewsData(revRes.data);
        if (suppRes.success && suppRes.data) setSupportData(suppRes.data);
      } else if (activeTab === "exports") {
        // Just ensure overview metrics exist for the export summary
        if (!overviewData) {
          const res = await api.analytics.getOverview(params);
          if (res.success && res.data) setOverviewData(res.data);
        }
      }
    } catch (err: any) {
      console.error("Failed to load analytics data:", err);
      setNotification({
        type: "error",
        message:
          err.response?.data?.detail ||
          "Failed to load real-time analytics data from database.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadActiveTabData();
  }, [activeTab, period]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadActiveTabData();
  };

  const handleDownloadReport = async (reportType: string) => {
    setExportingReport(reportType);
    try {
      const filename = await api.analytics.downloadCsvReport(
        reportType,
        getParams(),
      );
      setNotification({
        type: "success",
        message: `Report exported successfully: ${filename}`,
      });
    } catch (err: any) {
      console.error("Export error:", err);
      setNotification({
        type: "error",
        message:
          "Could not generate CSV report from database. Please try again.",
      });
    } finally {
      setExportingReport(null);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const periodOptions = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "7days", label: "Last 7 Days" },
    { id: "30days", label: "Last 30 Days" },
    { id: "90days", label: "Last 90 Days" },
    { id: "this_month", label: "This Month" },
    { id: "last_month", label: "Last Month" },
    { id: "this_year", label: "This Year" },
  ];

  // SVG Chart rendering helper
  const renderTimeSeriesChart = (
    series: AnalyticsTimeSeriesPoint[],
    metricKey:
      | "gross_sales"
      | "net_sales"
      | "orders_count"
      | "average_order_value",
    color: string = "#059669",
    unitPrefix: string = "₹",
  ) => {
    if (!series || series.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-neutral-400 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
          <BarChart3 className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm font-medium">
            No sales recorded during this selected date range.
          </p>
        </div>
      );
    }

    const values = series.map((pt) => pt[metricKey] as number);
    const maxVal = Math.max(...values, 1);
    const minVal = 0;
    const height = 200;
    const width = 760;
    const padX = 40;
    const padY = 24;

    const points = series.map((pt, idx) => {
      const x =
        padX + (idx / Math.max(1, series.length - 1)) * (width - padX * 2);
      const y =
        height -
        padY -
        ((pt[metricKey] - minVal) / (maxVal - minVal)) * (height - padY * 2);
      return { x, y, pt };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");

    const areaD =
      points.length > 0
        ? `${pathD} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`
        : "";

    return (
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-64 overflow-visible"
        >
          <defs>
            <linearGradient
              id={`grad-${metricKey}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = height - padY - ratio * (height - padY * 2);
            const labelVal =
              metricKey === "orders_count"
                ? Math.round(minVal + ratio * (maxVal - minVal))
                : formatCurrency(minVal + ratio * (maxVal - minVal));
            return (
              <g key={ratio}>
                <line
                  x1={padX}
                  y1={y}
                  x2={width - padX}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={padX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill={`url(#grad-${metricKey})`} />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoveredPoint?.date === p.pt.date ? 6 : 3.5}
              fill={hoveredPoint?.date === p.pt.date ? color : "#ffffff"}
              stroke={color}
              strokeWidth="2"
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoveredPoint(p.pt)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredPoint && (
          <div className="mt-3 p-3 bg-neutral-900 text-white rounded-lg shadow-xl text-xs flex items-center justify-between gap-6 w-fit mx-auto animate-fade-in border border-neutral-800">
            <div>
              <span className="text-neutral-400 block font-medium">
                {hoveredPoint.label} ({hoveredPoint.date})
              </span>
              <span className="text-emerald-400 font-semibold text-sm">
                Gross: {formatCurrency(hoveredPoint.gross_sales)}
              </span>
            </div>
            <div className="border-l border-neutral-700 pl-4 space-y-0.5 text-neutral-300">
              <div>
                Net Sales:{" "}
                <strong className="text-white">
                  {formatCurrency(hoveredPoint.net_sales)}
                </strong>
              </div>
              <div>
                Orders:{" "}
                <strong className="text-white">
                  {hoveredPoint.orders_count}
                </strong>
              </div>
              <div>
                Avg Order Value:{" "}
                <strong className="text-white">
                  {formatCurrency(hoveredPoint.average_order_value)}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm font-medium border shadow-sm ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-neutral-400 hover:text-neutral-700 text-xs uppercase font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Bar / Header with Global Controls */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                Executive Analytics & Business Intelligence
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Calculated strictly from authoritative database rows • Orders,
                Payments, Inventory & Customer Sentiment
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls: Period Dropdown, Custom Picker, Live Refresh & Export */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Period Selector */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200">
            <select
              value={period}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setShowCustomModal(true);
                } else {
                  setPeriod(e.target.value);
                }
              }}
              className="bg-transparent text-xs font-semibold text-neutral-800 px-3 py-1.5 focus:outline-hidden cursor-pointer"
            >
              {periodOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-neutral-700 text-xs font-medium rounded-xl border border-neutral-200 hover:bg-neutral-50 active:scale-95 transition-all duration-150 disabled:opacity-50"
            title="Fetch latest aggregation numbers from PostgreSQL"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`}
            />
            <span>Refresh</span>
          </button>

          {/* Quick Export Sales CSV */}
          <button
            onClick={() => handleDownloadReport("sales")}
            disabled={exportingReport !== null}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 active:scale-95 transition-all duration-150 shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {exportingReport === "sales"
                ? "Exporting..."
                : "Export Sales CSV"}
            </span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Modal / Popover */}
      {showCustomModal && (
        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-lg flex flex-wrap items-center gap-3">
          <Calendar className="w-4 h-4 text-neutral-500" />
          <span className="text-xs font-semibold text-neutral-700">
            Custom Date Range:
          </span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-neutral-200 rounded-lg text-neutral-800"
          />
          <span className="text-xs text-neutral-400">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-neutral-200 rounded-lg text-neutral-800"
          />
          <button
            onClick={() => {
              if (customStart && customEnd) {
                setPeriod("custom");
                setShowCustomModal(false);
                loadActiveTabData();
              }
            }}
            className="text-xs font-semibold bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700"
          >
            Apply Range
          </button>
          <button
            onClick={() => setShowCustomModal(false)}
            className="text-xs text-neutral-500 hover:text-neutral-800"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-neutral-200">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "sales", label: "Sales & Revenue", icon: DollarSign },
          { id: "orders", label: "Orders & Payments", icon: ShoppingCart },
          { id: "products", label: "Products & Brands", icon: Package },
          { id: "customers", label: "Customers", icon: Users },
          { id: "inventory", label: "Inventory Control", icon: Boxes },
          { id: "fulfillment", label: "Shipping & Delivery", icon: Truck },
          {
            id: "returns_sentiment",
            label: "Returns, Ratings & Support",
            icon: RotateCcw,
          },
          { id: "exports", label: "Report Center", icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AnalyticsSubTab)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-neutral-400"}`}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton */}
      {loading && !overviewData && !salesData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-neutral-200/70 rounded-2xl" />
          ))}
          <div className="md:col-span-4 h-80 bg-neutral-200/70 rounded-2xl" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. OVERVIEW TAB */}
      {/* ========================================================================= */}
      {activeTab === "overview" && overviewData && (
        <div className="space-y-6">
          {/* Executive KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Gross Sales
                </span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-neutral-900">
                {formatCurrency(overviewData.kpis.gross_sales)}
              </div>
              <div className="mt-1 text-xs text-neutral-500 flex items-center justify-between">
                <span>Net: {formatCurrency(overviewData.kpis.net_sales)}</span>
                <span className="text-neutral-400">
                  Discounts: {formatCurrency(overviewData.kpis.discounts)}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Total Orders
                </span>
                <ShoppingCart className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-neutral-900">
                {overviewData.kpis.total_orders}
              </div>
              <div className="mt-1 text-xs text-neutral-500 flex items-center justify-between">
                <span className="text-emerald-600 font-medium">
                  {overviewData.kpis.paid_orders} Paid
                </span>
                <span className="text-rose-600 font-medium">
                  {overviewData.kpis.cancelled_orders} Cancelled
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Average Order Value
                </span>
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-neutral-900">
                {formatCurrency(overviewData.kpis.average_order_value)}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                Calculated across {overviewData.kpis.paid_orders} settled orders
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Customers Registered
                </span>
                <Users className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-neutral-900">
                {overviewData.kpis.total_customers}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                Avg spend:{" "}
                {formatCurrency(overviewData.kpis.average_spend_per_customer)}
              </div>
            </div>
          </div>

          {/* Sales Trend Chart */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Sales & Revenue Trajectory
                </h3>

                <p className="text-xs text-neutral-500">
                  Aggregated gross revenue by period interval (
                  {overviewData.date_range.interval})
                </p>
              </div>

              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {(overviewData.sales?.time_series ?? []).length} Time Intervals
              </span>
            </div>

            {renderTimeSeriesChart(
              overviewData.sales?.time_series ?? [],
              "gross_sales",
              "#059669",
            )}
          </div>

          {/* Secondary Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Products Leaderboard */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    Top Selling Products
                  </h3>

                  <p className="text-xs text-neutral-500">
                    Ranked strictly by verified revenue
                  </p>
                </div>

                {onNavigateToTab && (
                  <button
                    onClick={() => onNavigateToTab("products")}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    Catalog
                    <ChevronDown className="w-3 h-3 -rotate-90" />
                  </button>
                )}
              </div>

              {(overviewData.top_products ?? []).length === 0 ? (
                <div className="text-center py-12 text-neutral-400 text-xs">
                  No settled sales recorded in this period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-neutral-400 uppercase tracking-wider border-b border-neutral-100">
                        <th className="pb-3 font-semibold">Product</th>
                        <th className="pb-3 font-semibold text-right">
                          Units Sold
                        </th>
                        <th className="pb-3 font-semibold text-right">
                          Gross Revenue
                        </th>
                        <th className="pb-3 font-semibold text-right">
                          Net Revenue
                        </th>
                        <th className="pb-3 font-semibold text-right">
                          In Stock
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-neutral-100">
                      {(overviewData.top_products ?? []).map((p, idx) => (
                        <tr
                          key={p.product_id}
                          className="hover:bg-neutral-50/70"
                        >
                          {/* existing product cells */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Order Status */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
                <h3 className="text-base font-bold text-neutral-900 mb-3">
                  Order Status Distribution
                </h3>

                <div className="space-y-3">
                  {(overviewData.order_status_distribution ?? []).map((st) => (
                    <div key={st.status} className="space-y-1">
                      {/* existing status content */}
                    </div>
                  ))}
                </div>
              </div>

              {/* Inventory Health remains unchanged */}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SALES & REVENUE TAB */}
      {/* ========================================================================= */}
      {activeTab === "sales" && salesData && (
        <div className="space-y-6">
          {/* Revenue Calculation Breakdown Grid */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
            <h3 className="text-base font-bold text-neutral-900 mb-4">
              Financial Breakdown & Net Calculation
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="text-neutral-500 block">Gross Sales</span>
                <strong className="text-base text-neutral-900 block mt-1">
                  {formatCurrency(salesData.gross_sales)}
                </strong>
              </div>
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                <span className="text-rose-700 block">- Discounts</span>
                <strong className="text-base text-rose-800 block mt-1">
                  {formatCurrency(salesData.discounts)}
                </strong>
              </div>
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                <span className="text-rose-700 block">- Refunds</span>
                <strong className="text-base text-rose-800 block mt-1">
                  {formatCurrency(salesData.refunds)}
                </strong>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-emerald-800 font-semibold block">
                  = Net Sales
                </span>
                <strong className="text-base text-emerald-900 font-extrabold block mt-1">
                  {formatCurrency(salesData.net_sales)}
                </strong>
              </div>
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <span className="text-blue-700 block">Tax Collected</span>
                <strong className="text-base text-blue-900 block mt-1">
                  {formatCurrency(salesData.tax)}
                </strong>
              </div>
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <span className="text-indigo-700 block">Shipping Revenue</span>
                <strong className="text-base text-indigo-900 block mt-1">
                  {formatCurrency(salesData.shipping_revenue)}
                </strong>
              </div>
            </div>

            {/* Discount Sources Breakdown */}
            <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-3 gap-4 text-xs text-neutral-600">
              <div>
                Coupon Codes:{" "}
                <strong>{formatCurrency(salesData.coupon_discounts)}</strong>
              </div>
              <div>
                Automated Offers:{" "}
                <strong>{formatCurrency(salesData.offer_discounts)}</strong>
              </div>
              <div>
                Flash Sales:{" "}
                <strong>
                  {formatCurrency(salesData.flash_sale_discounts)}
                </strong>
              </div>
            </div>
          </div>

          {/* Time Series Chart */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
            <h3 className="text-base font-bold text-neutral-900 mb-2">
              Net Sales Trend
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Net revenue realized per interval after discounts and processed
              refunds
            </p>
            {renderTimeSeriesChart(
              salesData.time_series,
              "net_sales",
              "#2563eb",
            )}
          </div>

          {/* Time Series Table */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-neutral-900">
                Period Interval Ledger
              </h3>
              <button
                onClick={() => handleDownloadReport("sales")}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Ledger CSV</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-neutral-400 uppercase tracking-wider border-b border-neutral-100">
                    <th className="pb-3 font-semibold">Interval</th>
                    <th className="pb-3 font-semibold text-right">Orders</th>
                    <th className="pb-3 font-semibold text-right">
                      Gross Sales
                    </th>
                    <th className="pb-3 font-semibold text-right">Discounts</th>
                    <th className="pb-3 font-semibold text-right">Refunds</th>
                    <th className="pb-3 font-semibold text-right">Net Sales</th>
                    <th className="pb-3 font-semibold text-right">AOV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {salesData.time_series.map((pt) => (
                    <tr key={pt.date} className="hover:bg-neutral-50">
                      <td className="py-2.5 font-medium text-neutral-800">
                        {pt.label}{" "}
                        <span className="text-neutral-400 text-[10px]">
                          ({pt.date})
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-medium text-neutral-700">
                        {pt.orders_count}
                      </td>
                      <td className="py-2.5 text-right text-neutral-700">
                        {formatCurrency(pt.gross_sales)}
                      </td>
                      <td className="py-2.5 text-right text-rose-600 font-medium">
                        -{formatCurrency(pt.discounts)}
                      </td>
                      <td className="py-2.5 text-right text-rose-600 font-medium">
                        -{formatCurrency(pt.refunds)}
                      </td>
                      <td className="py-2.5 text-right font-bold text-neutral-900">
                        {formatCurrency(pt.net_sales)}
                      </td>
                      <td className="py-2.5 text-right text-neutral-600">
                        {formatCurrency(pt.average_order_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ORDERS & PAYMENTS TAB */}
      {/* ========================================================================= */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Orders Lifecycle Breakdown */}
            {ordersData && (
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
                <h3 className="text-base font-bold text-neutral-900 mb-2">
                  Order Lifecycle Breakdown
                </h3>
                <p className="text-xs text-neutral-500 mb-4">
                  Total Orders: <strong>{ordersData.total_orders}</strong> (
                  {ordersData.paid_orders} paid, {ordersData.pending_orders}{" "}
                  pending, {ordersData.cancelled_orders} cancelled)
                </p>
                <div className="space-y-3">
                  {ordersData.status_distribution.map((s) => (
                    <div
                      key={s.status}
                      className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="capitalize font-bold text-neutral-800">
                          {s.status}
                        </span>
                        <div className="text-[10px] text-neutral-400">
                          Volume: {formatCurrency(s.volume)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-neutral-900 text-sm">
                          {s.count}
                        </span>
                        <div className="text-[10px] text-neutral-500">
                          {s.percentage}% of total
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Methods Breakdown */}
            {paymentsData && (
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
                <h3 className="text-base font-bold text-neutral-900 mb-2">
                  Payment Performance & Methods
                </h3>
                <p className="text-xs text-neutral-500 mb-4">
                  Total Transactions:{" "}
                  <strong>{paymentsData.total_payments}</strong> • Settled:{" "}
                  {formatCurrency(paymentsData.paid_amount)}
                </p>

                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">
                      Settled Volume
                    </span>
                    <div className="text-base font-extrabold">
                      {formatCurrency(paymentsData.paid_amount)}
                    </div>
                    <div className="text-[10px]">
                      {paymentsData.paid_count} transactions
                    </div>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-900">
                    <span className="text-[10px] uppercase font-bold text-rose-700">
                      Failed / Refunded
                    </span>
                    <div className="text-base font-extrabold">
                      {formatCurrency(
                        paymentsData.failed_amount +
                          paymentsData.refunded_amount,
                      )}
                    </div>
                    <div className="text-[10px]">
                      {paymentsData.failed_count} failed,{" "}
                      {paymentsData.refunded_count} refunded
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Method Channels
                  </h4>
                  {paymentsData.methods.map((m) => (
                    <div
                      key={m.method}
                      className="p-3 bg-neutral-50 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="uppercase font-bold text-neutral-800">
                          {m.method}
                        </span>
                        <div className="text-[10px] text-neutral-500">
                          {m.total_transactions} txs • {m.success_rate}% success
                        </div>
                      </div>
                      <div className="text-right font-bold text-neutral-900">
                        {formatCurrency(m.total_volume)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PRODUCTS & BRANDS TAB */}
      {/* ========================================================================= */}
      {activeTab === "products" && productsData && (
        <div className="space-y-6">
          {/* Catalog Health Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
              <span className="text-xs font-semibold text-neutral-500 block">
                Total Catalog Products
              </span>
              <div className="text-2xl font-extrabold text-neutral-900 mt-1">
                {productsData.total_products}
              </div>
              <span className="text-xs text-emerald-600 font-medium">
                {productsData.active_products} Active in Store
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
              <span className="text-xs font-semibold text-neutral-500 block">
                Products with Sales
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                {productsData.products_with_sales}
              </div>
              <span className="text-xs text-neutral-400">
                {productsData.products_without_sales} Dormant Products
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
              <span className="text-xs font-semibold text-neutral-500 block">
                Low Stock Alerts
              </span>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">
                {productsData.low_stock_products}
              </div>
              <span className="text-xs text-neutral-400">
                At or below threshold
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
              <span className="text-xs font-semibold text-neutral-500 block">
                Out of Stock
              </span>
              <div className="text-2xl font-extrabold text-rose-600 mt-1">
                {productsData.out_of_stock_products}
              </div>
              <span className="text-xs text-neutral-400">
                Immediate restock needed
              </span>
            </div>
          </div>

          {/* Top Products Table */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Top Selling Products
                </h3>
                <p className="text-xs text-neutral-500">
                  Real transaction volume from PostgreSQL database
                </p>
              </div>
              <button
                onClick={() => handleDownloadReport("products")}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Products CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-neutral-400 uppercase tracking-wider border-b border-neutral-100">
                    <th className="pb-3 font-semibold">Product Name</th>
                    <th className="pb-3 font-semibold">SKU</th>
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold">Brand</th>
                    <th className="pb-3 font-semibold text-right">
                      Units Sold
                    </th>
                    <th className="pb-3 font-semibold text-right">Orders</th>
                    <th className="pb-3 font-semibold text-right">
                      Gross Revenue
                    </th>
                    <th className="pb-3 font-semibold text-right">
                      Net Revenue
                    </th>
                    <th className="pb-3 font-semibold text-right">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {productsData.top_products.map((p) => (
                    <tr key={p.product_id} className="hover:bg-neutral-50">
                      <td className="py-3 font-semibold text-neutral-900">
                        <div className="flex items-center gap-2.5">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover border"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400">
                              <Package className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <span className="truncate max-w-[220px]">
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-neutral-500 font-mono">
                        {p.sku}
                      </td>
                      <td className="py-3 text-neutral-600">
                        {p.category_name || "N/A"}
                      </td>
                      <td className="py-3 text-neutral-600">
                        {p.brand_name || "N/A"}
                      </td>
                      <td className="py-3 text-right font-bold text-neutral-900">
                        {p.units_sold}
                      </td>
                      <td className="py-3 text-right text-neutral-700">
                        {p.order_count}
                      </td>
                      <td className="py-3 text-right text-neutral-600">
                        {formatCurrency(p.gross_revenue)}
                      </td>
                      <td className="py-3 text-right font-extrabold text-emerald-600">
                        {formatCurrency(p.net_revenue)}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            p.current_stock > 10
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {p.current_stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Categories & Brands Performance Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categoriesData && (
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-neutral-900">
                    Category Sales Share
                  </h3>
                  <button
                    onClick={() => handleDownloadReport("categories")}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    CSV
                  </button>
                </div>
                <div className="space-y-3">
                  {categoriesData.categories.map((c) => (
                    <div
                      key={c.category_id}
                      className="p-3 bg-neutral-50 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-neutral-800">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {c.units_sold} units sold • {c.total_products} catalog
                          products
                        </div>
                      </div>
                      <div className="text-right font-extrabold text-neutral-900">
                        {formatCurrency(c.net_sales)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {brandsData && (
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-neutral-900">
                    Brand Portfolio Performance
                  </h3>
                  <button
                    onClick={() => handleDownloadReport("brands")}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    CSV
                  </button>
                </div>
                <div className="space-y-3">
                  {brandsData.brands.map((b) => (
                    <div
                      key={b.brand_id}
                      className="p-3 bg-neutral-50 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-neutral-800">
                          {b.name}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {b.units_sold} units sold • {b.total_products} catalog
                          products
                        </div>
                      </div>
                      <div className="text-right font-extrabold text-neutral-900">
                        {formatCurrency(b.net_sales)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CUSTOMERS TAB */}
      {/* ========================================================================= */}
      {activeTab === "customers" && customersData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
              <span className="text-xs font-semibold text-neutral-500 block">
                Total Customers
              </span>
              <div className="text-2xl font-extrabold text-neutral-900 mt-1">
                {customersData.total_customers}
              </div>
              <span className="text-xs text-emerald-600 font-medium">
                {customersData.customers_with_orders} with verified orders
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
              <span className="text-xs font-semibold text-neutral-500 block">
                New Registered
              </span>
              <div className="text-2xl font-extrabold text-blue-600 mt-1">
                {customersData.new_customers_in_period}
              </div>
              <span className="text-xs text-neutral-400">
                In selected period
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
              <span className="text-xs font-semibold text-neutral-500 block">
                Returning Customers
              </span>
              <div className="text-2xl font-extrabold text-indigo-600 mt-1">
                {customersData.returning_customers_in_period}
              </div>
              <span className="text-xs text-neutral-400">Repeat buyers</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
              <span className="text-xs font-semibold text-neutral-500 block">
                Average Spend / User
              </span>
              <div className="text-2xl font-extrabold text-neutral-900 mt-1">
                {formatCurrency(customersData.average_spend_per_customer)}
              </div>
              <span className="text-xs text-neutral-400">
                Total: {formatCurrency(customersData.total_customer_spend)}
              </span>
            </div>
          </div>

          {/* Top Customers by Spend Table */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Highest Value Customers (Spend Leaderboard)
                </h3>
                <p className="text-xs text-neutral-500">
                  Real spend totals calculated across verified paid orders
                </p>
              </div>
              <button
                onClick={() => handleDownloadReport("customers")}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Customers CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-neutral-400 uppercase tracking-wider border-b border-neutral-100">
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold text-right">
                      Orders Placed
                    </th>
                    <th className="pb-3 font-semibold text-right">
                      Total Spend
                    </th>
                    <th className="pb-3 font-semibold text-right">
                      Last Order Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {customersData.top_customers.map((c, idx) => (
                    <tr key={c.user_id} className="hover:bg-neutral-50">
                      <td className="py-3 font-semibold text-neutral-900">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-neutral-500 font-mono">
                        {c.email}
                      </td>
                      <td className="py-3 text-right font-bold text-neutral-900">
                        {c.total_orders}
                      </td>
                      <td className="py-3 text-right font-extrabold text-emerald-600">
                        {formatCurrency(c.total_spend)}
                      </td>
                      <td className="py-3 text-right text-neutral-400">
                        {c.last_order_date || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. INVENTORY CONTROL TAB */}
      {/* ========================================================================= */}
      {activeTab === "inventory" && inventoryData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
              <span className="text-xs font-semibold text-neutral-500 block">
                Total On-Hand Units
              </span>
              <div className="text-2xl font-extrabold text-neutral-900 mt-1">
                {inventoryData.total_on_hand_units}
              </div>
              <span className="text-xs text-neutral-400">
                {inventoryData.total_inventory_records} tracking records
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
              <span className="text-xs font-semibold text-neutral-500 block">
                Reserved Units
              </span>
              <div className="text-2xl font-extrabold text-indigo-600 mt-1">
                {inventoryData.total_reserved_units}
              </div>
              <span className="text-xs text-neutral-400">
                Held in pending checkouts
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
              <span className="text-xs font-semibold text-neutral-500 block">
                Available For Sale
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                {inventoryData.total_available_units}
              </div>
              <span className="text-xs text-emerald-700 font-medium">
                Unrestricted stock
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
              <span className="text-xs font-semibold text-neutral-500 block">
                Estimated Inventory Value
              </span>
              <div className="text-2xl font-extrabold text-neutral-900 mt-1">
                {formatCurrency(inventoryData.estimated_inventory_value)}
              </div>
              <span className="text-xs text-neutral-400">
                At current MRP/Price
              </span>
            </div>
          </div>

          {/* Low Stock & Out of Stock Alerts Table */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Low Stock & Out of Stock Action Queue
                </h3>
                <p className="text-xs text-neutral-500">
                  Authoritative inventory records requiring procurement or
                  reordering
                </p>
              </div>
              <button
                onClick={() => handleDownloadReport("inventory")}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Inventory CSV</span>
              </button>
            </div>

            {inventoryData.low_stock_items.length === 0 ? (
              <div className="text-center py-12 text-emerald-600 text-xs font-medium bg-emerald-50/50 rounded-xl border border-emerald-100">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                All inventory levels are healthy! No products currently below
                reorder thresholds.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-neutral-400 uppercase tracking-wider border-b border-neutral-100">
                      <th className="pb-3 font-semibold">Product Name</th>
                      <th className="pb-3 font-semibold">SKU</th>
                      <th className="pb-3 font-semibold text-right">On Hand</th>
                      <th className="pb-3 font-semibold text-right">
                        Reserved
                      </th>
                      <th className="pb-3 font-semibold text-right">
                        Available
                      </th>
                      <th className="pb-3 font-semibold text-right">
                        Threshold
                      </th>
                      <th className="pb-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {inventoryData.low_stock_items.map((item) => (
                      <tr
                        key={item.inventory_id}
                        className="hover:bg-neutral-50"
                      >
                        <td className="py-3 font-semibold text-neutral-900">
                          {item.product_name}
                        </td>
                        <td className="py-3 text-neutral-500 font-mono">
                          {item.sku}
                        </td>
                        <td className="py-3 text-right font-bold text-neutral-800">
                          {item.on_hand}
                        </td>
                        <td className="py-3 text-right text-indigo-600">
                          {item.reserved}
                        </td>
                        <td className="py-3 text-right font-extrabold text-neutral-900">
                          {item.available}
                        </td>
                        <td className="py-3 text-right text-neutral-400">
                          {item.low_stock_threshold}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              item.available <= 0
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.available <= 0 ? "OUT OF STOCK" : "LOW STOCK"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SHIPPING & FULFILLMENT TAB */}
      {/* ========================================================================= */}
      {activeTab === "fulfillment" && shippingData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border border-neutral-200 text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                Total Shipments
              </span>
              <div className="text-xl font-bold text-neutral-900 mt-1">
                {shippingData.total_shipments}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-neutral-200 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-600 block">
                Pending Dispatch
              </span>
              <div className="text-xl font-bold text-amber-700 mt-1">
                {shippingData.pending_shipments}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-neutral-200 text-center">
              <span className="text-[10px] uppercase font-bold text-blue-600 block">
                In Transit
              </span>
              <div className="text-xl font-bold text-blue-700 mt-1">
                {shippingData.in_transit_shipments}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-neutral-200 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">
                Delivered
              </span>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                {shippingData.delivered_shipments}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-neutral-200 text-center">
              <span className="text-[10px] uppercase font-bold text-rose-600 block">
                Failed / Returned
              </span>
              <div className="text-xl font-bold text-rose-700 mt-1">
                {shippingData.failed_shipments}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
            <h3 className="text-base font-bold text-neutral-900 mb-4">
              Carrier Volume & Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shippingData.carrier_breakdown.map((c) => (
                <div
                  key={c.carrier}
                  className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-neutral-900 uppercase">
                      {c.carrier}
                    </span>
                    <Truck className="w-4 h-4 text-neutral-500" />
                  </div>
                  <div className="space-y-1 text-neutral-600">
                    <div>
                      Total Shipments: <strong>{c.total_shipments}</strong>
                    </div>
                    <div>
                      Successfully Delivered:{" "}
                      <strong className="text-emerald-600">
                        {c.delivered_shipments}
                      </strong>
                    </div>
                    <div>
                      Currently In Transit:{" "}
                      <strong className="text-blue-600">
                        {c.in_transit_shipments}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. RETURNS, RATINGS & SUPPORT TAB */}
      {/* ========================================================================= */}
      {activeTab === "returns_sentiment" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Returns & Refunds Metrics */}
            {returnsData && (
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-neutral-900">
                    Returns & Refunds
                  </h3>
                  <button
                    onClick={() => handleDownloadReport("returns")}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    CSV
                  </button>
                </div>
                <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-100 text-rose-900">
                  <span className="text-xs font-semibold block">
                    Return Rate
                  </span>
                  <div className="text-2xl font-extrabold">
                    {returnsData.return_rate_percentage}%
                  </div>
                  <div className="text-[10px] mt-1">
                    {returnsData.total_returns} returns requested •{" "}
                    {formatCurrency(returnsData.total_refund_amount)} refunded
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Return Reasons
                  </h4>
                  {returnsData.reason_breakdown.map((r) => (
                    <div
                      key={r.reason}
                      className="flex items-center justify-between text-xs p-2 bg-neutral-50 rounded-lg"
                    >
                      <span className="capitalize text-neutral-700">
                        {r.reason.replace(/_/g, " ")}
                      </span>
                      <span className="font-bold text-neutral-900">
                        {r.count} ({r.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Reviews & Satisfaction */}
            {reviewsData && (
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-neutral-900">
                  Review Sentiment
                </h3>
                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100 text-amber-900 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold block">
                      Average Product Rating
                    </span>
                    <div className="text-2xl font-extrabold flex items-center gap-1.5 mt-0.5">
                      <span>{reviewsData.average_rating}</span>
                      <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-amber-800">
                    <div>{reviewsData.total_reviews} total reviews</div>
                    <div className="font-semibold text-emerald-700">
                      {reviewsData.verified_purchase_count} verified buyers
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Rating Distribution
                  </h4>
                  {reviewsData.rating_distribution.map((rd) => (
                    <div
                      key={rd.rating}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="w-8 text-neutral-600 font-medium">
                        {rd.rating} ★
                      </span>
                      <div className="flex-1 bg-neutral-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: `${rd.percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-neutral-400 font-medium">
                        {rd.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Support Queue Metrics */}
            {supportData && (
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-neutral-900">
                  Customer Support Health
                </h3>
                <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-indigo-900">
                  <span className="text-xs font-semibold block">
                    Active Support Tickets
                  </span>
                  <div className="text-2xl font-extrabold">
                    {supportData.open_tickets +
                      supportData.in_progress_tickets +
                      supportData.waiting_customer_tickets}
                  </div>
                  <div className="text-[10px] mt-1">
                    {supportData.resolved_tickets} resolved •{" "}
                    {supportData.closed_tickets} closed
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Priority Breakdown
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(supportData.priority_breakdown).map(
                      ([prio, count]) => (
                        <div
                          key={prio}
                          className="p-2 bg-neutral-50 rounded-lg text-center"
                        >
                          <span className="capitalize text-[10px] font-bold text-neutral-500 block">
                            {prio}
                          </span>
                          <strong className="text-sm font-extrabold text-neutral-900">
                            {count}
                          </strong>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. EXPORT & REPORT CENTER TAB */}
      {/* ========================================================================= */}
      {activeTab === "exports" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
            <h3 className="text-base font-bold text-neutral-900 mb-1">
              Standard Production Reports
            </h3>
            <p className="text-xs text-neutral-500 mb-6">
              Download genuine comma-separated (.csv) database extracts for
              executive auditing, tax compliance, and accounting.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: "sales",
                  title: "Sales Summary Report",
                  desc: "Daily time series, gross/net sales, tax, discounts, and AOV",
                },
                {
                  id: "orders",
                  title: "Orders Ledger Report",
                  desc: "Line items, payment status, customer identification, and grand totals",
                },
                {
                  id: "products",
                  title: "Product Performance Report",
                  desc: "Units sold, gross and net revenues, and current on-hand stock",
                },
                {
                  id: "customers",
                  title: "Customer Spend Report",
                  desc: "Verified customer lifetime spends, order frequency, and last purchase date",
                },
                {
                  id: "inventory",
                  title: "Inventory Valuation Report",
                  desc: "Authoritative stock levels, reserved units, thresholds, and inventory values",
                },
                {
                  id: "returns",
                  title: "Returns & Refunds Report",
                  desc: "Return reasons, inspection resolutions, and processed refund amounts",
                },
                {
                  id: "categories",
                  title: "Category Performance Report",
                  desc: "Category-level sales volume, units sold, and catalog counts",
                },
                {
                  id: "brands",
                  title: "Brand Portfolio Report",
                  desc: "Brand-level unit sales, revenue share, and product volume",
                },
                {
                  id: "coupons",
                  title: "Promotions & Coupons Report",
                  desc: "Coupon code redemptions, discount value granted, and generated revenue",
                },
              ].map((rep) => (
                <div
                  key={rep.id}
                  className="p-5 bg-neutral-50 rounded-xl border border-neutral-200/80 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-neutral-900">
                        {rep.title}
                      </span>
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      {rep.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadReport(rep.id)}
                    disabled={exportingReport === rep.id}
                    className="mt-4 w-full py-2 bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-bold rounded-lg border border-neutral-300 flex items-center justify-center gap-1.5 active:scale-98 transition-all disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {exportingReport === rep.id
                        ? "Generating..."
                        : "Download CSV"}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
