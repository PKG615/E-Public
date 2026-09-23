import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  BarChart3,
  Package, 
  Boxes,
  FolderTree, 
  Award,
  Image as ImageIcon, 
  Layers,
  ShoppingCart, 
  Truck,
  ArrowLeft,
  Database,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  Star,
  LifeBuoy,
  Users,
  Ticket,
  Search,
  X,
  Menu,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AdminSearchResults } from '../../types';

export type AdminTab = 
  | 'dashboard' 
  | 'analytics'
  | 'products' 
  | 'inventory' 
  | 'categories' 
  | 'brands' 
  | 'banners'
  | 'collections' 
  | 'orders' 
  | 'shipments' 
  | 'returns' 
  | 'reviews' 
  | 'support'
  | 'customers'
  | 'marketing';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onExitAdmin: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onExitAdmin,
  children
}) => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AdminSearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'dashboard', label: 'Overview & Sync', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory Control', icon: Boxes },
    { id: 'products', label: 'Product Catalog', icon: Package },
    { id: 'categories', label: 'Category Hierarchy', icon: FolderTree },
    { id: 'brands', label: 'Brand Portfolio', icon: Award },
    { id: 'banners', label: 'Banners & CMS', icon: ImageIcon },
    { id: 'collections', label: 'Curated Collections', icon: Layers },
    { id: 'orders', label: 'Customer Orders', icon: ShoppingCart },
    { id: 'shipments', label: 'Shipping & Delivery', icon: Truck },
    { id: 'returns', label: 'Returns & Refunds', icon: RotateCcw },
    { id: 'reviews', label: 'Reviews & Q&A', icon: Star },
    { id: 'support', label: 'Support & Tickets', icon: LifeBuoy },
    { id: 'customers', label: 'Customer Directory', icon: Users },
    { id: 'marketing', label: 'Marketing & Coupons', icon: Ticket },
  ] as const;

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.admin.globalSearch(searchQuery.trim());
        if (res.success && res.data) {
          setSearchResults(res.data);
          setSearchDropdownOpen(true);
        }
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchResultClick = (type: string) => {
    setSearchDropdownOpen(false);
    setSearchQuery('');
    if (type === 'product') onSelectTab('products');
    else if (type === 'order') onSelectTab('orders');
    else if (type === 'customer') onSelectTab('customers');
    else if (type === 'coupon') onSelectTab('marketing');
    else if (type === 'ticket') onSelectTab('support');
  };

  const totalResultsCount = searchResults 
    ? (searchResults.products?.length || 0) + 
      (searchResults.orders?.length || 0) + 
      (searchResults.customers?.length || 0) + 
      (searchResults.coupons?.length || 0) + 
      (searchResults.tickets?.length || 0)
    : 0;

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      
      {/* Admin Top Header */}
      <header className="bg-neutral-900 text-white border-b border-neutral-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-neutral-950 font-bold flex items-center justify-center text-sm shadow-xs">
            AD
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>Admin Dashboard</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.2 rounded font-mono">
                
              </span>
            </h1>
            <p className="text-[11px] text-neutral-400 hidden sm:block">Buy for the latest design </p>
          </div>
        </div>

        {/* Global Admin Search Bar (Step 28) */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-md mx-2">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults) setSearchDropdownOpen(true); }}
              placeholder="Search products, orders, customers, coupons, tickets..."
              className="w-full bg-neutral-800/90 text-neutral-100 placeholder:text-neutral-500 text-xs pl-9 pr-8 py-2 rounded-xl border border-neutral-700 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {isSearching ? (
              <RefreshCw className="w-3.5 h-3.5 text-neutral-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            ) : searchQuery ? (
              <button 
                onClick={() => { setSearchQuery(''); setSearchResults(null); setSearchDropdownOpen(false); }}
                className="text-neutral-400 hover:text-white absolute right-3 top-1/2 -translate-y-1/2 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Search Dropdown Results */}
          {searchDropdownOpen && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden z-50 text-xs max-h-[70vh] overflow-y-auto">
              <div className="p-2.5 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Search matches for "<strong>{searchQuery}</strong>"</span>
                <span className="font-mono bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">{totalResultsCount} found</span>
              </div>

              {totalResultsCount === 0 ? (
                <div className="p-6 text-center text-neutral-500">
                  No matching records across database.
                </div>
              ) : (
                <div className="p-2 space-y-3">
                  {/* Products */}
                  {searchResults.products?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 px-2 mb-1 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        <span>Products ({searchResults.products.length})</span>
                      </div>
                      <div className="space-y-1">
                        {searchResults.products.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => handleSearchResultClick('product')}
                            className="p-2 rounded-lg hover:bg-neutral-800 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <p className="font-semibold text-neutral-200">{p.title}</p>
                              <p className="text-[11px] text-neutral-400">{p.subtitle}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Orders */}
                  {searchResults.orders?.length > 0 && (
                    <div className="pt-2 border-t border-neutral-800">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-2 mb-1 flex items-center gap-1">
                        <ShoppingCart className="w-3 h-3" />
                        <span>Orders ({searchResults.orders.length})</span>
                      </div>
                      <div className="space-y-1">
                        {searchResults.orders.map(o => (
                          <div 
                            key={o.id}
                            onClick={() => handleSearchResultClick('order')}
                            className="p-2 rounded-lg hover:bg-neutral-800 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <p className="font-semibold text-neutral-200">{o.title}</p>
                              <p className="text-[11px] text-neutral-400">{o.subtitle}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customers */}
                  {searchResults.customers?.length > 0 && (
                    <div className="pt-2 border-t border-neutral-800">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 mb-1 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>Customers ({searchResults.customers.length})</span>
                      </div>
                      <div className="space-y-1">
                        {searchResults.customers.map(c => (
                          <div 
                            key={c.id}
                            onClick={() => handleSearchResultClick('customer')}
                            className="p-2 rounded-lg hover:bg-neutral-800 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <p className="font-semibold text-neutral-200">{c.title}</p>
                              <p className="text-[11px] text-neutral-400">{c.subtitle}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coupons */}
                  {searchResults.coupons?.length > 0 && (
                    <div className="pt-2 border-t border-neutral-800">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-violet-400 px-2 mb-1 flex items-center gap-1">
                        <Ticket className="w-3 h-3" />
                        <span>Coupons ({searchResults.coupons.length})</span>
                      </div>
                      <div className="space-y-1">
                        {searchResults.coupons.map(cp => (
                          <div 
                            key={cp.id}
                            onClick={() => handleSearchResultClick('coupon')}
                            className="p-2 rounded-lg hover:bg-neutral-800 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <p className="font-semibold text-neutral-200">{cp.title}</p>
                              <p className="text-[11px] text-neutral-400">{cp.subtitle}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Support Tickets */}
                  {searchResults.tickets?.length > 0 && (
                    <div className="pt-2 border-t border-neutral-800">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 px-2 mb-1 flex items-center gap-1">
                        <LifeBuoy className="w-3 h-3" />
                        <span>Support Tickets ({searchResults.tickets.length})</span>
                      </div>
                      <div className="space-y-1">
                        {searchResults.tickets.map(t => (
                          <div 
                            key={t.id}
                            onClick={() => handleSearchResultClick('ticket')}
                            className="p-2 rounded-lg hover:bg-neutral-800 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <p className="font-semibold text-neutral-200">{t.title}</p>
                              <p className="text-[11px] text-neutral-400">{t.subtitle}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">

        </div>
      </header>

      {/* Main Admin Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        
        {/* Desktop Sidebar Nav */}
        <aside className="w-60 shrink-0 hidden md:block space-y-1">
          <div className="p-2 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Navigation
            </span>
            <span className="text-[10px] bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full font-bold">
              {navItems.length} Modules
            </span>
          </div>

          <div className="space-y-1 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-neutral-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t border-neutral-200 p-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              Active Operator
            </span>
            <div className="bg-white p-2.5 rounded-lg border border-neutral-200 text-xs shadow-xs">
              <p className="font-bold text-neutral-900">{user?.full_name || 'Admin User'}</p>
              <p className="text-neutral-500 text-[11px] truncate">{user?.email}</p>
              <span className="inline-block mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                ROLE_ADMINISTRATOR
              </span>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 md:hidden flex">
            <div className="bg-white w-72 h-full p-4 flex flex-col justify-between shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                  <span className="font-bold text-neutral-900 text-sm">Admin Navigation</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-neutral-400 hover:text-neutral-900">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-1 overflow-y-auto max-h-[75vh]">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-neutral-900 text-white'
                            : 'text-neutral-600 hover:bg-neutral-100'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-neutral-500'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>

      </div>

    </div>
  );
};
