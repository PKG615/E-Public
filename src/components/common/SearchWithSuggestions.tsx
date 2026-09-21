import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Search, X, Loader2, Tag, Layers, ChevronRight, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { SearchSuggestionsResponse } from '../../types';

export const SearchWithSuggestions: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value with URL when on /shop page
  useEffect(() => {
    if (location.pathname === '/shop') {
      const qParam = searchParams.get('q') || searchParams.get('search') || '';
      setQuery(qParam);
    }
  }, [location.pathname, searchParams]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search suggestions fetch
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.products.getSuggestions(trimmed);
        if (res.success && res.data) {
          setSuggestions(res.data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Failed to fetch search suggestions:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    setIsOpen(false);
    if (trimmed) {
      navigate(`/shop?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/shop');
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleProductClick = (slug: string) => {
    setIsOpen(false);
    navigate(`/products/${slug}`);
  };

  const handleCategoryClick = (catSlug: string) => {
    setIsOpen(false);
    navigate(`/shop?category=${catSlug}`);
  };

  const handleBrandClick = (brandSlug: string) => {
    setIsOpen(false);
    navigate(`/shop?brand=${brandSlug}`);
  };

  const hasResults = suggestions && (
    (suggestions.products && suggestions.products.length > 0) ||
    (suggestions.categories && suggestions.categories.length > 0) ||
    (suggestions.brands && suggestions.brands.length > 0)
  );

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          id="header-search-input"
          type="text"
          placeholder="Search products, brands, models, or categories..."
          value={query}
          onFocus={() => {
            if (query.trim().length >= 2 && suggestions) {
              setIsOpen(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          className="w-full bg-neutral-100 border border-neutral-200 text-neutral-900 text-sm rounded-lg pl-10 pr-24 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all placeholder:text-neutral-400"
        />
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {loading && (
            <Loader2 className="w-3.5 h-3.5 text-neutral-400 animate-spin" />
          )}

          {query && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="submit"
            id="header-search-submit"
            className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown Popover */}
      {isOpen && query.trim().length >= 2 && (
        <div 
          id="search-suggestions-dropdown"
          className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {loading && !suggestions && (
            <div className="p-6 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
              <span>Searching catalog...</span>
            </div>
          )}

          {!loading && !hasResults && (
            <div className="p-6 text-center">
              <p className="text-xs text-neutral-600 font-medium">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-[11px] text-neutral-400 mt-1">Check spelling or try searching for a brand or category.</p>
            </div>
          )}

          {hasResults && (
            <div className="divide-y divide-neutral-100 max-h-[440px] overflow-y-auto">
              
              {/* Matching Categories */}
              {suggestions?.categories && suggestions.categories.length > 0 && (
                <div className="p-2.5">
                  <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-neutral-400" />
                    <span>Categories</span>
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    {suggestions.categories.map((cat) => (
                      <button
                        key={`cat-${cat.id}`}
                        onClick={() => handleCategoryClick(cat.slug)}
                        className="w-full text-left px-2 py-1.5 rounded-md hover:bg-neutral-50 flex items-center justify-between text-xs text-neutral-800 transition-colors group"
                      >
                        <span className="font-medium group-hover:text-emerald-700">{cat.name}</span>
                        <span className="text-[11px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                          {cat.product_count} items
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Brands */}
              {suggestions?.brands && suggestions.brands.length > 0 && (
                <div className="p-2.5">
                  <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-neutral-400" />
                    <span>Brands</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-2 mt-1">
                    {suggestions.brands.map((b) => (
                      <button
                        key={`br-${b.id}`}
                        onClick={() => handleBrandClick(b.slug)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full transition-colors font-medium"
                      >
                        <span>{b.name}</span>
                        <span className="text-[10px] text-neutral-500">({b.product_count})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Products */}
              {suggestions?.products && suggestions.products.length > 0 && (
                <div className="p-2.5">
                  <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Products
                  </div>
                  <div className="space-y-1 mt-0.5">
                    {suggestions.products.map((prod) => (
                      <button
                        key={`prod-${prod.id}`}
                        onClick={() => handleProductClick(prod.slug)}
                        className="w-full text-left p-2 rounded-lg hover:bg-neutral-50 flex items-center gap-3 transition-colors group"
                      >
                        {/* Thumbnail */}
                        <div className="w-10 h-10 rounded-md bg-neutral-100 border border-neutral-200 shrink-0 overflow-hidden flex items-center justify-center">
                          {prod.image_url ? (
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-full h-full object-contain p-0.5"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Search className="w-4 h-4 text-neutral-300" />
                          )}
                        </div>

                        {/* Title & Metadata */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-neutral-900 truncate group-hover:text-emerald-700">
                            {prod.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                            {prod.brand_name && <span>{prod.brand_name}</span>}
                            {prod.category_name && (
                              <>
                                <span>•</span>
                                <span>{prod.category_name}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Price & Discount */}
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-neutral-900 block">
                            ₹{prod.price.toLocaleString('en-IN')}
                          </span>
                          {prod.discount_percent > 0 && (
                            <span className="text-[10px] font-medium text-emerald-600">
                              {Math.round(prod.discount_percent)}% OFF
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* View All Search Action */}
              <div className="p-2 bg-neutral-50">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full py-2 px-3 text-xs font-semibold text-neutral-800 hover:text-neutral-950 flex items-center justify-center gap-1.5 hover:bg-neutral-100 rounded-md transition-colors"
                >
                  <span>See all search results for &ldquo;{query}&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
