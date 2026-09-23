import React, { useEffect, useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  ArrowUpDown,
  Edit2,
  Sliders,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Package,
  Layers,
  FileText
} from 'lucide-react';
import { 
  InventoryItem, 
  InventorySummary, 
  InventoryTransaction, 
  StockStatus, 
  Category 
} from '../../types';
import { api } from '../../services/api';

export const AdminInventory: React.FC = () => {
  // State
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('available');
  const [sortOrder, setSortOrder] = useState<string>('asc');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Modals state
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItem | null>(null);
  const [adjustMode, setAdjustMode] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Replenishment / Restock');
  const [customReason, setCustomReason] = useState<string>('');
  const [adjustRef, setAdjustRef] = useState<string>('');
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  // Transactions History Drawer / Modal
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<InventoryItem | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Edit threshold modal
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<InventoryItem | null>(null);
  const [editThreshold, setEditThreshold] = useState<number>(5);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);

  // Data Loading
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Load summary
      const sumRes = await api.admin.getInventorySummary();
      if (sumRes.success && sumRes.data) {
        setSummary(sumRes.data);
      }

      // 2. Load inventory items with active filters
      const params: any = {
        page,
        page_size: 15,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.stock_status = statusFilter;
      if (categoryFilter !== 'ALL') params.category_id = parseInt(categoryFilter, 10);

      const listRes = await api.admin.getInventoryList(params);
      if (listRes.success && listRes.data) {
        setItems(listRes.data.items || []);
        setTotalPages(listRes.data.total_pages || 1);
        setTotalItems(listRes.data.total || 0);
      }

      // 3. Load categories for filter if not yet loaded
      if (categories.length === 0) {
        const catRes = await api.categories.getAll();
        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter, categoryFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Open Adjust Modal
  const openAdjustModal = (item: InventoryItem, defaultMode: 'ADD' | 'DEDUCT' = 'ADD') => {
    setSelectedItemForAdjust(item);
    setAdjustMode(defaultMode);
    setAdjustQty(defaultMode === 'ADD' ? 10 : 1);
    setAdjustReason(defaultMode === 'ADD' ? 'Replenishment / Restock' : 'Damaged / Spoiled Goods');
    setCustomReason('');
    setAdjustRef('');
    setAdjustNotes('');
  };

  // Handle submit adjust
  const handleExecuteAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAdjust) return;

    const delta = adjustMode === 'ADD' ? Math.abs(adjustQty) : -Math.abs(adjustQty);
    if (delta === 0) {
      setError('Adjustment quantity cannot be 0');
      return;
    }

    const finalReason = adjustReason === 'Other (Specify Below)'
      ? (customReason.trim() || 'Inventory adjustment')
      : adjustReason;

    setActionLoading(true);
    setError(null);
    try {
      const res = await api.admin.adjustInventory(selectedItemForAdjust.id, {
        quantity_change: delta,
        reason: finalReason,
        reference_id: adjustRef.trim() || undefined,
        reference_type: adjustRef.trim() ? 'REF' : undefined,
        notes: adjustNotes.trim() || undefined
      });

      if (res.success && res.data) {
        showToast(`Successfully updated stock for ${selectedItemForAdjust.sku}: ${delta > 0 ? '+' : ''}${delta} units`);
        setSelectedItemForAdjust(null);
        await loadData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to adjust inventory');
    } finally {
      setActionLoading(false);
    }
  };

  // Open History Modal
  const openHistoryModal = async (item: InventoryItem) => {
    setSelectedItemForHistory(item);
    setLoadingHistory(true);
    try {
      const res = await api.admin.getInventoryTransactions(item.id, { page_size: 50 });
      if (res.success && res.data) {
        setTransactions(res.data.items || []);
      }
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (item: InventoryItem) => {
    setSelectedItemForEdit(item);
    setEditThreshold(item.low_stock_threshold);
    setEditIsActive(item.is_active);
  };

  // Handle Edit Submit
  const handleExecuteEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForEdit) return;

    setActionLoading(true);
    setError(null);
    try {
      const res = await api.admin.updateInventory(selectedItemForEdit.id, {
        low_stock_threshold: editThreshold,
        is_active: editIsActive
      });

      if (res.success && res.data) {
        showToast(`Updated threshold and status for ${selectedItemForEdit.sku}`);
        setSelectedItemForEdit(null);
        await loadData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update inventory settings');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
              <Boxes className="w-5 h-5 text-neutral-800" />
              <span>Inventory Management</span>
            </h2>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
              Authoritative Source
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Single source of truth for physical stock, reserved allocations, and immutable ledger transactions.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-3 rounded-xl text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-200 px-4 py-3 rounded-xl text-xs font-medium">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
            <span className="text-[11px] font-medium text-neutral-500 block uppercase tracking-wider">Total SKUs</span>
            <span className="text-2xl font-black text-neutral-900 mt-1 block">{summary.total_items}</span>
            <span className="text-[10px] text-neutral-400 mt-1 block">Catalog entries</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200/60 bg-emerald-50/20 shadow-xs">
            <span className="text-[11px] font-medium text-emerald-700 block uppercase tracking-wider">In Stock</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{summary.in_stock_count}</span>
            <span className="text-[10px] text-emerald-600 mt-1 block">Optimal inventory</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200/60 bg-amber-50/20 shadow-xs">
            <span className="text-[11px] font-medium text-amber-700 block uppercase tracking-wider">Low Stock</span>
            <span className="text-2xl font-black text-amber-700 mt-1 block">{summary.low_stock_count}</span>
            <span className="text-[10px] text-amber-600 mt-1 block">Under threshold</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200/60 bg-rose-50/20 shadow-xs">
            <span className="text-[11px] font-medium text-rose-700 block uppercase tracking-wider">Out of Stock</span>
            <span className="text-2xl font-black text-rose-700 mt-1 block">{summary.out_of_stock_count}</span>
            <span className="text-[10px] text-rose-600 mt-1 block">Replenish now</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
            <span className="text-[11px] font-medium text-neutral-500 block uppercase tracking-wider">On-Hand Units</span>
            <span className="text-2xl font-black text-neutral-900 mt-1 block">{summary.total_on_hand}</span>
            <span className="text-[10px] text-neutral-400 mt-1 block">Physical count</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
            <span className="text-[11px] font-medium text-neutral-500 block uppercase tracking-wider">Reserved Units</span>
            <span className="text-2xl font-black text-neutral-900 mt-1 block">{summary.total_reserved}</span>
            <span className="text-[10px] text-neutral-400 mt-1 block">Cart / pending</span>
          </div>

        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by SKU, product name, or variant title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-20 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-neutral-900 transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-neutral-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg"
            >
              Search
            </button>
          </form>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <span className="text-xs text-neutral-500 shrink-0 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2 text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock Alert</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <span className="text-xs text-neutral-500 shrink-0 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2 text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id.toString()}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <span className="text-xs text-neutral-500 shrink-0 font-medium">Sort:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2 text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
            >
              <option value="available-asc">Lowest Stock First</option>
              <option value="available-desc">Highest Stock First</option>
              <option value="sku-asc">SKU (A-Z)</option>
              <option value="updated_at-desc">Recently Updated</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                <th className="py-3 px-4">Item / SKU</th>
                <th className="py-3 px-4">Category / Brand</th>
                <th className="py-3 px-4 text-center">On Hand</th>
                <th className="py-3 px-4 text-center">Reserved</th>
                <th className="py-3 px-4 text-center">Available Stock</th>
                <th className="py-3 px-4 text-center">Threshold</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-neutral-400" />
                    <span>Loading authoritative inventory records...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    <Package className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                    <p className="font-semibold text-sm text-neutral-700">No inventory records found</p>
                    <p className="text-xs text-neutral-400 mt-1">Try adjusting your search query or status filter.</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isVariant = item.variant_id !== null;
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors">
                      
                      {/* Item info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {item.product_image ? (
                            <img
                              src={item.product_image}
                              alt={item.product_name || item.sku}
                              className="w-10 h-10 rounded-lg object-cover border border-neutral-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-neutral-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-neutral-900 truncate max-w-xs">
                              {item.product_name || 'Unnamed Product'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[11px] font-semibold text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded">
                                {item.sku}
                              </span>
                              {isVariant && (
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-1.5 py-0.2 rounded font-medium truncate max-w-[140px]">
                                  {item.variant_title || 'Variant'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="py-3.5 px-4 text-neutral-600">
                        <p className="font-medium text-neutral-800">{item.category_name || '—'}</p>
                        <p className="text-[11px] text-neutral-400">{item.brand_name || '—'}</p>
                      </td>

                      {/* On Hand */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block bg-neutral-100 text-neutral-800 font-bold px-2.5 py-1 rounded-md text-xs">
                          {item.on_hand_quantity}
                        </span>
                      </td>

                      {/* Reserved */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block font-semibold px-2 py-0.5 rounded-md text-xs ${
                          item.reserved_quantity > 0 ? 'bg-amber-100 text-amber-800' : 'text-neutral-400'
                        }`}>
                          {item.reserved_quantity}
                        </span>
                      </td>

                      {/* Available Quantity */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block font-extrabold px-3 py-1 rounded-lg text-xs ${
                          item.available_quantity <= 0
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : item.available_quantity <= item.low_stock_threshold
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {item.available_quantity} units
                        </span>
                      </td>

                      {/* Threshold */}
                      <td className="py-3.5 px-4 text-center text-neutral-600 font-medium">
                        ≤ {item.low_stock_threshold}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {item.stock_status === 'IN_STOCK' && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>In Stock</span>
                          </span>
                        )}
                        {item.stock_status === 'LOW_STOCK' && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <span>Low Stock</span>
                          </span>
                        )}
                        {item.stock_status === 'OUT_OF_STOCK' && (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <XCircle className="w-3 h-3 text-rose-500" />
                            <span>Out of Stock</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Quick Receive */}
                          <button
                            onClick={() => openAdjustModal(item, 'ADD')}
                            title="Replenish Stock"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Deduct */}
                          <button
                            onClick={() => openAdjustModal(item, 'DEDUCT')}
                            title="Deduct / Write-off Stock"
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          {/* Ledger / History */}
                          <button
                            onClick={() => openHistoryModal(item)}
                            title="View Audit Ledger"
                            className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-300 transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Settings */}
                          <button
                            onClick={() => openEditModal(item)}
                            title="Edit Threshold & Active Status"
                            className="p-1.5 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-neutral-200 bg-neutral-50 text-xs">
            <span className="text-neutral-500">
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalItems} total items)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 font-medium"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 font-bold text-neutral-900 bg-white border border-neutral-200 rounded-lg">
                {page}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADJUST QUANTITY MODAL */}
      {/* ========================================================================= */}
      {selectedItemForAdjust && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-neutral-200 overflow-hidden animate-scaleIn">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div>
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <span>Stock Quantity Adjustment</span>
                </h3>
                <p className="text-xs text-neutral-500">SKU: <span className="font-mono font-bold text-neutral-800">{selectedItemForAdjust.sku}</span></p>
              </div>
              <button
                onClick={() => setSelectedItemForAdjust(null)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleExecuteAdjustment} className="p-5 space-y-4">
              
              {/* Target info */}
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-neutral-800 truncate max-w-[200px]">{selectedItemForAdjust.product_name}</p>
                  {selectedItemForAdjust.variant_title && (
                    <p className="text-[11px] text-indigo-600 font-medium">{selectedItemForAdjust.variant_title}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Current Available</span>
                  <span className="font-extrabold text-sm text-neutral-900">{selectedItemForAdjust.available_quantity} units</span>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustMode('ADD');
                    setAdjustReason('Replenishment / Restock');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    adjustMode === 'ADD'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Receive / Restock</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustMode('DEDUCT');
                    setAdjustReason('Damaged / Spoiled Goods');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    adjustMode === 'DEDUCT'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Reduce / Deduct</span>
                </button>
              </div>

              {/* Quantity input */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Quantity ({adjustMode === 'ADD' ? '+ Add' : '- Deduct'})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={adjustMode === 'DEDUCT' ? selectedItemForAdjust.on_hand_quantity : 99999}
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm font-bold text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                    required
                  />
                  <div className="flex gap-1">
                    {[5, 10, 25, 50].map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => setAdjustQty(quick)}
                        className="text-xs font-semibold px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-700"
                      >
                        +{quick}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview */}
                <div className="mt-2 p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs flex items-center justify-between">
                  <span className="text-neutral-500">Projected Available:</span>
                  <span className="font-extrabold text-neutral-900">
                    {adjustMode === 'ADD'
                      ? selectedItemForAdjust.available_quantity + adjustQty
                      : selectedItemForAdjust.available_quantity - adjustQty}{' '}
                    units
                  </span>
                </div>
              </div>

              {/* Reason Selector */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Adjustment Reason <span className="text-rose-500">*</span>
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                  required
                >
                  {adjustMode === 'ADD' ? (
                    <>
                      <option value="Replenishment / Restock">Replenishment / Restock Shipment</option>
                      <option value="Customer Return Restock">Customer Return Restock</option>
                      <option value="Physical Audit Surplus">Physical Audit Surplus</option>
                      <option value="Other (Specify Below)">Other (Specify Below)</option>
                    </>
                  ) : (
                    <>
                      <option value="Damaged / Spoiled Goods">Damaged / Spoiled Goods</option>
                      <option value="Physical Audit Shortage">Physical Audit Shortage</option>
                      <option value="Promotional Sampling / Internal Use">Promotional Sampling / Internal Use</option>
                      <option value="Inventory Write-off">Inventory Write-off</option>
                      <option value="Other (Specify Below)">Other (Specify Below)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Custom reason text if selected */}
              {adjustReason === 'Other (Specify Below)' && (
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Custom Reason Detail
                  </label>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Provide justification..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                    required
                  />
                </div>
              )}

              {/* Reference ID (Optional) */}
              <div>
                <label className="text-xs font-medium text-neutral-600 block mb-1">
                  Reference ID (PO Number, Audit ID, etc.)
                </label>
                <input
                  type="text"
                  value={adjustRef}
                  onChange={(e) => setAdjustRef(e.target.value)}
                  placeholder="e.g. PO-84920 or AUDIT-2026-Q3"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setSelectedItemForAdjust(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 ${
                    adjustMode === 'ADD'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{adjustMode === 'ADD' ? 'Commit Restock' : 'Commit Deduction'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TRANSACTIONS AUDIT LEDGER DRAWER / MODAL */}
      {/* ========================================================================= */}
      {selectedItemForHistory && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-scaleIn max-h-[85vh] flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50 shrink-0">
              <div>
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-neutral-700" />
                  <span>Immutable Audit Ledger</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  Historical transaction trace for SKU: <span className="font-mono font-bold text-neutral-900">{selectedItemForHistory.sku}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedItemForHistory(null)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Content Table */}
            <div className="overflow-y-auto flex-1 p-6">
              {loadingHistory ? (
                <div className="py-12 text-center text-neutral-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-neutral-400" />
                  <span>Fetching transaction ledger...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-12 text-center text-neutral-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                  <p className="font-medium text-neutral-700">No ledger transactions recorded yet</p>
                </div>
              ) : (
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Date / Time</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3 text-center">Change</th>
                        <th className="py-2.5 px-3 text-center">Before → After</th>
                        <th className="py-2.5 px-3">Reason / Reference</th>
                        <th className="py-2.5 px-3 text-right">Actor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-neutral-50/70">
                          
                          {/* Date */}
                          <td className="py-2.5 px-3 text-neutral-600 font-mono text-[11px]">
                            {new Date(t.created_at).toLocaleString()}
                          </td>

                          {/* Type */}
                          <td className="py-2.5 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.transaction_type === 'RECEIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.transaction_type === 'ADJUSTMENT'
                                ? 'bg-sky-100 text-sky-800'
                                : t.transaction_type === 'RESERVE'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-neutral-100 text-neutral-800'
                            }`}>
                              {t.transaction_type}
                            </span>
                          </td>

                          {/* Delta */}
                          <td className="py-2.5 px-3 text-center font-bold">
                            <span className={t.quantity_change > 0 ? 'text-emerald-700' : 'text-rose-700'}>
                              {t.quantity_change > 0 ? `+${t.quantity_change}` : t.quantity_change}
                            </span>
                          </td>

                          {/* Before -> After */}
                          <td className="py-2.5 px-3 text-center text-neutral-600 font-mono text-[11px]">
                            {t.quantity_before} → <strong>{t.quantity_after}</strong>
                          </td>

                          {/* Reason */}
                          <td className="py-2.5 px-3 text-neutral-800">
                            <p className="font-medium">{t.reason}</p>
                            {t.reference_id && (
                              <p className="text-[10px] text-neutral-400 font-mono">Ref: {t.reference_id}</p>
                            )}
                          </td>

                          {/* Actor */}
                          <td className="py-2.5 px-3 text-right text-[11px] text-neutral-500 font-mono">
                            {t.created_by}
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-neutral-500">
                Total transactions recorded: <strong>{transactions.length}</strong>
              </span>
              <button
                onClick={() => setSelectedItemForHistory(null)}
                className="px-4 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-200/80 hover:bg-neutral-300 rounded-lg"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* THRESHOLD & ACTIVE SETTINGS MODAL */}
      {/* ========================================================================= */}
      {selectedItemForEdit && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-neutral-200 overflow-hidden animate-scaleIn">
            
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Inventory Configuration</h3>
                <p className="text-xs text-neutral-500">SKU: <span className="font-mono font-bold">{selectedItemForEdit.sku}</span></p>
              </div>
              <button
                onClick={() => setSelectedItemForEdit(null)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteEdit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  min={0}
                  max={9999}
                  value={editThreshold}
                  onChange={(e) => setEditThreshold(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                  required
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  Items with available quantity less than or equal to this threshold trigger low-stock alerts.
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900"
                />
                <label htmlFor="editIsActive" className="text-xs font-semibold text-neutral-800 cursor-pointer">
                  Item is active for storefront ordering
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setSelectedItemForEdit(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
