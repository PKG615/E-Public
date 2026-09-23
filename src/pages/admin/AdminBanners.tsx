import React, { useEffect, useState } from 'react';
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Edit, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  Eye, 
  EyeOff, 
  Layers, 
  Sparkles, 
  Sliders, 
  Calendar,
  ExternalLink,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  Tag,
  AlertCircle
} from 'lucide-react';
import { Banner, HomepageSection, Category, Brand, Product, Collection } from '../../types';
import { api } from '../../services/api';
import { AdminCollections } from './AdminCollections';

const SECTION_TYPE_OPTIONS = [
  { value: 'HERO_BANNER', label: 'Hero Banner Carousel', desc: 'Full-width top hero slider backed by active banners' },
  { value: 'CATEGORY_GRID', label: 'Category Grid', desc: 'Grid of product categories with subcategory chips' },
  { value: 'FEATURED_PRODUCTS', label: 'Featured Products Grid', desc: 'Handpicked products or high-priority catalog items' },
  { value: 'NEW_ARRIVALS', label: 'New Arrivals Grid', desc: 'Newly released components ordered by creation date' },
  { value: 'BEST_SELLERS', label: 'Best Sellers Grid', desc: 'Top rated or high sales-volume hardware' },
  { value: 'TRENDING_PRODUCTS', label: 'Trending Hardware', desc: 'Flash deals and trending hardware items' },
  { value: 'PROMOTIONAL_BANNER', label: 'Promotional Strip / Banner', desc: 'Full-width marketing callout with background visual' },
  { value: 'COLLECTION', label: 'Curated Collection', desc: 'Curated grouping of products showcased together' },
  { value: 'BRANDS', label: 'Brand Partners Grid', desc: 'Authorized manufacturer partner logos' },
  { value: 'OFFER', label: 'Special Incentive Strip', desc: 'High-visibility discount or warranty callout' },
  { value: 'TRUST_INFO', label: 'Enterprise Guarantee Cards', desc: 'Trust badges (Warranty, Dispatch, Security, Support)' },
  { value: 'FAQ', label: 'Interactive FAQ Accordion', desc: 'Collapsible frequently asked questions' },
  { value: 'NEWSLETTER', label: 'Corporate Newsletter Box', desc: 'Corporate email subscription module' },
  { value: 'CUSTOM_CONTENT', label: 'Custom HTML / Content', desc: 'Custom HTML or markdown notice' }
];

