import axios from 'axios';
import { 
  APIResponse, 
  PaginatedData, 
  Product, 
  ProductImage,
  Category, 
  Brand,
  Banner,
  Collection,
  DashboardMetrics, 
  User,
  InventoryItem,
  InventoryTransaction,
  InventorySummary,
  InventoryDetail,
  InventoryAdjustPayload,
  HomepageSection,
  PublicHomepageResponse,
  SearchSuggestionsResponse,
  WishlistItem,
  WishlistResponse,
  CompareItem,
  CompareResponse,
  CartResponse,
  CartItemResponse,
  Address,
  AddressCreatePayload,
  CheckoutPreviewResponse,
  Order,
  OrderCreatePayload,
  OrderListResponse,
  OrderStatus,
  Shipment,
  CustomerTrackingData,
  ShipmentCreatePayload,
  ShipmentUpdatePayload,
  ShipmentStatusUpdatePayload,
  TrackingEventCreatePayload,
  Return,
  ReturnEligibilityData,
  ReturnCreatePayload,
  ReturnApprovePayload,
  ReturnRejectPayload,
  ReturnInspectPayload,
  ReturnStatusUpdatePayload,
  Refund,
  RefundProcessPayload,
  Replacement,
  ReplacementStatusUpdatePayload,
  Review,
  ReviewAggregate,
  ReviewEligibility,
  ReviewCreatePayload,
  ReviewUpdatePayload,
  ProductQuestion,
  ProductAnswer,
  QuestionCreatePayload,
  AnswerCreatePayload,
  UserProfileUpdatePayload,
  PasswordChangePayload,
  AccountDashboard,
  NotificationItem,
  NotificationPreferences,
  SupportTicket,
  SupportMessage,
  SupportTicketDetail,
  SupportTicketCreatePayload,
  CustomerQuestionItem,
  AvailableCouponItem,
  DashboardOverviewResponse,
  AdminCustomerListItem,
  AdminCustomerDetail,
  AdminSearchResults,
  AnalyticsOverviewData,
  AnalyticsSalesResponse,
  AnalyticsOrdersResponse,
  AnalyticsCustomersResponse,
  AnalyticsProductsResponse,
  AnalyticsCategoriesResponse,
  AnalyticsBrandsResponse,
  AnalyticsInventoryResponse,
  AnalyticsPaymentsResponse,
  AnalyticsShippingResponse,
  AnalyticsReturnsResponse,
  AnalyticsPromotionsResponse,
  AnalyticsReviewsResponse,
  AnalyticsSupportResponse,
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, '');

function normalizeApiMediaUrls(value: any): any {
  if (typeof value === 'string' && value.startsWith('/uploads/')) {
    return `${API_ORIGIN}${value}`;
  }
  if (Array.isArray(value)) return value.map(normalizeApiMediaUrls);
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      value[key] = normalizeApiMediaUrls(item);
    });
  }
  return value;
}

function getGuestSessionId(): string {
  let sessionId = localStorage.getItem('guest_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('guest_session_id', sessionId);
  }
  return sessionId;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Attach only server-issued JWT and guest session identity to each request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.headers) {
    config.headers['X-Session-Id'] = getGuestSessionId();
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    response.data = normalizeApiMediaUrls(response.data);
    return response;
  },
  (error) => Promise.reject(error)
);

