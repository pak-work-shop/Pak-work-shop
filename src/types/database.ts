export type LanguageCode = 'en' | 'ur' | 'ur-roman';

export type LocalizedText = {
  en?: string;
  ur?: string;
  'ur-roman'?: string;
};

export type LocalizedStringList = {
  en?: string[];
  ur?: string[];
  'ur-roman'?: string[];
};

export type WeekdayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type DayWorkingHours = {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};

export type WorkingHoursMap = Partial<Record<WeekdayKey, DayWorkingHours>>;

export type UserRole = 'customer' | 'admin' | 'staff';

export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'cng' | 'electric';

export type FaqCategory =
  | 'general'
  | 'services'
  | 'booking'
  | 'parts'
  | 'delivery'
  | 'payments';

export type LegalPageSlug = 'privacy' | 'terms' | 'returns' | 'delivery-policy';

export type ContactMessageStatus = 'new' | 'read' | 'replied' | 'archived';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'rescheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type BookingSource = 'web' | 'admin';

export type DayAvailabilityStatus = 'past' | 'blocked' | 'closed' | 'full' | 'open';

export type ProfileRow = {
  id: string;
  full_name: string;
  phone: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type SiteSettingsRow = {
  id: number;
  business_name: string;
  tagline: LocalizedText;
  phone: string;
  whatsapp: string;
  email: string;
  address: LocalizedText;
  maps_embed_url: string;
  working_hours: WorkingHoursMap;
  logo_url: string;
  print_logo_url?: string | null;
  favicon_url: string;
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
  tiktok_url: string;
  announcement: LocalizedText;
  announcement_enabled: boolean;
  hero_image_url: string;
  about_image_url: string;
  cta_banner_url: string;
  og_image_url: string;
  about_title: LocalizedText;
  about_body: LocalizedText;
  demo_mode: boolean;
  created_at: string;
  updated_at: string;
};

export type VehicleMakeRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type VehicleClass =
  | 'hatchback'
  | 'sedan'
  | 'suv'
  | 'pickup'
  | 'van';

export type VehicleModelRow = {
  id: string;
  make_id: string;
  name: string;
  slug: string;
  vehicle_class?: VehicleClass | null;
  year_from: number;
  year_to: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type VehicleRow = {
  id: string;
  user_id: string;
  make_id: string;
  model_id: string;
  year: number;
  plate_number: string;
  fuel_type: FuelType;
  nickname: string;
  created_at: string;
  updated_at: string;
};

export type AddressRow = {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  city: string;
  address_line: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceRow = {
  id: string;
  slug: string;
  name: LocalizedText;
  short_description: LocalizedText;
  description: LocalizedText;
  includes: LocalizedStringList;
  estimated_time: LocalizedText | null;
  price_from: number | null;
  price_to: number | null;
  price_note: LocalizedText | null;
  image_url: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

export type FaqRow = {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
  category: FaqCategory;
  service_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PageRow = {
  id: string;
  slug: LegalPageSlug;
  title: LocalizedText;
  content: LocalizedText;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type ContactMessageRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  subject: string | null;
  message: string;
  language: string;
  status: ContactMessageStatus;
  ip_hash: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type BookingSettingsRow = {
  id: number;
  online_booking_enabled: boolean;
  slot_minutes: 30 | 45 | 60 | 90 | 120;
  max_bookings_per_slot: number;
  min_advance_hours: number;
  max_advance_days: number;
  allow_pickup_drop: boolean;
  updated_at: string;
};

export type BlockedSlotRow = {
  id: string;
  block_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
};

export type BookingRow = {
  id: string;
  booking_no: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  make_id: string | null;
  model_id: string | null;
  make_text: string | null;
  model_text: string | null;
  vehicle_year: number | null;
  plate_number: string | null;
  fuel_type: FuelType | null;
  mileage_km: number | null;
  booking_date: string;
  slot_start: string;
  slot_end: string;
  problem_description: string | null;
  photo_path: string | null;
  pickup_requested: boolean;
  pickup_address: string | null;
  status: BookingStatus;
  admin_notes: string | null;
  source: BookingSource;
  language: string | null;
  ip_hash: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type BookingServiceRow = {
  id: string;
  booking_id: string;
  service_id: string | null;
  service_name: string;
};

export type BookingStatusHistoryRow = {
  id: string;
  booking_id: string;
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  note: string | null;
  changed_by: string | null;
  created_at: string;
};

export type AvailableSlotItem = {
  slot_start: string;
  slot_end: string;
  remaining: number;
};

export type MonthAvailabilityItem = {
  day: string;
  status: DayAvailabilityStatus;
};

export type SubmitBookingResponse = {
  ok: boolean;
  booking_id: string;
  booking_no: string;
  booking_date: string;
  slot_start: string;
  slot_end: string;
  status: BookingStatus;
  services: string[];
  vehicle_summary: string;
};

export type BookingLookupHistoryItem = {
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  note: string | null;
  created_at: string;
};

export type BookingLookupResponse = {
  booking_no: string;
  status: BookingStatus;
  booking_date: string;
  slot_start: string;
  slot_end: string;
  services: string[];
  vehicle_summary: string;
  pickup_requested: boolean;
  history: BookingLookupHistoryItem[];
};

// =============================================================================
// PHASE 4 TYPES: Job Cards, Repair Tracking & Invoices
// =============================================================================
export type JobStatus =
  | 'received'
  | 'inspection'
  | 'awaiting_approval'
  | 'in_progress'
  | 'quality_check'
  | 'ready'
  | 'delivered'
  | 'on_hold'
  | 'cancelled';

export type JobItemType = 'service' | 'part' | 'labor' | 'other';

export type InvoiceStatus =
  | 'draft'
  | 'issued'
  | 'partially_paid'
  | 'paid'
  | 'void';

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'jazzcash'
  | 'easypaisa'
  | 'card'
  | 'other';

export type JobCardRow = {
  id: string;
  job_no: string;
  booking_id: string | null;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  make_id: string | null;
  model_id: string | null;
  make_text: string | null;
  model_text: string | null;
  vehicle_year: number | null;
  plate_number: string | null;
  fuel_type: FuelType | null;
  mileage_in: number | null;
  status: JobStatus;
  complaint: string | null;
  estimated_completion: string | null;
  public_note: string | null;
  internal_notes: string | null;
  show_cost_to_customer: boolean;
  received_at: string;
  delivered_at: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type JobItemRow = {
  id: string;
  job_id: string;
  item_type: JobItemType;
  description: string;
  service_id: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type JobStatusHistoryRow = {
  id: string;
  job_id: string;
  from_status: JobStatus | null;
  to_status: JobStatus;
  note: string | null;
  changed_by: string | null;
  created_at: string;
};

export type JobNoteRow = {
  id: string;
  job_id: string;
  note: string;
  is_customer_visible: boolean;
  created_by: string | null;
  created_at: string;
};

export type InvoiceItemSnapshot = {
  id?: string;
  item_type: JobItemType;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type InvoiceRow = {
  id: string;
  invoice_no: string;
  job_id: string;
  status: InvoiceStatus;
  items_snapshot: InvoiceItemSnapshot[];
  subtotal: number;
  discount: number;
  total: number;
  amount_paid: number;
  notes: string | null;
  issued_at: string | null;
  due_date: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type JobPaymentRow = {
  id: string;
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  paid_at: string;
  received_by: string | null;
  note: string | null;
};

export type JobLookupAttemptsRow = {
  id: string;
  ip_hash: string;
  created_at: string;
};

export type JobLookupItem = {
  item_type: JobItemType;
  description: string;
  quantity: number;
  unit_price: number | null;
  line_total: number | null;
};

export type JobLookupNote = {
  note: string;
  created_at: string;
};

export type JobLookupHistoryItem = {
  from_status: JobStatus | null;
  to_status: JobStatus;
  note: string | null;
  created_at: string;
};

export type JobLookupResponse = {
  job_no: string;
  status: JobStatus;
  vehicle_summary: string;
  plate_masked: string | null;
  fuel_type: FuelType | null;
  mileage_in: number | null;
  complaint: string | null;
  estimated_completion: string | null;
  public_note: string | null;
  show_cost_to_customer: boolean;
  received_at: string;
  delivered_at: string | null;
  items: JobLookupItem[];
  notes: JobLookupNote[];
  history: JobLookupHistoryItem[];
  invoice_status: InvoiceStatus | null;
};

export type CustomerJobInvoiceSummary = {
  id: string;
  invoice_no: string;
  status: InvoiceStatus;
  subtotal: number;
  discount: number;
  total: number;
  amount_paid: number;
  issued_at: string | null;
  due_date: string | null;
};

export type CustomerJobDetailResponse = {
  id: string;
  job_no: string;
  booking_id: string | null;
  status: JobStatus;
  make_text: string | null;
  model_text: string | null;
  vehicle_year: number | null;
  plate_number: string | null;
  fuel_type: FuelType | null;
  mileage_in: number | null;
  complaint: string | null;
  estimated_completion: string | null;
  public_note: string | null;
  show_cost_to_customer: boolean;
  received_at: string;
  delivered_at: string | null;
  items: Array<JobLookupItem & { id: string }>;
  notes: Array<JobLookupNote & { id: string }>;
  history: Array<JobLookupHistoryItem & { id: string }>;
  invoices: CustomerJobInvoiceSummary[];
};

// ---------------------------------------------------------------------------
// Phase 5 — Parts & Accessories Catalogue Types
// ---------------------------------------------------------------------------

export type PartOrigin = 'genuine_oem' | 'japanese_imported' | 'aftermarket' | 'local';

export type StockMovementReason =
  | 'initial'
  | 'restock'
  | 'sale'
  | 'order_cancel'
  | 'job_use'
  | 'return'
  | 'adjustment'
  | 'damage'
  | 'manual_adjustment'
  | 'order_reserved'
  | 'order_cancelled'
  | 'used_in_job'
  | 'damaged';

export type ProductSpecItem = {
  label: LocalizedText;
  value: LocalizedText;
};

export type ProductCategoryRow = {
  id: string;
  parent_id: string | null;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  image_url: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type BrandRow = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductRow = {
  id: string;
  sku: string;
  slug: string;
  name: LocalizedText;
  short_description: LocalizedText;
  description: LocalizedText;
  specs: ProductSpecItem[];
  category_id: string | null;
  brand_id: string | null;
  part_origin: PartOrigin;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  stock_qty: number;
  low_stock_threshold: number;
  is_universal: boolean;
  warranty: string | null;
  is_featured: boolean;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductImageRow = {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
};

export type ProductVehicleRow = {
  id: string;
  product_id: string;
  make_id: string;
  model_id: string | null;
  year_from: number | null;
  year_to: number | null;
  fuel_type: FuelType | null;
  notes: string | null;
  created_at: string;
};

export type ProductServiceRow = {
  product_id: string;
  service_id: string;
};

export type StockMovementRow = {
  id: string;
  product_id: string;
  delta: number;
  reason: StockMovementReason;
  reference_type: string | null;
  reference_id: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

export type SearchProductItem = {
  id: string;
  sku: string;
  slug: string;
  name: LocalizedText;
  short_description: LocalizedText;
  category_id: string | null;
  category_slug: string | null;
  category_name: LocalizedText | null;
  category_icon: string | null;
  brand_id: string | null;
  brand_name: string | null;
  brand_slug: string | null;
  brand_logo_url: string | null;
  part_origin: PartOrigin;
  price: number;
  compare_at_price: number | null;
  stock_qty: number;
  low_stock_threshold: number;
  is_universal: boolean;
  warranty: string | null;
  is_featured: boolean;
  is_demo: boolean;
  primary_image_url: string | null;
  primary_image_alt: string | null;
  matches_selected_vehicle: boolean;
  created_at: string;
};

export type SearchProductsResponse = {
  items: SearchProductItem[];
  total_count: number;
  page: number;
  page_size: number;
};

// ---------------------------------------------------------------------------
// Phase 6 — Cart, Checkout (COD), Delivery, Coupons & Orders Types
// ---------------------------------------------------------------------------

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type OrderPaymentMethod = 'cod' | 'online' | 'manual';

export type OrderPaymentStatus =
  | 'cod_pending'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'cod_collected';

export type CouponDiscountType = 'percent' | 'fixed';

export type PakistanCityRow = {
  id: string;
  name: string;
  province: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
};

export type DeliverySettingsRow = {
  id: number;
  flat_rate: number;
  free_cities: string[];
  free_over_amount: number | null;
  min_order_amount: number;
  cod_enabled: boolean;
  cod_max_amount: number | null;
  cod_blocked_cities: string[];
  online_payment_enabled: boolean;
  updated_at: string;
};

export type CouponRow = {
  id: string;
  code: string;
  discount_type: CouponDiscountType;
  value: number;
  min_order: number;
  max_discount: number | null;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type OrderRow = {
  id: string;
  order_no: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  city: string;
  address_line: string;
  address_notes: string | null;
  subtotal: number;
  discount: number;
  delivery_charge: number;
  total: number;
  coupon_code: string | null;
  payment_method: OrderPaymentMethod;
  payment_status: OrderPaymentStatus;
  status: OrderStatus;
  courier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  customer_notes: string | null;
  admin_notes: string | null;
  language: string | null;
  ip_hash: string | null;
  is_demo: boolean;
  placed_at: string;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  sku: string;
  name: string;
  name_i18n: LocalizedText;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type OrderStatusHistoryRow = {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  note: string | null;
  changed_by: string | null;
  created_at: string;
};

export type CartStoredItem = {
  product_id: string;
  sku: string;
  slug: string;
  name: LocalizedText;
  unit_price: number;
  compare_at_price?: number | null;
  primary_image_url?: string | null;
  part_origin?: PartOrigin;
  stock_qty: number;
  quantity: number;
};

export type UserCartRow = {
  user_id: string;
  items: CartStoredItem[];
  updated_at: string;
};

export type QuoteOrderLineProblemCode =
  | 'out_of_stock'
  | 'price_changed'
  | 'inactive';

export type QuoteOrderProblem = {
  product_id: string;
  sku?: string;
  code: QuoteOrderLineProblemCode;
  available_stock?: number;
  requested_qty?: number;
  old_price?: number;
  new_price?: number;
};

export type QuoteOrderLine = {
  product_id: string;
  sku: string;
  slug: string;
  name: LocalizedText;
  primary_image_url?: string | null;
  part_origin?: PartOrigin;
  unit_price: number;
  compare_at_price?: number | null;
  quantity: number;
  available_stock: number;
  line_total: number;
  is_active: boolean;
  problems: QuoteOrderLineProblemCode[];
};

export type QuoteOrderResponse = {
  lines: QuoteOrderLine[];
  problems: QuoteOrderProblem[];
  has_blocking_problems: boolean;
  subtotal: number;
  discount: number;
  coupon_code: string | null;
  coupon_valid: boolean;
  coupon_error:
    | 'invalid_coupon'
    | 'not_started'
    | 'expired'
    | 'usage_limit'
    | 'min_order'
    | null;
  coupon_min_order?: number | null;
  delivery_charge: number;
  delivery_rule: 'free_city' | 'free_over_amount' | 'flat_rate' | 'empty_cart';
  free_cities: string[];
  flat_rate: number;
  free_over_amount: number | null;
  min_order_amount: number;
  meets_min_order: boolean;
  total: number;
  cod_allowed: boolean;
  cod_reason: 'cod_disabled' | 'city_blocked' | 'exceeds_max_amount' | null;
  cod_max_amount: number | null;
  online_payment_enabled: boolean;
};

export type PlaceOrderResponse = {
  order_id: string;
  order_no: string;
  subtotal: number;
  discount: number;
  delivery_charge: number;
  total: number;
  payment_method: OrderPaymentMethod;
  payment_status: OrderPaymentStatus;
  status: OrderStatus;
  city: string;
  placed_at: string;
};

export type OrderLookupItem = {
  sku: string;
  name: string;
  name_i18n: LocalizedText;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type OrderLookupHistoryItem = {
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  note: string | null;
  created_at: string;
};

export type OrderLookupResponse = {
  order_no: string;
  status: OrderStatus;
  payment_method: OrderPaymentMethod;
  payment_status: OrderPaymentStatus;
  city: string;
  subtotal: number;
  discount: number;
  delivery_charge: number;
  total: number;
  coupon_code: string | null;
  courier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  placed_at: string;
  delivered_at: string | null;
  items: OrderLookupItem[];
  history: OrderLookupHistoryItem[];
  latest_payment?: PaymentRow | null;
};

export type PaymentMethodType =
  | 'bank_transfer'
  | 'jazzcash'
  | 'easypaisa'
  | 'other';

export type PaymentProvider =
  | 'manual'
  | 'mock'
  | 'jazzcash'
  | 'easypaisa'
  | 'payfast'
  | 'safepay'
  | 'other';

export type PaymentStatus =
  | 'initiated'
  | 'submitted'
  | 'verified'
  | 'rejected'
  | 'succeeded'
  | 'failed'
  | 'refunded';

export type PaymentAccountRow = {
  id: string;
  method: PaymentMethodType;
  title: LocalizedText;
  account_title: string;
  account_number: string;
  iban: string | null;
  bank_name: string | null;
  instructions: LocalizedText;
  is_active: boolean;
  sort_order: number;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type PaymentRow = {
  id: string;
  order_id: string;
  provider: PaymentProvider;
  method: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transaction_id: string | null;
  provider_reference: string | null;
  proof_path: string | null;
  submitted_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  reject_reason: string | null;
  idempotency_key: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type PaymentLogRow = {
  id: string;
  payment_id: string | null;
  order_id: string | null;
  event: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type PaymentSettingsRow = {
  id: number;
  manual_enabled: boolean;
  mock_gateway_enabled: boolean;
  gateway_provider: string | null;
  require_proof: boolean;
  updated_at: string;
};

export type PaymentOptionsAccount = {
  id: string;
  method: PaymentMethodType;
  title: LocalizedText;
  account_title: string;
  account_number: string;
  iban: string | null;
  bank_name: string | null;
  instructions: LocalizedText;
  sort_order: number;
};

export type PaymentOptionsResponse = {
  online_enabled: boolean;
  manual_enabled: boolean;
  mock_gateway_enabled: boolean;
  gateway_provider: string | null;
  require_proof: boolean;
  is_demo_mode: boolean;
  accounts: PaymentOptionsAccount[];
};

export type MockGatewayStartResponse = {
  token: string;
  order_no: string;
  customer_name: string;
  customer_phone: string;
  amount: number;
  city: string;
};

export type MockGatewayCompleteResponse = {
  idempotent: boolean;
  order_no: string;
  phone: string;
  payment_status: OrderPaymentStatus;
  order_status: OrderStatus;
  outcome: PaymentStatus;
};

export type BlogCategoryRow = {
  id: string;
  slug: string;
  name: LocalizedText;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BlogPostRow = {
  id: string;
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  content: LocalizedText;
  cover_image_url: string | null;
  category_id: string | null;
  tags: string[];
  author_name: string;
  is_published: boolean;
  published_at: string;
  related_service_ids: string[];
  related_category_ids: string[];
  seo_title: LocalizedText | null;
  seo_description: LocalizedText | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type EstimatorRuleRow = {
  id: string;
  vehicle_class: VehicleClass;
  label: LocalizedText;
  multiplier: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ReviewStatus = 'pending' | 'approved' | 'hidden';

export type ReviewRow = {
  id: string;
  user_id: string | null;
  reviewer_name: string;
  rating: number;
  title: string | null;
  body: string;
  service_id: string | null;
  language: string;
  status: ReviewStatus;
  is_verified: boolean;
  admin_reply: LocalizedText | null;
  ip_hash?: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type ReviewSummary = {
  total_reviews: number;
  average_rating: number;
  star_counts: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
};

export type GalleryCategory =
  | 'workshop'
  | 'repairs'
  | 'before_after'
  | 'parts'
  | 'team';

export type GalleryItemRow = {
  id: string;
  title: LocalizedText;
  caption: LocalizedText;
  category: GalleryCategory;
  image_url: string;
  before_image_url: string | null;
  sort_order: number;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatbotEngineMode = 'auto' | 'local_only';

export type ChatbotQuickReply = {
  label: LocalizedText;
  prompt: LocalizedText;
};

export type ChatbotSettingsRow = {
  id: number;
  enabled: boolean;
  engine_mode: ChatbotEngineMode;
  welcome_message: LocalizedText;
  quick_replies: ChatbotQuickReply[];
  disclaimer: LocalizedText;
  max_messages_per_session: number;
  logging_enabled: boolean;
  updated_at: string;
};

export type ChatbotKnowledgeCategory =
  | 'services'
  | 'troubleshooting'
  | 'parts'
  | 'booking_delivery'
  | 'workshop_info';

export type ChatbotKnowledgeRow = {
  id: string;
  title: LocalizedText;
  content: LocalizedText;
  category: ChatbotKnowledgeCategory;
  keywords: {
    en: string[];
    ur: string[];
    'ur-roman': string[];
  };
  is_active: boolean;
  sort_order: number;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatSessionRow = {
  id: string;
  started_at: string;
  language: string;
  vehicle: {
    make?: string;
    model?: string;
    year?: number;
  } | null;
  engine_used: 'ai' | 'local';
  message_count: number;
  ip_hash: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatMessageRow = {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<Omit<ProfileRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      site_settings: {
        Row: SiteSettingsRow;
        Insert: Partial<SiteSettingsRow>;
        Update: Partial<Omit<SiteSettingsRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      vehicle_makes: {
        Row: VehicleMakeRow;
        Insert: Omit<VehicleMakeRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<VehicleMakeRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      vehicle_models: {
        Row: VehicleModelRow;
        Insert: Omit<VehicleModelRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<VehicleModelRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      vehicles: {
        Row: VehicleRow;
        Insert: Omit<VehicleRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<VehicleRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      addresses: {
        Row: AddressRow;
        Insert: Omit<AddressRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<AddressRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      services: {
        Row: ServiceRow;
        Insert: Omit<ServiceRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<ServiceRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      faqs: {
        Row: FaqRow;
        Insert: Omit<FaqRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<FaqRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      pages: {
        Row: PageRow;
        Insert: Omit<PageRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<PageRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      contact_messages: {
        Row: ContactMessageRow;
        Insert: Omit<ContactMessageRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<ContactMessageRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      booking_settings: {
        Row: BookingSettingsRow;
        Insert: Partial<BookingSettingsRow>;
        Update: Partial<Omit<BookingSettingsRow, 'id'>>;
        Relationships: [];
      };
      blocked_slots: {
        Row: BlockedSlotRow;
        Insert: Omit<BlockedSlotRow, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<BlockedSlotRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      bookings: {
        Row: BookingRow;
        Insert: Omit<BookingRow, 'id' | 'booking_no' | 'created_at' | 'updated_at'> & {
          id?: string;
          booking_no?: string;
        };
        Update: Partial<Omit<BookingRow, 'id' | 'booking_no' | 'created_at'>>;
        Relationships: [];
      };
      booking_services: {
        Row: BookingServiceRow;
        Insert: Omit<BookingServiceRow, 'id'> & { id?: string };
        Update: Partial<Omit<BookingServiceRow, 'id'>>;
        Relationships: [];
      };
      booking_status_history: {
        Row: BookingStatusHistoryRow;
        Insert: Omit<BookingStatusHistoryRow, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<BookingStatusHistoryRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      job_cards: {
        Row: JobCardRow;
        Insert: Omit<JobCardRow, 'id' | 'job_no' | 'created_at' | 'updated_at'> & {
          id?: string;
          job_no?: string;
        };
        Update: Partial<Omit<JobCardRow, 'id' | 'job_no' | 'created_at'>>;
        Relationships: [];
      };
      job_items: {
        Row: JobItemRow;
        Insert: Omit<JobItemRow, 'id' | 'line_total' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Omit<JobItemRow, 'id' | 'line_total' | 'created_at'>>;
        Relationships: [];
      };
      job_status_history: {
        Row: JobStatusHistoryRow;
        Insert: Omit<JobStatusHistoryRow, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<JobStatusHistoryRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      job_notes: {
        Row: JobNoteRow;
        Insert: Omit<JobNoteRow, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<JobNoteRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      invoices: {
        Row: InvoiceRow;
        Insert: Omit<InvoiceRow, 'id' | 'invoice_no' | 'created_at' | 'updated_at'> & {
          id?: string;
          invoice_no?: string;
        };
        Update: Partial<Omit<InvoiceRow, 'id' | 'invoice_no' | 'created_at'>>;
        Relationships: [];
      };
      job_payments: {
        Row: JobPaymentRow;
        Insert: Omit<JobPaymentRow, 'id'> & { id?: string };
        Update: Partial<Omit<JobPaymentRow, 'id'>>;
        Relationships: [];
      };
      job_lookup_attempts: {
        Row: JobLookupAttemptsRow;
        Insert: Omit<JobLookupAttemptsRow, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<JobLookupAttemptsRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      product_categories: {
        Row: ProductCategoryRow;
        Insert: Partial<ProductCategoryRow> & {
          slug: string;
          name: LocalizedText;
        };
        Update: Partial<Omit<ProductCategoryRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      brands: {
        Row: BrandRow;
        Insert: Partial<BrandRow> & {
          slug: string;
          name: string;
        };
        Update: Partial<Omit<BrandRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      products: {
        Row: ProductRow;
        Insert: Partial<ProductRow> & {
          sku: string;
          slug: string;
          name: LocalizedText;
          price: number;
        };
        Update: Partial<Omit<ProductRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      product_images: {
        Row: ProductImageRow;
        Insert: Partial<ProductImageRow> & {
          product_id: string;
          url: string;
        };
        Update: Partial<Omit<ProductImageRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      product_vehicles: {
        Row: ProductVehicleRow;
        Insert: Partial<ProductVehicleRow> & {
          product_id: string;
          make_id: string;
        };
        Update: Partial<Omit<ProductVehicleRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      product_services: {
        Row: ProductServiceRow;
        Insert: ProductServiceRow;
        Update: Partial<ProductServiceRow>;
        Relationships: [];
      };
      stock_movements: {
        Row: StockMovementRow;
        Insert: Partial<StockMovementRow> & {
          product_id: string;
          delta: number;
          reason: StockMovementReason;
        };
        Update: Partial<Omit<StockMovementRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      pakistan_cities: {
        Row: PakistanCityRow;
        Insert: Partial<PakistanCityRow> & {
          name: string;
          province: string;
        };
        Update: Partial<Omit<PakistanCityRow, 'id'>>;
        Relationships: [];
      };
      delivery_settings: {
        Row: DeliverySettingsRow;
        Insert: Partial<DeliverySettingsRow>;
        Update: Partial<Omit<DeliverySettingsRow, 'id'>>;
        Relationships: [];
      };
      coupons: {
        Row: CouponRow;
        Insert: Partial<CouponRow> & {
          code: string;
          discount_type: CouponDiscountType;
          value: number;
        };
        Update: Partial<Omit<CouponRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: Partial<OrderRow> & {
          customer_name: string;
          customer_phone: string;
          city: string;
          address_line: string;
        };
        Update: Partial<Omit<OrderRow, 'id' | 'order_no' | 'created_at'>>;
        Relationships: [];
      };
      order_items: {
        Row: OrderItemRow;
        Insert: Omit<OrderItemRow, 'id'> & { id?: string };
        Update: Partial<Omit<OrderItemRow, 'id'>>;
        Relationships: [];
      };
      order_status_history: {
        Row: OrderStatusHistoryRow;
        Insert: Omit<OrderStatusHistoryRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<OrderStatusHistoryRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      user_carts: {
        Row: UserCartRow;
        Insert: {
          user_id: string;
          items: CartStoredItem[];
          updated_at?: string;
        };
        Update: {
          items?: CartStoredItem[];
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_accounts: {
        Row: PaymentAccountRow;
        Insert: Partial<PaymentAccountRow> & {
          method: PaymentMethodType;
          account_title: string;
          account_number: string;
        };
        Update: Partial<Omit<PaymentAccountRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      payments: {
        Row: PaymentRow;
        Insert: Partial<PaymentRow> & {
          order_id: string;
          provider: PaymentProvider;
          method: string;
          amount: number;
        };
        Update: Partial<Omit<PaymentRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      payment_logs: {
        Row: PaymentLogRow;
        Insert: Omit<PaymentLogRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<PaymentLogRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      payment_settings: {
        Row: PaymentSettingsRow;
        Insert: Partial<PaymentSettingsRow>;
        Update: Partial<Omit<PaymentSettingsRow, 'id'>>;
        Relationships: [];
      };
      blog_categories: {
        Row: BlogCategoryRow;
        Insert: Partial<BlogCategoryRow> & { slug: string; name: LocalizedText };
        Update: Partial<Omit<BlogCategoryRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      blog_posts: {
        Row: BlogPostRow;
        Insert: Partial<BlogPostRow> & {
          slug: string;
          title: LocalizedText;
          excerpt: LocalizedText;
          content: LocalizedText;
        };
        Update: Partial<Omit<BlogPostRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      estimator_rules: {
        Row: EstimatorRuleRow;
        Insert: Partial<EstimatorRuleRow> & {
          vehicle_class: VehicleClass;
          multiplier: number;
        };
        Update: Partial<Omit<EstimatorRuleRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      reviews: {
        Row: ReviewRow;
        Insert: Partial<ReviewRow> & {
          reviewer_name: string;
          rating: number;
          body: string;
        };
        Update: Partial<Omit<ReviewRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      review_contacts: {
        Row: {
          review_id: string;
          phone_hash: string;
          created_at: string;
        };
        Insert: {
          review_id: string;
          phone_hash: string;
          created_at?: string;
        };
        Update: Partial<{
          phone_hash: string;
        }>;
        Relationships: [];
      };
      gallery_items: {
        Row: GalleryItemRow;
        Insert: Partial<GalleryItemRow> & {
          category: GalleryCategory;
          image_url: string;
        };
        Update: Partial<Omit<GalleryItemRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      chatbot_settings: {
        Row: ChatbotSettingsRow;
        Insert: Partial<ChatbotSettingsRow>;
        Update: Partial<Omit<ChatbotSettingsRow, 'id'>>;
        Relationships: [];
      };
      chatbot_knowledge: {
        Row: ChatbotKnowledgeRow;
        Insert: Partial<ChatbotKnowledgeRow> & {
          title: LocalizedText;
          content: LocalizedText;
          category: ChatbotKnowledgeCategory;
        };
        Update: Partial<Omit<ChatbotKnowledgeRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      chat_sessions: {
        Row: ChatSessionRow;
        Insert: Partial<ChatSessionRow> & { id?: string };
        Update: Partial<Omit<ChatSessionRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      chat_messages: {
        Row: ChatMessageRow;
        Insert: Omit<ChatMessageRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ChatMessageRow, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'chat_messages_session_id_fkey';
            columns: ['session_id'];
            referencedRelation: 'chat_sessions';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      public_reviews: {
        Row: Omit<ReviewRow, 'ip_hash'>;
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      submit_contact_message: {
        Args: {
          p_name: string;
          p_phone: string;
          p_email?: string | null;
          p_subject?: string | null;
          p_message: string;
          p_language?: string;
        };
        Returns: { ok: boolean };
      };
      get_available_slots: {
        Args: {
          p_date: string;
        };
        Returns: AvailableSlotItem[];
      };
      get_month_availability: {
        Args: {
          p_year: number;
          p_month: number;
        };
        Returns: MonthAvailabilityItem[];
      };
      submit_booking: {
        Args: {
          p_customer_name: string;
          p_customer_phone: string;
          p_customer_email?: string | null;
          p_service_ids: string[];
          p_make_id?: string | null;
          p_model_id?: string | null;
          p_make_text?: string | null;
          p_model_text?: string | null;
          p_vehicle_year?: number | null;
          p_plate_number?: string | null;
          p_fuel_type?: string | null;
          p_mileage_km?: number | null;
          p_booking_date: string;
          p_slot_start: string;
          p_problem_description?: string | null;
          p_photo_path?: string | null;
          p_pickup_requested?: boolean;
          p_pickup_address?: string | null;
          p_language?: string;
        };
        Returns: SubmitBookingResponse;
      };
      get_booking_status: {
        Args: {
          p_booking_no: string;
          p_phone: string;
        };
        Returns: BookingLookupResponse;
      };
      cancel_my_booking: {
        Args: {
          p_booking_id: string;
        };
        Returns: { ok: boolean };
      };
      admin_create_booking: {
        Args: {
          p_customer_name: string;
          p_customer_phone: string;
          p_customer_email?: string | null;
          p_service_ids: string[];
          p_make_id?: string | null;
          p_model_id?: string | null;
          p_make_text?: string | null;
          p_model_text?: string | null;
          p_vehicle_year?: number | null;
          p_plate_number?: string | null;
          p_fuel_type?: string | null;
          p_mileage_km?: number | null;
          p_booking_date: string;
          p_slot_start: string;
          p_problem_description?: string | null;
          p_pickup_requested?: boolean;
          p_pickup_address?: string | null;
          p_admin_notes?: string | null;
          p_status?: string;
          p_override_capacity?: boolean;
        };
        Returns: { ok: boolean; booking_id: string; booking_no: string };
      };
      admin_update_booking_status: {
        Args: {
          p_booking_id: string;
          p_status: string;
          p_note?: string | null;
        };
        Returns: { ok: boolean; status: BookingStatus };
      };
      admin_reschedule_booking: {
        Args: {
          p_booking_id: string;
          p_date: string;
          p_slot_start: string;
          p_note?: string | null;
        };
        Returns: {
          ok: boolean;
          booking_date: string;
          slot_start: string;
          slot_end: string;
          status: BookingStatus;
        };
      };
      lookup_job_status: {
        Args: {
          p_job_no: string;
          p_phone: string;
        };
        Returns: JobLookupResponse;
      };
      get_my_job_detail: {
        Args: {
          p_job_id: string;
        };
        Returns: CustomerJobDetailResponse;
      };
      admin_find_customer: {
        Args: {
          p_phone: string;
        };
        Returns: {
          found: boolean;
          id: string | null;
          full_name: string | null;
        };
      };
      admin_create_job_from_booking: {
        Args: {
          p_booking_id: string;
        };
        Returns: {
          ok: boolean;
          job_id: string;
          job_no: string;
        };
      };
      admin_create_job: {
        Args: {
          p_customer_name: string;
          p_customer_phone: string;
          p_customer_email?: string | null;
          p_user_id?: string | null;
          p_make_id?: string | null;
          p_model_id?: string | null;
          p_make_text?: string | null;
          p_model_text?: string | null;
          p_vehicle_year?: number | null;
          p_plate_number?: string | null;
          p_fuel_type?: string | null;
          p_mileage_in?: number | null;
          p_complaint?: string | null;
          p_estimated_completion?: string | null;
          p_public_note?: string | null;
          p_internal_notes?: string | null;
          p_show_cost_to_customer?: boolean;
          p_service_ids?: string[];
        };
        Returns: {
          ok: boolean;
          job_id: string;
          job_no: string;
        };
      };
      admin_update_job_status: {
        Args: {
          p_job_id: string;
          p_status: string;
          p_note?: string | null;
          p_public_note?: string | null;
        };
        Returns: {
          ok: boolean;
          status: JobStatus;
          delivered_at: string | null;
        };
      };
      admin_save_draft_invoice: {
        Args: {
          p_job_id: string;
          p_discount?: number;
          p_due_date?: string | null;
          p_notes?: string | null;
        };
        Returns: {
          ok: boolean;
          invoice_id: string;
          invoice_no: string;
          subtotal: number;
          discount: number;
          total: number;
          status: InvoiceStatus;
        };
      };
      admin_issue_invoice: {
        Args: {
          p_job_id: string;
          p_discount?: number;
          p_due_date?: string | null;
          p_notes?: string | null;
        };
        Returns: {
          ok: boolean;
          invoice_id: string;
          invoice_no: string;
          subtotal: number;
          discount: number;
          total: number;
          status: InvoiceStatus;
        };
      };
      admin_void_invoice: {
        Args: {
          p_invoice_id: string;
          p_note?: string | null;
        };
        Returns: {
          ok: boolean;
          invoice_id: string;
          status: InvoiceStatus;
        };
      };
      admin_record_payment: {
        Args: {
          p_invoice_id: string;
          p_amount: number;
          p_method: string;
          p_reference?: string | null;
          p_note?: string | null;
        };
        Returns: {
          ok: boolean;
          payment_id: string;
          amount_paid: number;
          balance: number;
          status: InvoiceStatus;
        };
      };
      search_products: {
        Args: {
          p_query?: string | null;
          p_category_id?: string | null;
          p_brand_ids?: string[] | null;
          p_part_origins?: string[] | null;
          p_price_min?: number | null;
          p_price_max?: number | null;
          p_in_stock_only?: boolean;
          p_make_id?: string | null;
          p_model_id?: string | null;
          p_year?: number | null;
          p_fuel_type?: string | null;
          p_include_universal?: boolean;
          p_sort?: string;
          p_page?: number;
          p_page_size?: number;
        };
        Returns: SearchProductsResponse;
      };
      admin_adjust_stock: {
        Args: {
          p_product_id: string;
          p_delta: number;
          p_reason: string;
          p_note?: string | null;
        };
        Returns: {
          ok: boolean;
          movement_id: string;
          product_id: string;
          previous_stock_qty: number;
          new_stock_qty: number;
          delta: number;
          reason: StockMovementReason;
        };
      };
      quote_order: {
        Args: {
          p_items: Array<{
            product_id: string;
            quantity: number;
            client_unit_price?: number;
            sku?: string;
            slug?: string;
            name?: LocalizedText;
          }>;
          p_city?: string | null;
          p_coupon?: string | null;
        };
        Returns: QuoteOrderResponse;
      };
      place_order: {
        Args: {
          p_items: Array<{
            product_id: string;
            quantity: number;
          }>;
          p_customer: {
            name: string;
            phone: string;
            email?: string | null;
            notes?: string | null;
          };
          p_city: string;
          p_address_line: string;
          p_address_notes?: string | null;
          p_payment_method?: string;
          p_coupon?: string | null;
          p_language?: string;
        };
        Returns: PlaceOrderResponse;
      };
      lookup_order_status: {
        Args: {
          p_order_no: string;
          p_phone: string;
        };
        Returns: OrderLookupResponse;
      };
      cancel_my_order: {
        Args: {
          p_order_id: string;
        };
        Returns: {
          order_id: string;
          order_no: string;
          status: OrderStatus;
        };
      };
      admin_update_order_status: {
        Args: {
          p_order_id: string;
          p_status: string;
          p_note?: string | null;
        };
        Returns: OrderRow;
      };
      admin_set_shipping: {
        Args: {
          p_order_id: string;
          p_courier: string;
          p_tracking_no: string;
          p_tracking_url?: string | null;
        };
        Returns: OrderRow;
      };
      admin_update_payment_status: {
        Args: {
          p_order_id: string;
          p_payment_status: string;
          p_note?: string | null;
        };
        Returns: OrderRow;
      };
      get_payment_options: {
        Args: Record<PropertyKey, never>;
        Returns: PaymentOptionsResponse;
      };
      submit_payment_proof: {
        Args: {
          p_order_no: string;
          p_phone: string;
          p_method: string;
          p_transaction_id: string;
          p_proof_path?: string | null;
          p_amount?: number | null;
        };
        Returns: {
          success: boolean;
          payment_id: string;
          order_no: string;
          status: string;
          amount: number;
          amount_mismatch: boolean;
        };
      };
      admin_verify_payment: {
        Args: {
          p_payment_id: string;
          p_note?: string | null;
        };
        Returns: {
          success: boolean;
          payment_id: string;
          order_no: string;
          payment_status: OrderPaymentStatus;
          order_status: OrderStatus;
        };
      };
      admin_reject_payment: {
        Args: {
          p_payment_id: string;
          p_reason: string;
        };
        Returns: {
          success: boolean;
          payment_id: string;
          order_no: string;
          payment_status: OrderPaymentStatus;
          reject_reason: string;
        };
      };
      admin_mark_refunded: {
        Args: {
          p_payment_id: string;
          p_note?: string | null;
        };
        Returns: {
          success: boolean;
          payment_id: string;
          order_no: string;
          payment_status: OrderPaymentStatus;
        };
      };
      mock_gateway_start: {
        Args: {
          p_order_no: string;
          p_phone: string;
        };
        Returns: MockGatewayStartResponse;
      };
      mock_gateway_complete: {
        Args: {
          p_token: string;
          p_outcome: string;
        };
        Returns: MockGatewayCompleteResponse;
      };
      apply_gateway_result: {
        Args: {
          p_provider: string;
          p_provider_reference: string;
          p_order_no: string;
          p_amount: number | null;
          p_status: string;
          p_raw?: Record<string, unknown>;
        };
        Returns: {
          processed: boolean;
          payment_id?: string;
          order_no?: string;
          payment_status?: OrderPaymentStatus;
          reason?: string;
        };
      };
      submit_review: {
        Args: {
          p_name: string;
          p_rating: number;
          p_title?: string | null;
          p_body: string;
          p_service_id?: string | null;
          p_phone?: string | null;
          p_language?: string;
        };
        Returns: { ok: boolean; id?: string };
      };
      get_review_summary: {
        Args: Record<PropertyKey, never>;
        Returns: ReviewSummary;
      };
      chat_rate_check: {
        Args: {
          p_session_id?: string | null;
        };
        Returns: {
          allowed: boolean;
          reason: string;
          remaining: number;
        };
      };
      chat_log: {
        Args: {
          p_session_id: string;
          p_language: string;
          p_vehicle?: Record<string, unknown> | null;
          p_engine: string;
          p_user_message: string;
          p_assistant_message: string;
        };
        Returns: {
          ok: boolean;
          logged: boolean;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
