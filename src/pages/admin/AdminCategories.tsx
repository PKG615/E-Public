import React, { useEffect, useState, useMemo } from 'react';
import {
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  X,
  Folder,
  CornerDownRight,
  Eye,
  EyeOff,
  Search,
  Image as ImageIcon,
  Layers,
  Globe,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Category } from '../../types';
import { api } from '../../services/api';

interface CategoryFormData {
  id?: number;
  name: string;
  slug: string;
  description: string;
  parent_id: number | null;
  image: string;
  banner: string;
  sort_order: number;
  is_active: boolean;
  seo_title: string;
  seo_description: string;
}

const emptyForm: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  parent_id: null,
  image: '',
  banner: '',
  sort_order: 0,
  is_active: true,
  seo_title: '',
  seo_description: ''
};

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');
  const [expandedParents, setExpandedParents] = useState<Record<number, boolean>>({});

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
        // Expand all parents by default
        const initExpanded: Record<number, boolean> = {};
        res.data.forEach((c) => {
          if (!c.parent_id) initExpanded[c.id] = true;
        });
        setExpandedParents(initExpanded);
      }
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      showToast('error', 'Failed to retrieve categories from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Compute Root Categories & Flattened List
  const rootCategories = useMemo(() => {
    return categories.filter((c) => c.parent_id === null);
  }, [categories]);

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && c.is_active) ||
        (statusFilter === 'inactive' && !c.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [categories, searchQuery, statusFilter]);

  // Open Create Modal
  const handleOpenCreate = (parentId: number | null = null) => {
    setEditingCategory(null);
    setFormErrors({});
    setFormData({
      ...emptyForm,
      parent_id: parentId,
      sort_order: categories.length + 1
    });
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormErrors({});
    setFormData({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      parent_id: cat.parent_id || null,
      image: cat.image || cat.image_url || '',
      banner: cat.banner || '',
      sort_order: cat.sort_order ?? cat.display_order ?? 0,
      is_active: cat.is_active,
      seo_title: cat.seo_title || '',
      seo_description: cat.seo_description || ''
    });
    setShowModal(true);
  };

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    const updated: Partial<CategoryFormData> = { name: val };
    if (!editingCategory || !formData.slug) {
      updated.slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    setFormData((prev) => ({ ...prev, ...updated }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Category name must be at least 2 characters.';
    }
    if (!formData.slug.trim()) {
      errors.slug = 'Slug is required.';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = 'Slug must only contain lowercase letters, numbers, and hyphens.';
    }
    if (editingCategory && formData.parent_id === editingCategory.id) {
      errors.parent_id = 'A category cannot be its own parent.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setActionLoading(true);
    try {
      const payload: Partial<Category> = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
        parent_id: formData.parent_id,
        image: formData.image.trim() || undefined,
        image_url: formData.image.trim() || undefined,
        banner: formData.banner.trim() || undefined,
        sort_order: Number(formData.sort_order) || 0,
        display_order: Number(formData.sort_order) || 0,
        is_active: formData.is_active,
        seo_title: formData.seo_title.trim() || undefined,
        seo_description: formData.seo_description.trim() || undefined
      };

      if (editingCategory) {
        const res = await api.admin.updateCategory(editingCategory.id, payload);
        if (res.success) {
          showToast('success', `Category "${formData.name}" updated successfully.`);
          setShowModal(false);
          await loadCategories();
        } else {
          showToast('error', res.message || 'Failed to update category.');
        }
      } else {
        const res = await api.admin.createCategory(payload);
        if (res.success) {
          showToast('success', `Category "${formData.name}" created successfully.`);
          setShowModal(false);
          await loadCategories();
        } else {
          showToast('error', res.message || 'Failed to create category.');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Operation failed.';
      showToast('error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle category active state directly
  const handleToggleActive = async (cat: Category) => {
    try {
      const updatedStatus = !cat.is_active;
      const res = await api.admin.updateCategory(cat.id, { is_active: updatedStatus });
      if (res.success) {
        showToast(
          'success',
          `Category "${cat.name}" is now ${updatedStatus ? 'Active' : 'Disabled'}.`
        );
        setCategories((prev) =>
          prev.map((item) => (item.id === cat.id ? { ...item, is_active: updatedStatus } : item))
        );
      } else {
        showToast('error', res.message || 'Status update failed.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to toggle status.';
      showToast('error', msg);
    }
  };

  // Delete category with safe checks
  const handleDelete = async (cat: Category) => {
    if (cat.products_count && cat.products_count > 0) {
      alert(
        `Cannot delete "${cat.name}" because it has ${cat.products_count} active product(s) linked in the database. Please reassign products first.`
      );
      return;
    }

    const subCount = cat.subcategories ? cat.subcategories.length : 0;
    const confirmMsg = subCount > 0
      ? `Delete category "${cat.name}"? Its ${subCount} subcategory/subcategories will be safely preserved and moved to top-level.`
      : `Are you sure you want to permanently delete category "${cat.name}"?`;

    if (window.confirm(confirmMsg)) {
      setActionLoading(true);
      try {
        const res = await api.admin.deleteCategory(cat.id);
        if (res.success) {
          showToast('success', `Category "${cat.name}" deleted successfully.`);
          await loadCategories();
        } else {
          showToast('error', res.message || 'Failed to delete category.');
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Failed to delete category.';
        showToast('error', msg);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedParents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div id="category-management-module" className="space-y-6">
      {/* Toast Alert */}
      {notification && (
        <div
          id="category-toast-notification"
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="text-xs font-semibold">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-neutral-400 hover:text-neutral-700 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neutral-900 text-white shadow-xs">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
                Category & Subcategory Management
              </h2>
              <p className="text-xs text-neutral-500">
                Authoritative  images, sorting, and storefront visibility
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="refresh-categories-btn"
            onClick={loadCategories}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            title="Reload from API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <div className="inline-flex p-1 bg-neutral-100 rounded-lg border border-neutral-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'tree' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Tree Hierarchy
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'flat' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All Categories ({categories.length})
            </button>
          </div>

          <button
            id="btn-create-category"
            onClick={() => handleOpenCreate(null)}
            className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="category-search-input"
            type="text"
            placeholder="Search by name, slug, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 bg-neutral-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-neutral-500 font-medium">Status:</span>
          <select
            id="category-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-neutral-50 font-medium text-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
          >
            <option value="all">All ({categories.length})</option>
            <option value="active">Active Only ({categories.filter((c) => c.is_active).length})</option>
            <option value="inactive">Disabled ({categories.filter((c) => !c.is_active).length})</option>
          </select>
        </div>
      </div>

      {/* Main Categories Display */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-neutral-600">Loading categories from FastAPI...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <FolderTree className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-neutral-900">No Categories Found</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Get started by creating your primary department categories, such as Electronics, Fashion, or Home & Living.
          </p>
          <button
            onClick={() => handleOpenCreate(null)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold"
          >
            <Plus className="w-4 h-4" /> Create Category
          </button>
        </div>
      ) : viewMode === 'tree' ? (
        /* HIERARCHY TREE VIEW */
        <div className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-neutral-50/80 border-b border-neutral-200/80 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-600">
            <span>Hierarchy & Nesting Structure</span>
            <span>Total Root Departments: {rootCategories.length}</span>
          </div>

          <div className="divide-y divide-neutral-100 p-3">
            {rootCategories.map((root) => {
              const isExpanded = expandedParents[root.id] !== false;
              const subcats = root.subcategories || [];

              return (
                <div key={root.id} className="p-3.5 space-y-3 rounded-xl transition-colors hover:bg-neutral-50/50">
                  {/* Root Category Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <button
                        onClick={() => toggleExpand(root.id)}
                        className="text-neutral-400 hover:text-neutral-800 p-1 rounded-md transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      {/* Thumbnail Image */}
                      {root.image || root.image_url ? (
                        <img
                          src={root.image || root.image_url}
                          alt={root.name}
                          className="w-10 h-10 rounded-lg object-cover border border-neutral-200 shrink-0 bg-neutral-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 font-bold">
                          <Folder className="w-5 h-5" />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-neutral-900">{root.name}</h4>
                          <span className="text-[11px] font-mono bg-neutral-100 px-2 py-0.5 rounded-md text-neutral-600 border border-neutral-200/60">
                            /{root.slug}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            Order: {root.sort_order ?? root.display_order ?? 0}
                          </span>
                          {root.banner && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" /> Banner
                            </span>
                          )}
                          {root.seo_title && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              <Globe className="w-3 h-3" /> SEO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                          {root.description || 'Top-level department'}
                        </p>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* Active Toggle */}
                      <button
                        onClick={() => handleToggleActive(root)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                          root.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-300 hover:bg-neutral-200'
                        }`}
                      >
                        {root.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{root.is_active ? 'Active' : 'Disabled'}</span>
                      </button>

                      {/* Add Subcategory */}
                      <button
                        onClick={() => handleOpenCreate(root.id)}
                        className="text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200 transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Subcategory</span>
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEdit(root)}
                        className="text-neutral-600 hover:text-neutral-900 p-1.5 rounded-md hover:bg-neutral-100 border border-neutral-200 transition-colors"
                        title="Edit category details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(root)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 border border-red-200 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories Tree Section */}
                  {isExpanded && subcats.length > 0 && (
                    <div className="ml-6 sm:ml-10 pl-4 border-l-2 border-neutral-200 space-y-2 pt-1">
                      {subcats.map((sub) => {
                        const fullSub = categories.find((c) => c.id === sub.id) || sub;
                        return (
                          <div
                            key={sub.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-neutral-50/90 border border-neutral-200/70 hover:border-neutral-300 transition-all text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <CornerDownRight className="w-4 h-4 text-neutral-400 shrink-0" />

                              {fullSub.image || fullSub.image_url ? (
                                <img
                                  src={fullSub.image || fullSub.image_url}
                                  alt={sub.name}
                                  className="w-7 h-7 rounded-md object-cover border border-neutral-200 shrink-0 bg-white"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-md bg-neutral-200 text-neutral-600 flex items-center justify-center shrink-0 font-bold">
                                  <Folder className="w-3.5 h-3.5" />
                                </div>
                              )}

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-neutral-900">{sub.name}</span>
                                  <span className="font-mono text-[10px] text-neutral-500 bg-white px-1.5 py-0.5 rounded border border-neutral-200">
                                    /{sub.slug}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                    Order: {sub.sort_order ?? sub.display_order ?? 0}
                                  </span>
                                  {fullSub.seo_title && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                      SEO
                                    </span>
                                  )}
                                </div>
                                {fullSub.description && (
                                  <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                                    {fullSub.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                              {/* Status Toggle */}
                              <button
                                onClick={() => handleToggleActive(fullSub as Category)}
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 border ${
                                  fullSub.is_active
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-neutral-100 text-neutral-500 border-neutral-300'
                                }`}
                              >
                                {fullSub.is_active ? 'Active' : 'Disabled'}
                              </button>

                              {/* Edit Subcategory */}
                              <button
                                onClick={() => handleOpenEdit(fullSub as Category)}
                                className="p-1 rounded text-neutral-600 hover:text-neutral-900 hover:bg-white border border-transparent hover:border-neutral-200 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Subcategory */}
                              <button
                                onClick={() => handleDelete(fullSub as Category)}
                                className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* FLAT TABLE VIEW */
        <div className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Image</th>
                  <th className="py-3 px-4">Name & Slug</th>
                  <th className="py-3 px-4">Parent Category</th>
                  <th className="py-3 px-4">Sort Order</th>
                  <th className="py-3 px-4">SEO Config</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
                {filteredCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-4">
                      {c.image || c.image_url ? (
                        <img
                          src={c.image || c.image_url}
                          alt={c.name}
                          className="w-9 h-9 rounded-lg object-cover border border-neutral-200 bg-neutral-100"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-neutral-100 text-neutral-400 flex items-center justify-center border border-neutral-200">
                          <Folder className="w-4 h-4" />
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900">{c.name}</div>
                      <div className="font-mono text-[10px] text-neutral-500">/{c.slug}</div>
                      {c.description && (
                        <div className="text-[11px] text-neutral-400 line-clamp-1">{c.description}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {c.parent_name ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-[11px] font-semibold">
                          <CornerDownRight className="w-3 h-3 text-neutral-400" />
                          {c.parent_name}
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-[11px]">Top Level (Root)</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono font-bold bg-neutral-100 px-2 py-0.5 rounded text-neutral-700">
                        {c.sort_order ?? c.display_order ?? 0}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {c.seo_title ? (
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-semibold text-neutral-800 line-clamp-1">
                            {c.seo_title}
                          </span>
                          <span className="text-[10px] text-neutral-400 line-clamp-1">
                            {c.seo_description || 'No description set'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral-400 text-[11px]">Default template</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 border ${
                          c.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-300'
                        }`}
                      >
                        {c.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{c.is_active ? 'Active' : 'Disabled'}</span>
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-1.5 rounded text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-neutral-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-800">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-neutral-900">
                  {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {/* Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mobiles, Laptops, Accessories"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-neutral-900 focus:outline-hidden focus:ring-1 ${
                      formErrors.name ? 'border-red-400 focus:ring-red-500' : 'border-neutral-300 focus:ring-neutral-900'
                    }`}
                  />
                  {formErrors.name && <p className="text-[11px] text-red-500 mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. mobiles, laptops, accessories"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().trim() })}
                    className={`w-full border rounded-lg px-3 py-2 text-neutral-900 font-mono focus:outline-hidden focus:ring-1 ${
                      formErrors.slug ? 'border-red-400 focus:ring-red-500' : 'border-neutral-300 focus:ring-neutral-900'
                    }`}
                  />
                  {formErrors.slug && <p className="text-[11px] text-red-500 mt-1">{formErrors.slug}</p>}
                </div>
              </div>

              {/* Parent Category & Sort Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Parent Category</label>
                  <select
                    value={formData.parent_id === null ? '' : formData.parent_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        parent_id: e.target.value ? parseInt(e.target.value, 10) : null
                      })
                    }
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 bg-white"
                  >
                    <option value="">None (Top-Level Parent Department)</option>
                    {categories
                      .filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.parent_name ? `${c.parent_name} → ${c.name}` : c.name}
                        </option>
                      ))}
                  </select>
                  {formErrors.parent_id && (
                    <p className="text-[11px] text-red-500 mt-1">{formErrors.parent_id}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Sort Order / Display Weight
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900"
                    placeholder="0 = first"
                  />
                  <p className="text-[10px] text-neutral-400 mt-0.5">Lower numbers display first in navigation.</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Category Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900"
                  placeholder="Clear description displayed on customer category landing page"
                />
              </div>

              {/* Image & Banner URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Thumbnail / Cover Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900"
                  />
                  {formData.image && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-8 h-8 rounded border object-cover"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                      <span className="text-[10px] text-neutral-400">Thumbnail Preview</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Category Header Banner URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.banner}
                    onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900"
                  />
                  {formData.banner && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <img
                        src={formData.banner}
                        alt="Banner Preview"
                        className="w-16 h-8 rounded border object-cover"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                      <span className="text-[10px] text-neutral-400">Banner Preview</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                <div>
                  <span className="font-bold text-neutral-900 block">Enable Public Storefront Visibility</span>
                  <span className="text-[11px] text-neutral-500">
                    When disabled, this category and its direct links will be hidden from customer navigation.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* SEO Meta Fields */}
              <div className="pt-2 border-t border-neutral-200/80 space-y-3">
                <div className="flex items-center gap-1.5 text-neutral-800 font-bold">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>Search Engine Optimization (SEO Metadata)</span>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-neutral-700">SEO Meta Title</label>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {formData.seo_title.length}/60 chars recommended
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={255}
                    placeholder="e.g. Shop Laptops & Workstations Online | Best Prices"
                    value={formData.seo_title}
                    onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-neutral-700">SEO Meta Description</label>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {formData.seo_description.length}/160 chars recommended
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={500}
                    placeholder="Brief description for Google search snippets..."
                    value={formData.seo_description}
                    onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