export const api = {
  // Health
  checkHealth: async () => {
    try {
      const res = await apiClient.get('/health');
      return res.data;
    } catch {
      return { success: false, message: 'Backend warming up' };
    }
  },

  // Auth
  auth: {
    register: async (payload: { email: string; password: string; full_name: string; phone?: string }) => {
      const res = await apiClient.post<APIResponse<{ access_token: string; user: User }>>('/auth/register', payload);
      return res.data;
    },
    login: async (payload: { email: string; password: string }) => {
      const res = await apiClient.post<APIResponse<{ access_token: string; user: User }>>('/auth/login', payload);
      return res.data;
    },
    me: async () => {
      const res = await apiClient.get<APIResponse<User>>('/auth/me');
      return res.data;
    },
  },

  // Customer Homepage
  home: {
    get: async () => {
      const res = await apiClient.get<APIResponse<PublicHomepageResponse>>('/home');
      return res.data;
    },
    subscribeNewsletter: async (email: string) => {
      const res = await apiClient.post<APIResponse<{ id: number; email: string; message: string }>>('/home/newsletter/subscribe', { email });
      return res.data;
    },
  },

  // Customer Collections
  collections: {
    getAll: async () => {
      const res = await apiClient.get<APIResponse<Collection[]>>('/collections');
      return res.data;
    },
    getBySlug: async (slug: string) => {
      const res = await apiClient.get<APIResponse<{
        id: number;
        title: string;
        slug: string;
        description?: string;
        image_url?: string;
        seo_title?: string;
        seo_description?: string;
        products_count: number;
        products: Product[];
      }>>(`/collections/${slug}`);
      return res.data;
    },
  },

  // Categories
  categories: {
    getTree: async () => {
      const res = await apiClient.get<APIResponse<Category[]>>('/categories/tree');
      return res.data;
    },
    getAll: async () => {
      const res = await apiClient.get<APIResponse<Category[]>>('/categories');
      return res.data;
    },
    getBySlug: async (slug: string) => {
      const res = await apiClient.get<APIResponse<Category>>(`/categories/${slug}`);
      return res.data;
    },
  },

  // Brands
  brands: {
    getAll: async (params?: { search?: string }) => {
      const res = await apiClient.get<APIResponse<Brand[]>>('/brands', { params });
      return res.data;
    },
    getBySlug: async (slug: string) => {
      const res = await apiClient.get<APIResponse<Brand>>(`/brands/${slug}`);
      return res.data;
    },
  },

  // Products
  products: {
    getAll: async (params?: {
      category_slug?: string;
      category_id?: number;
      category?: string;
      subcategory_slug?: string;
      subcategory_id?: number;
      subcategory?: string;
      brand_slug?: string;
      brand_id?: number;
      brand?: string;
      brands?: string;
      search?: string;
      q?: string;
      sort_by?: string;
      sort?: string;
      min_price?: number;
      max_price?: number;
      min_discount?: number;
      discount_min?: number;
      availability?: string;
      in_stock?: boolean;
      attributes?: string;
      include_facets?: boolean;
      page?: number;
      limit?: number;
      is_featured?: boolean;
      featured?: boolean;
      is_new_arrival?: boolean;
      new_arrival?: boolean;
      is_best_seller?: boolean;
      best_seller?: boolean;
      is_flash_sale?: boolean;
      status?: string;
      [key: string]: any;
    }) => {
      const res = await apiClient.get<APIResponse<PaginatedData<Product>>>('/products', { params });
      return res.data;
    },
    getSuggestions: async (q: string) => {
      const res = await apiClient.get<APIResponse<SearchSuggestionsResponse>>('/products/suggestions', {
        params: { q }
      });
      return res.data;
    },
    getByIdOrSlug: async (idOrSlug: string | number) => {
      const res = await apiClient.get<APIResponse<Product>>(`/products/${idOrSlug}`);
      return res.data;
    },
    getFlashDeals: async () => {
      const res = await apiClient.get<APIResponse<Product[]>>('/products/flash-deals');
      return res.data;
    },
    getFeatured: async () => {
      const res = await apiClient.get<APIResponse<Product[]>>('/products/featured');
      return res.data;
    },
    getImages: async (slugOrId: string | number) => {
      const res = await apiClient.get<APIResponse<ProductImage[]>>(`/products/${slugOrId}/images`);
      return res.data;
    },
    getRelated: async (slugOrId: string | number, limit: number = 6) => {
      const res = await apiClient.get<APIResponse<Product[]>>(`/products/${slugOrId}/related`, {
        params: { limit }
      });
      return res.data;
    },
    getRecentlyViewed: async (ids: number[]) => {
      if (!ids || ids.length === 0) {
        return { success: true, message: "No IDs provided", data: [] };
      }
      const res = await apiClient.get<APIResponse<Product[]>>('/products/recently-viewed', {
        params: { ids: ids.join(',') }
      });
      return res.data;
    },
  },

  // Wishlist
  wishlist: {
    getAll: async () => {
      const res = await apiClient.get<APIResponse<WishlistResponse>>('/me/wishlist');
      return res.data;
    },
    add: async (productId: number, variantId?: number) => {
      const res = await apiClient.post<APIResponse<WishlistItem>>('/me/wishlist/items', {
        product_id: productId,
        variant_id: variantId
      });
      return res.data;
    },
    remove: async (productId: number) => {
      const res = await apiClient.delete<APIResponse<{ product_id: number; removed: boolean }>>(`/me/wishlist/items/${productId}`);
      return res.data;
    },
    check: async (productId: number) => {
      const res = await apiClient.get<APIResponse<{ product_id: number; in_wishlist: boolean }>>(`/me/wishlist/check/${productId}`);
      return res.data;
    },
  },

  // Compare
  compare: {
    getAll: async () => {
      const res = await apiClient.get<APIResponse<CompareResponse>>('/me/compare');
      return res.data;
    },
    add: async (productId: number) => {
      const res = await apiClient.post<APIResponse<CompareItem>>('/me/compare/items', {
        product_id: productId
      });
      return res.data;
    },
    remove: async (productId: number) => {
      const res = await apiClient.delete<APIResponse<{ product_id: number; removed: boolean }>>(`/me/compare/items/${productId}`);
      return res.data;
    },
    clear: async () => {
      const res = await apiClient.delete<APIResponse<{ cleared_count: number }>>('/me/compare');
      return res.data;
    },
  },

  // Content
  content: {
    getHomepage: async () => {
      const res = await apiClient.get<APIResponse<{
        banners: Banner[];
        featured_categories: Category[];
        flash_sale_products: Product[];
        new_arrivals: Product[];
        best_sellers: Product[];
      }>>('/content/homepage');
      return res.data;
    },
  },

  // Admin APIs
  admin: {
    getDashboard: async () => {
      const res = await apiClient.get<APIResponse<DashboardMetrics>>('/admin/dashboard');
      return res.data;
    },
    getDashboardOverview: async (params?: { period?: string; start_date?: string; end_date?: string }) => {
      const res = await apiClient.get<APIResponse<DashboardOverviewResponse>>('/admin/dashboard/overview', { params });
      return res.data;
    },
    getCustomers: async (params?: { search?: string; status_filter?: string; skip?: number; limit?: number; sort_by?: string }) => {
      const res = await apiClient.get<APIResponse<AdminCustomerListItem[]>>('/admin/customers', { params });
      return res.data;
    },
    getCustomerById: async (id: number) => {
      const res = await apiClient.get<APIResponse<AdminCustomerDetail>>(`/admin/customers/${id}`);
      return res.data;
    },
    updateCustomerStatus: async (id: number, payload: { is_active?: boolean; is_verified?: boolean; role?: string }) => {
      const res = await apiClient.put<APIResponse<AdminCustomerListItem>>(`/admin/customers/${id}/status`, payload);
      return res.data;
    },
    globalSearch: async (q: string) => {
      const res = await apiClient.get<APIResponse<AdminSearchResults>>('/admin/search', { params: { q } });
      return res.data;
    },
    getCoupons: async (params?: { search?: string; is_active?: boolean }) => {
      const res = await apiClient.get<APIResponse<any[]>>('/admin/promotions/coupons', { params });
      return res.data;
    },
    createCoupon: async (payload: any) => {
      const res = await apiClient.post<APIResponse<any>>('/admin/promotions/coupons', payload);
      return res.data;
    },
    updateCoupon: async (id: number, payload: any) => {
      const res = await apiClient.put<APIResponse<any>>(`/admin/promotions/coupons/${id}`, payload);
      return res.data;
    },
    deleteCoupon: async (id: number) => {
      const res = await apiClient.delete<APIResponse<any>>(`/admin/promotions/coupons/${id}`);
      return res.data;
    },
    getOffers: async (params?: { search?: string; is_active?: boolean }) => {
      const res = await apiClient.get<APIResponse<any[]>>('/admin/promotions/offers', { params });
      return res.data;
    },
    createOffer: async (payload: any) => {
      const res = await apiClient.post<APIResponse<any>>('/admin/promotions/offers', payload);
      return res.data;
    },
    deleteOffer: async (id: number) => {
      const res = await apiClient.delete<APIResponse<any>>(`/admin/promotions/offers/${id}`);
      return res.data;
    },
    getFlashSales: async (params?: { status_filter?: string }) => {
      const res = await apiClient.get<APIResponse<any[]>>('/admin/promotions/flash-sales', { params });
      return res.data;
    },
    createFlashSale: async (payload: any) => {
      const res = await apiClient.post<APIResponse<any>>('/admin/promotions/flash-sales', payload);
      return res.data;
    },
    deleteFlashSale: async (id: number) => {
      const res = await apiClient.delete<APIResponse<any>>(`/admin/promotions/flash-sales/${id}`);
      return res.data;
    },
    getProducts: async (params?: { 
      page?: number; 
      limit?: number; 
      search?: string; 
      category_id?: number;
      brand_id?: number;
      status?: string;
      is_featured?: boolean;
      is_new_arrival?: boolean;
      is_best_seller?: boolean;
      stock_filter?: string;
      sort_by?: string;
    }) => {
      const res = await apiClient.get<APIResponse<PaginatedData<Product>>>('/admin/products', { params });
      return res.data;
    },
    getProductById: async (id: number) => {
      const res = await apiClient.get<APIResponse<Product>>(`/admin/products/${id}`);
      return res.data;
    },
    createProduct: async (productData: Partial<Product>) => {
      const res = await apiClient.post<APIResponse<Product>>('/admin/products', productData);
      return res.data;
    },
    updateProduct: async (id: number, productData: Partial<Product>) => {
      const res = await apiClient.put<APIResponse<Product>>(`/admin/products/${id}`, productData);
      return res.data;
    },
    updatePrice: async (id: number, price: number, mrp?: number) => {
      // Direct implementation of Section 19 test case
      const res = await apiClient.put<APIResponse<Product>>(`/admin/products/${id}/price`, { price, mrp });
      return res.data;
    },
    updateStock: async (id: number, stock: number) => {
      const res = await apiClient.put<APIResponse<Product>>(`/admin/products/${id}/stock`, { stock });
      return res.data;
    },
    deleteProduct: async (id: number) => {
      const res = await apiClient.delete<APIResponse<boolean>>(`/admin/products/${id}`);
      return res.data;
    },
    // Product Images Management (Checkpoint 04)
    getProductImages: async (productId: number) => {
      const res = await apiClient.get<APIResponse<ProductImage[]>>(`/admin/products/${productId}/images`);
      return res.data;
    },
    createProductImage: async (productId: number, payload: { image_url: string; alt_text?: string; is_primary?: boolean; sort_order?: number }) => {
      const res = await apiClient.post<APIResponse<ProductImage>>(`/admin/products/${productId}/images`, payload);
      return res.data;
    },
    uploadProductImage: async (productId: number, file: File, options?: { alt_text?: string; is_primary?: boolean; sort_order?: number }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (options?.alt_text) formData.append('alt_text', options.alt_text);
      if (options?.is_primary !== undefined) formData.append('is_primary', String(options.is_primary));
      if (options?.sort_order !== undefined) formData.append('sort_order', String(options.sort_order));

      const res = await apiClient.post<APIResponse<ProductImage>>(`/admin/products/${productId}/images/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    updateProductImage: async (productId: number, imageId: number, payload: Partial<ProductImage>) => {
      const res = await apiClient.put<APIResponse<ProductImage>>(`/admin/products/${productId}/images/${imageId}`, payload);
      return res.data;
    },
    setPrimaryImage: async (productId: number, imageId: number) => {
      const res = await apiClient.put<APIResponse<ProductImage>>(`/admin/products/${productId}/images/${imageId}/primary`);
      return res.data;
    },
    reorderProductImages: async (productId: number, imageIds: number[]) => {
      const res = await apiClient.put<APIResponse<ProductImage[]>>(`/admin/products/${productId}/images/reorder`, { image_ids: imageIds });
      return res.data;
    },
    deleteProductImage: async (productId: number, imageId: number) => {
      const res = await apiClient.delete<APIResponse<boolean>>(`/admin/products/${productId}/images/${imageId}`);
      return res.data;
    },
    getCategories: async (params?: { search?: string; parent_id?: string; status?: string }) => {
      const res = await apiClient.get<APIResponse<Category[]>>('/admin/categories', { params });
      return res.data;
    },
    getCategoryById: async (id: number) => {
      const res = await apiClient.get<APIResponse<Category>>(`/admin/categories/${id}`);
      return res.data;
    },
    createCategory: async (categoryData: Partial<Category>) => {
      const res = await apiClient.post<APIResponse<Category>>('/admin/categories', categoryData);
      return res.data;
    },
    updateCategory: async (id: number, categoryData: Partial<Category>) => {
      const res = await apiClient.put<APIResponse<Category>>(`/admin/categories/${id}`, categoryData);
      return res.data;
    },
    deleteCategory: async (id: number) => {
      const res = await apiClient.delete<APIResponse<boolean>>(`/admin/categories/${id}`);
      return res.data;
    },
    getBrands: async (params?: { search?: string; status?: string; limit?: number; skip?: number }) => {
      const res = await apiClient.get<APIResponse<Brand[]>>('/admin/brands', { params });
      return res.data;
    },
    getBrandById: async (id: number) => {
      const res = await apiClient.get<APIResponse<Brand>>(`/admin/brands/${id}`);
      return res.data;
    },
    createBrand: async (brandData: Partial<Brand>) => {
      const res = await apiClient.post<APIResponse<Brand>>('/admin/brands', brandData);
      return res.data;
    },
    updateBrand: async (id: number, brandData: Partial<Brand>) => {
      const res = await apiClient.put<APIResponse<Brand>>(`/admin/brands/${id}`, brandData);
      return res.data;
    },
    deleteBrand: async (id: number) => {
      const res = await apiClient.delete<APIResponse<boolean>>(`/admin/brands/${id}`);
      return res.data;
    },
    // Banners Management
    getBanners: async (params?: { banner_type?: string; is_active?: boolean }) => {
      const res = await apiClient.get<APIResponse<Banner[]>>('/admin/banners', { params });
      return res.data;
    },
    getBannerById: async (id: number) => {
      const res = await apiClient.get<APIResponse<Banner>>(`/admin/banners/${id}`);
      return res.data;
    },
    createBanner: async (bannerData: Partial<Banner>) => {
      const res = await apiClient.post<APIResponse<Banner>>('/admin/banners', bannerData);
      return res.data;
    },
    updateBanner: async (id: number, bannerData: Partial<Banner>) => {
      const res = await apiClient.put<APIResponse<Banner>>(`/admin/banners/${id}`, bannerData);
      return res.data;
    },
    toggleBannerStatus: async (id: number, isActive: boolean) => {
      const res = await apiClient.put<APIResponse<Banner>>(`/admin/banners/${id}/status`, { is_active: isActive });
      return res.data;
    },
    reorderBanners: async (items: Array<{ id: number; sort_order: number }>) => {
      const res = await apiClient.put<APIResponse<Banner[]>>('/admin/banners/reorder', { items });
      return res.data;
    },
    deleteBanner: async (id: number) => {
      const res = await apiClient.delete<APIResponse<boolean>>(`/admin/banners/${id}`);
      return res.data;
    },
    // Homepage CMS Management
    homepage: {
      getSections: async () => {
        const res = await apiClient.get<APIResponse<HomepageSection[]>>('/admin/homepage/sections');
        return res.data;
      },
      getSectionById: async (id: number) => {
        const res = await apiClient.get<APIResponse<HomepageSection>>(`/admin/homepage/sections/${id}`);
        return res.data;
      },
      createSection: async (payload: Partial<HomepageSection> & { item_ids?: number[]; items_data?: any[] }) => {
        const res = await apiClient.post<APIResponse<HomepageSection>>('/admin/homepage/sections', payload);
        return res.data;
      },
      updateSection: async (id: number, payload: Partial<HomepageSection> & { item_ids?: number[]; items_data?: any[] }) => {
        const res = await apiClient.put<APIResponse<HomepageSection>>(`/admin/homepage/sections/${id}`, payload);
        return res.data;
      },
      toggleSectionStatus: async (id: number, isActive: boolean) => {
        const res = await apiClient.put<APIResponse<HomepageSection>>(`/admin/homepage/sections/${id}/status`, { is_active: isActive });
        return res.data;
      },
      reorderSections: async (items: Array<{ id: number; sort_order: number }>) => {
        const res = await apiClient.put<APIResponse<HomepageSection[]>>('/admin/homepage/sections/reorder', { items });
        return res.data;
      },
      deleteSection: async (id: number) => {
        const res = await apiClient.delete<APIResponse<boolean>>(`/admin/homepage/sections/${id}`);
        return res.data;
      },
    },
    // Collections Management
    collections: {
      getCollections: async (params?: { search?: string; is_active?: boolean }) => {
        const res = await apiClient.get<APIResponse<Collection[]>>('/admin/collections', { params });
        return res.data;
      },
      getCollectionById: async (id: number) => {
        const res = await apiClient.get<APIResponse<Collection>>(`/admin/collections/${id}`);
        return res.data;
      },
      searchProducts: async (q?: string, limit: number = 20) => {
        const res = await apiClient.get<APIResponse<Array<{
          id: number;
          name: string;
          slug: string;
          sku: string;
          price: number;
          sale_price?: number;
          stock: number;
          is_active: boolean;
          image_url?: string;
        }>>>('/admin/collections/products/search', { params: { q, limit } });
        return res.data;
      },
      createCollection: async (payload: Partial<Collection> & { product_ids?: number[] }) => {
        const res = await apiClient.post<APIResponse<Collection>>('/admin/collections', payload);
        return res.data;
      },
      updateCollection: async (id: number, payload: Partial<Collection> & { product_ids?: number[] }) => {
        const res = await apiClient.put<APIResponse<Collection>>(`/admin/collections/${id}`, payload);
        return res.data;
      },
      toggleCollectionStatus: async (id: number, isActive: boolean) => {
        const res = await apiClient.put<APIResponse<Collection>>(`/admin/collections/${id}/status`, { is_active: isActive });
        return res.data;
      },
      reorderCollections: async (items: Array<{ id: number; sort_order: number }>) => {
        const res = await apiClient.put<APIResponse<Collection[]>>('/admin/collections/reorder', { items });
        return res.data;
      },
      deleteCollection: async (id: number) => {
        const res = await apiClient.delete<APIResponse<boolean>>(`/admin/collections/${id}`);
        return res.data;
      },
    },
    // Inventory Management
    getInventorySummary: async () => {
      const res = await apiClient.get<APIResponse<InventorySummary>>('/admin/inventory/summary');
      return res.data;
    },
    getInventoryList: async (params?: {
      page?: number;
      page_size?: number;
      search?: string;
      category_id?: number;
      brand_id?: number;
      stock_status?: string;
      is_active?: boolean;
      sort_by?: string;
      sort_order?: string;
    }) => {
      const res = await apiClient.get<APIResponse<PaginatedData<InventoryItem>>>('/admin/inventory', { params });
      return res.data;
    },
    getInventoryById: async (id: number) => {
      const res = await apiClient.get<APIResponse<InventoryDetail>>(`/admin/inventory/${id}`);
      return res.data;
    },
    adjustInventory: async (id: number, payload: InventoryAdjustPayload) => {
      const res = await apiClient.post<APIResponse<InventoryItem>>(`/admin/inventory/${id}/adjust`, payload);
      return res.data;
    },
    updateInventory: async (id: number, payload: { low_stock_threshold?: number; is_active?: boolean }) => {
      const res = await apiClient.put<APIResponse<InventoryItem>>(`/admin/inventory/${id}`, payload);
      return res.data;
    },
    getInventoryTransactions: async (id: number, params?: { page?: number; page_size?: number }) => {
      const res = await apiClient.get<APIResponse<PaginatedData<InventoryTransaction>>>(`/admin/inventory/${id}/transactions`, { params });
      return res.data;
    },
  },

  // Customer Cart Management
  cart: {
    getCart: async () => {
      const res = await apiClient.get<APIResponse<CartResponse>>('/me/cart');
      return res.data;
    },
    addItem: async (productId: number, variantId?: number | null, quantity: number = 1) => {
      const res = await apiClient.post<APIResponse<CartResponse>>('/me/cart/items', {
        product_id: productId,
        variant_id: variantId || null,
        quantity,
      });
      return res.data;
    },
    updateQuantity: async (itemId: number, quantity: number) => {
      const res = await apiClient.put<APIResponse<CartResponse>>(`/me/cart/items/${itemId}`, {
        quantity,
      });
      return res.data;
    },
    removeItem: async (itemId: number) => {
      const res = await apiClient.delete<APIResponse<CartResponse>>(`/me/cart/items/${itemId}`);
      return res.data;
    },
    clearCart: async () => {
      const res = await apiClient.delete<APIResponse<CartResponse>>('/me/cart');
      return res.data;
    },
  },

  // Customer Address Management
  addresses: {
    list: async () => {
      const res = await apiClient.get<APIResponse<Address[]>>('/me/addresses');
      return res.data;
    },
    create: async (payload: AddressCreatePayload) => {
      const res = await apiClient.post<APIResponse<Address>>('/me/addresses', payload);
      return res.data;
    },
    getById: async (addressId: number) => {
      const res = await apiClient.get<APIResponse<Address>>(`/me/addresses/${addressId}`);
      return res.data;
    },
    update: async (addressId: number, payload: Partial<AddressCreatePayload>) => {
      const res = await apiClient.put<APIResponse<Address>>(`/me/addresses/${addressId}`, payload);
      return res.data;
    },
    delete: async (addressId: number) => {
      const res = await apiClient.delete<APIResponse<{ address_id: number; deleted: boolean }>>(`/me/addresses/${addressId}`);
      return res.data;
    },
    setDefault: async (addressId: number) => {
      const res = await apiClient.put<APIResponse<Address>>(`/me/addresses/${addressId}/default`);
      return res.data;
    },
  },

  // Checkout Preview
  checkout: {
    preview: async (addressId: number) => {
      const res = await apiClient.post<APIResponse<CheckoutPreviewResponse>>('/me/checkout/preview', {
        address_id: addressId,
      });
      return res.data;
    },
  },

  // Customer Order Management
  orders: {
    create: async (payload: OrderCreatePayload) => {
      const res = await apiClient.post<APIResponse<Order>>('/me/orders', payload);
      return res.data;
    },
    list: async (page: number = 1, pageSize: number = 20) => {
      const res = await apiClient.get<APIResponse<OrderListResponse>>('/me/orders', {
        params: { page, page_size: pageSize },
      });
      return res.data;
    },
    getById: async (orderId: number) => {
      const res = await apiClient.get<APIResponse<Order>>(`/me/orders/${orderId}`);
      return res.data;
    },
    getPayment: async (orderId: number) => {
      const res = await apiClient.get<APIResponse<any>>(`/me/orders/${orderId}/payment`);
      return res.data;
    },
    getShipment: async (orderId: number) => {
      const res = await apiClient.get<APIResponse<Shipment | null>>(`/me/orders/${orderId}/shipment`);
      return res.data;
    },
    getTracking: async (orderId: number) => {
      const res = await apiClient.get<APIResponse<CustomerTrackingData>>(`/me/orders/${orderId}/tracking`);
      return res.data;
    },
    getReturnEligibility: async (orderId: number) => {
      const res = await apiClient.get<APIResponse<ReturnEligibilityData>>(`/me/orders/${orderId}/return-eligibility`);
      return res.data;
    },
    createReturn: async (orderId: number, payload: ReturnCreatePayload) => {
      const res = await apiClient.post<APIResponse<Return>>(`/me/orders/${orderId}/returns`, payload);
      return res.data;
    },
  },

  // Customer Returns Management
  returns: {
    list: async (params?: { page?: number; page_size?: number }) => {
      const res = await apiClient.get<APIResponse<{ items: Return[]; total: number; page: number; page_size: number }>>('/me/returns', { params });
      return res.data;
    },
    getById: async (returnId: number) => {
      const res = await apiClient.get<APIResponse<Return>>(`/me/returns/${returnId}`);
      return res.data;
    },
    cancel: async (returnId: number, reason?: string) => {
      const res = await apiClient.post<APIResponse<Return>>(`/me/returns/${returnId}/cancel`, { reason });
      return res.data;
    },
    getRefund: async (returnId: number) => {
      const res = await apiClient.get<APIResponse<Refund | null>>(`/me/returns/${returnId}/refund`);
      return res.data;
    },
    getReplacement: async (returnId: number) => {
      const res = await apiClient.get<APIResponse<Replacement | null>>(`/me/returns/${returnId}/replacement`);
      return res.data;
    },
  },

  // Admin Order Management
  adminOrders: {
    list: async (params?: {
      page?: number;
      page_size?: number;
      status?: string;
      payment_status?: string;
      search?: string;
      start_date?: string;
      end_date?: string;
    }) => {
      const res = await apiClient.get<APIResponse<OrderListResponse>>('/admin/orders', { params });
      return res.data;
    },
    getById: async (orderId: number) => {
      const res = await apiClient.get<APIResponse<Order>>(`/admin/orders/${orderId}`);
      return res.data;
    },
    updateStatus: async (orderId: number, status: OrderStatus, reason?: string, notes?: string) => {
      const res = await apiClient.put<APIResponse<Order>>(`/admin/orders/${orderId}/status`, {
        status,
        reason,
        notes,
      });
      return res.data;
    },
    createShipment: async (orderId: number, payload?: ShipmentCreatePayload) => {
      const res = await apiClient.post<APIResponse<any>>(`/admin/orders/${orderId}/shipment`, payload || {});
      return res.data;
    },
  },

  // Admin Returns Management
  adminReturns: {
    list: async (params?: {
      page?: number;
      page_size?: number;
      status?: string;
      resolution_type?: string;
      search?: string;
    }) => {
      const res = await apiClient.get<APIResponse<{ items: Return[]; total: number; page: number; page_size: number }>>('/admin/returns', { params });
      return res.data;
    },
    getById: async (returnId: number) => {
      const res = await apiClient.get<APIResponse<Return>>(`/admin/returns/${returnId}`);
      return res.data;
    },
    approve: async (returnId: number, payload?: ReturnApprovePayload) => {
      const res = await apiClient.put<APIResponse<Return>>(`/admin/returns/${returnId}/approve`, payload || {});
      return res.data;
    },
    reject: async (returnId: number, payload: ReturnRejectPayload) => {
      const res = await apiClient.put<APIResponse<Return>>(`/admin/returns/${returnId}/reject`, payload);
      return res.data;
    },
    inspect: async (returnId: number, payload: ReturnInspectPayload) => {
      const res = await apiClient.post<APIResponse<Return>>(`/admin/returns/${returnId}/inspect`, payload);
      return res.data;
    },
    updateStatus: async (returnId: number, payload: ReturnStatusUpdatePayload) => {
      const res = await apiClient.put<APIResponse<Return>>(`/admin/returns/${returnId}/status`, payload);
      return res.data;
    },
    createRefund: async (returnId: number, payload?: { amount?: number; reason?: string }) => {
      const res = await apiClient.post<APIResponse<Refund>>(`/admin/returns/${returnId}/create-refund`, payload || {});
      return res.data;
    },
    createReplacement: async (returnId: number, payload?: any) => {
      const res = await apiClient.post<APIResponse<Replacement>>(`/admin/returns/${returnId}/create-replacement`, payload || {});
      return res.data;
    },
  },

  // Admin Refunds Management
  adminRefunds: {
    list: async (params?: {
      page?: number;
      page_size?: number;
      status?: string;
      search?: string;
    }) => {
      const res = await apiClient.get<APIResponse<{ items: Refund[]; total: number; page: number; page_size: number }>>('/admin/refunds', { params });
      return res.data;
    },
    getById: async (refundId: number) => {
      const res = await apiClient.get<APIResponse<Refund>>(`/admin/refunds/${refundId}`);
      return res.data;
    },
    process: async (refundId: number, payload?: RefundProcessPayload) => {
      const res = await apiClient.post<APIResponse<Refund>>(`/admin/refunds/${refundId}/process`, payload || {});
      return res.data;
    },
  },

  // Admin Replacements Management
  adminReplacements: {
    list: async (params?: {
      page?: number;
      page_size?: number;
      status?: string;
      search?: string;
    }) => {
      const res = await apiClient.get<APIResponse<{ items: Replacement[]; total: number; page: number; page_size: number }>>('/admin/replacements', { params });
      return res.data;
    },
    getById: async (replacementId: number) => {
      const res = await apiClient.get<APIResponse<Replacement>>(`/admin/replacements/${replacementId}`);
      return res.data;
    },
    updateStatus: async (replacementId: number, payload: ReplacementStatusUpdatePayload) => {
      const res = await apiClient.put<APIResponse<Replacement>>(`/admin/replacements/${replacementId}/status`, payload);
      return res.data;
    },
  },

  // Admin Shipment Management
  shipments: {
    list: async (params?: {
      page?: number;
      page_size?: number;
      status?: string;
      carrier?: string;
      search?: string;
    }) => {
      const res = await apiClient.get<APIResponse<{ items: Shipment[]; total: number; page: number; page_size: number }>>('/admin/shipments', { params });
      return res.data;
    },
    getById: async (shipmentId: number) => {
      const res = await apiClient.get<APIResponse<Shipment>>(`/admin/shipments/${shipmentId}`);
      return res.data;
    },
    getByOrderId: async (orderId: number) => {
      const res = await apiClient.get<APIResponse<Shipment>>(`/me/orders/${orderId}/shipment`);
      return res.data;
    },
    createForOrder: async (orderId: number, payload?: ShipmentCreatePayload) => {
      const res = await apiClient.post<APIResponse<Shipment>>(`/admin/orders/${orderId}/shipment`, payload || {});
      return res.data;
    },
    update: async (shipmentId: number, payload: ShipmentUpdatePayload) => {
      const res = await apiClient.put<APIResponse<any>>(`/admin/shipments/${shipmentId}`, payload);
      return res.data;
    },
    updateStatus: async (shipmentId: number, payload: ShipmentStatusUpdatePayload) => {
      const res = await apiClient.put<APIResponse<any>>(`/admin/shipments/${shipmentId}/status`, payload);
      return res.data;
    },
    addTrackingEvent: async (shipmentId: number, payload: TrackingEventCreatePayload) => {
      const res = await apiClient.post<APIResponse<any>>(`/admin/shipments/${shipmentId}/tracking-events`, payload);
      return res.data;
    },
  },

  // Customer Reviews & Ratings
  reviews: {
    getByProduct: async (
      slugOrId: string | number,
      params?: {
        page?: number;
        limit?: number;
        sort?: 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating' | 'most_helpful';
        rating?: number;
        verified_only?: boolean;
      }
    ) => {
      const res = await apiClient.get<APIResponse<PaginatedData<Review>>>(`/products/${slugOrId}/reviews`, { params });
      return res.data;
    },
    getAggregate: async (slugOrId: string | number) => {
      const res = await apiClient.get<APIResponse<ReviewAggregate>>(`/products/${slugOrId}/reviews/aggregate`);
      return res.data;
    },
    getEligibility: async (slugOrId: string | number) => {
      const res = await apiClient.get<APIResponse<ReviewEligibility>>(`/products/${slugOrId}/reviews/eligibility`);
      return res.data;
    },
    create: async (slugOrId: string | number, payload: ReviewCreatePayload) => {
      const res = await apiClient.post<APIResponse<Review>>(`/products/${slugOrId}/reviews`, payload);
      return res.data;
    },
    voteHelpful: async (reviewId: number) => {
      const res = await apiClient.post<APIResponse<{ review_id: number; helpful_count: number; voted: boolean; message: string }>>(`/products/reviews/${reviewId}/helpful`);
      return res.data;
    },
    getMyReviews: async (params?: { page?: number; limit?: number }) => {
      const res = await apiClient.get<APIResponse<PaginatedData<Review>>>('/me/reviews', { params });
      return res.data;
    },
    updateMyReview: async (reviewId: number, payload: ReviewUpdatePayload) => {
      const res = await apiClient.put<APIResponse<Review>>(`/me/reviews/${reviewId}`, payload);
      return res.data;
    },
    deleteMyReview: async (reviewId: number) => {
      const res = await apiClient.delete<APIResponse<{ message: string }>>(`/me/reviews/${reviewId}`);
      return res.data;
    },
  },

  // Product Q&A
  qa: {
    getByProduct: async (slugOrId: string | number, params?: { page?: number; limit?: number }) => {
      const res = await apiClient.get<APIResponse<PaginatedData<ProductQuestion>>>(`/products/${slugOrId}/questions`, { params });
      return res.data;
    },
    askQuestion: async (slugOrId: string | number, payload: QuestionCreatePayload) => {
      const res = await apiClient.post<APIResponse<ProductQuestion>>(`/products/${slugOrId}/questions`, payload);
      return res.data;
    },
    answerQuestion: async (questionId: number, payload: AnswerCreatePayload) => {
      const res = await apiClient.post<APIResponse<ProductAnswer>>(`/products/questions/${questionId}/answers`, payload);
      return res.data;
    },
  },

  // Admin Review Moderation
  adminReviews: {
    list: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
      product_id?: number;
      rating?: number;
      search?: string;
    }) => {
      const res = await apiClient.get<APIResponse<PaginatedData<Review>>>('/admin/reviews', { params });
      return res.data;
    },
    approve: async (reviewId: number) => {
      const res = await apiClient.put<APIResponse<Review>>(`/admin/reviews/${reviewId}/approve`);
      return res.data;
    },
    reject: async (reviewId: number) => {
      const res = await apiClient.put<APIResponse<Review>>(`/admin/reviews/${reviewId}/reject`);
      return res.data;
    },
    hide: async (reviewId: number) => {
      const res = await apiClient.put<APIResponse<Review>>(`/admin/reviews/${reviewId}/hide`);
      return res.data;
    },
    updateStatus: async (reviewId: number, status: string, note?: string) => {
      const res = await apiClient.put<APIResponse<Review>>(`/admin/reviews/${reviewId}/status`, { status, moderation_note: note });
      return res.data;
    },
    delete: async (reviewId: number) => {
      const res = await apiClient.delete<APIResponse<{ message: string }>>(`/admin/reviews/${reviewId}`);
      return res.data;
    },
  },

  // Admin Product Q&A Management
  adminQA: {
    listQuestions: async (params?: { page?: number; limit?: number; status?: string; product_id?: number }) => {
      const res = await apiClient.get<APIResponse<PaginatedData<ProductQuestion>>>('/admin/questions', { params });
      return res.data;
    },
    approveQuestion: async (questionId: number) => {
      const res = await apiClient.put<APIResponse<ProductQuestion>>(`/admin/questions/${questionId}/approve`);
      return res.data;
    },
    rejectQuestion: async (questionId: number) => {
      const res = await apiClient.put<APIResponse<ProductQuestion>>(`/admin/questions/${questionId}/reject`);
      return res.data;
    },
    answerQuestion: async (questionId: number, payload: AnswerCreatePayload) => {
      const res = await apiClient.post<APIResponse<ProductAnswer>>(`/admin/questions/${questionId}/answers`, payload);
      return res.data;
    },
    deleteQuestion: async (questionId: number) => {
      const res = await apiClient.delete<APIResponse<{ message: string }>>(`/admin/questions/${questionId}`);
      return res.data;
    },
    deleteAnswer: async (answerId: number) => {
      const res = await apiClient.delete<APIResponse<{ message: string }>>(`/admin/questions/answers/${answerId}`);
      return res.data;
    },
  },

  // Customer Account & Profile
  account: {
    getProfile: async () => {
      const res = await apiClient.get<APIResponse<User>>('/me/profile');
      return res.data;
    },
    updateProfile: async (payload: UserProfileUpdatePayload) => {
      const res = await apiClient.put<APIResponse<User>>('/me/profile', payload);
      return res.data;
    },
    changePassword: async (payload: PasswordChangePayload) => {
      const res = await apiClient.put<APIResponse<{ message: string }>>('/me/password', payload);
      return res.data;
    },
    getDashboard: async () => {
      const res = await apiClient.get<APIResponse<AccountDashboard>>('/me/dashboard');
      return res.data;
    },
    getCoupons: async () => {
      const res = await apiClient.get<APIResponse<AvailableCouponItem[]>>('/me/coupons');
      return res.data;
    },
    getQuestions: async (params?: { page?: number; page_size?: number }) => {
      const res = await apiClient.get<APIResponse<{ items: CustomerQuestionItem[]; total: number; page: number; page_size: number }>>('/me/questions', { params });
      return res.data;
    },
    deleteQuestion: async (questionId: number) => {
      const res = await apiClient.delete<APIResponse<{ message: string }>>(`/me/questions/${questionId}`);
      return res.data;
    },
  },

  // Customer Notifications
  notifications: {
    list: async (params?: { is_read?: boolean; page?: number; page_size?: number }) => {
      const res = await apiClient.get<APIResponse<{ items: NotificationItem[]; total: number; unread_count: number; page: number; page_size: number }>>('/me/notifications', { params });
      return res.data;
    },
    getUnreadCount: async () => {
      const res = await apiClient.get<APIResponse<{ unread_count: number }>>('/me/notifications/unread-count');
      return res.data;
    },
    markAsRead: async (notificationId: number) => {
      const res = await apiClient.put<APIResponse<NotificationItem>>(`/me/notifications/${notificationId}/read`);
      return res.data;
    },
    markAllAsRead: async () => {
      const res = await apiClient.put<APIResponse<{ updated_count: number }>>('/me/notifications/read-all');
      return res.data;
    },
    delete: async (notificationId: number) => {
      const res = await apiClient.delete<APIResponse<{ message: string }>>(`/me/notifications/${notificationId}`);
      return res.data;
    },
    getPreferences: async () => {
      const res = await apiClient.get<APIResponse<NotificationPreferences>>('/me/notifications/preferences');
      return res.data;
    },
    updatePreferences: async (payload: Partial<NotificationPreferences>) => {
      const res = await apiClient.put<APIResponse<NotificationPreferences>>('/me/notifications/preferences', payload);
      return res.data;
    },
  },

  // Customer Support & Help Center
  support: {
    listTickets: async (params?: { status?: string; page?: number; page_size?: number }) => {
      const res = await apiClient.get<APIResponse<{ items: SupportTicket[]; total: number; page: number; page_size: number }>>('/me/support/tickets', { params });
      return res.data;
    },
    getTicket: async (ticketId: number) => {
      const res = await apiClient.get<APIResponse<SupportTicketDetail>>(`/me/support/tickets/${ticketId}`);
      return res.data;
    },
    createTicket: async (payload: SupportTicketCreatePayload) => {
      const res = await apiClient.post<APIResponse<SupportTicket>>('/me/support/tickets', payload);
      return res.data;
    },
    replyTicket: async (ticketId: number, message: string) => {
      const res = await apiClient.post<APIResponse<SupportMessage>>(`/me/support/tickets/${ticketId}/messages`, { message });
      return res.data;
    },
    closeTicket: async (ticketId: number) => {
      const res = await apiClient.put<APIResponse<SupportTicket>>(`/me/support/tickets/${ticketId}/close`);
      return res.data;
    },
  },

  // Admin Support Management
  adminSupport: {
    listTickets: async (params?: { status?: string; category?: string; priority?: string; page?: number; page_size?: number }) => {
      const res = await apiClient.get<APIResponse<{ items: SupportTicket[]; total: number; page: number; page_size: number }>>('/admin/support/tickets', { params });
      return res.data;
    },
    getTicket: async (ticketId: number) => {
      const res = await apiClient.get<APIResponse<SupportTicketDetail>>(`/admin/support/tickets/${ticketId}`);
      return res.data;
    },
    updateStatus: async (ticketId: number, status: string) => {
      const res = await apiClient.put<APIResponse<SupportTicket>>(`/admin/support/tickets/${ticketId}/status`, { status });
      return res.data;
    },
    replyTicket: async (ticketId: number, message: string, isInternal: boolean = false) => {
      const res = await apiClient.post<APIResponse<SupportMessage>>(`/admin/support/tickets/${ticketId}/messages`, { message }, { params: { is_internal: isInternal } });
      return res.data;
    },
  },

  // Checkpoint 19 — Analytics & Reports
  analytics: {
    getOverview: async (params?: { period?: string; start_date?: string; end_date?: string }) => {
      const res = await apiClient.get<APIResponse<AnalyticsOverviewData>>('/admin/analytics/overview', { params });
      return res.data;
    },
    getSales: async (params?: { period?: string; start_date?: string; end_date?: string }) => {
      const res = await apiClient.get<APIResponse<AnalyticsSalesResponse>>('/admin/analytics/sales', { params });
      return res.data;
    },
    getOrders: async (params?: { period?: string; start_date?: string; end_date?: string }) => {
      const res = await apiClient.get<APIResponse<AnalyticsOrdersResponse>>('/admin/analytics/orders', { params });
      return res.data;
    },
    getCustomers: async (params?: { period?: string; start_date?: string; end_date?: string; limit?: number }) => {
      const res = await apiClient.get<APIResponse<AnalyticsCustomersResponse>>('/admin/analytics/customers', { params });
      return res.data;
    },
    getProducts: async (params?: { period?: string; start_date?: string; end_date?: string; limit?: number }) => {
      const res = await apiClient.get<APIResponse<AnalyticsProductsResponse>>('/admin/analytics/products', { params });
      return res.data;
    },
    getCategories: async (params?: { period?: string; start_date?: string; end_date?: string }) => {
      const res = await apiClient.get<APIResponse<AnalyticsCategoriesResponse>>('/admin/analytics/categories', { params });
      return res.data;
    },
    getBrands: async (params?: { period?: string; start_date?: string; end_date?: string }) => {
      const res = await apiClient.get<APIResponse<AnalyticsBrandsResponse>>('/admin/analytics/brands', { params });
      return res.data;
    },
    getInventory: async () => {
      const res = await apiClient.get<APIResponse<AnalyticsInventoryResponse>>('/admin/analytics/inventory');
      return res.data;
    },
    getPayments: async (params?: { period?: string; start_date?: string; end_date?: string }) => {
      const res = await apiClient.get<APIResponse<AnalyticsPaymentsResponse>>('/admin/analytics/payments', { params });
      return res.data;
    },
    getShipping: async (params?: { period?: string; start_date?: string; end_date?: string }) => {
      const res = await apiClient.get<APIResponse<AnalyticsShippingResponse>>('/admin/analytics/shipping', { params });
      return res.data;
    },
    getReturns: async (params?: { period?: string; start_date?: string; end_date?: string }) => {
      const res = await apiClient.get<APIResponse<AnalyticsReturnsResponse>>('/admin/analytics/returns', { params });
      return res.data;
    },
    getPromotions: async (params?: { period?: string; start_date?: string; end_date?: string }) => {
      const res = await apiClient.get<APIResponse<AnalyticsPromotionsResponse>>('/admin/analytics/promotions', { params });
      return res.data;
    },
    getReviews: async (params?: { period?: string; start_date?: string; end_date?: string }) => {
      const res = await apiClient.get<APIResponse<AnalyticsReviewsResponse>>('/admin/analytics/reviews', { params });
      return res.data;
    },
    getSupport: async (params?: { period?: string; start_date?: string; end_date?: string }) => {
      const res = await apiClient.get<APIResponse<AnalyticsSupportResponse>>('/admin/analytics/support', { params });
      return res.data;
    },
    downloadCsvReport: async (reportType: string, params?: { period?: string; start_date?: string; end_date?: string }) => {
      const queryParams = new URLSearchParams();
      queryParams.set('report_type', reportType);
      if (params?.period) queryParams.set('period', params.period);
      if (params?.start_date) queryParams.set('start_date', params.start_date);
      if (params?.end_date) queryParams.set('end_date', params.end_date);

      const response = await apiClient.get(`/admin/analytics/export?${queryParams.toString()}`, {
        responseType: 'blob',
      });

      // Extract filename from header if available
      const disposition = response.headers['content-disposition'];
      let filename = `${reportType}_report.csv`;
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Trigger standard browser download
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      return filename;
    },
  },
};

export const cartService = api.cart;
export const addressService = api.addresses;
export const checkoutService = api.checkout;
export const orderService = api.orders;
export const returnService = api.returns;
export const adminOrderService = api.adminOrders;
export const adminReturnService = api.adminReturns;
export const adminRefundService = api.adminRefunds;
export const adminReplacementService = api.adminReplacements;
export const shippingService = api.shipments;
export const reviewService = api.reviews;
export const qaService = api.qa;
export const adminReviewService = api.adminReviews;
export const adminQAService = api.adminQA;
export const accountService = api.account;
export const notificationService = api.notifications;
export const supportService = api.support;
export const adminSupportService = api.adminSupport;
export const analyticsService = api.analytics;





