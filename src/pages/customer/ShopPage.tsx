import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Filter, 
  SlidersHorizontal, 
  ShoppingBag, 
  Check, 
  Star, 
  X, 
  Search,
  ArrowUpDown,
  ChevronRight,
  Grid3X3,
  List,
  CheckSquare,
  Square,
  RotateCcw,
  Layers,
  Tag,
  Percent,
  ChevronLeft,
  Heart,
  ArrowLeftRight
} from 'lucide-react';
import { Product, Category, CatalogFacets } from '../../types';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useWishlistCompare } from '../../context/WishlistCompareContext';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist, isInCompare, toggleCompare } = useWishlistCompare();

  // URL State
  const searchQuery = searchParams.get('q') || searchParams.get('search') || '';
  const categorySlug = searchParams.get('category') || '';
  const subcategorySlug = searchParams.get('subcategory') || '';
  const brandSlug = searchParams.get('brand') || '';
  const brandsParam = searchParams.get('brands') || '';
  const minPriceParam = searchParams.get('min_price') || '';
  const maxPriceParam = searchParams.get('max_price') || '';
  const minDiscountParam = searchParams.get('min_discount') || searchParams.get('discount_min') || '';
  const availabilityParam = searchParams.get('availability') || '';
  const sortBy = searchParams.get('sort') || (searchQuery ? 'relevance' : 'newest');
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const pageLimit = parseInt(searchParams.get('limit') || '12', 10);

  // Selected brands set (supports single brand or multi brands)
  const selectedBrands = useMemo(() => {
    const list: string[] = [];
    if (brandSlug) list.push(brandSlug);
    if (brandsParam) {
      brandsParam.split(',').forEach(b => {
        const clean = b.trim();
        if (clean && !list.includes(clean)) list.push(clean);
      });
    }
    return list;
  }, [brandSlug, brandsParam]);

  // Selected dynamic attributes from URL (attribute_color=silver, etc.)
  const selectedAttributes = useMemo<Record<string, string[]>>(() => {
    const attrs: Record<string, string[]> = {};
    searchParams.forEach((val, key) => {
      if (key.startsWith('attribute_')) {
        const attrSlug = key.replace('attribute_', '');
        attrs[attrSlug] = val.split(',').map(v => v.trim()).filter(Boolean);
      }
    });
    const rawAttrParam = searchParams.get('attributes');
    if (rawAttrParam) {
      rawAttrParam.split(',').forEach(pair => {
        const [k, v] = pair.split(':');
        if (k && v) {
          const kSlug = k.trim().toLowerCase();
          if (!attrs[kSlug]) attrs[kSlug] = [];
          if (!attrs[kSlug].includes(v.trim())) attrs[kSlug].push(v.trim());
        }
      });
    }
    return attrs;
  }, [searchParams]);

  // Local Component State
  const [products, setProducts] = useState<Product[]>([]);
  const [facets, setFacets] = useState<CatalogFacets | null>(null);
  const [categoriesTree, setCategoriesTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilter, setShowMobileFilter] = useState<boolean>(false);
  const [addedProductId, setAddedProductId] = useState<number | null>(null);

  // Price inputs state (allows user typing before applying)
  const [inputMinPrice, setInputMinPrice] = useState<string>(minPriceParam);
  const [inputMaxPrice, setInputMaxPrice] = useState<string>(maxPriceParam);

  // Sync inputs when URL changes
  useEffect(() => {
    setInputMinPrice(minPriceParam);
    setInputMaxPrice(maxPriceParam);
  }, [minPriceParam, maxPriceParam]);

  // Fetch Category Tree for Hierarchical Navigation
  useEffect(() => {
    const loadCategoriesTree = async () => {
      try {
        const res = await api.categories.getTree();
        if (res.success && res.data) {
          setCategoriesTree(res.data);
        }
      } catch (err) {
        console.error('Failed to load categories tree:', err);
      }
    };
    loadCategoriesTree();
  }, []);

  // Update Page Title based on Filters
  useEffect(() => {
    if (searchQuery) {
      document.title = `Search: "${searchQuery}" | Store Catalog`;
    } else if (categorySlug) {
      const formatted = categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      document.title = `${formatted} | Store Catalog`;
    } else if (brandSlug) {
      const formatted = brandSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      document.title = `${formatted} Products | Store Catalog`;
    } else {
      document.title = 'Shop Catalog | Store';
    }
  }, [searchQuery, categorySlug, brandSlug]);

  // Main Fetch: Server-side Query Execution
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const params: Record<string, any> = {
          page: currentPage,
          limit: pageLimit,
          sort_by: sortBy,
          include_facets: true,
        };

        if (searchQuery) params.q = searchQuery;
        if (categorySlug) params.category_slug = categorySlug;
        if (subcategorySlug) params.subcategory_slug = subcategorySlug;
        if (selectedBrands.length > 0) {
          params.brands = selectedBrands.join(',');
        }
        if (minPriceParam) params.min_price = parseFloat(minPriceParam);
        if (maxPriceParam) params.max_price = parseFloat(maxPriceParam);
        if (minDiscountParam) params.min_discount = parseFloat(minDiscountParam);
        if (availabilityParam) params.availability = availabilityParam;

        // Forward dynamic attribute parameters
        Object.entries(selectedAttributes).forEach(([attrSlug, values]: [string, string[]]) => {
          if (values && values.length > 0) {
            params[`attribute_${attrSlug}`] = values.join(',');
          }
        });

        const res = await api.products.getAll(params);
        if (res.success && res.data) {
          setProducts(res.data.items || []);
          setTotalCount(res.data.total || 0);
          setTotalPages(res.data.total_pages || 1);
          if (res.data.facets) {
            setFacets(res.data.facets);
          }
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [
    searchQuery,
    categorySlug,
    subcategorySlug,
    selectedBrands,
    minPriceParam,
    maxPriceParam,
    minDiscountParam,
    availabilityParam,
    selectedAttributes,
    sortBy,
    currentPage,
    pageLimit
  ]);

  // URL Helper to mutate query params
  const updateQueryParam = useCallback((updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === '') {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    });
    if (!('page' in updates)) {
      next.set('page', '1');
    }
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  // Filter Handlers
  const handleCategorySelect = (slug: string) => {
    if (slug === categorySlug) {
      updateQueryParam({ category: null, subcategory: null });
    } else {
      updateQueryParam({ category: slug, subcategory: null });
    }
  };

  const handleSubcategorySelect = (subSlug: string, parentSlug: string) => {
    if (subSlug === subcategorySlug) {
      updateQueryParam({ subcategory: null });
    } else {
      updateQueryParam({ category: parentSlug, subcategory: subSlug });
    }
  };

  const handleBrandToggle = (brandSlugToToggle: string) => {
    let nextBrands = [...selectedBrands];
    if (nextBrands.includes(brandSlugToToggle)) {
      nextBrands = nextBrands.filter(b => b !== brandSlugToToggle);
    } else {
      nextBrands.push(brandSlugToToggle);
    }

    const next = new URLSearchParams(searchParams);
    next.delete('brand');
    if (nextBrands.length === 0) {
      next.delete('brands');
    } else {
      next.set('brands', nextBrands.join(','));
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleApplyPrice = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateQueryParam({
      min_price: inputMinPrice ? inputMinPrice : null,
      max_price: inputMaxPrice ? inputMaxPrice : null,
    });
  };

  const handlePricePreset = (min: number | null, max: number | null) => {
    setInputMinPrice(min !== null ? String(min) : '');
    setInputMaxPrice(max !== null ? String(max) : '');
    updateQueryParam({
      min_price: min !== null ? String(min) : null,
      max_price: max !== null ? String(max) : null,
    });
  };

  const handleDiscountSelect = (discountVal: string) => {
    if (discountVal === minDiscountParam) {
      updateQueryParam({ min_discount: null, discount_min: null });
    } else {
      updateQueryParam({ min_discount: discountVal });
    }
  };

  const handleAvailabilitySelect = (avail: string) => {
    if (avail === availabilityParam) {
      updateQueryParam({ availability: null });
    } else {
      updateQueryParam({ availability: avail });
    }
  };

  const handleAttributeToggle = (attrSlug: string, value: string) => {
    const currentValues = selectedAttributes[attrSlug] || [];
    let updatedValues: string[];
    if (currentValues.includes(value)) {
      updatedValues = currentValues.filter(v => v !== value);
    } else {
      updatedValues = [...currentValues, value];
    }

    const next = new URLSearchParams(searchParams);
    const paramKey = `attribute_${attrSlug}`;
    if (updatedValues.length === 0) {
      next.delete(paramKey);
    } else {
      next.set(paramKey, updatedValues.join(','));
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleSortChange = (newSort: string) => {
    updateQueryParam({ sort: newSort });
  };

  const handlePageChange = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(newPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAllFilters = () => {
    setSearchParams({});
    setInputMinPrice('');
    setInputMaxPrice('');
  };

  const handleAddToCart = (e: React.MouseEvent, prod: Product) => {
    e.preventDefault();
    const primaryVariant = prod.variants && prod.variants.length > 0 ? prod.variants[0] : undefined;
    addToCart(prod, primaryVariant, 1);
    setAddedProductId(prod.id);
    setTimeout(() => setAddedProductId(null), 1800);
  };

  // Compute Active Filter Chips
  const activeFilterChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];

    if (searchQuery) {
      chips.push({
        id: 'search',
        label: `Search: "${searchQuery}"`,
        onRemove: () => updateQueryParam({ q: null, search: null })
      });
    }

    if (categorySlug) {
      const catName = facets?.categories.find(c => c.slug === categorySlug)?.name || categorySlug.replace(/-/g, ' ');
      chips.push({
        id: 'category',
        label: `Category: ${catName}`,
        onRemove: () => updateQueryParam({ category: null, subcategory: null })
      });
    }

    if (subcategorySlug) {
      chips.push({
        id: 'subcategory',
        label: `Subcategory: ${subcategorySlug.replace(/-/g, ' ')}`,
        onRemove: () => updateQueryParam({ subcategory: null })
      });
    }

    selectedBrands.forEach(bSlug => {
      const bName = facets?.brands.find(b => b.slug === bSlug)?.name || bSlug;
      chips.push({
        id: `brand-${bSlug}`,
        label: `Brand: ${bName}`,
        onRemove: () => handleBrandToggle(bSlug)
      });
    });

    if (minPriceParam || maxPriceParam) {
      let priceLabel = 'Price: ';
      if (minPriceParam && maxPriceParam) {
        priceLabel += `₹${parseInt(minPriceParam, 10).toLocaleString('en-IN')} - ₹${parseInt(maxPriceParam, 10).toLocaleString('en-IN')}`;
      } else if (minPriceParam) {
        priceLabel += `Over ₹${parseInt(minPriceParam, 10).toLocaleString('en-IN')}`;
      } else {
        priceLabel += `Under ₹${parseInt(maxPriceParam, 10).toLocaleString('en-IN')}`;
      }
      chips.push({
        id: 'price',
        label: priceLabel,
        onRemove: () => {
          setInputMinPrice('');
          setInputMaxPrice('');
          updateQueryParam({ min_price: null, max_price: null });
        }
      });
    }

    if (minDiscountParam) {
      chips.push({
        id: 'discount',
        label: `Min ${minDiscountParam}% Off`,
        onRemove: () => updateQueryParam({ min_discount: null, discount_min: null })
      });
    }

    if (availabilityParam) {
      chips.push({
        id: 'availability',
        label: availabilityParam === 'in_stock' ? 'In Stock Only' : 'Out of Stock Only',
        onRemove: () => updateQueryParam({ availability: null })
      });
    }

    Object.entries(selectedAttributes).forEach(([attrSlug, vals]: [string, string[]]) => {
      if (vals) {
        vals.forEach((val: string) => {
          chips.push({
            id: `attr-${attrSlug}-${val}`,
            label: `${attrSlug.charAt(0).toUpperCase() + attrSlug.slice(1)}: ${val}`,
            onRemove: () => handleAttributeToggle(attrSlug, val)
          });
        });
      }
    });

    return chips;
  }, [
    searchQuery,
    categorySlug,
    subcategorySlug,
    selectedBrands,
    minPriceParam,
    maxPriceParam,
    minDiscountParam,
    availabilityParam,
    selectedAttributes,
    facets,
    updateQueryParam
  ]);

  const hasActiveFilters = activeFilterChips.length > 0;

  // Sidebar Filter Component (used in desktop and mobile drawer)
  const renderFilterSidebar = () => (
    <div className="space-y-6">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
        <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-neutral-700" />
          <span>Refine Catalog</span>
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearAllFilters}
            className="text-xs text-neutral-600 hover:text-neutral-900 font-semibold flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* Categories Facet */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-neutral-500" />
            <span>Categories</span>
          </span>
          {categorySlug && (
            <button
              onClick={() => updateQueryParam({ category: null, subcategory: null })}
              className="text-[11px] lowercase text-neutral-500 hover:text-neutral-900"
            >
              Clear
            </button>
          )}
        </h4>

        <div className="space-y-1 text-xs">
          <button
            onClick={() => updateQueryParam({ category: null, subcategory: null })}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
              !categorySlug ? 'bg-neutral-900 text-white font-semibold shadow-sm' : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <span>All Categories</span>
            <span className={`text-[11px] ${!categorySlug ? 'text-neutral-300' : 'text-neutral-400'}`}>
              {facets ? facets.categories.reduce((acc, c) => acc + c.count, 0) : ''}
            </span>
          </button>

          {/* Render category tree with subcategories if available */}
          {facets?.categories.map((cat) => {
            const isCatActive = categorySlug === cat.slug;
            const treeCat = categoriesTree.find(c => c.slug === cat.slug);
            const hasSubcategories = treeCat && treeCat.subcategories && treeCat.subcategories.length > 0;

            return (
              <div key={`facet-cat-${cat.id}`} className="space-y-0.5">
                <button
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    isCatActive && !subcategorySlug
                      ? 'bg-neutral-900 text-white font-semibold shadow-sm'
                      : isCatActive
                      ? 'bg-neutral-100 text-neutral-900 font-semibold'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className={`text-[11px] ${isCatActive && !subcategorySlug ? 'text-neutral-300' : 'text-neutral-400'}`}>
                    {cat.count}
                  </span>
                </button>

                {/* Subcategories list if category is selected or expanded */}
                {isCatActive && hasSubcategories && (
                  <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-neutral-200 ml-3">
                    {treeCat.subcategories.map((sub) => {
                      const isSubActive = subcategorySlug === sub.slug;
                      return (
                        <button
                          key={`sub-${sub.id}`}
                          onClick={() => handleSubcategorySelect(sub.slug, cat.slug)}
                          className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between transition-colors ${
                            isSubActive
                              ? 'text-emerald-700 font-bold bg-emerald-50'
                              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                          }`}
                        >
                          <span className="truncate">{sub.name}</span>
                          {isSubActive && <Check className="w-3 h-3 text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Brands Facet (Multi-select) */}
      {facets?.brands && facets.brands.length > 0 && (
        <div className="pt-2 border-t border-neutral-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-neutral-500" />
              <span>Brands</span>
            </span>
            {selectedBrands.length > 0 && (
              <button
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.delete('brand');
                  next.delete('brands');
                  next.set('page', '1');
                  setSearchParams(next);
                }}
                className="text-[11px] lowercase text-neutral-500 hover:text-neutral-900"
              >
                Clear
              </button>
            )}
          </h4>

          <div className="space-y-1 text-xs max-h-52 overflow-y-auto pr-1">
            {facets.brands.map((b) => {
              const isChecked = selectedBrands.includes(b.slug);
              return (
                <button
                  key={`facet-brand-${b.id}`}
                  onClick={() => handleBrandToggle(b.slug)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    isChecked
                      ? 'bg-neutral-100 text-neutral-950 font-semibold'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-neutral-900 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-400 shrink-0" />
                    )}
                    <span className="truncate">{b.name}</span>
                  </div>
                  <span className="text-[11px] text-neutral-400 shrink-0">
                    {b.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Range Filter */}
      <div className="pt-2 border-t border-neutral-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-3">
          Price Range (₹)
        </h4>

        {/* Quick Presets */}
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          <button
            type="button"
            onClick={() => handlePricePreset(null, 15000)}
            className="text-[11px] py-1 px-2 border border-neutral-200 hover:border-neutral-900 rounded-md text-neutral-700 hover:text-neutral-900 text-center transition-colors"
          >
            Under ₹15k
          </button>
          <button
            type="button"
            onClick={() => handlePricePreset(15000, 30000)}
            className="text-[11px] py-1 px-2 border border-neutral-200 hover:border-neutral-900 rounded-md text-neutral-700 hover:text-neutral-900 text-center transition-colors"
          >
            ₹15k - ₹30k
          </button>
          <button
            type="button"
            onClick={() => handlePricePreset(30000, 75000)}
            className="text-[11px] py-1 px-2 border border-neutral-200 hover:border-neutral-900 rounded-md text-neutral-700 hover:text-neutral-900 text-center transition-colors"
          >
            ₹30k - ₹75k
          </button>
          <button
            type="button"
            onClick={() => handlePricePreset(75000, null)}
            className="text-[11px] py-1 px-2 border border-neutral-200 hover:border-neutral-900 rounded-md text-neutral-700 hover:text-neutral-900 text-center transition-colors"
          >
            Over ₹75k
          </button>
        </div>

        {/* Custom Min / Max Inputs */}
        <form onSubmit={handleApplyPrice} className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              min="0"
              value={inputMinPrice}
              onChange={(e) => setInputMinPrice(e.target.value)}
              className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
            <span className="text-neutral-400 text-xs">-</span>
            <input
              type="number"
              placeholder="Max"
              min="0"
              value={inputMaxPrice}
              onChange={(e) => setInputMaxPrice(e.target.value)}
              className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs font-semibold transition-colors"
          >
            Apply Price
          </button>
        </form>
      </div>

      {/* Discount Filter */}
      <div className="pt-2 border-t border-neutral-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-neutral-500" />
            <span>Discount</span>
          </span>
          {minDiscountParam && (
            <button
              onClick={() => updateQueryParam({ min_discount: null, discount_min: null })}
              className="text-[11px] lowercase text-neutral-500 hover:text-neutral-900"
            >
              Clear
            </button>
          )}
        </h4>

        <div className="grid grid-cols-2 gap-1.5">
          {['10', '20', '30', '50'].map((disc) => {
            const isSelected = minDiscountParam === disc;
            return (
              <button
                key={`disc-${disc}`}
                onClick={() => handleDiscountSelect(disc)}
                className={`py-1.5 px-2 rounded-md text-xs text-center border transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                    : 'border-neutral-200 text-neutral-700 hover:border-neutral-400 bg-white'
                }`}
              >
                {disc}% & Above
              </button>
            );
          })}
        </div>
      </div>

      {/* Availability Filter (Backed by PostgreSQL Inventory) */}
      {facets?.availability && (
        <div className="pt-2 border-t border-neutral-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-3">
            Availability
          </h4>

          <div className="space-y-1 text-xs">
            <button
              onClick={() => handleAvailabilitySelect('in_stock')}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                availabilityParam === 'in_stock'
                  ? 'bg-neutral-100 text-neutral-900 font-semibold'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {availabilityParam === 'in_stock' ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-neutral-400 shrink-0" />
                )}
                <span>In Stock Only</span>
              </div>
              <span className="text-[11px] text-neutral-400">
                {facets.availability.in_stock}
              </span>
            </button>

            <button
              onClick={() => handleAvailabilitySelect('out_of_stock')}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                availabilityParam === 'out_of_stock'
                  ? 'bg-neutral-100 text-neutral-900 font-semibold'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {availabilityParam === 'out_of_stock' ? (
                  <CheckSquare className="w-4 h-4 text-neutral-900 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-neutral-400 shrink-0" />
                )}
                <span>Out of Stock</span>
              </div>
              <span className="text-[11px] text-neutral-400">
                {facets.availability.out_of_stock}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Product Attributes Facets */}
      {facets?.attributes && facets.attributes.length > 0 && (
        <div className="pt-2 border-t border-neutral-200 space-y-4">
          {facets.attributes.map((attr) => {
            const activeVals = selectedAttributes[attr.slug] || [];
            return (
              <div key={`facet-attr-${attr.slug}`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2.5 flex items-center justify-between">
                  <span>{attr.name}</span>
                  {activeVals.length > 0 && (
                    <button
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.delete(`attribute_${attr.slug}`);
                        next.set('page', '1');
                        setSearchParams(next);
                      }}
                      className="text-[11px] lowercase text-neutral-500 hover:text-neutral-900"
                    >
                      Clear
                    </button>
                  )}
                </h4>

                <div className="flex flex-wrap gap-1.5">
                  {attr.values.map((v) => {
                    const isValSelected = activeVals.includes(v.value);
                    return (
                      <button
                        key={`attr-val-${attr.slug}-${v.value}`}
                        onClick={() => handleAttributeToggle(attr.slug, v.value)}
                        className={`text-xs px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1.5 ${
                          isValSelected
                            ? 'bg-neutral-900 text-white border-neutral-900 font-medium'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        <span>{v.value}</span>
                        <span className={`text-[10px] ${isValSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                          ({v.count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Header & Breadcrumb */}
      <div className="pb-6 border-b border-neutral-200">
        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
          <Link to="/" className="hover:text-neutral-900 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-neutral-400" />
          <Link to="/shop" className="hover:text-neutral-900 transition-colors">Shop Catalog</Link>
          {categorySlug && (
            <>
              <ChevronRight className="w-3 h-3 text-neutral-400" />
              <span className="text-neutral-800 font-medium capitalize">
                {categorySlug.replace(/-/g, ' ')}
              </span>
            </>
          )}
          {subcategorySlug && (
            <>
              <ChevronRight className="w-3 h-3 text-neutral-400" />
              <span className="text-neutral-900 font-semibold capitalize">
                {subcategorySlug.replace(/-/g, ' ')}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              {searchQuery
                ? `Results for "${searchQuery}"`
                : categorySlug
                ? categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                : 'All Products Catalog'}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              {loading ? (
                'Querying database...'
              ) : (
                `Showing ${products.length} of ${totalCount} verified products`
              )}
            </p>
          </div>

          {/* Controls: Sort and View Modes */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowMobileFilter(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              )}
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="shop-sort-select" className="text-xs text-neutral-500 hidden sm:inline font-medium">
                Sort:
              </label>
              <select
                id="shop-sort-select"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-white border border-neutral-300 text-neutral-800 text-xs font-medium rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900 cursor-pointer shadow-sm"
              >
                {searchQuery && (
                  <option value="relevance">Most Relevant</option>
                )}
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="discount_desc">Highest Discount</option>
                <option value="popularity">Popularity & Rating</option>
              </select>
            </div>

            {/* Grid vs List View Mode Toggle */}
            <div className="hidden sm:flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
                title="Grid View"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Badges Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-neutral-100">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Active Filters:
            </span>
            {activeFilterChips.map((chip) => (
              <span
                key={chip.id}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-full border border-neutral-200"
              >
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="hover:text-red-600 transition-colors p-0.5"
                  title="Remove filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={handleClearAllFilters}
              className="text-xs text-red-600 hover:text-red-700 font-semibold ml-1 underline decoration-dotted"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-6">
        
        {/* Left Desktop Sidebar */}
        <aside className="hidden md:block">
          <div className="sticky top-24 bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
            {renderFilterSidebar()}
          </div>
        </aside>

        {/* Right Product Grid Area */}
        <main className="md:col-span-3">
          
          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="border border-neutral-200 rounded-xl p-4 animate-pulse space-y-3">
                  <div className="w-full h-48 bg-neutral-100 rounded-lg"></div>
                  <div className="h-4 bg-neutral-100 rounded w-2/3"></div>
                  <div className="h-4 bg-neutral-100 rounded w-1/3"></div>
                  <div className="h-8 bg-neutral-100 rounded w-full mt-4"></div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && products.length === 0 && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center max-w-lg mx-auto my-8">
              <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">
                No products found
              </h3>
              <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
                {searchQuery
                  ? `We couldn't find any products matching "${searchQuery}". Try checking for typos, using broader terms, or clearing some filters.`
                  : 'No products match your selected combination of filters. Try widening your price range or clearing attribute filters.'}
              </p>
              <button
                onClick={handleClearAllFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}

          {/* Product Items: Grid View */}
          {!loading && products.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const primaryImage = product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
                const discount = product.discount_percent || product.discount_percentage || 0;
                const isOutOfStock = product.stock <= 0 || product.in_stock === false;
                const isAdded = addedProductId === product.id;

                return (
                  <div
                    key={`prod-grid-${product.id}`}
                    className="group bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
                  >
                    {/* Image Stage */}
                    <div className="relative block aspect-square bg-neutral-50 overflow-hidden">
                      <Link to={`/products/${product.slug}`} className="block w-full h-full">
                        <img
                          src={primaryImage}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </Link>

                      {/* Floating Wishlist & Compare Quick Action Buttons */}
                      <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleWishlist(product);
                          }}
                          className={`p-1.5 rounded-full shadow-sm transition-all ${
                            isInWishlist(product.id)
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-white/90 hover:bg-white text-neutral-500 hover:text-rose-600 border border-neutral-200'
                          }`}
                          title={isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isInWishlist(product.id) ? 'fill-rose-600' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleCompare(product);
                          }}
                          className={`p-1.5 rounded-full shadow-sm transition-all ${
                            isInCompare(product.id)
                              ? 'bg-blue-50 text-blue-600 border border-blue-200'
                              : 'bg-white/90 hover:bg-white text-neutral-500 hover:text-blue-600 border border-neutral-200'
                          }`}
                          title={isInCompare(product.id) ? 'Remove from Compare' : 'Compare Product'}
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                        {discount > 0 && (
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                            {Math.round(discount)}% OFF
                          </span>
                        )}
                        {product.is_best_seller && (
                          <span className="bg-amber-500 text-neutral-950 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                            BEST SELLER
                          </span>
                        )}
                        {product.is_new_arrival && !product.is_best_seller && (
                          <span className="bg-neutral-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                            NEW
                          </span>
                        )}
                      </div>

                      {/* Out of stock overlay */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-20">
                          <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-md">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Brand & Category line */}
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mb-1">
                          {product.brand_name && (
                            <span className="font-medium text-neutral-600 uppercase tracking-wider">
                              {product.brand_name}
                            </span>
                          )}
                          {product.brand_name && product.category_name && <span>•</span>}
                          {product.category_name && (
                            <span className="truncate">{product.category_name}</span>
                          )}
                        </div>

                        {/* Title */}
                        <Link
                          to={`/products/${product.slug}`}
                          className="block text-sm font-semibold text-neutral-900 hover:text-emerald-700 transition-colors line-clamp-2"
                        >
                          {product.name}
                        </Link>

                        {/* Rating Foundation */}
                        {product.total_reviews > 0 ? (
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="flex items-center text-amber-500">
                              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-500" />
                              <span className="text-xs font-bold text-neutral-800 ml-1">
                                {product.average_rating.toFixed(1)}
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-400">
                              ({product.total_reviews})
                            </span>
                          </div>
                        ) : (
                          <div className="h-5"></div>
                        )}
                      </div>

                      {/* Pricing & Cart Action */}
                      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-extrabold text-neutral-900">
                              ₹{product.price.toLocaleString('en-IN')}
                            </span>
                            {product.mrp && product.mrp > product.price && (
                              <span className="text-xs text-neutral-400 line-through">
                                ₹{product.mrp.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                          {product.stock > 0 && product.stock <= 5 && (
                            <span className="text-[10px] text-amber-600 font-medium block">
                              Only {product.stock} left in stock
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={isOutOfStock}
                          className={`p-2 rounded-lg transition-all ${
                            isOutOfStock
                              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                              : isAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm'
                          }`}
                          title={isOutOfStock ? 'Item out of stock' : 'Add to cart'}
                        >
                          {isAdded ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <ShoppingBag className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Product Items: List View */}
          {!loading && products.length > 0 && viewMode === 'list' && (
            <div className="space-y-4">
              {products.map((product) => {
                const primaryImage = product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
                const discount = product.discount_percent || product.discount_percentage || 0;
                const isOutOfStock = product.stock <= 0 || product.in_stock === false;
                const isAdded = addedProductId === product.id;

                return (
                  <div
                    key={`prod-list-${product.id}`}
                    className="bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all p-4 flex flex-col sm:flex-row gap-5 items-center"
                  >
                    {/* Thumbnail */}
                    <Link
                      to={`/products/${product.slug}`}
                      className="w-full sm:w-44 h-40 bg-neutral-50 rounded-lg shrink-0 overflow-hidden relative flex items-center justify-center"
                    >
                      <img
                        src={primaryImage}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain p-2 hover:scale-105 transition-transform"
                      />
                      {discount > 0 && (
                        <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          {Math.round(discount)}% OFF
                        </span>
                      )}
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                        {product.brand_name && (
                          <span className="font-semibold text-neutral-700 uppercase">
                            {product.brand_name}
                          </span>
                        )}
                        {product.category_name && <span>• {product.category_name}</span>}
                      </div>

                      <Link
                        to={`/products/${product.slug}`}
                        className="text-base font-bold text-neutral-900 hover:text-emerald-700 transition-colors block"
                      >
                        {product.name}
                      </Link>

                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                        {product.short_description || product.description}
                      </p>

                      {/* Specs / Variants preview if any */}
                      {product.variants && product.variants.length > 1 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[11px] text-neutral-400">Available in:</span>
                          <span className="text-[11px] font-medium text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                            {product.variants.length} options
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price & Add to Cart Column */}
                    <div className="w-full sm:w-48 text-right shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100 flex sm:flex-col items-center sm:items-end justify-between gap-3">
                      <div>
                        <div className="text-lg font-black text-neutral-900">
                          ₹{product.price.toLocaleString('en-IN')}
                        </div>
                        {product.mrp && product.mrp > product.price && (
                          <div className="text-xs text-neutral-400 line-through">
                            MRP ₹{product.mrp.toLocaleString('en-IN')}
                          </div>
                        )}
                        <span className={`text-[11px] font-medium block mt-1 ${isOutOfStock ? 'text-red-500' : 'text-emerald-600'}`}>
                          {isOutOfStock ? 'Out of stock' : 'In Stock'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleWishlist(product)}
                          className={`p-2 rounded-lg border transition-all ${
                            isInWishlist(product.id)
                              ? 'bg-rose-50 text-rose-600 border-rose-200'
                              : 'bg-white hover:bg-neutral-50 text-neutral-600 border-neutral-200'
                          }`}
                          title={isInWishlist(product.id) ? 'In Wishlist' : 'Add to Wishlist'}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isInWishlist(product.id) ? 'fill-rose-600' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCompare(product)}
                          className={`p-2 rounded-lg border transition-all ${
                            isInCompare(product.id)
                              ? 'bg-blue-50 text-blue-600 border-blue-200'
                              : 'bg-white hover:bg-neutral-50 text-neutral-600 border-neutral-200'
                          }`}
                          title={isInCompare(product.id) ? 'In Compare' : 'Add to Compare'}
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={isOutOfStock}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            isOutOfStock
                              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                              : isAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Add to Cart</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Server-Authoritative Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-10 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-neutral-500">
                Page <span className="font-bold text-neutral-800">{currentPage}</span> of{' '}
                <span className="font-bold text-neutral-800">{totalPages}</span> ({totalCount} items)
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    return p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
                  })
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;

                    return (
                      <React.Fragment key={`page-${p}`}>
                        {showEllipsis && (
                          <span className="px-2 text-xs text-neutral-400">...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePageChange(p)}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                            currentPage === p
                              ? 'bg-neutral-900 text-white shadow-sm'
                              : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Drawer Modal */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileFilter(false)}
          ></div>
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-5 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
                <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-neutral-700" />
                  <span>Filters</span>
                </h3>
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {renderFilterSidebar()}
            </div>

            <div className="pt-4 border-t border-neutral-200 mt-6 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowMobileFilter(false)}
                className="w-full py-2.5 bg-neutral-900 text-white text-xs font-bold rounded-lg shadow-md"
              >
                View {totalCount} Products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
