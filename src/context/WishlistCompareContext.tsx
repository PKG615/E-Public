import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product, WishlistItem, CompareItem } from '../types';
import { api } from '../services/api';

interface WishlistCompareContextType {
  // Wishlist
  wishlistItems: WishlistItem[];
  wishlistCount: number;
  isInWishlist: (productId: number) => boolean;
  addToWishlist: (product: Product, variantId?: number) => Promise<boolean>;
  removeFromWishlist: (productId: number) => Promise<void>;
  toggleWishlist: (product: Product, variantId?: number) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;

  // Compare
  compareItems: CompareItem[];
  compareCount: number;
  isInCompare: (productId: number) => boolean;
  addToCompare: (product: Product) => Promise<boolean>;
  removeFromCompare: (productId: number) => Promise<void>;
  toggleCompare: (product: Product) => Promise<boolean>;
  clearCompare: () => Promise<void>;
  refreshCompare: () => Promise<void>;

  // Recently Viewed Foundation
  recentlyViewedIds: number[];
  recordProductView: (productId: number) => void;

  // Toast notifications
  toast: { message: string; type: 'success' | 'info' | 'warning' | 'error' } | null;
  clearToast: () => void;
}

const WishlistCompareContext = createContext<WishlistCompareContextType | undefined>(undefined);

export const WishlistCompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [compareItems, setCompareItems] = useState<CompareItem[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);

  // Initialize Recently Viewed IDs from localStorage
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('recently_viewed_product_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  // Fetch Wishlist from API
  const refreshWishlist = useCallback(async () => {
    try {
      const res = await api.wishlist.getAll();
      if (res.success && res.data) {
        setWishlistItems(res.data.items || []);
      }
    } catch (e) {
      // If unauthenticated or offline, fallback to empty or keep current
    }
  }, []);

  // Fetch Compare from API
  const refreshCompare = useCallback(async () => {
    try {
      const res = await api.compare.getAll();
      if (res.success && res.data) {
        setCompareItems(res.data.items || []);
      }
    } catch (e) {
      // If error, ignore
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshWishlist();
    refreshCompare();
  }, [refreshWishlist, refreshCompare]);

  // Wishlist Lookups
  const wishlistProductIds = useMemo(() => {
    return new Set(wishlistItems.map((item) => item.product_id));
  }, [wishlistItems]);

  const isInWishlist = useCallback((productId: number) => {
    return wishlistProductIds.has(productId);
  }, [wishlistProductIds]);

  const addToWishlist = useCallback(async (product: Product, variantId?: number): Promise<boolean> => {
    try {
      const res = await api.wishlist.add(product.id, variantId);
      if (res.success && res.data) {
        setWishlistItems((prev) => {
          const filtered = prev.filter((i) => i.product_id !== product.id);
          return [res.data, ...filtered];
        });
        showToast(`Added "${product.name}" to wishlist`, 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not add to wishlist';
      showToast(msg, 'error');
      return false;
    }
  }, [showToast]);

  const removeFromWishlist = useCallback(async (productId: number) => {
    const item = wishlistItems.find((i) => i.product_id === productId);
    try {
      await api.wishlist.remove(productId);
      setWishlistItems((prev) => prev.filter((i) => i.product_id !== productId));
      showToast(`Removed from wishlist`, 'info');
    } catch (err: any) {
      showToast('Could not remove from wishlist', 'error');
    }
  }, [wishlistItems, showToast]);

  const toggleWishlist = useCallback(async (product: Product, variantId?: number): Promise<boolean> => {
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
      return false;
    } else {
      return await addToWishlist(product, variantId);
    }
  }, [isInWishlist, removeFromWishlist, addToWishlist]);

  // Compare Lookups
  const compareProductIds = useMemo(() => {
    return new Set(compareItems.map((item) => item.product_id));
  }, [compareItems]);

  const isInCompare = useCallback((productId: number) => {
    return compareProductIds.has(productId);
  }, [compareProductIds]);

  const addToCompare = useCallback(async (product: Product): Promise<boolean> => {
    if (compareItems.length >= 4 && !isInCompare(product.id)) {
      showToast('Maximum 4 products can be compared at once', 'warning');
      return false;
    }
    try {
      const res = await api.compare.add(product.id);
      if (res.success && res.data) {
        setCompareItems((prev) => {
          const filtered = prev.filter((i) => i.product_id !== product.id);
          return [...filtered, res.data];
        });
        showToast(`Added "${product.name}" to compare`, 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Could not add to compare';
      showToast(msg, 'error');
      return false;
    }
  }, [compareItems.length, isInCompare, showToast]);

  const removeFromCompare = useCallback(async (productId: number) => {
    try {
      await api.compare.remove(productId);
      setCompareItems((prev) => prev.filter((i) => i.product_id !== productId));
      showToast(`Removed from compare list`, 'info');
    } catch {
      showToast('Could not remove from compare', 'error');
    }
  }, [showToast]);

  const toggleCompare = useCallback(async (product: Product): Promise<boolean> => {
    if (isInCompare(product.id)) {
      await removeFromCompare(product.id);
      return false;
    } else {
      return await addToCompare(product);
    }
  }, [isInCompare, removeFromCompare, addToCompare]);

  const clearCompare = useCallback(async () => {
    try {
      await api.compare.clear();
      setCompareItems([]);
      showToast('Compare list cleared', 'info');
    } catch {
      showToast('Could not clear compare list', 'error');
    }
  }, [showToast]);

  // Recently Viewed Foundation
  const recordProductView = useCallback((productId: number) => {
    if (!productId) return;
    setRecentlyViewedIds((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      const updated = [productId, ...filtered].slice(0, 15);
      try {
        localStorage.setItem('recently_viewed_product_ids', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  return (
    <WishlistCompareContext.Provider
      value={{
        wishlistItems,
        wishlistCount: wishlistItems.length,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        refreshWishlist,
        compareItems,
        compareCount: compareItems.length,
        isInCompare,
        addToCompare,
        removeFromCompare,
        toggleCompare,
        clearCompare,
        refreshCompare,
        recentlyViewedIds,
        recordProductView,
        toast,
        clearToast
      }}
    >
      {children}
      {/* Visual Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border bg-slate-900 text-white text-sm animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`w-2 h-2 rounded-full ${
              toast.type === 'success'
                ? 'bg-emerald-400'
                : toast.type === 'warning'
                ? 'bg-amber-400'
                : toast.type === 'error'
                ? 'bg-rose-400'
                : 'bg-blue-400'
            }`}
          />
          <span className="font-medium text-slate-100">{toast.message}</span>
          <button
            onClick={clearToast}
            className="ml-2 text-slate-400 hover:text-white text-xs font-semibold focus:outline-none"
          >
            ✕
          </button>
        </div>
      )}
    </WishlistCompareContext.Provider>
  );
};

export const useWishlistCompare = () => {
  const context = useContext(WishlistCompareContext);
  if (!context) {
    throw new Error('useWishlistCompare must be used within a WishlistCompareProvider');
  }
  return context;
};
