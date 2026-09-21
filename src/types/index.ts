export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: 'customer' | 'admin' | 'manager';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface CategorySummary {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  image_url?: string;
  banner?: string;
  parent_id?: number | null;
  is_active: boolean;
  sort_order: number;
  display_order: number;
  seo_title?: string;
  seo_description?: string;
  products_count?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  image_url?: string;
  banner?: string;
  parent_id?: number | null;
  parent_name?: string | null;
  is_active: boolean;
  sort_order: number;
  display_order: number;
  seo_title?: string;
  seo_description?: string;
  products_count?: number;
  created_at: string;
  updated_at: string;
  subcategories: CategorySummary[];
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  sort_order: number;
  is_active: boolean;
  seo_title?: string;
  seo_description?: string;
  products_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id?: number;
  product_id?: number;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order?: number;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductVariant {
  id?: number;
  sku: string;
  title: string;
  price: number;
  mrp: number;
  stock: number;
  attributes: Record<string, string>;
  image_url?: string;
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description: string;
  short_description?: string;
  category_id: number;
  category_name?: string;
  brand_id?: number;
  brand_name?: string;
  price: number;
  selling_price?: number;
  mrp: number;
  discount_percent: number;
  discount_percentage?: number;
  tax_percent: number;
  tax_percentage?: number;
  stock: number;
  stock_quantity?: number;
  in_stock?: boolean;
  status?: 'draft' | 'active' | 'inactive';
  is_active: boolean;
  is_featured: boolean;
  is_new_arrival?: boolean;
  is_best_seller: boolean;
  is_flash_sale: boolean;
  sort_order?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  video_url?: string;
  warranty?: string;
  warranty_info?: string;
  return_policy?: string;
  specifications: Record<string, string>;
  attributes: Record<string, string[]>;
  seo_title?: string;
  seo_description?: string;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
  variants: ProductVariant[];
  average_rating: number;
  total_reviews: number;
}

export interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  mobile_image_url?: string;
  alt_text?: string;
  link_type?: 'product' | 'category' | 'brand' | 'collection' | 'shop' | 'custom' | string;
  link_target?: string;
  link_url?: string;
  cta_label?: string;
  cta_url?: string;
  banner_type: 'hero' | 'promo' | 'flash_sale' | 'strip' | string;
  is_active: boolean;
  display_order: number;
  start_at?: string;
  end_at?: string;
  starts_at?: string;
  ends_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CollectionProductItem {
  product_id: number;
  sort_order: number;
  name?: string;
  slug?: string;
  sku?: string;
  price?: number;
  sale_price?: number;
  image_url?: string;
  is_active?: boolean;
  stock?: number;
}

export interface Collection {
  id: number;
  title: string;
  slug: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  seo_title?: string;
  seo_description?: string;
  products_count?: number;
  products?: CollectionProductItem[];
  created_at?: string;
  updated_at?: string;
}

export type HomepageSectionType = 
  | 'HERO_BANNER'
  | 'CATEGORY_GRID'
  | 'FEATURED_CATEGORIES'
  | 'FEATURED_PRODUCTS'
  | 'NEW_ARRIVALS'
  | 'BEST_SELLERS'
  | 'TRENDING_PRODUCTS'
  | 'BRANDS'
  | 'COLLECTION'
  | 'OFFER'
  | 'PROMOTIONAL_BANNER'
  | 'TRUST_INFO'
  | 'NEWSLETTER'
  | 'FAQ'
  | 'CUSTOM_CONTENT';

export interface HomepageSectionItem {
  id: number;
  section_id: number;
  item_type: 'product' | 'category' | 'brand' | 'banner' | 'faq' | 'trust_item' | 'custom' | string;
  item_id?: number;
  custom_title?: string;
  custom_content?: string;
  custom_icon?: string;
  custom_url?: string;
  sort_order: number;
  is_active: boolean;
  details?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface HomepageSection {
  id: number;
  section_key: string;
  section_type: HomepageSectionType | string;
  title: string;
  subtitle?: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  starts_at?: string;
  ends_at?: string;
  configuration?: Record<string, any>;
  items?: HomepageSectionItem[];
  created_at?: string;
  updated_at?: string;
}

export interface HomepageSEO {
  title: string;
  meta_description: string;
  og_title?: string;
  og_description?: string;
}

export interface PublicHomepageSection {
  id: number;
  section_key: string;
  section_type: HomepageSectionType | string;
  title: string;
  subtitle?: string;
  description?: string;
  sort_order: number;
  configuration?: Record<string, any>;
  data: {
    banners?: Banner[];
    categories?: Array<{
      id: number;
      name: string;
      slug: string;
      description?: string;
      image_url: string;
      subcategories_count?: number;
      subcategories?: Array<{ id: number; name: string; slug: string }>;
    }>;
    products?: Product[];
    brands?: Array<{
      id: number;
      name: string;
      slug: string;
      description?: string;
      logo_url: string;
      website_url?: string;
    }>;
    collection?: {
      id: number;
      title: string;
      slug: string;
      description?: string;
      image_url?: string;
      products: Product[];
    } | null;
    items?: Array<{
      id: number;
      icon: string;
      title: string;
      content: string;
      url?: string;
    }>;
    faqs?: Array<{
      id: number;
      question: string;
      answer: string;
    }>;
    placeholder?: string;
    button_text?: string;
    disclaimer?: string;
    offer_title?: string;
    offer_badge?: string;
    discount_text?: string;
    cta_label?: string;
    cta_url?: string;
    custom_html?: string;
    custom_text?: string;
    [key: string]: any;
  };
}

export interface PublicHomepageResponse {
  seo: HomepageSEO;
  sections: PublicHomepageSection[];
}

export interface CartItemProductInfo {
  id: number;
  name: string;
  slug: string;
  sku: string;
  brand_name?: string | null;
  category_name?: string | null;
  is_active: boolean;
  status: string;
}

export interface CartItemVariantInfo {
  id: number;
  title: string;
  sku: string;
  attributes?: Record<string, any>;
  is_active: boolean;
}

export interface CartItemResponse {
  id: number;
  cart_id: number;
  product_id: number;
  product: CartItemProductInfo;
  variant_id?: number | null;
  variant?: CartItemVariantInfo | null;
  image?: string | null;
  quantity: number;
  unit_price: number;
  mrp: number;
  discount: number;
  line_subtotal: number;
  available_quantity: number;
  in_stock: boolean;
  price_changed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartResponse {
  id: number;
  user_id?: number | null;
  session_id?: string | null;
  status: string;
  item_count: number;
  items: CartItemResponse[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

export interface Address {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  landmark?: string | null;
  street?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: 'home' | 'work' | 'other' | string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressCreatePayload {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  landmark?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  address_type?: 'home' | 'work' | 'other' | string;
  is_default?: boolean;
}

export interface CheckoutPreviewResponse {
  valid: boolean;
  items: CartItemResponse[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  address?: Address | null;
  warnings: string[];
  errors: string[];
}

export interface CartItem {
  id: string | number; // unique item key or backend id
  product: Product | CartItemProductInfo;
  variant?: ProductVariant | CartItemVariantInfo;
  quantity: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  variant_title?: string;
  sku: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface DashboardMetrics {
  total_revenue: number;
  total_orders: number;
  total_products: number;
  total_customers: number;
  low_stock_products: number;
  recent_orders: Array<{
    id: number;
    order_number: string;
    customer_name: string;
    total_amount: number;
    status: string;
    payment_status: string;
    created_at: string;
  }>;
  sales_trend: Array<{
    day: string;
    sales: number;
    orders: number;
  }>;
}

export interface SalesSummary {
  gross_sales: number;
  discounts: number;
  tax: number;
  shipping: number;
  net_order_value: number;
  paid_amount: number;
  pending_amount: number;
}

export interface OrderStatusBreakdown {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  returned: number;
}

export interface CustomerMetricsSummary {
  total_customers: number;
  active_customers: number;
  new_customers_in_period: number;
  customers_with_orders: number;
  customers_without_orders: number;
}

export interface ProductMetricsSummary {
  total_products: number;
  active_products: number;
  inactive_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  total_inventory_units: number;
}

export interface InventoryAlertItem {
  product_id: number;
  variant_id?: number | null;
  sku: string;
  product_name: string;
  variant_title?: string | null;
  stock: number;
  safety_stock: number;
  status: 'out_of_stock' | 'low_stock';
}

export interface PaymentMetricsSummary {
  total_payments: number;
  paid_count: number;
  pending_count: number;
  failed_count: number;
  refunded_count: number;
  paid_amount: number;
  pending_amount: number;
  failed_amount: number;
  refunded_amount: number;
}

export interface ShippingMetricsSummary {
  total_shipments: number;
  pending: number;
  processing: number;
  packed: number;
  shipped: number;
  in_transit: number;
  out_for_delivery: number;
  delivered: number;
  failed_cancelled: number;
}

export interface ReturnsMetricsSummary {
  total_returns: number;
  pending_returns: number;
  awaiting_inspection: number;
  approved_for_refund: number;
  rejected: number;
  refund_processing: number;
  refunded: number;
  refund_failed: number;
  replacement_processing: number;
  replacement_shipped: number;
}

export interface MarketingMetricsSummary {
  total_coupons: number;
  active_coupons: number;
  expiring_soon_coupons: number;
  total_coupon_usages: number;
  active_offers: number;
  active_flash_sales: number;
}

export interface ModerationMetricsSummary {
  pending_reviews: number;
  approved_reviews: number;
  rejected_reviews: number;
  total_reviews: number;
  pending_questions: number;
  answered_questions: number;
  total_questions: number;
  open_support_tickets: number;
  urgent_support_tickets: number;
  waiting_customer_tickets: number;
  resolved_tickets: number;
}

export interface SalesChartPoint {
  label: string;
  date: string;
  sales: number;
  orders: number;
  average_order_value: number;
}

export interface SalesChartData {
  period: string;
  labels: string[];
  sales: number[];
  orders: number[];
  points: SalesChartPoint[];
}

export interface RecentOrderItem {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
}

export interface TopProductItem {
  product_id: number;
  product_name: string;
  sku: string;
  image_url?: string | null;
  units_sold: number;
  revenue: number;
  order_count: number;
}

export interface CategoryPerformanceItem {
  category_id: number;
  category_name: string;
  product_count: number;
  units_sold: number;
  revenue: number;
}

export interface OperationalAlert {
  id: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  category: string;
  title: string;
  message: string;
  count: number;
  action_label: string;
  action_tab: string;
}

export interface DashboardOverviewResponse {
  period: string;
  sales: SalesSummary;
  orders: OrderStatusBreakdown;
  customers: CustomerMetricsSummary;
  products: ProductMetricsSummary;
  inventory_alerts: InventoryAlertItem[];
  payments: PaymentMetricsSummary;
  shipments: ShippingMetricsSummary;
  returns: ReturnsMetricsSummary;
  marketing: MarketingMetricsSummary;
  moderation: ModerationMetricsSummary;
  chart: SalesChartData;
  recent_orders: RecentOrderItem[];
  top_products: TopProductItem[];
  category_performance: CategoryPerformanceItem[];
  alerts: OperationalAlert[];
}

export interface AdminCustomerListItem {
  id: number;
  email: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  order_count: number;
  total_spent: number;
  last_order_date?: string | null;
}

export interface AdminCustomerDetail {
  id: number;
  email: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  order_count: number;
  total_spent: number;
  addresses: Array<{
    id: number;
    address_type: string;
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    is_default: boolean;
  }>;
  recent_orders: Array<{
    id: number;
    order_number: string;
    total_amount: number;
    status: string;
    payment_status: string;
    created_at: string;
    items_count: number;
  }>;
  wishlist_count: number;
  reviews_count: number;
  returns_count: number;
  support_tickets: Array<{
    id: number;
    ticket_number: string;
    subject: string;
    status: string;
    priority: string;
    created_at: string;
  }>;
}

export interface AdminSearchResultItem {
  id: number;
  title: string;
  subtitle: string;
  type: 'product' | 'order' | 'customer' | 'coupon' | 'ticket';
  link: string;
}

export interface AdminSearchResults {
  products: AdminSearchResultItem[];
  orders: AdminSearchResultItem[];
  customers: AdminSearchResultItem[];
  coupons: AdminSearchResultItem[];
  tickets: AdminSearchResultItem[];
}

export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error_code?: string;
}

export interface FacetCategoryItem {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface FacetBrandItem {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface FacetAttributeValue {
  value: string;
  slug: string;
  count: number;
}

export interface FacetAttribute {
  name: string;
  slug: string;
  values: FacetAttributeValue[];
}

export interface CatalogFacets {
  categories: FacetCategoryItem[];
  brands: FacetBrandItem[];
  price_range: { min: number; max: number };
  availability: { in_stock: number; out_of_stock: number };
  attributes: FacetAttribute[];
}

export interface ProductSuggestionItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  image_url?: string | null;
  category_name?: string | null;
  brand_name?: string | null;
  discount_percent: number;
}

export interface CategorySuggestionItem {
  id: number;
  name: string;
  slug: string;
  product_count: number;
}

export interface BrandSuggestionItem {
  id: number;
  name: string;
  slug: string;
  product_count: number;
}

export interface SearchSuggestionsResponse {
  products: ProductSuggestionItem[];
  categories: CategorySuggestionItem[];
  brands: BrandSuggestionItem[];
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  facets?: CatalogFacets;
}

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type InventoryTransactionType = 'RECEIVE' | 'ADJUSTMENT' | 'RESERVE' | 'RELEASE';

export interface InventoryItem {
  id: number;
  product_id: number;
  variant_id: number | null;
  sku: string;
  on_hand_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  stock_status: StockStatus;
  product_name?: string | null;
  product_slug?: string | null;
  product_image?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  brand_id?: number | null;
  brand_name?: string | null;
  variant_title?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: number;
  inventory_id: number;
  transaction_type: InventoryTransactionType;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reason: string;
  reference_type?: string | null;
  reference_id?: string | null;
  notes?: string | null;
  created_by: string;
  created_at: string;
}

export interface InventorySummary {
  total_items: number;
  in_stock_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_on_hand: number;
  total_reserved: number;
}

export interface InventoryDetail extends InventoryItem {
  transactions: InventoryTransaction[];
}

export interface InventoryAdjustPayload {
  quantity_change: number;
  reason: string;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
}

export interface WishlistItem {
  id: number;
  user_id: number;
  product_id: number;
  variant_id?: number | null;
  created_at: string;
  product: Product;
}

export interface WishlistResponse {
  items: WishlistItem[];
  total_count: number;
}

export interface CompareItem {
  id: number;
  product_id: number;
  created_at: string;
  product: Product;
}

export interface CompareResponse {
  items: CompareItem[];
  total_count: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'cod';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id?: number | null;
  product_name: string;
  variant_title?: string | null;
  sku: string;
  unit_price: number;
  mrp: number;
  discount_amount: number;
  tax_amount: number;
  quantity: number;
  total_price: number;
  line_total: number;
  image_url?: string | null;
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  old_status?: string | null;
  new_status: string;
  changed_by: string;
  reason?: string | null;
  created_at: string;
}

export interface OrderPaymentSummary {
  id: number;
  provider: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
  provider_payment_id?: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  customer_name?: string;
  customer_email?: string;
  address_id?: number | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_provider: string;
  currency: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  shipping_address: Address;
  notes?: string | null;
  placed_at?: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  status_history: OrderStatusHistory[];
  payments: OrderPaymentSummary[];
}

export interface OrderCreatePayload {
  address_id: number;
  payment_method: PaymentMethod;
  payment_provider?: string;
  notes?: string;
  idempotency_key?: string;
}

export interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  page_size: number;
}

export type ShipmentStatus =
  | 'pending'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface ShipmentTrackingEvent {
  id: number;
  shipment_id?: number;
  status: ShipmentStatus | string;
  location?: string | null;
  description: string;
  event_time: string;
  source: string;
  created_at?: string;
}

export interface Shipment {
  id: number;
  order_id: number;
  shipment_number: string;
  carrier?: string | null;
  shipping_method: string;
  tracking_number?: string | null;
  status: ShipmentStatus;
  shipping_cost: number;
  estimated_delivery_date?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  order_number?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  items_count?: number | null;
  tracking_events: ShipmentTrackingEvent[];
}

export interface CustomerTrackingData {
  order_id: number;
  order_number: string;
  order_status: string;
  shipping_address: Partial<Address> & Record<string, any>;
  shipment?: Shipment | null;
  tracking_events: ShipmentTrackingEvent[];
  estimated_delivery_date?: string | null;
  status_message: string;
  items: Array<{
    id: number;
    product_id?: number;
    product_name: string;
    variant_title?: string | null;
    sku: string;
    quantity: number;
    unit_price: number;
    image_url?: string | null;
  }>;
}

export interface ShipmentCreatePayload {
  carrier?: string;
  shipping_method?: string;
  tracking_number?: string;
  estimated_delivery_date?: string;
  notes?: string;
}

export interface ShipmentUpdatePayload {
  carrier?: string;
  shipping_method?: string;
  tracking_number?: string;
  estimated_delivery_date?: string;
  notes?: string;
}

export interface ShipmentStatusUpdatePayload {
  status: ShipmentStatus;
  location?: string;
  description?: string;
}

export interface TrackingEventCreatePayload {
  status: string;
  location?: string;
  description: string;
  source?: string;
  event_time?: string;
}

// -------------------------------------------------------------
// Checkpoint 13: Returns, Refunds, and Replacements Types
// -------------------------------------------------------------
export type ReturnStatus =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'pickup_pending'
  | 'in_transit'
  | 'received'
  | 'inspection'
  | 'approved_for_refund'
  | 'approved_for_replacement'
  | 'refunded'
  | 'replaced'
  | 'completed'
  | 'cancelled'
  | 'closed';

export type ReturnResolutionType = 'refund' | 'replacement';

export type ReturnReason =
  | 'defective'
  | 'damaged'
  | 'wrong_item'
  | 'not_as_expected'
  | 'size_fit_issue'
  | 'quality_issue'
  | 'changed_mind'
  | 'other';

export type ReturnCondition =
  | 'unopened'
  | 'resellable'
  | 'damaged'
  | 'defective'
  | 'missing_parts';

export type RefundStatus =
  | 'requested'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ReplacementStatus =
  | 'requested'
  | 'approved'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface ReturnItem {
  id: number;
  return_id: number;
  order_item_id: number;
  product_id: number;
  variant_id?: number | null;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  refund_amount: number;
  reason: string;
  resolution: ReturnResolutionType;
  condition?: ReturnCondition | null;
  restocked: boolean;
  restocked_at?: string | null;
  image_url?: string | null;
}

export interface ReturnStatusHistory {
  id: number;
  return_id: number;
  old_status?: string | null;
  new_status: string;
  changed_by: string;
  reason?: string | null;
  created_at: string;
}

export interface RefundTransaction {
  id: number;
  refund_id: number;
  transaction_reference: string;
  provider: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
  gateway_response?: string | null;
  created_at: string;
}

export interface Refund {
  id: number;
  refund_number: string;
  return_id?: number | null;
  order_id: number;
  user_id: number;
  amount: number;
  currency: string;
  status: RefundStatus;
  payment_method?: string | null;
  payment_provider?: string | null;
  provider_refund_id?: string | null;
  reason?: string | null;
  approved_by?: string | null;
  processed_by?: string | null;
  processed_at?: string | null;
  created_at: string;
  updated_at: string;
  order_number?: string | null;
  return_number?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  transactions?: RefundTransaction[];
}

export interface ReplacementItem {
  id: number;
  replacement_id: number;
  return_item_id?: number | null;
  product_id: number;
  variant_id?: number | null;
  product_name: string;
  sku: string;
  quantity: number;
  allocated: boolean;
  allocated_at?: string | null;
  image_url?: string | null;
}

export interface ReplacementStatusHistory {
  id: number;
  replacement_id: number;
  old_status?: string | null;
  new_status: string;
  changed_by: string;
  notes?: string | null;
  created_at: string;
}

export interface Replacement {
  id: number;
  replacement_number: string;
  return_id?: number | null;
  order_id: number;
  user_id: number;
  status: ReplacementStatus;
  shipment_id?: number | null;
  tracking_number?: string | null;
  carrier?: string | null;
  notes?: string | null;
  approved_by?: string | null;
  processed_by?: string | null;
  created_at: string;
  updated_at: string;
  order_number?: string | null;
  return_number?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  items: ReplacementItem[];
  status_history: ReplacementStatusHistory[];
  shipment?: Shipment | null;
}

export interface Return {
  id: number;
  return_number: string;
  order_id: number;
  user_id: number;
  status: ReturnStatus;
  reason: ReturnReason;
  resolution_type: ReturnResolutionType;
  customer_note?: string | null;
  admin_note?: string | null;
  pickup_address_json?: string | null;
  pickup_tracking_number?: string | null;
  pickup_carrier?: string | null;
  inspection_condition?: ReturnCondition | null;
  inspection_note?: string | null;
  inspected_by?: string | null;
  inspected_at?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_by?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  order_number?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  total_items_count: number;
  total_refund_amount: number;
  items: ReturnItem[];
  status_history: ReturnStatusHistory[];
  refund?: Refund | null;
  replacement?: Replacement | null;
}

export interface ReturnItemEligibility {
  order_item_id: number;
  product_id: number;
  variant_id?: number | null;
  product_name: string;
  sku: string;
  purchased_quantity: number;
  previously_returned_quantity: number;
  returnable_quantity: number;
  unit_price: number;
  total_price: number;
  image_url?: string | null;
}

export interface ReturnEligibilityData {
  eligible: boolean;
  order_id: number;
  order_number: string;
  order_status: string;
  delivered_at?: string | null;
  days_since_delivery: number;
  return_window_days: number;
  return_window_expires_at?: string | null;
  reason?: string | null;
  items: ReturnItemEligibility[];
}

export interface ReturnCreatePayload {
  reason: string;
  resolution_type?: ReturnResolutionType;
  customer_note?: string;
  pickup_address?: Partial<Address> & Record<string, any>;
  items: Array<{
    order_item_id: number;
    quantity: number;
    reason?: string;
    resolution?: ReturnResolutionType;
  }>;
}

export interface ReturnApprovePayload {
  admin_note?: string;
  pickup_carrier?: string;
  pickup_tracking_number?: string;
}

export interface ReturnRejectPayload {
  rejection_reason: string;
  admin_note?: string;
}

export interface ReturnInspectPayload {
  condition: ReturnCondition;
  inspection_note?: string;
  restock?: boolean;
}

export interface ReturnStatusUpdatePayload {
  status: ReturnStatus;
  reason?: string;
  admin_note?: string;
  pickup_carrier?: string;
  pickup_tracking_number?: string;
}

export interface RefundProcessPayload {
  notes?: string;
  provider_refund_id?: string;
}

export interface ReplacementStatusUpdatePayload {
  status: ReplacementStatus;
  notes?: string;
}

// ==========================================
// REVIEWS & RATINGS & PRODUCT Q&A TYPES
// ==========================================

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'hidden';

export interface ReviewImage {
  id: number;
  image_url: string;
  alt_text?: string;
  sort_order: number;
}

export interface Review {
  id: number;
  product_id: number;
  product_name?: string;
  product_slug?: string;
  product_image?: string;
  variant_id?: number | null;
  variant_title?: string | null;
  user_id: number;
  user_name: string;
  rating: number; // 1 to 5
  title?: string | null;
  body: string;
  status: ReviewStatus;
  is_verified_purchase: boolean;
  order_id?: number | null;
  helpful_count: number;
  user_has_voted_helpful: boolean;
  images: ReviewImage[];
  created_at: string;
  updated_at: string;
}

export interface ReviewAggregate {
  average_rating: number;
  review_count: number;
  rating_distribution: {
    '5': number;
    '4': number;
    '3': number;
    '2': number;
    '1': number;
  };
  verified_purchases_count: number;
  with_images_count: number;
}

export interface ReviewEligibility {
  can_review: boolean;
  has_purchased: boolean;
  is_verified_eligible: boolean;
  existing_review_id?: number | null;
  reason?: string | null;
}

export interface ReviewCreatePayload {
  rating: number;
  title?: string;
  body: string;
  variant_id?: number;
  images?: string[];
}

export interface ReviewUpdatePayload {
  rating?: number;
  title?: string;
  body?: string;
  images?: string[];
}

export interface ProductAnswer {
  id: number;
  question_id: number;
  user_id?: number | null;
  user_name: string;
  answer: string;
  is_seller_answer: boolean;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductQuestion {
  id: number;
  product_id: number;
  product_name?: string;
  product_slug?: string;
  variant_id?: number | null;
  variant_title?: string | null;
  user_id: number;
  user_name: string;
  question: string;
  status: ReviewStatus;
  answer_count: number;
  answers: ProductAnswer[];
  created_at: string;
  updated_at: string;
}

export interface QuestionCreatePayload {
  question: string;
  variant_id?: number;
}

export interface AnswerCreatePayload {
  answer: string;
}

// ==========================================
// CHECKPOINT 16: CUSTOMER ACCOUNT & SUPPORT
// ==========================================

export interface UserProfileUpdatePayload {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface PasswordChangePayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ProfileCompletionItem {
  key: string;
  label: string;
  completed: boolean;
  weight: number;
}

export interface AccountDashboardStats {
  orders_count: number;
  active_shipments_count: number;
  pending_returns_count: number;
  wishlist_count: number;
  reviews_count: number;
  questions_count: number;
  unread_notifications_count: number;
  available_coupons_count: number;
  addresses_count: number;
  open_tickets_count: number;
}

export interface AccountDashboard {
  customer_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  member_since: string;
  profile_completion_percent: number;
  profile_completion_items: ProfileCompletionItem[];
  stats: AccountDashboardStats;
  recent_orders: Array<{
    id: number;
    order_number: string;
    total_amount: number;
    status: string;
    created_at: string;
    items_count: number;
    items_preview: Array<{
      id: number;
      product_name: string;
      quantity: number;
      total_price: number;
    }>;
  }>;
  recent_notifications: Array<{
    id: number;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    reference_type?: string;
    reference_id?: string;
  }>;
  open_tickets: Array<{
    id: number;
    ticket_number: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    created_at: string;
    updated_at: string;
    message_count: number;
  }>;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  type: 'order' | 'shipment' | 'delivery' | 'return' | 'refund' | 'review' | 'promotion' | 'support' | 'security' | 'system';
  title: string;
  message: string;
  reference_type?: string;
  reference_id?: string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  order_updates: boolean;
  shipment_updates: boolean;
  return_refund_updates: boolean;
  promotional_updates: boolean;
  email_notifications: boolean;
  in_app_notifications: boolean;
}

export interface SupportTicket {
  id: number;
  ticket_number: string;
  user_id: number;
  subject: string;
  category: 'order' | 'delivery' | 'payment' | 'return' | 'product' | 'account' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_for_customer' | 'resolved' | 'closed';
  description: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface SupportMessage {
  id: number;
  ticket_id: number;
  sender_user_id?: number | null;
  sender_role: 'customer' | 'support' | 'admin';
  sender_name: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export interface SupportTicketDetail extends SupportTicket {
  customer_name: string;
  customer_email: string;
  messages: SupportMessage[];
}

export interface SupportTicketCreatePayload {
  subject: string;
  category: string;
  priority?: string;
  description: string;
}

export interface CustomerQuestionItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_image?: string | null;
  question: string;
  status: string;
  created_at: string;
  answers: Array<{
    id: number;
    answer: string;
    is_seller_answer: boolean;
    created_at: string;
    status: string;
  }>;
}

export interface AvailableCouponItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  max_discount_amount?: number | null;
  minimum_cart_value: number;
  maximum_cart_value?: number | null;
  per_customer_limit: number;
  user_used_count: number;
  is_usable: boolean;
  expires_at?: string | null;
}

// ---------------------------------------------------------------------------
// Checkpoint 19 — Analytics & Reports Interfaces
// ---------------------------------------------------------------------------

export interface AnalyticsDateRangeInfo {
  period: string;
  start_date: string;
  end_date: string;
  interval: string;
}

export interface AnalyticsTimeSeriesPoint {
  date: string;
  label: string;
  orders_count: number;
  gross_sales: number;
  discounts: number;
  tax: number;
  shipping: number;
  refunds: number;
  net_sales: number;
  average_order_value: number;
}

export interface AnalyticsSalesResponse {
  date_range: AnalyticsDateRangeInfo;
  gross_sales: number;
  discounts: number;
  coupon_discounts: number;
  offer_discounts: number;
  flash_sale_discounts: number;
  tax: number;
  shipping_revenue: number;
  refunds: number;
  net_sales: number;
  total_orders: number;
  paid_orders: number;
  average_order_value: number;
  time_series: AnalyticsTimeSeriesPoint[];
}

export interface AnalyticsOrderStatusCount {
  status: string;
  count: number;
  percentage: number;
  volume: number;
}

export interface AnalyticsPaymentStatusCount {
  status: string;
  count: number;
  volume: number;
}

export interface AnalyticsOrdersResponse {
  date_range: AnalyticsDateRangeInfo;
  total_orders: number;
  paid_orders: number;
  cancelled_orders: number;
  pending_orders: number;
  status_distribution: AnalyticsOrderStatusCount[];
  payment_status_distribution: AnalyticsPaymentStatusCount[];
  average_order_value: number;
  time_series: AnalyticsTimeSeriesPoint[];
}

export interface AnalyticsTopCustomerItem {
  user_id: number;
  name: string;
  email: string;
  total_orders: number;
  total_spend: number;
  last_order_date?: string | null;
}

export interface AnalyticsCustomersResponse {
  date_range: AnalyticsDateRangeInfo;
  total_customers: number;
  customers_with_orders: number;
  customers_without_orders: number;
  new_customers_in_period: number;
  returning_customers_in_period: number;
  total_customer_spend: number;
  average_spend_per_customer: number;
  top_customers: AnalyticsTopCustomerItem[];
}

export interface AnalyticsTopProductItem {
  product_id: number;
  name: string;
  sku: string;
  image_url?: string | null;
  category_name?: string | null;
  brand_name?: string | null;
  units_sold: number;
  order_count: number;
  gross_revenue: number;
  discount_amount: number;
  net_revenue: number;
  current_stock: number;
}

export interface AnalyticsProductsResponse {
  date_range: AnalyticsDateRangeInfo;
  total_products: number;
  active_products: number;
  draft_products: number;
  out_of_stock_products: number;
  low_stock_products: number;
  products_with_sales: number;
  products_without_sales: number;
  top_products: AnalyticsTopProductItem[];
}

export interface AnalyticsCategoryItem {
  category_id: number;
  name: string;
  slug: string;
  total_products: number;
  units_sold: number;
  gross_sales: number;
  net_sales: number;
  order_count: number;
}

export interface AnalyticsCategoriesResponse {
  date_range: AnalyticsDateRangeInfo;
  categories: AnalyticsCategoryItem[];
}

export interface AnalyticsBrandItem {
  brand_id: number;
  name: string;
  slug: string;
  total_products: number;
  units_sold: number;
  gross_sales: number;
  net_sales: number;
  order_count: number;
}

export interface AnalyticsBrandsResponse {
  date_range: AnalyticsDateRangeInfo;
  brands: AnalyticsBrandItem[];
}

export interface AnalyticsLowStockItem {
  inventory_id: number;
  product_id: number;
  product_name: string;
  sku: string;
  on_hand: number;
  reserved: number;
  available: number;
  low_stock_threshold: number;
}

export interface AnalyticsInventoryResponse {
  total_inventory_records: number;
  total_on_hand_units: number;
  total_reserved_units: number;
  total_available_units: number;
  out_of_stock_records: number;
  low_stock_records: number;
  healthy_stock_records: number;
  estimated_inventory_value: number;
  low_stock_items: AnalyticsLowStockItem[];
}

export interface AnalyticsPaymentMethodMetric {
  method: string;
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  success_rate: number;
  total_volume: number;
}

export interface AnalyticsPaymentsResponse {
  date_range: AnalyticsDateRangeInfo;
  total_payments: number;
  paid_count: number;
  pending_count: number;
  failed_count: number;
  refunded_count: number;
  paid_amount: number;
  pending_amount: number;
  failed_amount: number;
  refunded_amount: number;
  methods: AnalyticsPaymentMethodMetric[];
}

export interface AnalyticsCarrierMetric {
  carrier: string;
  total_shipments: number;
  delivered_shipments: number;
  in_transit_shipments: number;
}

export interface AnalyticsShippingResponse {
  date_range: AnalyticsDateRangeInfo;
  total_shipments: number;
  pending_shipments: number;
  in_transit_shipments: number;
  out_for_delivery_shipments: number;
  delivered_shipments: number;
  failed_shipments: number;
  carrier_breakdown: AnalyticsCarrierMetric[];
  average_delivery_days?: number | null;
}

export interface AnalyticsReasonCount {
  reason: string;
  count: number;
  percentage: number;
}

export interface AnalyticsReturnsResponse {
  date_range: AnalyticsDateRangeInfo;
  total_returns: number;
  requested_returns: number;
  approved_returns: number;
  rejected_returns: number;
  completed_returns: number;
  return_rate_percentage: number;
  total_refunds_processed: number;
  total_refund_amount: number;
  total_replacements_requested: number;
  total_replacements_completed: number;
  reason_breakdown: AnalyticsReasonCount[];
}

export interface AnalyticsCouponPerformanceItem {
  coupon_id: number;
  code: string;
  name: string;
  discount_type: string;
  discount_value: number;
  used_count: number;
  usage_limit?: number | null;
  total_discount_given: number;
  total_revenue_generated: number;
  is_active: boolean;
}

export interface AnalyticsFlashSaleItem {
  flash_sale_id: number;
  title: string;
  is_active: boolean;
  items_count: number;
  total_units_sold: number;
  total_revenue: number;
}

export interface AnalyticsPromotionsResponse {
  date_range: AnalyticsDateRangeInfo;
  total_coupons: number;
  active_coupons: number;
  coupon_performance: AnalyticsCouponPerformanceItem[];
  total_offers: number;
  active_offers: number;
  orders_with_offers: number;
  total_offer_discount: number;
  total_flash_sales: number;
  active_flash_sales: number;
  flash_sales: AnalyticsFlashSaleItem[];
}

export interface AnalyticsRatingCount {
  rating: number;
  count: number;
  percentage: number;
}

export interface AnalyticsReviewsResponse {
  date_range: AnalyticsDateRangeInfo;
  total_reviews: number;
  approved_reviews: number;
  pending_reviews: number;
  rejected_reviews: number;
  average_rating: number;
  verified_purchase_count: number;
  rating_distribution: AnalyticsRatingCount[];
  total_questions: number;
  answered_questions: number;
  pending_questions: number;
  rejected_questions: number;
}

export interface AnalyticsCategoryCount {
  category: string;
  count: number;
}

export interface AnalyticsSupportResponse {
  date_range: AnalyticsDateRangeInfo;
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  waiting_customer_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  priority_breakdown: Record<string, number>;
  category_breakdown: AnalyticsCategoryCount[];
}

export interface AnalyticsOverviewData {
  date_range: AnalyticsDateRangeInfo;
  kpis: Record<string, number>;
  sales_trend: AnalyticsTimeSeriesPoint[];
  order_status_distribution: AnalyticsOrderStatusCount[];
  top_products: AnalyticsTopProductItem[];
  top_categories: AnalyticsCategoryItem[];
  inventory_summary: Record<string, number>;
  operational_summary: Record<string, number>;
}








