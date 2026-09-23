import React, { useEffect, useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Check, 
  X, 
  Edit, 
  Trash2, 
  RefreshCw, 
  AlertCircle,
  ExternalLink,
  Filter,
  RotateCcw,
  Tag,
  Info,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { Product, Category, Brand } from '../../types';
import { api } from '../../services/api';
import { ProductMediaManager } from '../../components/admin/ProductMediaManager';

interface ProductFormData {
  id?: number;
  name: string;
  slug: string;
  sku: string;
  category_id: number;
  brand_id?: number | null;
  price: number;
  mrp: number;
  tax_percent: number;
  stock: number;
  status: 'draft' | 'active' | 'inactive';
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  is_flash_sale: boolean;
  sort_order: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  short_description: string;
  description: string;
  image_url: string;
  warranty: string;
  return_policy: string;
  seo_title: string;
  seo_description: string;
}

const initialFormData: ProductFormData = {
  name: '',
  slug: '',
  sku: '',
  category_id: 0,
  brand_id: null,
  price: 999,
  mrp: 1499,
  tax_percent: 18,
  stock: 20,
  status: 'active',
  is_featured: false,
  is_new_arrival: false,
  is_best_seller: false,
  is_flash_sale: false,
  sort_order: 0,
  weight: 0.5,
  length: 15,
  width: 10,
  height: 5,
  short_description: '',
  description: '',
  image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
  warranty: '1 Year Manufacturer Warranty',
  return_policy: '7-day replacement policy',
  seo_title: '',
  seo_description: ''
};

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStock, setSelectedStock] = useState<string>('all');

  // Quick inline price/stock edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editMrp, setEditMrp] = useState<string>('');
  const [editStock, setEditStock] = useState<string>('');
  const [savingId, setSavingId] = useState<number | null>(null);

  // Comprehensive Create / Edit Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'content' | 'images' | 'shipping' | 'seo'>('basic');

  // Dedicated Quick Media Management Modal
  const [mediaModalProduct, setMediaModalProduct] = useState<Product | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, bRes] = await Promise.all([
        api.admin.getProducts({ 
          search: search || undefined,
          category_id: selectedCategory !== 'all' ? parseInt(selectedCategory, 10) : undefined,
          brand_id: selectedBrand !== 'all' ? parseInt(selectedBrand, 10) : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          stock_filter: selectedStock !== 'all' ? selectedStock : undefined,
          limit: 100 
        }),
        api.categories.getAll(),
        api.brands.getAll()
      ]);

      if (pRes.success && pRes.data) {
        setProducts(pRes.data.items);
      }
      if (cRes.success && cRes.data) {
        setCategories(cRes.data);
      }
      if (bRes.success && bRes.data) {
        setBrands(bRes.data);
      }
    } catch (err: any) {
      console.error('Failed to load products data:', err);
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to connect to PostgreSQL backend.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory, selectedBrand, selectedStatus, selectedStock]);

  // Dynamic calculated discount for modal preview
  const previewDiscount = useMemo(() => {
    if (formData.mrp > 0 && formData.price > 0 && formData.mrp >= formData.price) {
      return Math.round(((formData.mrp - formData.price) / formData.mrp) * 100);
    }
    return 0;
  }, [formData.mrp, formData.price]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsEditing(false);
    const defaultCatId = categories.length > 0 ? categories[0].id : 0;
    setFormData({
      ...initialFormData,
      category_id: defaultCatId,
      sku: `SKU-${Date.now().toString().slice(-6)}`
    });
    setFormErrors({});
    setActiveTab('basic');
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (prod: Product) => {
    setIsEditing(true);
    setFormData({
      id: prod.id,
      name: prod.name,
      slug: prod.slug,
      sku: prod.sku,
      category_id: prod.category_id,
      brand_id: prod.brand_id || null,
      price: prod.price,
      mrp: prod.mrp,
      tax_percent: prod.tax_percent || 18,
      stock: prod.stock,
      status: (prod.status as any) || (prod.is_active ? 'active' : 'inactive'),
      is_featured: prod.is_featured,
      is_new_arrival: !!prod.is_new_arrival,
      is_best_seller: prod.is_best_seller,
      is_flash_sale: prod.is_flash_sale,
      sort_order: prod.sort_order || 0,
      weight: prod.weight || 0.5,
      length: prod.length || 15,
      width: prod.width || 10,
      height: prod.height || 5,
      short_description: prod.short_description || '',
      description: prod.description || '',
      image_url: prod.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      warranty: prod.warranty || prod.warranty_info || '',
      return_policy: prod.return_policy || '7-day replacement policy',
      seo_title: prod.seo_title || prod.meta_title || '',
      seo_description: prod.seo_description || prod.meta_description || ''
    });
    setFormErrors({});
    setActiveTab('basic');
    setModalOpen(true);
  };

  // Auto-generate Slug from title
  const handleGenerateSlug = () => {
    if (formData.name) {
      const generated = formData.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug: generated }));
    }
  };

  // Quick Inline Edit Save
  const handleSaveQuickEdit = async (prodId: number) => {
    const p = parseFloat(editPrice);
    const m = parseFloat(editMrp);
    const s = parseInt(editStock, 10);

    if (isNaN(p) || p <= 0) {
      setFeedback({ type: 'error', message: 'Selling price must be greater than zero.' });
      return;
    }
    if (isNaN(m) || m < p) {
      setFeedback({ type: 'error', message: 'MRP must be greater than or equal to selling price.' });
      return;
    }
    if (isNaN(s) || s < 0) {
      setFeedback({ type: 'error', message: 'Stock cannot be negative.' });
      return;
    }

    setSavingId(prodId);
    try {
      await api.admin.updatePrice(prodId, p, m);
      await api.admin.updateStock(prodId, s);
      setEditingId(null);
      setFeedback({ type: 'success', message: 'Price and stock updated in PostgreSQL.' });
      await loadData();
    } catch (err: any) {
      setFeedback({ 
        type: 'error', 
        message: err?.response?.data?.message || 'Failed to update product.' 
      });
    } finally {
      setSavingId(null);
    }
  };

  // Submit Modal Form (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Product title is required';
    if (!formData.category_id || formData.category_id <= 0) errors.category_id = 'Valid category is required';
    if (!formData.sku.trim()) errors.sku = 'SKU is required';
    if (formData.price <= 0) errors.price = 'Selling price must be greater than 0';
    if (formData.mrp < formData.price) errors.mrp = 'MRP cannot be less than selling price';
    if (formData.stock < 0) errors.stock = 'Stock cannot be negative';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setActiveTab('basic');
      return;
    }

    setActionLoading(true);
    setFormErrors({});

    try {
      const payload: any = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || undefined,
        sku: formData.sku.trim().toUpperCase(),
        category_id: formData.category_id,
        brand_id: formData.brand_id || null,
        price: formData.price,
        mrp: formData.mrp,
        tax_percent: formData.tax_percent,
        stock: formData.stock,
        status: formData.status,
        is_active: formData.status === 'active',
        is_featured: formData.is_featured,
        is_new_arrival: formData.is_new_arrival,
        is_best_seller: formData.is_best_seller,
        is_flash_sale: formData.is_flash_sale,
        sort_order: formData.sort_order,
        weight: formData.weight,
        length: formData.length,
        width: formData.width,
        height: formData.height,
        short_description: formData.short_description.trim() || undefined,
        description: formData.description.trim() || `${formData.name} premium retail item.`,
        warranty: formData.warranty.trim() || undefined,
        return_policy: formData.return_policy.trim() || undefined,
        seo_title: formData.seo_title.trim() || undefined,
        seo_description: formData.seo_description.trim() || undefined,
        images: formData.image_url ? [{ image_url: formData.image_url, is_primary: true, display_order: 0 }] : []
      };

      if (isEditing && formData.id) {
        const res = await api.admin.updateProduct(formData.id, payload);
        if (res.success) {
          setFeedback({ type: 'success', message: `Product '${formData.name}' updated successfully in PostgreSQL.` });
          setModalOpen(false);
          await loadData();
        }
      } else {
        const res = await api.admin.createProduct(payload);
        if (res.success) {
          setFeedback({ type: 'success', message: `Product '${formData.name}' created successfully in PostgreSQL.` });
          setModalOpen(false);
          await loadData();
        }
      }
    } catch (err: any) {
      console.error('Save product error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Server validation error occurred.';
      setFeedback({ type: 'error', message: msg });
      setFormErrors({ general: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Safe Deletion
  const handleDeleteProduct = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from PostgreSQL?\n\nIf this product is linked to customer orders, deletion will be blocked to maintain audit integrity.`)) {
      return;
    }

    try {
      const res = await api.admin.deleteProduct(id);
      if (res.success) {
        setFeedback({ type: 'success', message: `Product "${name}" deleted from database.` });
        await loadData();
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      const msg = err?.response?.data?.message || 'Failed to delete product. It may be referenced in existing orders.';
      setFeedback({ type: 'error', message: msg });
    }
  };

  // Stats
  const activeCount = products.filter(p => p.status === 'active' || p.is_active).length;
  const draftOrInactiveCount = products.length - activeCount;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  return (
    <div className="space-y-6">
      
      {/* Feedback banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Core Product Management</h2>
            {/* <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
              PostgreSQL Ground Truth
            </span> */}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Server-authoritative pricing, normalized SKUs, category & brand bindings, inventory, and lifecycle states.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <p className="text-[11px] font-semibold text-neutral-500">Total Products</p>
          <p className="text-2xl font-black text-neutral-900 mt-1">{products.length}</p>
          <span className="text-[10px] text-neutral-400">All registered SKUs</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-600">Active on Storefront</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</p>
          <span className="text-[10px] text-emerald-600/70">Publicly visible</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-600">Drafts / Inactive</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{draftOrInactiveCount}</p>
          <span className="text-[10px] text-amber-600/70">Internal or hidden</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <p className="text-[11px] font-semibold text-red-600">Low / Out of Stock</p>
          <p className="text-2xl font-black text-red-700 mt-1">{lowStockCount + outOfStockCount}</p>
          <span className="text-[10px] text-red-600/70">{outOfStockCount} out of stock, {lowStockCount} low</span>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, SKU, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-neutral-50/50"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
            >
              <option value="all">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="draft">Draft Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs text-neutral-500">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-neutral-700">{products.length} Products match criteria</span>
            {(selectedCategory !== 'all' || selectedBrand !== 'all' || selectedStatus !== 'all' || search) && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                  setSelectedBrand('all');
                  setSelectedStatus('all');
                  setSelectedStock('all');
                }}
                className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-400">Stock filter:</span>
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="text-xs border border-neutral-200 rounded px-2 py-1 bg-white text-neutral-700"
            >
              <option value="all">All Stock Levels</option>
              <option value="in_stock">In Stock (&gt; 0)</option>
              <option value="low_stock">Low Stock (1-5)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-4">Category & Brand</th>
                <th className="py-3 px-4">Selling Price (₹)</th>
                <th className="py-3 px-4">MRP (₹)</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status & Flags</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-neutral-400" />
                    <span>Loading products from PostgreSQL...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    <Package className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                    <p className="font-semibold text-neutral-700">No products match your current filters</p>
                    <p className="text-xs text-neutral-400 mt-1">Try clearing your filters or create a new product above.</p>
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const isInlineEditing = editingId === prod.id;
                  const img = prod.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80';
                  const prodStatus = prod.status || (prod.is_active ? 'active' : 'inactive');
                  const discountPct = prod.discount_percentage ?? prod.discount_percent ?? (
                    prod.mrp > prod.price ? Math.round(((prod.mrp - prod.price) / prod.mrp) * 100) : 0
                  );

                  return (
                    <tr key={prod.id} className="hover:bg-neutral-50/80 transition-colors">
                      {/* Product details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={img}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-lg object-cover bg-neutral-100 border border-neutral-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-neutral-900 truncate max-w-xs">{prod.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                                {prod.sku}
                              </span>
                              <span className="text-[10px] text-neutral-400 truncate max-w-[120px]">
                                /{prod.slug}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                            {prod.category_name || 'Category'}
                          </span>
                          {prod.brand_name && (
                            <div className="text-[11px] text-neutral-500 font-medium flex items-center gap-1">
                              <Tag className="w-3 h-3 text-neutral-400" />
                              <span>{prod.brand_name}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Price (Inline Editable) */}
                      <td className="py-3.5 px-4">
                        {isInlineEditing ? (
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-24 border border-emerald-500 rounded px-2 py-1 text-xs font-bold text-neutral-900 bg-emerald-50/40"
                          />
                        ) : (
                          <div>
                            <span className="font-extrabold text-neutral-900 block">
                              ₹{prod.price.toLocaleString('en-IN')}
                            </span>
                            {discountPct > 0 && (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                                {discountPct}% off
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* MRP (Inline Editable) */}
                      <td className="py-3.5 px-4">
                        {isInlineEditing ? (
                          <input
                            type="number"
                            value={editMrp}
                            onChange={(e) => setEditMrp(e.target.value)}
                            className="w-24 border border-neutral-300 rounded px-2 py-1 text-xs text-neutral-700"
                          />
                        ) : (
                          <span className="text-neutral-500 line-through">
                            ₹{prod.mrp.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      {/* Stock (Inline Editable) */}
                      <td className="py-3.5 px-4">
                        {isInlineEditing ? (
                          <input
                            type="number"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            className="w-16 border border-neutral-300 rounded px-2 py-1 text-xs font-bold text-neutral-900"
                          />
                        ) : (
                          <div>
                            <span className={`font-semibold ${
                              prod.stock <= 0 
                                ? 'text-red-600' 
                                : prod.stock <= 5 
                                ? 'text-amber-600' 
                                : 'text-neutral-700'
                            }`}>
                              {prod.stock} units
                            </span>
                            <span className={`block text-[10px] font-bold ${
                              prod.stock <= 0 
                                ? 'text-red-500' 
                                : prod.stock <= 5 
                                ? 'text-amber-500' 
                                : 'text-emerald-600'
                            }`}>
                              {prod.stock <= 0 ? 'Out of Stock' : prod.stock <= 5 ? 'Low Stock' : 'In Stock'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status & Flags */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            prodStatus === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : prodStatus === 'draft'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              prodStatus === 'active' ? 'bg-emerald-500' : prodStatus === 'draft' ? 'bg-amber-500' : 'bg-neutral-400'
                            }`} />
                            {prodStatus}
                          </span>
                          
                          <div className="flex flex-wrap gap-1">
                            {prod.is_featured && (
                              <span className="text-[9px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded border border-purple-100">
                                Featured
                              </span>
                            )}
                            {prod.is_new_arrival && (
                              <span className="text-[9px] font-bold bg-sky-50 text-sky-700 px-1.5 py-0.2 rounded border border-sky-100">
                                New
                              </span>
                            )}
                            {prod.is_best_seller && (
                              <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded border border-amber-100">
                                Best Seller
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isInlineEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveQuickEdit(prod.id)}
                              disabled={savingId === prod.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-md transition-colors"
                              title="Save to PostgreSQL"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 p-1.5 rounded-md transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`/product/${prod.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
                              title="View Live Storefront Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => {
                                setEditingId(prod.id);
                                setEditPrice(prod.price.toString());
                                setEditMrp(prod.mrp.toString());
                                setEditStock(prod.stock.toString());
                              }}
                              className="text-neutral-500 hover:text-neutral-900 p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
                              title="Quick Price/Stock Edit"
                            >
                              <span className="text-[10px] font-semibold border border-neutral-200 px-1 py-0.5 rounded bg-white">
                                ₹/Qty
                              </span>
                            </button>
                            <button
                              onClick={() => setMediaModalProduct(prod)}
                              className="text-neutral-700 hover:text-neutral-900 px-2 py-1 rounded-md hover:bg-neutral-100 transition-colors flex items-center gap-1 border border-neutral-200 bg-white"
                              title="Manage Product Images & Gallery"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-neutral-600" />
                              <span className="text-[10px] font-bold">
                                Media ({prod.images?.length || 0})
                              </span>
                            </button>
                            <button
                              onClick={() => handleOpenEdit(prod)}
                              className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-50 transition-colors"
                              title="Full Edit Details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                              title="Safe Delete from PostgreSQL"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-neutral-200 max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div>
                <h3 className="font-extrabold text-base text-neutral-900">
                  {isEditing ? `Edit Product: ${formData.name}` : 'Create New Product in PostgreSQL'}
                </h3>
                <p className="text-xs text-neutral-500">
                  {isEditing ? 'Update specifications, pricing rules, or inventory' : 'Enter authoritative product specifications & pricing'}
                </p>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg hover:bg-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-neutral-200 px-5 bg-white text-xs font-semibold gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`py-3 border-b-2 transition-colors ${
                  activeTab === 'basic' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                1. Basic Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pricing')}
                className={`py-3 border-b-2 transition-colors ${
                  activeTab === 'pricing' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                2. Pricing & Stock
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`py-3 border-b-2 transition-colors ${
                  activeTab === 'content' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                3. Descriptions
              </button>
              {isEditing && formData.id && (
                <button
                  type="button"
                  onClick={() => setActiveTab('images')}
                  className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'images' ? 'border-neutral-900 text-neutral-900 font-bold' : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-neutral-700" />
                  4. Media & Gallery
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('shipping')}
                className={`py-3 border-b-2 transition-colors ${
                  activeTab === 'shipping' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                {isEditing && formData.id ? '5. Specs & Shipping' : '4. Specs & Shipping'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className={`py-3 border-b-2 transition-colors ${
                  activeTab === 'seo' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                {isEditing && formData.id ? '6. SEO & Policies' : '5. SEO & Policies'}
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              
              {formErrors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formErrors.general}</span>
                </div>
              )}

              {/* Tab 1: Basic Info */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-neutral-800 mb-1">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AeroBook Pro 16 M3 Max"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs focus:ring-1 focus:ring-neutral-900"
                    />
                    {formErrors.name && <p className="text-red-500 text-[11px] mt-1">{formErrors.name}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-neutral-800">
                          Slug (URL Path)
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateSlug}
                          className="text-[10px] text-blue-600 hover:underline font-semibold"
                        >
                          Auto Generate
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="aerobook-pro-16"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs"
                      />
                      <span className="text-[10px] text-neutral-400">Leave empty to auto-create from title</span>
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        SKU <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="APL-AB16-M3X"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs font-mono uppercase"
                      />
                      {formErrors.sku && <p className="text-red-500 text-[11px] mt-1">{formErrors.sku}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value, 10) })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs"
                      >
                        <option value={0}>Select Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {!c.is_active ? '(Inactive)' : ''}
                          </option>
                        ))}
                      </select>
                      {formErrors.category_id && <p className="text-red-500 text-[11px] mt-1">{formErrors.category_id}</p>}
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        Brand
                      </label>
                      <select
                        value={formData.brand_id || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          brand_id: e.target.value ? parseInt(e.target.value, 10) : null 
                        })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs"
                      >
                        <option value="">No Brand Binding (Generic)</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block font-bold text-neutral-800 mb-1">Product Status</label>
                    <div className="grid grid-cols-3 gap-3">
                      <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer ${
                        formData.status === 'active' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'border-neutral-200'
                      }`}>
                        <input
                          type="radio"
                          name="status"
                          value="active"
                          checked={formData.status === 'active'}
                          onChange={() => setFormData({ ...formData, status: 'active' })}
                          className="text-emerald-600"
                        />
                        <div>
                          <span className="font-bold block">Active</span>
                          <span className="text-[10px] text-neutral-500">Live on storefront</span>
                        </div>
                      </label>
                      <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer ${
                        formData.status === 'draft' ? 'bg-amber-50 border-amber-500 text-amber-900' : 'border-neutral-200'
                      }`}>
                        <input
                          type="radio"
                          name="status"
                          value="draft"
                          checked={formData.status === 'draft'}
                          onChange={() => setFormData({ ...formData, status: 'draft' })}
                          className="text-amber-600"
                        />
                        <div>
                          <span className="font-bold block">Draft</span>
                          <span className="text-[10px] text-neutral-500">Under review</span>
                        </div>
                      </label>
                      <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer ${
                        formData.status === 'inactive' ? 'bg-neutral-100 border-neutral-400 text-neutral-900' : 'border-neutral-200'
                      }`}>
                        <input
                          type="radio"
                          name="status"
                          value="inactive"
                          checked={formData.status === 'inactive'}
                          onChange={() => setFormData({ ...formData, status: 'inactive' })}
                          className="text-neutral-600"
                        />
                        <div>
                          <span className="font-bold block">Inactive</span>
                          <span className="text-[10px] text-neutral-500">Archived/Hidden</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Pricing & Stock */}
              {activeTab === 'pricing' && (
                <div className="space-y-4">
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-600">
                    <p className="font-semibold text-neutral-800">Server-Authoritative Pricing Rules:</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      MRP must be greater than or equal to Selling Price. Discount percentage is dynamically calibrated and enforced by the PostgreSQL backend.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        Selling Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs font-bold"
                      />
                      {formErrors.price && <p className="text-red-500 text-[11px] mt-1">{formErrors.price}</p>}
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        Maximum Retail Price (MRP ₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.mrp}
                        onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs"
                      />
                      {formErrors.mrp && <p className="text-red-500 text-[11px] mt-1">{formErrors.mrp}</p>}
                    </div>
                  </div>

                  {/* Calculated Discount Card */}
                  <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-emerald-900">Calculated Discount:</span>
                    </div>
                    <span className="font-extrabold text-sm text-emerald-800">
                      {previewDiscount}% OFF (Save ₹{(formData.mrp - formData.price).toLocaleString('en-IN')})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        Stock Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs font-semibold"
                      />
                      {formErrors.stock && <p className="text-red-500 text-[11px] mt-1">{formErrors.stock}</p>}
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        Tax Percentage (GST %)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={formData.tax_percent}
                        onChange={(e) => setFormData({ ...formData, tax_percent: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs"
                      />
                    </div>
                  </div>

                  {/* Product Promotion Flags */}
                  <div className="pt-2 border-t border-neutral-200">
                    <p className="font-bold text-neutral-800 mb-2">Merchandising & Catalog Flags</p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-neutral-700">
                        <input
                          type="checkbox"
                          checked={formData.is_featured}
                          onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span>Featured on Homepage</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-neutral-700">
                        <input
                          type="checkbox"
                          checked={formData.is_new_arrival}
                          onChange={(e) => setFormData({ ...formData, is_new_arrival: e.target.checked })}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span>New Arrival Showcase</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-neutral-700">
                        <input
                          type="checkbox"
                          checked={formData.is_best_seller}
                          onChange={(e) => setFormData({ ...formData, is_best_seller: e.target.checked })}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span>Mark as Best Seller</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-neutral-700">
                        <input
                          type="checkbox"
                          checked={formData.is_flash_sale}
                          onChange={(e) => setFormData({ ...formData, is_flash_sale: e.target.checked })}
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span>Flash Sale Deal</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Content & Media */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-neutral-800 mb-1">Primary Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs"
                    />
                    {formData.image_url && (
                      <div className="mt-2 flex items-center gap-3 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                        <img 
                          src={formData.image_url} 
                          alt="Preview" 
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded object-cover border" 
                        />
                        <span className="text-[11px] text-neutral-500">Image Preview from URL</span>
                      </div>
                    )}
                    {isEditing && formData.id && (
                      <div className="mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-neutral-700 shrink-0" />
                          <span className="text-xs text-neutral-700">
                            Multi-image gallery, file uploads, alt text, and reordering are available in the <strong>Media & Gallery</strong> tab.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('images')}
                          className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-[11px] font-bold shrink-0"
                        >
                          Open Gallery
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-800 mb-1">Short Description</label>
                    <input
                      type="text"
                      maxLength={500}
                      placeholder="Brief one-line summary for product cards..."
                      value={formData.short_description}
                      onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-800 mb-1">Full Detailed Description</label>
                    <textarea
                      rows={5}
                      placeholder="Write detailed specifications, build materials, audio/display specs, and usage guidelines..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Tab 4: Product Images / Media Management */}
              {activeTab === 'images' && formData.id && (
                <div className="py-2">
                  <ProductMediaManager
                    productId={formData.id}
                    productName={formData.name}
                    onImagesChange={loadData}
                  />
                </div>
              )}

              {/* Tab 4: Shipping & Dimensions */}
              {activeTab === 'shipping' && (
                <div className="space-y-4">
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                    <p className="font-semibold text-neutral-800">Physical Metrics & Sort Priority</p>
                    <p className="text-[11px] text-neutral-500">
                      Dimensions and weight are utilized for shipping rate calculations and package compliance.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.weight || ''}
                        onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">Sort Order (Rank)</label>
                      <input
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs"
                      />
                      <span className="text-[10px] text-neutral-400">Lower numbers appear first</span>
                    </div>
                  </div>

                  <p className="font-bold text-neutral-800 pt-2 border-t border-neutral-100">Package Dimensions (cm)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-neutral-600 mb-1">Length (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.length || ''}
                        onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 mb-1">Width (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.width || ''}
                        onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 mb-1">Height (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.height || ''}
                        onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: SEO & Policies */}
              {activeTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-neutral-800 mb-1">Warranty Information</label>
                    <input
                      type="text"
                      placeholder="e.g. 1 Year Comprehensive Brand Warranty"
                      value={formData.warranty}
                      onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-800 mb-1">Return Policy</label>
                    <input
                      type="text"
                      placeholder="e.g. 7-day hassle-free replacement"
                      value={formData.return_policy}
                      onChange={(e) => setFormData({ ...formData, return_policy: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs"
                    />
                  </div>

                  <div className="pt-2 border-t border-neutral-200">
                    <label className="block font-bold text-neutral-800 mb-1">SEO Meta Title</label>
                    <input
                      type="text"
                      placeholder="Buy AeroBook Pro 16 Online at Best Price"
                      value={formData.seo_title}
                      onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-800 mb-1">SEO Meta Description</label>
                    <textarea
                      rows={2}
                      placeholder="High performance laptop with M3 Max silicon..."
                      value={formData.seo_description}
                      onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
                <div className="flex gap-2">
                  {activeTab !== 'basic' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs: Array<'basic' | 'pricing' | 'content' | 'images' | 'shipping' | 'seo'> = 
                          isEditing && formData.id 
                            ? ['basic', 'pricing', 'content', 'images', 'shipping', 'seo'] 
                            : ['basic', 'pricing', 'content', 'shipping', 'seo'];
                        const currIdx = tabs.indexOf(activeTab);
                        if (currIdx > 0) setActiveTab(tabs[currIdx - 1]);
                      }}
                      className="px-3 py-2 border border-neutral-300 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100"
                    >
                      Back
                    </button>
                  )}
                  {activeTab !== 'seo' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs: Array<'basic' | 'pricing' | 'content' | 'images' | 'shipping' | 'seo'> = 
                          isEditing && formData.id 
                            ? ['basic', 'pricing', 'content', 'images', 'shipping', 'seo'] 
                            : ['basic', 'pricing', 'content', 'shipping', 'seo'];
                        const currIdx = tabs.indexOf(activeTab);
                        if (currIdx < tabs.length - 1) setActiveTab(tabs[currIdx + 1]);
                      }}
                      className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-800 font-semibold"
                    >
                      Next Step
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs disabled:opacity-50"
                  >
                    {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{isEditing ? 'Save Changes' : 'Commit to PostgreSQL'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Dedicated Quick Media Management Modal */}
      {mediaModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div>
                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-neutral-800" />
                  Product Media Gallery — {mediaModalProduct.name}
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  SKU: <span className="font-mono text-neutral-700">{mediaModalProduct.sku}</span> | Database ID: #{mediaModalProduct.id}
                </p>
              </div>
              <button
                onClick={() => {
                  setMediaModalProduct(null);
                  loadData();
                }}
                className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ProductMediaManager
              productId={mediaModalProduct.id}
              productName={mediaModalProduct.name}
              onImagesChange={loadData}
            />

            <div className="pt-4 border-t border-neutral-200 flex justify-end">
              <button
                onClick={() => {
                  setMediaModalProduct(null);
                  loadData();
                }}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Done & Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
