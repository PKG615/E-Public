import React, { useEffect, useState, useMemo } from 'react';
import {
  Award,
  Plus,
  Trash2,
  Edit2,
  X,
  Eye,
  EyeOff,
  Search,
  Image as ImageIcon,
  Globe,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  RefreshCw,
  ExternalLink,
  Package,
  Calendar,
  Layers
} from 'lucide-react';
import { Brand } from '../../types';
import { api } from '../../services/api';

interface BrandFormData {
  id?: number;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  website_url: string;
  sort_order: number;
  is_active: boolean;
  seo_title: string;
  seo_description: string;
}

const emptyForm: BrandFormData = {
  name: '',
  slug: '',
  description: '',
  logo_url: '',
  website_url: '',
  sort_order: 0,
  is_active: true,
  seo_title: '',
  seo_description: ''
};

export const AdminBrands: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'sort_order' | 'name' | 'products' | 'created'>('sort_order');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'media' | 'seo'>('general');
  const [formData, setFormData] = useState<BrandFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [autoSlug, setAutoSlug] = useState<boolean>(true);

  // Delete Dialog State
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch Brands from Database
  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getBrands({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery.trim() || undefined
      });
      if (res && res.success) {
        setBrands(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load brands from API:', err);
      showNotification('error', err?.response?.data?.message || 'Failed to load brands from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [statusFilter]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Slug generator helper
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: autoSlug && !editingBrand ? generateSlug(val) : prev.slug
    }));
    if (formErrors.name) {
      setFormErrors(prev => ({ ...prev, name: '' }));
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingBrand(null);
    setFormData(emptyForm);
    setFormErrors({});
    setAutoSlug(true);
    setActiveTab('general');
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      description: brand.description || '',
      logo_url: brand.logo_url || '',
      website_url: brand.website_url || '',
      sort_order: brand.sort_order || 0,
      is_active: brand.is_active,
      seo_title: brand.seo_title || '',
      seo_description: brand.seo_description || ''
    });
    setFormErrors({});
    setAutoSlug(false);
    setActiveTab('general');
    setShowModal(true);
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Brand name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Brand name must be at least 2 characters';
    }

    const targetSlug = formData.slug.trim() || generateSlug(formData.name);
    if (!targetSlug) {
      errors.slug = 'Valid slug is required';
    }

    if (formData.website_url && !/^https?:\/\//i.test(formData.website_url)) {
      errors.website_url = 'Website URL must begin with http:// or https://';
    }

    if (formData.logo_url && !/^https?:\/\//i.test(formData.logo_url)) {
      errors.logo_url = 'Logo URL must begin with http:// or https://';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Brand (Create / Edit)
  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setActionLoading(true);
    try {
      const payload: Partial<Brand> = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || generateSlug(formData.name),
        description: formData.description.trim() || undefined,
        logo_url: formData.logo_url.trim() || undefined,
        website_url: formData.website_url.trim() || undefined,
        sort_order: Number(formData.sort_order) || 0,
        is_active: formData.is_active,
        seo_title: formData.seo_title.trim() || undefined,
        seo_description: formData.seo_description.trim() || undefined
      };

      if (editingBrand) {
        const res = await api.admin.updateBrand(editingBrand.id, payload);
        if (res && res.success) {
          showNotification('success', `Brand "${res.data.name}" updated in PostgreSQL!`);
          setShowModal(false);
          await fetchBrands();
        }
      } else {
        const res = await api.admin.createBrand(payload);
        if (res && res.success) {
          showNotification('success', `Brand "${res.data.name}" created in PostgreSQL!`);
          setShowModal(false);
          await fetchBrands();
        }
      }
    } catch (err: any) {
      console.error('Error saving brand:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to save brand';
      showNotification('error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Fast Toggle Active / Inactive
  const handleToggleStatus = async (brand: Brand) => {
    try {
      const newStatus = !brand.is_active;
      const res = await api.admin.updateBrand(brand.id, { is_active: newStatus });
      if (res && res.success) {
        setBrands(prev => prev.map(b => b.id === brand.id ? { ...b, is_active: newStatus } : b));
        showNotification(
          'success',
          `Brand "${brand.name}" set to ${newStatus ? 'ACTIVE' : 'INACTIVE'} in database`
        );
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to toggle brand status';
      showNotification('error', msg);
    }
  };

  // Delete Brand Handler
  const handleDeleteBrand = async () => {
    if (!brandToDelete) return;
    setDeleteError(null);
    setActionLoading(true);
    try {
      const res = await api.admin.deleteBrand(brandToDelete.id);
      if (res && res.success) {
        showNotification('success', `Brand "${brandToDelete.name}" deleted from database`);
        setBrandToDelete(null);
        await fetchBrands();
      }
    } catch (err: any) {
      console.error('Delete brand error:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to delete brand';
      setDeleteError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered & Sorted Brands
  const filteredBrands = useMemo(() => {
    return brands
      .filter(b => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          b.slug.toLowerCase().includes(q) ||
          (b.description && b.description.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'sort_order') {
          return (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'products') {
          return (b.products_count ?? 0) - (a.products_count ?? 0);
        }
        if (sortBy === 'created') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return 0;
      });
  }, [brands, searchQuery, sortBy]);

  const activeCount = brands.filter(b => b.is_active).length;
  const totalProductsAssigned = brands.reduce((acc, curr) => acc + (curr.products_count || 0), 0);

  return (
    <div id="admin-brands-view" className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 text-neutral-900">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <Award className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Brand Management</h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                Truth
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1.5 max-w-2xl">
              Create, configure, and maintain manufacturer and designer brands. Changes synchronize live to storefront filters, product catalog indexes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="refresh-brands-btn"
              onClick={fetchBrands}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors border border-neutral-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
            <button
              id="create-brand-modal-btn"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add Brand</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-neutral-100">
          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200/60">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Total Brands</span>
            <span className="text-xl font-bold text-neutral-900 mt-0.5 block">{brands.length}</span>
          </div>
          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200/60">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Active Online</span>
            <span className="text-xl font-bold text-emerald-600 mt-0.5 block">{activeCount}</span>
          </div>
          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200/60">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Inactive / Hidden</span>
            <span className="text-xl font-bold text-neutral-500 mt-0.5 block">{brands.length - activeCount}</span>
          </div>
          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200/60">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Associated Products</span>
            <span className="text-xl font-bold text-amber-600 mt-0.5 block">{totalProductsAssigned}</span>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          id="brand-notification-toast"
          className={`p-4 rounded-xl flex items-center gap-3 border text-xs font-medium animate-fadeIn transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-neutral-400 hover:text-neutral-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="brand-search-input"
            type="text"
            placeholder="Search brands by name, slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Status Filter Tabs */}
          <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200/60 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All ({brands.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Inactive ({brands.length - activeCount})
            </button>
          </div>

          {/* Sort By Select */}
          <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs text-neutral-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
            <select
              id="brand-sort-select"
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-semibold text-neutral-800 focus:outline-hidden cursor-pointer"
            >
              <option value="sort_order">Sort: Order (Asc)</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="products">Sort: Most Products</option>
              <option value="created">Sort: Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Brand Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-7 h-7 text-amber-500 animate-spin mb-3" />
            <p className="text-xs font-semibold text-neutral-700">Loading Brands from Database...</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">Fetching PostgreSQL records via FastAPI</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400 mb-3">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-neutral-900">No Brands Found</h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No brands matched your search "${searchQuery}". Try a different keyword or reset filters.`
                : 'No brands exist in the database yet. Click "Add Brand" to create your first brand.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/75 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">URL Slug</th>
                  <th className="py-3 px-4">Website</th>
                  <th className="py-3 px-4 text-center">Products</th>
                  <th className="py-3 px-4 text-center">Order</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
                {filteredBrands.map((brand) => {
                  return (
                    <tr
                      key={brand.id}
                      id={`brand-row-${brand.id}`}
                      className="hover:bg-neutral-50/60 transition-colors group"
                    >
                      {/* Brand Info & Logo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200/80 flex items-center justify-center overflow-hidden shrink-0">
                            {brand.logo_url ? (
                              <img
                                src={brand.logo_url}
                                alt={brand.name}
                                className="w-full h-full object-contain p-1"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="font-bold text-neutral-400 text-sm">
                                {brand.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-neutral-900 block group-hover:text-amber-600 transition-colors">
                              {brand.name}
                            </span>
                            {brand.description ? (
                              <span className="text-[11px] text-neutral-500 line-clamp-1 max-w-xs block font-normal">
                                {brand.description}
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-400 italic">No description</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-3.5 px-4">
                        <code className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-mono text-[11px] border border-neutral-200">
                          {brand.slug}
                        </code>
                      </td>

                      {/* Official Website */}
                      <td className="py-3.5 px-4">
                        {brand.website_url ? (
                          <a
                            href={brand.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 hover:underline text-[11px]"
                          >
                            <Globe className="w-3 h-3" />
                            <span className="max-w-[140px] truncate">
                              {brand.website_url.replace(/^https?:\/\/(www\.)?/, '')}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                          </a>
                        ) : (
                          <span className="text-neutral-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Product Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            (brand.products_count || 0) > 0
                              ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                              : 'bg-neutral-100 text-neutral-500 border border-neutral-200/60'
                          }`}
                        >
                          <Package className="w-3 h-3" />
                          <span>{brand.products_count || 0}</span>
                        </span>
                      </td>

                      {/* Sort Order */}
                      <td className="py-3.5 px-4 text-center font-mono text-neutral-600">
                        {brand.sort_order ?? 0}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(brand)}
                          title={`Click to set ${brand.is_active ? 'Inactive' : 'Active'}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                            brand.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200'
                          }`}
                        >
                          {brand.is_active ? (
                            <>
                              <Eye className="w-3 h-3 text-emerald-600" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-neutral-400" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`edit-brand-btn-${brand.id}`}
                            onClick={() => handleOpenEditModal(brand)}
                            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Edit Brand"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-brand-btn-${brand.id}`}
                            onClick={() => {
                              setDeleteError(null);
                              setBrandToDelete(brand);
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Brand"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT BRAND MODAL */}
      {showModal && (
        <div
          id="brand-form-modal"
          className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-xl w-full border border-neutral-200 shadow-2xl overflow-hidden animate-fadeIn my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500 text-neutral-950">
                  <Award className="w-4 h-4 font-bold" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-white">
                    {editingBrand ? `Edit Brand: ${editingBrand.name}` : 'Create New Brand'}
                  </h3>
                  <p className="text-[11px] text-neutral-400">PostgreSQL Authoritative Brand Record</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-neutral-200 bg-neutral-50 px-6 pt-2 gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'general'
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>General</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('media')}
                className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'media'
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Logo & Web</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'seo'
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>SEO Schema</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBrand}>
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                {/* TAB 1: GENERAL */}
                {activeTab === 'general' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1">
                        Brand Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="brand-name-input"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. Apple, Sony, Nike"
                        className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10 ${
                          formErrors.name ? 'border-rose-400 bg-rose-50/30' : 'border-neutral-200'
                        }`}
                      />
                      {formErrors.name && (
                        <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-neutral-800">
                          URL Slug <span className="text-rose-500">*</span>
                        </label>
                        {!editingBrand && (
                          <label className="text-[11px] text-neutral-500 flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={autoSlug}
                              onChange={(e) => setAutoSlug(e.target.checked)}
                              className="rounded text-neutral-900 text-xs"
                            />
                            <span>Auto-generate from Name</span>
                          </label>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-mono">
                          /brands/
                        </span>
                        <input
                          id="brand-slug-input"
                          type="text"
                          value={formData.slug}
                          onChange={(e) => {
                            setAutoSlug(false);
                            setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                            if (formErrors.slug) setFormErrors(prev => ({ ...prev, slug: '' }));
                          }}
                          placeholder="e.g. apple"
                          className={`w-full pl-20 pr-3 py-2 text-xs font-mono border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10 ${
                            formErrors.slug ? 'border-rose-400 bg-rose-50/30' : 'border-neutral-200'
                          }`}
                        />
                      </div>
                      {formErrors.slug && (
                        <p className="text-[11px] text-rose-500 mt-1">{formErrors.slug}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1">
                        Brand Overview & History
                      </label>
                      <textarea
                        id="brand-description-input"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Short brand summary, history, and craftsmanship standards..."
                        className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Sort Order Weight
                        </label>
                        <input
                          id="brand-sort-order-input"
                          type="number"
                          min="0"
                          value={formData.sort_order}
                          onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10"
                        />
                        <span className="text-[10px] text-neutral-400 mt-0.5 block">
                          Lower values (0, 1, 2) display first
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Visibility Status
                        </label>
                        <div className="flex items-center gap-3 mt-2">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                            <input
                              type="radio"
                              name="is_active"
                              checked={formData.is_active === true}
                              onChange={() => setFormData(prev => ({ ...prev, is_active: true }))}
                              className="text-emerald-600"
                            />
                            <span className="text-emerald-700">Active (Public)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                            <input
                              type="radio"
                              name="is_active"
                              checked={formData.is_active === false}
                              onChange={() => setFormData(prev => ({ ...prev, is_active: false }))}
                              className="text-neutral-600"
                            />
                            <span className="text-neutral-600">Hidden (Disabled)</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: MEDIA & WEBSITE */}
                {activeTab === 'media' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1">
                        Logo Image URL
                      </label>
                      <input
                        id="brand-logo-input"
                        type="url"
                        value={formData.logo_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                        placeholder="https://example.com/brand-logo.png"
                        className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10 ${
                          formErrors.logo_url ? 'border-rose-400' : 'border-neutral-200'
                        }`}
                      />
                      {formErrors.logo_url && (
                        <p className="text-[11px] text-rose-500 mt-1">{formErrors.logo_url}</p>
                      )}
                    </div>

                    {/* Logo Preview */}
                    {formData.logo_url && (
                      <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-white border border-neutral-200 p-2 flex items-center justify-center overflow-hidden">
                          <img
                            src={formData.logo_url}
                            alt="Logo preview"
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-neutral-800 block">Logo Preview</span>
                          <span className="text-[11px] text-neutral-400 block break-all">{formData.logo_url}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1">
                        Official Website URL
                      </label>
                      <input
                        id="brand-website-input"
                        type="url"
                        value={formData.website_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                        placeholder="https://www.brand.com"
                        className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10 ${
                          formErrors.website_url ? 'border-rose-400' : 'border-neutral-200'
                        }`}
                      />
                      {formErrors.website_url && (
                        <p className="text-[11px] text-rose-500 mt-1">{formErrors.website_url}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: SEO */}
                {activeTab === 'seo' && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-neutral-800">
                          SEO Meta Title
                        </label>
                        <span className={`text-[10px] font-mono ${
                          formData.seo_title.length > 60 ? 'text-amber-600 font-bold' : 'text-neutral-400'
                        }`}>
                          {formData.seo_title.length}/60 chars (Recommended)
                        </span>
                      </div>
                      <input
                        id="brand-seo-title-input"
                        type="text"
                        maxLength={255}
                        value={formData.seo_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                        placeholder={formData.name ? `${formData.name} Products, Warranty & Deals | Buy Online` : 'Brand Meta Title'}
                        className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-neutral-800">
                          SEO Meta Description
                        </label>
                        <span className={`text-[10px] font-mono ${
                          formData.seo_description.length > 160 ? 'text-amber-600 font-bold' : 'text-neutral-400'
                        }`}>
                          {formData.seo_description.length}/160 chars (Recommended)
                        </span>
                      </div>
                      <textarea
                        id="brand-seo-description-input"
                        rows={3}
                        maxLength={500}
                        value={formData.seo_description}
                        onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                        placeholder="Shop authentic brand products with manufacturer warranty, fast delivery, and hassle-free returns."
                        className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10"
                      />
                    </div>

                    {/* Google Search Snippet Preview */}
                    <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                        Search Result Preview
                      </span>
                      <div className="space-y-1">
                        <span className="text-[11px] text-neutral-500 block truncate">
                          https://example.com/brands/{formData.slug || 'brand-slug'}
                        </span>
                        <h4 className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer truncate">
                          {formData.seo_title || formData.name || 'Brand Meta Title'}
                        </h4>
                        <p className="text-xs text-neutral-600 line-clamp-2">
                          {formData.seo_description || formData.description || 'Brand description will appear here in search engine indexes.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  id="save-brand-submit-btn"
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to PostgreSQL...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>{editingBrand ? 'Update Brand' : 'Create Brand'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAFE DELETE CONFIRMATION DIALOG */}
      {brandToDelete && (
        <div
          id="delete-brand-modal"
          className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full border border-neutral-200 shadow-2xl p-6 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-neutral-900 text-center">
              Delete Brand "{brandToDelete.name}"?
            </h3>

            <p className="text-xs text-neutral-500 text-center mt-2 leading-relaxed">
              Are you sure you want to permanently delete this brand from PostgreSQL? This action cannot be undone.
            </p>

            {/* Product Protection Notice */}
            {(brandToDelete.products_count || 0) > 0 && (
              <div className="mt-4 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Referential Integrity Protection:</span>
                  <span>
                    This brand currently has <strong>{brandToDelete.products_count}</strong> associated product(s). To protect your catalog from accidental data loss, the database will reject this deletion until all products are reassigned or removed.
                  </span>
                </div>
              </div>
            )}

            {deleteError && (
              <div className="mt-3 p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setBrandToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-brand-btn"
                type="button"
                onClick={handleDeleteBrand}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
