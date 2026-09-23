import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Globe, 
  Package, 
  RefreshCw, 
  AlertCircle,
  ExternalLink,
  Sparkles,
  SlidersHorizontal,
  CheckCircle2
} from 'lucide-react';
import { Collection, Product } from '../../types';
import { api } from '../../services/api';

export const AdminCollections: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [modalTab, setModalTab] = useState<'general' | 'products' | 'seo'>('general');
  const [saving, setSaving] = useState<boolean>(false);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    image_url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1000&q=80',
    sort_order: 1,
    is_active: true,
    seo_title: '',
    seo_description: '',
    selected_product_ids: [] as number[]
  });

  // Product search state inside modal
  const [productSearchTerm, setProductSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{
    id: number;
    name: string;
    slug: string;
    sku: string;
    price: number;
    stock: number;
    is_active: boolean;
    image_url?: string;
  }>>([]);
  const [searchingProducts, setSearchingProducts] = useState<boolean>(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Array<{
    id: number;
    name: string;
    sku: string;
    price: number;
    image_url?: string;
  }>>([]);

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await api.admin.collections.getCollections({
        search: searchQuery || undefined,
        is_active: statusFilter === 'all' ? undefined : statusFilter === 'active'
      });
      if (res.success && res.data) {
        setCollections(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load collections:', err);
      notify('Failed to load collections from database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [statusFilter]);

  // Handle product search with debounce
  useEffect(() => {
    if (!showModal) return;
    const timer = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const res = await api.admin.collections.searchProducts(productSearchTerm, 15);
        if (res.success && res.data) {
          setSearchResults(res.data);
        }
      } catch (err) {
        console.error('Product search error:', err);
      } finally {
        setSearchingProducts(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [productSearchTerm, showModal]);

  const openCreateModal = () => {
    setEditingCollection(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1000&q=80',
      sort_order: collections.length + 1,
      is_active: true,
      seo_title: '',
      seo_description: '',
      selected_product_ids: []
    });
    setSelectedProductDetails([]);
    setModalTab('general');
    setShowModal(true);
  };

  const openEditModal = async (coll: Collection) => {
    setEditingCollection(coll);
    setFormData({
      title: coll.title,
      slug: coll.slug,
      description: coll.description || '',
      image_url: coll.image_url || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1000&q=80',
      sort_order: coll.sort_order,
      is_active: coll.is_active,
      seo_title: coll.seo_title || '',
      seo_description: coll.seo_description || '',
      selected_product_ids: (coll.products || []).map(p => p.product_id)
    });

    // Populate existing product details
    const prods = (coll.products || []).map(p => ({
      id: p.product_id,
      name: p.name || `Product #${p.product_id}`,
      sku: p.sku || 'SKU-N/A',
      price: p.price || 0,
      image_url: p.image_url
    }));
    setSelectedProductDetails(prods);

    setModalTab('general');
    setShowModal(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const generatedSlug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData(prev => ({
      ...prev,
      title,
      slug: editingCollection ? prev.slug : generatedSlug,
      seo_title: prev.seo_title ? prev.seo_title : (title ? `${title} | Curated Collection` : '')
    }));
  };

  const addProductToCollection = (product: {
    id: number;
    name: string;
    sku: string;
    price: number;
    image_url?: string;
  }) => {
    if (formData.selected_product_ids.includes(product.id)) return;
    setFormData(prev => ({
      ...prev,
      selected_product_ids: [...prev.selected_product_ids, product.id]
    }));
    setSelectedProductDetails(prev => [...prev, product]);
  };

  const removeProductFromCollection = (productId: number) => {
    setFormData(prev => ({
      ...prev,
      selected_product_ids: prev.selected_product_ids.filter(id => id !== productId)
    }));
    setSelectedProductDetails(prev => prev.filter(p => p.id !== productId));
  };

  const moveProductOrder = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= selectedProductDetails.length) return;
    
    const newDetails = [...selectedProductDetails];
    const temp = newDetails[index];
    newDetails[index] = newDetails[targetIdx];
    newDetails[targetIdx] = temp;

    setSelectedProductDetails(newDetails);
    setFormData(prev => ({
      ...prev,
      selected_product_ids: newDetails.map(p => p.id)
    }));
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      notify('Collection title is required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
        image_url: formData.image_url.trim() || undefined,
        sort_order: Number(formData.sort_order),
        is_active: formData.is_active,
        seo_title: formData.seo_title.trim() || undefined,
        seo_description: formData.seo_description.trim() || undefined,
        product_ids: formData.selected_product_ids
      };

      if (editingCollection) {
        const res = await api.admin.collections.updateCollection(editingCollection.id, payload);
        if (res.success) {
          notify('Collection updated successfully.');
          setShowModal(false);
          fetchCollections();
        }
      } else {
        const res = await api.admin.collections.createCollection(payload);
        if (res.success) {
          notify('Collection created successfully.');
          setShowModal(false);
          fetchCollections();
        }
      }
    } catch (err: any) {
      console.error('Save collection error:', err);
      notify(err.response?.data?.detail || 'Failed to save collection.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const res = await api.admin.collections.toggleCollectionStatus(id, !currentStatus);
      if (res.success) {
        setCollections(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
        notify(`Collection ${!currentStatus ? 'activated' : 'deactivated'}.`);
      }
    } catch (err) {
      notify('Failed to update status.', 'error');
    }
  };

  const deleteCollection = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete collection "${title}"?`)) return;
    try {
      const res = await api.admin.collections.deleteCollection(id);
      if (res.success) {
        setCollections(prev => prev.filter(c => c.id !== id));
        notify('Collection deleted successfully.');
      }
    } catch (err) {
      notify('Failed to delete collection.', 'error');
    }
  };

  const moveCollectionOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= collections.length) return;

    const newCollections = [...collections];
    const temp = newCollections[index];
    newCollections[index] = newCollections[targetIdx];
    newCollections[targetIdx] = temp;

    // Recalculate sort orders
    const items = newCollections.map((c, idx) => ({ id: c.id, sort_order: idx + 1 }));
    setCollections(newCollections);

    try {
      await api.admin.collections.reorderCollections(items);
      notify('Collection order updated.');
    } catch (err) {
      notify('Failed to update order.', 'error');
      fetchCollections();
    }
  };

  const filteredCollections = useMemo(() => {
    return collections.filter(c => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = c.title.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [collections, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center justify-between shadow-lg text-xs font-semibold ${
          notification.type === 'success' 
            ? 'bg-emerald-950 border border-emerald-800 text-emerald-300' 
            : 'bg-red-950 border border-red-800 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-neutral-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900">Curated Collections</h1>
            <span className="text-xs bg-neutral-100 text-neutral-600 px-2.5 py-0.5 rounded-full font-semibold">
              {collections.length} Total
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 max-w-xl">
            Group products into thematic marketing collections, configure scheduling and customized SEO metadata for targeted campaigns.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchCollections}
            className="p-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
            title="Refresh collections"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Collection</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {(['all', 'active', 'inactive'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                statusFilter === tab
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Collections List */}
      {loading ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center text-neutral-400 flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
          <span className="text-xs font-mono">Loading collections...</span>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center space-y-3">
          <Layers className="w-8 h-8 text-neutral-300 mx-auto" />
          <h3 className="text-sm font-bold text-neutral-700">No collections found</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {searchQuery ? 'No collections match your filter criteria.' : 'Create your first curated collection to showcase themed products on the storefront.'}
          </p>
          {!searchQuery && (
            <button
              onClick={openCreateModal}
              className="mt-2 inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Collection</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">Order</th>
                  <th className="py-3.5 px-4">Collection Info</th>
                  <th className="py-3.5 px-4">Slug & URL</th>
                  <th className="py-3.5 px-4 text-center">Products</th>
                  <th className="py-3.5 px-4">SEO Config</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredCollections.map((coll, idx) => (
                  <tr key={coll.id} className="hover:bg-neutral-50/70 transition-colors">
                    
                    {/* Order Controls */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-mono font-bold text-neutral-400 w-5">{coll.sort_order}</span>
                        <div className="flex flex-col">
                          <button
                            disabled={idx === 0}
                            onClick={() => moveCollectionOrder(idx, 'up')}
                            className="p-0.5 text-neutral-400 hover:text-neutral-900 disabled:opacity-20"
                            title="Move up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            disabled={idx === filteredCollections.length - 1}
                            onClick={() => moveCollectionOrder(idx, 'down')}
                            className="p-0.5 text-neutral-400 hover:text-neutral-900 disabled:opacity-20"
                            title="Move down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Collection Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                          {coll.image_url ? (
                            <img src={coll.image_url} alt={coll.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-300">
                              <Layers className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 text-sm">{coll.title}</p>
                          <p className="text-neutral-500 text-[11px] line-clamp-1 max-w-xs">
                            {coll.description || 'No description provided.'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Slug & Storefront Link */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-mono text-[11px] text-neutral-600">
                        <span>/collections/{coll.slug}</span>
                        <a
                          href={`/shop?collection=${coll.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-neutral-400 hover:text-neutral-900"
                          title="View on storefront"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>

                    {/* Product count */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-mono text-xs font-semibold">
                        <Package className="w-3 h-3 text-neutral-500" />
                        <span>{coll.products_count || (coll.products?.length || 0)}</span>
                      </span>
                    </td>

                    {/* SEO Config */}
                    <td className="py-3 px-4">
                      {coll.seo_title ? (
                        <div className="max-w-xs">
                          <p className="text-[11px] font-semibold text-emerald-600 truncate flex items-center gap-1">
                            <Globe className="w-3 h-3 shrink-0" />
                            <span className="truncate">{coll.seo_title}</span>
                          </p>
                          <p className="text-[10px] text-neutral-400 truncate">
                            {coll.seo_description || 'Auto-generated fallback'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-neutral-400 italic">Default title fallback</span>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleStatus(coll.id, coll.is_active)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                          coll.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-neutral-100 text-neutral-500 border border-neutral-200 hover:bg-neutral-200'
                        }`}
                      >
                        {coll.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{coll.is_active ? 'Active' : 'Draft'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(coll)}
                          className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                          title="Edit Collection"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteCollection(coll.id, coll.title)}
                          className="p-1.5 rounded-lg border border-neutral-200 text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete Collection"
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

      {/* CREATE / EDIT COLLECTION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-neutral-200 my-8">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  {editingCollection ? `Edit Collection: ${editingCollection.title}` : 'Create New Collection'}
                </h3>
                <p className="text-xs text-neutral-500">Configure collection metadata, mapped products, and search engine parameters.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-neutral-200 bg-white px-6">
              <button
                type="button"
                onClick={() => setModalTab('general')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  modalTab === 'general' ? 'border-amber-500 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>General Details</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('products')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  modalTab === 'products' ? 'border-amber-500 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Products ({formData.selected_product_ids.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('seo')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  modalTab === 'seo' ? 'border-amber-500 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>SEO & Social</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCollection}>
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 text-xs">
                
                {/* TAB 1: GENERAL */}
                {modalTab === 'general' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Collection Title *</label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={handleTitleChange}
                        placeholder="e.g. Enterprise Workstation Essentials"
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-neutral-700 mb-1">URL Slug *</label>
                        <input
                          type="text"
                          required
                          value={formData.slug}
                          onChange={(e) => setFormData(p => ({ ...p, slug: e.target.value.toLowerCase().trim() }))}
                          placeholder="e.g. enterprise-workstation-essentials"
                          className="w-full px-3 py-2 font-mono border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-neutral-700 mb-1">Sort Order</label>
                        <input
                          type="number"
                          value={formData.sort_order}
                          onChange={(e) => setFormData(p => ({ ...p, sort_order: parseInt(e.target.value) || 1 }))}
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                        placeholder="Brief overview explaining the curation theme..."
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Banner Image URL</label>
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData(p => ({ ...p, image_url: e.target.value }))}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                      />
                      {formData.image_url && (
                        <div className="mt-2 h-24 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50">
                          <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
                      <div>
                        <span className="font-bold text-neutral-800 block">Active Status</span>
                        <span className="text-neutral-500 text-[11px]">When inactive, this collection is hidden from customer browsing and search.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                        className="w-4 h-4 text-amber-500 rounded border-neutral-300 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: PRODUCTS SELECTION */}
                {modalTab === 'products' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Search & Add Catalog Products</label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Type product title or SKU to filter..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                        {searchingProducts && (
                          <RefreshCw className="w-4 h-4 text-amber-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                        )}
                      </div>
                    </div>

                    {/* Search suggestions dropdown */}
                    {searchResults.length > 0 && (
                      <div className="border border-neutral-200 rounded-xl p-2 bg-neutral-50 max-h-48 overflow-y-auto space-y-1">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2">Catalog Results:</span>
                        {searchResults.map(p => {
                          const isAlreadyAdded = formData.selected_product_ids.includes(p.id);
                          return (
                            <div
                              key={p.id}
                              className={`p-2 rounded-lg flex items-center justify-between transition-colors ${
                                isAlreadyAdded ? 'bg-neutral-200/50 opacity-60' : 'bg-white hover:bg-amber-50/60 border border-neutral-200/60'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-neutral-100 overflow-hidden shrink-0">
                                  {p.image_url ? (
                                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-4 h-4 text-neutral-400 m-auto mt-2" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-neutral-900 line-clamp-1">{p.name}</p>
                                  <p className="text-[10px] text-neutral-500 font-mono">SKU: {p.sku} | ${p.price.toFixed(2)}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={isAlreadyAdded}
                                onClick={() => addProductToCollection(p)}
                                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                                  isAlreadyAdded 
                                    ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                                    : 'bg-neutral-900 text-white hover:bg-neutral-800'
                                }`}
                              >
                                {isAlreadyAdded ? 'Added' : 'Add'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Assigned Products List */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-neutral-800">
                          Selected Products ({selectedProductDetails.length})
                        </span>
                        <span className="text-[11px] text-neutral-400">Order products in the sequence they will appear on the storefront</span>
                      </div>

                      {selectedProductDetails.length === 0 ? (
                        <div className="p-8 border border-dashed border-neutral-200 rounded-xl text-center text-neutral-400">
                          No products assigned yet. Use the search bar above to assign catalog items.
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-60 overflow-y-auto">
                          {selectedProductDetails.map((p, idx) => (
                            <div
                              key={p.id}
                              className="p-2 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-neutral-400 text-[11px] w-5 text-center">{idx + 1}</span>
                                <div className="w-7 h-7 rounded bg-neutral-200 overflow-hidden shrink-0">
                                  {p.image_url ? (
                                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-3.5 h-3.5 text-neutral-500 m-auto mt-1.5" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-neutral-900 line-clamp-1">{p.name}</p>
                                  <p className="text-[10px] text-neutral-500 font-mono">SKU: {p.sku} | ${p.price.toFixed(2)}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => moveProductOrder(idx, 'up')}
                                  className="p-1 text-neutral-400 hover:text-neutral-900 disabled:opacity-20"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === selectedProductDetails.length - 1}
                                  onClick={() => moveProductOrder(idx, 'down')}
                                  className="p-1 text-neutral-400 hover:text-neutral-900 disabled:opacity-20"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeProductFromCollection(p.id)}
                                  className="p-1 text-red-500 hover:text-red-700 ml-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: SEO */}
                {modalTab === 'seo' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">SEO Title (Title Tag)</label>
                      <input
                        type="text"
                        value={formData.seo_title}
                        onChange={(e) => setFormData(p => ({ ...p, seo_title: e.target.value }))}
                        placeholder="e.g. Best Enterprise Hardware & Components 2026"
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                      <span className="text-[10px] text-neutral-400 block mt-1">Recommended length: 50-60 characters.</span>
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">SEO Meta Description</label>
                      <textarea
                        rows={3}
                        value={formData.seo_description}
                        onChange={(e) => setFormData(p => ({ ...p, seo_description: e.target.value }))}
                        placeholder="Comprehensive hardware curation tested for high-reliability environments..."
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                      <span className="text-[10px] text-neutral-400 block mt-1">Recommended length: 140-160 characters.</span>
                    </div>

                    {/* Search Engine Result Page Preview */}
                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                        Google Search Snippet Preview
                      </span>
                      <p className="text-xs text-neutral-500 font-mono truncate">
                        https://nexus-enterprise.com › collections › {formData.slug || 'collection-slug'}
                      </p>
                      <h4 className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer truncate">
                        {formData.seo_title || formData.title || 'Collection Title'}
                      </h4>
                      <p className="text-[11px] text-neutral-600 line-clamp-2 leading-relaxed">
                        {formData.seo_description || formData.description || 'Discover our curated selection of high-performance components and hardware.'}
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-600 hover:bg-neutral-100 rounded-lg font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCollection ? 'Update Collection' : 'Create Collection'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