export const AdminBanners: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sections' | 'banners' | 'collections'>('sections');
  
  // Sections state
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loadingSections, setLoadingSections] = useState<boolean>(true);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [showSectionModal, setShowSectionModal] = useState<boolean>(false);

  // Banners state
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState<boolean>(true);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [showBannerModal, setShowBannerModal] = useState<boolean>(false);

  // Reference data for item linking
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Section Form state
  const [sectionForm, setSectionForm] = useState({
    section_key: '',
    section_type: 'FEATURED_PRODUCTS',
    title: '',
    subtitle: '',
    description: '',
    is_active: true,
    sort_order: 0,
    selected_item_ids: [] as number[],
    limit: 8,
    custom_icon: 'ShieldCheck',
    custom_content: '',
    collection_id: '',
    starts_at: '',
    ends_at: ''
  });

  // Banner Form state
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    alt_text: '',
    image_url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&q=80',
    mobile_image_url: '',
    link_type: 'custom' as 'product' | 'category' | 'brand' | 'collection' | 'shop' | 'custom',
    link_target: '',
    link_url: '/shop',
    cta_label: 'Explore Now',
    cta_url: '/shop',
    banner_type: 'hero',
    is_active: true,
    display_order: 1,
    start_at: '',
    end_at: ''
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Load Sections
  const loadSections = async () => {
    setLoadingSections(true);
    try {
      const res = await api.admin.homepage.getSections();
      if (res.success && res.data) {
        setSections(res.data);
      }
    } catch (err) {
      console.error('Failed to load sections:', err);
      notify('Failed to load homepage sections', 'error');
    } finally {
      setLoadingSections(false);
    }
  };

  // Load Banners
  const loadBanners = async () => {
    setLoadingBanners(true);
    try {
      const res = await api.admin.getBanners();
      if (res.success && res.data) {
        setBanners(res.data);
      }
    } catch (err) {
      console.error('Failed to load banners:', err);
      notify('Failed to load banners', 'error');
    } finally {
      setLoadingBanners(false);
    }
  };

  // Load reference items (categories, brands, products, collections) for selection
  const loadReferenceData = async () => {
    try {
      const [catRes, brandRes, prodRes, collRes] = await Promise.all([
        api.categories.getAll(),
        api.brands.getAll(),
        api.products.getAll({ limit: 50 }),
        api.admin.collections.getCollections()
      ]);
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (brandRes.success && brandRes.data) setBrands(brandRes.data);
      if (prodRes.success && prodRes.data?.items) setProducts(prodRes.data.items);
      if (collRes.success && collRes.data) setCollections(collRes.data);
    } catch (err) {
      console.error('Error loading reference entities:', err);
    }
  };

  useEffect(() => {
    loadSections();
    loadBanners();
    loadReferenceData();
  }, []);

  // --- SECTION ACTIONS ---

  const handleToggleSection = async (section: HomepageSection) => {
    const newStatus = !section.is_active;
    try {
      await api.admin.homepage.toggleSectionStatus(section.id, newStatus);
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, is_active: newStatus } : s))
      );
      notify(`Section "${section.title}" ${newStatus ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      notify('Failed to toggle section status', 'error');
    }
  };

  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    // Recalculate sort_order
    const reorderPayload = newSections.map((s, idx) => ({
      id: s.id,
      sort_order: idx + 1
    }));

    setSections(newSections.map((s, idx) => ({ ...s, sort_order: idx + 1 })));

    try {
      await api.admin.homepage.reorderSections(reorderPayload);
      notify('Homepage sections order updated.');
    } catch (err) {
      notify('Failed to save section ordering', 'error');
      loadSections();
    }
  };

  const handleOpenCreateSection = () => {
    setEditingSection(null);
    setSectionForm({
      section_key: `section_${Date.now()}`,
      section_type: 'FEATURED_PRODUCTS',
      title: '',
      subtitle: '',
      description: '',
      is_active: true,
      sort_order: sections.length + 1,
      selected_item_ids: [],
      limit: 8,
      custom_icon: 'ShieldCheck',
      custom_content: '',
      collection_id: '',
      starts_at: '',
      ends_at: ''
    });
    setShowSectionModal(true);
  };

  const handleOpenEditSection = (sec: HomepageSection) => {
    setEditingSection(sec);
    const existingIds = (sec.items || [])
      .filter((it) => it.item_id !== null && it.item_id !== undefined)
      .map((it) => it.item_id as number);

    setSectionForm({
      section_key: sec.section_key,
      section_type: sec.section_type,
      title: sec.title,
      subtitle: sec.subtitle || '',
      description: sec.description || '',
      is_active: sec.is_active,
      sort_order: sec.sort_order,
      selected_item_ids: existingIds,
      limit: sec.configuration?.limit || 8,
      custom_icon: sec.items?.[0]?.custom_icon || 'ShieldCheck',
      custom_content: sec.configuration?.html || sec.description || '',
      collection_id: sec.configuration?.collection_id ? String(sec.configuration.collection_id) : '',
      starts_at: sec.starts_at ? sec.starts_at.substring(0, 16) : '',
      ends_at: sec.ends_at ? sec.ends_at.substring(0, 16) : ''
    });
    setShowSectionModal(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        section_key: sectionForm.section_key.trim().toLowerCase().replace(/\s+/g, '_'),
        section_type: sectionForm.section_type,
        title: sectionForm.title.trim(),
        subtitle: sectionForm.subtitle.trim() || undefined,
        description: sectionForm.description.trim() || undefined,
        is_active: sectionForm.is_active,
        sort_order: sectionForm.sort_order,
        starts_at: sectionForm.starts_at ? new Date(sectionForm.starts_at).toISOString() : undefined,
        ends_at: sectionForm.ends_at ? new Date(sectionForm.ends_at).toISOString() : undefined,
        configuration: {
          limit: sectionForm.limit,
          html: sectionForm.custom_content,
          collection_id: sectionForm.collection_id ? parseInt(sectionForm.collection_id) : undefined
        }
      };

      if (sectionForm.selected_item_ids.length > 0) {
        payload.item_ids = sectionForm.selected_item_ids;
      }

      if (editingSection) {
        await api.admin.homepage.updateSection(editingSection.id, payload);
        notify(`Section "${sectionForm.title}" updated successfully.`);
      } else {
        await api.admin.homepage.createSection(payload);
        notify(`New section "${sectionForm.title}" created.`);
      }

      setShowSectionModal(false);
      await loadSections();
    } catch (err) {
      console.error('Failed to save section:', err);
      notify('Failed to save section.', 'error');
    }
  };

  const handleDeleteSection = async (id: number) => {
    if (!window.confirm('Delete this section from the homepage?')) return;
    try {
      await api.admin.homepage.deleteSection(id);
      notify('Section deleted successfully.');
      await loadSections();
    } catch (err) {
      notify('Failed to delete section.', 'error');
    }
  };

  // --- BANNER ACTIONS ---

  const handleToggleBanner = async (banner: Banner) => {
    const newStatus = !banner.is_active;
    try {
      await api.admin.toggleBannerStatus(banner.id, newStatus);
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, is_active: newStatus } : b))
      );
      notify(`Banner "${banner.title}" ${newStatus ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      notify('Failed to toggle banner status', 'error');
    }
  };

  const handleMoveBanner = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= banners.length) return;

    const newBanners = [...banners];
    const temp = newBanners[index];
    newBanners[index] = newBanners[targetIdx];
    newBanners[targetIdx] = temp;

    const reorderPayload = newBanners.map((b, idx) => ({
      id: b.id,
      sort_order: idx + 1
    }));

    setBanners(newBanners.map((b, idx) => ({ ...b, display_order: idx + 1 })));

    try {
      await api.admin.reorderBanners(reorderPayload);
      notify('Banner order updated.');
    } catch (err) {
      notify('Failed to save banner ordering', 'error');
      loadBanners();
    }
  };

  const handleOpenCreateBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      title: '',
      subtitle: '',
      description: '',
      alt_text: '',
      image_url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&q=80',
      mobile_image_url: '',
      link_type: 'custom',
      link_target: '',
      link_url: '/shop',
      cta_label: 'Explore Now',
      cta_url: '/shop',
      banner_type: 'hero',
      is_active: true,
      display_order: banners.length + 1,
      start_at: '',
      end_at: ''
    });
    setShowBannerModal(true);
  };

  const handleOpenEditBanner = (b: Banner) => {
    setEditingBanner(b);
    setBannerForm({
      title: b.title,
      subtitle: b.subtitle || '',
      description: b.description || '',
      alt_text: b.alt_text || '',
      image_url: b.image_url,
      mobile_image_url: b.mobile_image_url || '',
      link_type: (b.link_type as any) || 'custom',
      link_target: b.link_target || '',
      link_url: b.link_url || '/shop',
      cta_label: b.cta_label || 'Explore Now',
      cta_url: b.cta_url || b.link_url || '/shop',
      banner_type: b.banner_type,
      is_active: b.is_active,
      display_order: b.display_order,
      start_at: (b.starts_at || b.start_at) ? (b.starts_at || b.start_at)!.substring(0, 16) : '',
      end_at: (b.ends_at || b.end_at) ? (b.ends_at || b.end_at)!.substring(0, 16) : ''
    });
    setShowBannerModal(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        title: bannerForm.title.trim(),
        subtitle: bannerForm.subtitle.trim() || undefined,
        description: bannerForm.description.trim() || undefined,
        alt_text: bannerForm.alt_text.trim() || undefined,
        image_url: bannerForm.image_url.trim(),
        mobile_image_url: bannerForm.mobile_image_url.trim() || undefined,
        link_url: bannerForm.link_url.trim() || undefined,
        link_type: bannerForm.link_type,
        link_target: bannerForm.link_target.trim() || undefined,
        cta_label: bannerForm.cta_label.trim() || 'Explore Now',
        cta_url: bannerForm.cta_url.trim() || bannerForm.link_url.trim() || '/shop',
        banner_type: bannerForm.banner_type,
        is_active: bannerForm.is_active,
        display_order: bannerForm.display_order,
        start_at: bannerForm.start_at ? new Date(bannerForm.start_at).toISOString() : undefined,
        end_at: bannerForm.end_at ? new Date(bannerForm.end_at).toISOString() : undefined,
        starts_at: bannerForm.start_at ? new Date(bannerForm.start_at).toISOString() : undefined,
        ends_at: bannerForm.end_at ? new Date(bannerForm.end_at).toISOString() : undefined
      };

      if (editingBanner) {
        await api.admin.updateBanner(editingBanner.id, payload);
        notify(`Banner "${bannerForm.title}" updated successfully.`);
      } else {
        await api.admin.createBanner(payload);
        notify(`New banner "${bannerForm.title}" created.`);
      }

      setShowBannerModal(false);
      await loadBanners();
    } catch (err) {
      console.error('Failed to save banner:', err);
      notify('Failed to save banner.', 'error');
    }
  };

  const handleDeleteBanner = async (id: number) => {
    if (!window.confirm('Delete this banner from database?')) return;
    try {
      await api.admin.deleteBanner(id);
      notify('Banner deleted.');
      await loadBanners();
    } catch (err) {
      notify('Failed to delete banner.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-500 text-white border-emerald-600'
              : 'bg-red-500 text-white border-red-600'
          }`}
        >
          {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header with Sub-Tabs and Live Preview Trigger */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Homepage CMS & Layout Control</h2>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              truth
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure section ordering, active visibility, promotional hero slides, and entity bindings
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sub-tab switcher */}
          <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('sections')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'sections'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Sections Architecture ({sections.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('banners')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'banners'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Marketing Banners ({banners.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('collections')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'collections'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Curated Collections ({collections.length})</span>
            </button>
          </div>

          {activeTab !== 'collections' && (
            <button
              onClick={activeTab === 'sections' ? handleOpenCreateSection : handleOpenCreateBanner}
              className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{activeTab === 'sections' ? 'Add Section' : 'Add Banner'}</span>
            </button>
          )}
        </div>
      </div>

      {/* --- TAB 1: SECTIONS ARCHITECTURE --- */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
            <span>
              Arrange sections using <span className="font-semibold text-neutral-700">Up/Down arrows</span>. Changes sync immediately with the Customer Homepage.
            </span>
            <button
              onClick={loadSections}
              className="hover:text-neutral-900 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {loadingSections ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center text-xs text-neutral-400">
              Loading homepage sections from PostgreSQL...
            </div>
          ) : sections.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-3">
              <Layers className="w-8 h-8 text-neutral-300 mx-auto" />
              <p className="text-sm font-bold text-neutral-800">No Homepage Sections Defined</p>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Create a new section to structure the customer storefront.
              </p>
              <button
                onClick={handleOpenCreateSection}
                className="bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Create First Section
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs divide-y divide-neutral-100">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                    sec.is_active ? 'hover:bg-neutral-50/70' : 'bg-neutral-50/50 opacity-60'
                  }`}
                >
                  {/* Left: Reordering and Rank */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMoveSection(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-neutral-200 rounded text-neutral-500 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveSection(idx, 'down')}
                        disabled={idx === sections.length - 1}
                        className="p-1 hover:bg-neutral-200 rounded text-neutral-500 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-7 h-7 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-mono font-bold flex items-center justify-center">
                      {sec.sort_order}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-neutral-900">{sec.title}</h3>
                        <span className="text-[10px] font-mono uppercase bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded border border-neutral-200 font-semibold">
                          {sec.section_type}
                        </span>
                        {!sec.is_active && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                        {sec.subtitle || sec.description || `Key: ${sec.section_key}`}
                      </p>
                    </div>
                  </div>

                  {/* Right: Items count, Active toggle, Edit, Delete */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-neutral-400 font-medium hidden sm:inline">
                      {sec.items?.length || 0} custom items linked
                    </span>

                    {/* Active toggle button */}
                    <button
                      onClick={() => handleToggleSection(sec)}
                      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                        sec.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200'
                      }`}
                      title="Toggle Visibility"
                    >
                      {sec.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{sec.is_active ? 'Active' : 'Draft'}</span>
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => handleOpenEditSection(sec)}
                      className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                      title="Edit Section"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteSection(sec.id)}
                      className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: MARKETING BANNERS --- */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
            <span>
              Active banners automatically populate the <span className="font-semibold text-neutral-700">HERO_BANNER</span> carousel and promotional callout sections.
            </span>
            <button
              onClick={loadBanners}
              className="hover:text-neutral-900 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {loadingBanners ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center text-xs text-neutral-400">
              Loading banners from PostgreSQL...
            </div>
          ) : banners.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-3">
              <ImageIcon className="w-8 h-8 text-neutral-300 mx-auto" />
              <p className="text-sm font-bold text-neutral-800">No Banners Configured</p>
              <button
                onClick={handleOpenCreateBanner}
                className="bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Create First Banner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {banners.map((b, idx) => (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-16/9 bg-neutral-100 relative overflow-hidden group">
                      <img
                        src={b.image_url}
                        alt={b.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="bg-neutral-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          {b.banner_type}
                        </span>
                        <span className="bg-neutral-900/80 backdrop-blur-xs text-neutral-300 text-[10px] font-mono px-2 py-0.5 rounded">
                          Order: {b.display_order}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-neutral-900/80 backdrop-blur-xs rounded-lg p-0.5">
                        <button
                          onClick={() => handleMoveBanner(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-white hover:text-emerald-400 disabled:opacity-30"
                          title="Move Left/Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveBanner(idx, 'down')}
                          disabled={idx === banners.length - 1}
                          className="p-1 text-white hover:text-emerald-400 disabled:opacity-30"
                          title="Move Right/Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {!b.is_active && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center">
                          <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                            Inactive / Draft
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-neutral-900 text-base leading-snug">{b.title}</h3>
                      {b.subtitle && <p className="text-xs font-medium text-emerald-700">{b.subtitle}</p>}
                      {b.description && <p className="text-xs text-neutral-500 line-clamp-2">{b.description}</p>}

                      <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                        <span className="bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                          CTA: <strong>{b.cta_label || 'Explore'}</strong>
                        </span>
                        <span className="bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 truncate max-w-xs">
                          URL: {b.cta_url || b.link_url || '/shop'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-neutral-100 flex items-center justify-between mt-3">
                    <button
                      onClick={() => handleToggleBanner(b)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                        b.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200'
                      }`}
                    >
                      {b.is_active ? 'Active' : 'Inactive'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditBanner(b)}
                        className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Edit Banner"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(b.id)}
                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: CURATED COLLECTIONS --- */}
      {activeTab === 'collections' && (
        <AdminCollections />
      )}

      {/* --- SECTION CREATE / EDIT MODAL --- */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-neutral-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {editingSection ? 'Configure Section' : 'Create Homepage Section'}
                </h3>
                <p className="text-xs text-neutral-500">
                  Control layout type, display titles, and linked database entities
                </p>
              </div>
              <button
                onClick={() => setShowSectionModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="space-y-4 text-xs">
              {/* Section Type Selector */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Section Type</label>
                <select
                  value={sectionForm.section_type}
                  onChange={(e) => setSectionForm({ ...sectionForm, section_type: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg p-2.5 bg-white font-medium text-neutral-800 focus:ring-2 focus:ring-emerald-500"
                >
                  {SECTION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — ({opt.desc})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title & Section Key */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Display Title *</label>
                  <input
                    type="text"
                    required
                    value={sectionForm.title}
                    onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                    placeholder="e.g. Featured Flagship Hardware"
                    className="w-full border border-neutral-300 rounded-lg p-2.5 text-neutral-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Section Key (Unique)</label>
                  <input
                    type="text"
                    required
                    value={sectionForm.section_key}
                    onChange={(e) => setSectionForm({ ...sectionForm, section_key: e.target.value })}
                    placeholder="e.g. featured_flagships"
                    className="w-full border border-neutral-300 rounded-lg p-2.5 font-mono text-neutral-800"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Subtitle / Descriptor</label>
                <input
                  type="text"
                  value={sectionForm.subtitle}
                  onChange={(e) => setSectionForm({ ...sectionForm, subtitle: e.target.value })}
                  placeholder="e.g. Handpicked workstations and components"
                  className="w-full border border-neutral-300 rounded-lg p-2.5 text-neutral-800"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Description / Custom Content</label>
                <textarea
                  rows={2}
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  placeholder="Optional explanatory note"
                  className="w-full border border-neutral-300 rounded-lg p-2.5 text-neutral-800"
                />
              </div>

              {/* Entity Picker based on section type */}
              {(sectionForm.section_type.includes('PRODUCT') || sectionForm.section_type === 'NEW_ARRIVALS' || sectionForm.section_type === 'BEST_SELLERS') && (
                <div className="space-y-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-800">Pin Specific Products (Optional)</span>
                    <span className="text-[11px] text-neutral-500">
                      {sectionForm.selected_item_ids.length} selected (leave empty for automatic selection)
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                    {products.map((p) => {
                      const isSelected = sectionForm.selected_item_ids.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSectionForm({
                                  ...sectionForm,
                                  selected_item_ids: [...sectionForm.selected_item_ids, p.id]
                                });
                              } else {
                                setSectionForm({
                                  ...sectionForm,
                                  selected_item_ids: sectionForm.selected_item_ids.filter((id) => id !== p.id)
                                });
                              }
                            }}
                            className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="font-medium text-neutral-900 truncate">{p.name}</span>
                          <span className="text-neutral-400 text-[11px]">({p.sku})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {sectionForm.section_type.includes('CATEGOR') && (
                <div className="space-y-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-800">Select Specific Categories</span>
                    <span className="text-[11px] text-neutral-500">
                      {sectionForm.selected_item_ids.length} selected
                    </span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-2">
                    {categories.map((c) => {
                      const isSelected = sectionForm.selected_item_ids.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSectionForm({
                                  ...sectionForm,
                                  selected_item_ids: [...sectionForm.selected_item_ids, c.id]
                                });
                              } else {
                                setSectionForm({
                                  ...sectionForm,
                                  selected_item_ids: sectionForm.selected_item_ids.filter((id) => id !== c.id)
                                });
                              }
                            }}
                            className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="font-medium text-neutral-900">{c.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {sectionForm.section_type === 'COLLECTION' && (
                <div className="space-y-2 p-3.5 bg-amber-50/70 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Select Curated Collection *</span>
                    </span>
                    <span className="text-[11px] text-amber-700 font-mono">
                      {collections.length} Collections Ready
                    </span>
                  </div>
                  <select
                    value={sectionForm.collection_id}
                    onChange={(e) => {
                      const collId = e.target.value;
                      const selectedColl = collections.find((c) => String(c.id) === collId);
                      setSectionForm({
                        ...sectionForm,
                        collection_id: collId,
                        title: sectionForm.title || (selectedColl ? selectedColl.title : ''),
                        subtitle: sectionForm.subtitle || (selectedColl?.description || '')
                      });
                    }}
                    required={sectionForm.section_type === 'COLLECTION'}
                    className="w-full border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 font-medium"
                  >
                    <option value="">-- Choose a Curated Collection --</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.products_count || c.products?.length || 0} products)
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-neutral-500">
                    The chosen collection's products will be showcased directly in this storefront section.
                  </p>
                </div>
              )}

              {/* Schedule Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Display Start (Optional)</label>
                  <input
                    type="datetime-local"
                    value={sectionForm.starts_at}
                    onChange={(e) => setSectionForm({ ...sectionForm, starts_at: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg p-2 bg-white text-neutral-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Display Expiration (Optional)</label>
                  <input
                    type="datetime-local"
                    value={sectionForm.ends_at}
                    onChange={(e) => setSectionForm({ ...sectionForm, ends_at: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg p-2 bg-white text-neutral-800 text-xs"
                  />
                </div>
              </div>

              {/* Status and Sort Order */}
              <div className="flex items-center gap-6 pt-2 border-t border-neutral-100">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-neutral-700">
                  <input
                    type="checkbox"
                    checked={sectionForm.is_active}
                    onChange={(e) => setSectionForm({ ...sectionForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Active on Homepage</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingSection ? 'Save Changes' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- BANNER CREATE / EDIT MODAL --- */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-neutral-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {editingBanner ? 'Edit Banner' : 'Create Marketing Banner'}
                </h3>
                <p className="text-xs text-neutral-500">
                  Configure visual asset, CTA label, destination URL, and scheduling
                </p>
              </div>
              <button
                onClick={() => setShowBannerModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Banner Type</label>
                  <select
                    value={bannerForm.banner_type}
                    onChange={(e) => setBannerForm({ ...bannerForm, banner_type: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg p-2.5 bg-white font-medium text-neutral-800"
                  >
                    <option value="hero">Hero Slider (Main)</option>
                    <option value="promo">Promotional Strip</option>
                    <option value="flash_sale">Flash Sale Strip</option>
                    <option value="offer">Incentive Card</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={bannerForm.display_order}
                    onChange={(e) => setBannerForm({ ...bannerForm, display_order: parseInt(e.target.value) || 1 })}
                    className="w-full border border-neutral-300 rounded-lg p-2.5 text-neutral-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Headline / Title *</label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  placeholder="e.g. Next-Gen Enterprise Workstations"
                  className="w-full border border-neutral-300 rounded-lg p-2.5 text-neutral-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Subtitle / Badge</label>
                <input
                  type="text"
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  placeholder="e.g. Authorized Flagship Series"
                  className="w-full border border-neutral-300 rounded-lg p-2.5 text-neutral-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={bannerForm.description}
                  onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                  placeholder="Marketing copy..."
                  className="w-full border border-neutral-300 rounded-lg p-2.5 text-neutral-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Desktop Image URL *</label>
                <input
                  type="url"
                  required
                  value={bannerForm.image_url}
                  onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-neutral-300 rounded-lg p-2.5 text-neutral-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Mobile Image URL (Optional)</label>
                <input
                  type="url"
                  value={bannerForm.mobile_image_url}
                  onChange={(e) => setBannerForm({ ...bannerForm, mobile_image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-neutral-300 rounded-lg p-2.5 text-neutral-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Image Alt Text (Accessibility & SEO)</label>
                <input
                  type="text"
                  value={bannerForm.alt_text}
                  onChange={(e) => setBannerForm({ ...bannerForm, alt_text: e.target.value })}
                  placeholder="e.g. Enterprise Workstation promotion visual"
                  className="w-full border border-neutral-300 rounded-lg p-2.5 text-neutral-800"
                />
              </div>

              {/* Dynamic Link Builder */}
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-neutral-900 block">Banner Click Destination / Link Type</label>
                  <span className="text-[11px] text-neutral-500 font-mono">Dynamic Resolution</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Link Entity Type</label>
                    <select
                      value={bannerForm.link_type}
                      onChange={(e) => {
                        const type = e.target.value as any;
                        let targetUrl = bannerForm.cta_url;
                        if (type === 'shop') targetUrl = '/shop';
                        setBannerForm({
                          ...bannerForm,
                          link_type: type,
                          link_target: '',
                          link_url: targetUrl,
                          cta_url: targetUrl
                        });
                      }}
                      className="w-full border border-neutral-300 rounded-lg p-2 bg-white text-neutral-800 text-xs"
                    >
                      <option value="custom">Custom / External URL</option>
                      <option value="collection">Curated Collection</option>
                      <option value="category">Category Page</option>
                      <option value="brand">Brand Partner Page</option>
                      <option value="product">Specific Product Page</option>
                      <option value="shop">Full Shop Catalog (/shop)</option>
                    </select>
                  </div>

                  {/* Dependent Entity Selector */}
                  {bannerForm.link_type === 'collection' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Select Collection</label>
                      <select
                        value={bannerForm.link_target}
                        onChange={(e) => {
                          const slug = e.target.value;
                          setBannerForm({
                            ...bannerForm,
                            link_target: slug,
                            link_url: `/collections/${slug}`,
                            cta_url: `/collections/${slug}`
                          });
                        }}
                        className="w-full border border-neutral-300 rounded-lg p-2 bg-white text-neutral-800 text-xs"
                      >
                        <option value="">-- Choose Collection --</option>
                        {collections.map(c => (
                          <option key={c.id} value={c.slug}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {bannerForm.link_type === 'category' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Select Category</label>
                      <select
                        value={bannerForm.link_target}
                        onChange={(e) => {
                          const slug = e.target.value;
                          setBannerForm({
                            ...bannerForm,
                            link_target: slug,
                            link_url: `/shop?category=${slug}`,
                            cta_url: `/shop?category=${slug}`
                          });
                        }}
                        className="w-full border border-neutral-300 rounded-lg p-2 bg-white text-neutral-800 text-xs"
                      >
                        <option value="">-- Choose Category --</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.slug}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {bannerForm.link_type === 'brand' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Select Brand</label>
                      <select
                        value={bannerForm.link_target}
                        onChange={(e) => {
                          const slug = e.target.value;
                          setBannerForm({
                            ...bannerForm,
                            link_target: slug,
                            link_url: `/shop?brand=${slug}`,
                            cta_url: `/shop?brand=${slug}`
                          });
                        }}
                        className="w-full border border-neutral-300 rounded-lg p-2 bg-white text-neutral-800 text-xs"
                      >
                        <option value="">-- Choose Brand --</option>
                        {brands.map(b => (
                          <option key={b.id} value={b.slug}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {bannerForm.link_type === 'product' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Select Product</label>
                      <select
                        value={bannerForm.link_target}
                        onChange={(e) => {
                          const slug = e.target.value;
                          setBannerForm({
                            ...bannerForm,
                            link_target: slug,
                            link_url: `/product/${slug}`,
                            cta_url: `/product/${slug}`
                          });
                        }}
                        className="w-full border border-neutral-300 rounded-lg p-2 bg-white text-neutral-800 text-xs"
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.slug}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">CTA Label</label>
                    <input
                      type="text"
                      value={bannerForm.cta_label}
                      onChange={(e) => setBannerForm({ ...bannerForm, cta_label: e.target.value })}
                      placeholder="e.g. Explore Now"
                      className="w-full border border-neutral-300 rounded-lg p-2.5 text-neutral-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Destination URL *</label>
                    <input
                      type="text"
                      required
                      value={bannerForm.cta_url}
                      onChange={(e) => setBannerForm({ ...bannerForm, cta_url: e.target.value, link_url: e.target.value })}
                      placeholder="/shop or /collections/ai-workstations or https://..."
                      className="w-full border border-neutral-300 rounded-lg p-2.5 text-neutral-800"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Start Schedule (Optional)</label>
                  <input
                    type="datetime-local"
                    value={bannerForm.start_at}
                    onChange={(e) => setBannerForm({ ...bannerForm, start_at: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg p-2 bg-white text-neutral-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">End Schedule (Optional)</label>
                  <input
                    type="datetime-local"
                    value={bannerForm.end_at}
                    onChange={(e) => setBannerForm({ ...bannerForm, end_at: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg p-2 bg-white text-neutral-800"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-2 border-t border-neutral-100">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-neutral-700">
                  <input
                    type="checkbox"
                    checked={bannerForm.is_active}
                    onChange={(e) => setBannerForm({ ...bannerForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Active & Visible in Carousel</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowBannerModal(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingBanner ? 'Save Changes' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
