import type { BadgeVariant } from '../../components/ui/Badge';
import type {
  CartStoredItem,
  DeliverySettingsRow,
  OrderPaymentStatus,
  OrderStatus,
  PakistanCityRow,
  QuoteOrderLine,
  QuoteOrderResponse,
} from '../../types/database';

export const FORWARD_ORDER_STAGES: OrderStatus[] = [
  'placed',
  'confirmed',
  'packed',
  'shipped',
  'delivered',
];

export const ALL_ORDER_STATUSES: OrderStatus[] = [
  'placed',
  'confirmed',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
];

export const ALL_ORDER_PAYMENT_STATUSES: OrderPaymentStatus[] = [
  'cod_pending',
  'pending',
  'paid',
  'cod_collected',
  'failed',
  'refunded',
];

export function getOrderStageRank(status: OrderStatus): number | null {
  const idx = FORWARD_ORDER_STAGES.indexOf(status);
  return idx >= 0 ? idx + 1 : null;
}

export function getOrderStatusBadgeVariant(status: OrderStatus): BadgeVariant {
  switch (status) {
    case 'placed':
      return 'warning';
    case 'confirmed':
    case 'packed':
    case 'shipped':
      return 'primary';
    case 'delivered':
      return 'success';
    case 'cancelled':
    case 'returned':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function getOrderPaymentStatusBadgeVariant(
  paymentStatus: OrderPaymentStatus
): BadgeVariant {
  switch (paymentStatus) {
    case 'paid':
    case 'cod_collected':
      return 'success';
    case 'cod_pending':
    case 'pending':
      return 'warning';
    case 'failed':
    case 'refunded':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function canCustomerCancelOrder(status: OrderStatus): boolean {
  return status === 'placed' || status === 'confirmed';
}

export function getAllowedAdminOrderTransitions(
  current: OrderStatus
): OrderStatus[] {
  switch (current) {
    case 'placed':
      return ['confirmed', 'packed', 'cancelled'];
    case 'confirmed':
      return ['packed', 'shipped', 'cancelled'];
    case 'packed':
      return ['shipped', 'cancelled'];
    case 'shipped':
      return ['delivered', 'returned'];
    case 'delivered':
      return ['returned'];
    case 'cancelled':
    case 'returned':
    default:
      return [];
  }
}

export const COURIER_PRESETS: Array<{
  name: string;
  trackingUrlTemplate: string;
}> = [
  {
    name: 'Workshop Local Rider',
    trackingUrlTemplate: '',
  },
  {
    name: 'TCS Express',
    trackingUrlTemplate: 'https://www.tcsexpress.com/track',
  },
  {
    name: 'Leopards Courier',
    trackingUrlTemplate: 'https://www.leopardscourier.com',
  },
  {
    name: 'M&P Express Logistics',
    trackingUrlTemplate: 'https://www.mulphilog.com',
  },
  {
    name: 'PostEx',
    trackingUrlTemplate: 'https://postex.pk/tracking',
  },
  {
    name: 'Call Courier',
    trackingUrlTemplate: 'https://callcourier.com.pk/tracking/',
  },
  {
    name: 'Daewoo FastEx',
    trackingUrlTemplate: 'https://fastex.pk',
  },
  {
    name: 'Pakistan Post',
    trackingUrlTemplate: 'https://ep.gov.pk/track.asp',
  },
];

export const DEMO_ORDER_SAMPLES: Array<{
  orderNo: string;
  phone: string;
  city: string;
  status: OrderStatus;
}> = [
  {
    orderNo: 'ORD-000101',
    phone: '03001234567',
    city: 'Sadiqabad',
    status: 'delivered',
  },
  {
    orderNo: 'ORD-000102',
    phone: '03217654321',
    city: 'Lahore',
    status: 'shipped',
  },
  {
    orderNo: 'ORD-000103',
    phone: '03339876543',
    city: 'Rahim Yar Khan',
    status: 'packed',
  },
  {
    orderNo: 'ORD-000104',
    phone: '03451122334',
    city: 'Islamabad',
    status: 'confirmed',
  },
  {
    orderNo: 'ORD-000105',
    phone: '03129988776',
    city: 'Sadiqabad',
    status: 'placed',
  },
];

export const DEMO_COUPON_SAMPLES: Array<{
  code: string;
  label: string;
}> = [
  { code: 'WELCOME10', label: '10% OFF (Min Rs. 2,000)' },
  { code: 'SADIQABAD500', label: 'Rs. 500 OFF (Min Rs. 5,000)' },
];

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettingsRow = {
  id: 1,
  flat_rate: 300,
  free_cities: ['Sadiqabad'],
  free_over_amount: null,
  min_order_amount: 0,
  cod_enabled: true,
  cod_max_amount: null,
  cod_blocked_cities: [],
  online_payment_enabled: false,
  updated_at: new Date().toISOString(),
};

export const DEFAULT_PAKISTAN_CITIES: PakistanCityRow[] = [
  { id: 'city-sadiqabad', name: 'Sadiqabad', province: 'Punjab', sort_order: 1, is_active: true },
  { id: 'city-ryk', name: 'Rahim Yar Khan', province: 'Punjab', sort_order: 2, is_active: true },
  { id: 'city-khanpur', name: 'Khanpur', province: 'Punjab', sort_order: 3, is_active: true },
  { id: 'city-liaquatpur', name: 'Liaquatpur', province: 'Punjab', sort_order: 4, is_active: true },
  { id: 'city-zahpir', name: 'Zahpir', province: 'Punjab', sort_order: 5, is_active: true },
  { id: 'city-sanjarpur', name: 'Sanjarpur', province: 'Punjab', sort_order: 6, is_active: true },
  { id: 'city-lahore', name: 'Lahore', province: 'Punjab', sort_order: 11, is_active: true },
  { id: 'city-karachi', name: 'Karachi', province: 'Sindh', sort_order: 12, is_active: true },
  { id: 'city-islamabad', name: 'Islamabad', province: 'Islamabad Capital Territory', sort_order: 13, is_active: true },
  { id: 'city-rawalpindi', name: 'Rawalpindi', province: 'Punjab', sort_order: 14, is_active: true },
  { id: 'city-faisalabad', name: 'Faisalabad', province: 'Punjab', sort_order: 15, is_active: true },
  { id: 'city-multan', name: 'Multan', province: 'Punjab', sort_order: 16, is_active: true },
  { id: 'city-bahawalpur', name: 'Bahawalpur', province: 'Punjab', sort_order: 17, is_active: true },
  { id: 'city-gujranwala', name: 'Gujranwala', province: 'Punjab', sort_order: 18, is_active: true },
  { id: 'city-peshawar', name: 'Peshawar', province: 'Khyber Pakhtunkhwa', sort_order: 19, is_active: true },
  { id: 'city-quetta', name: 'Quetta', province: 'Balochistan', sort_order: 20, is_active: true },
  { id: 'city-sialkot', name: 'Sialkot', province: 'Punjab', sort_order: 21, is_active: true },
  { id: 'city-hyderabad', name: 'Hyderabad', province: 'Sindh', sort_order: 22, is_active: true },
  { id: 'city-sukkur', name: 'Sukkur', province: 'Sindh', sort_order: 23, is_active: true },
  { id: 'city-sargodha', name: 'Sargodha', province: 'Punjab', sort_order: 24, is_active: true },
  { id: 'city-dgk', name: 'Dera Ghazi Khan', province: 'Punjab', sort_order: 42, is_active: true },
  { id: 'city-gujrat', name: 'Gujrat', province: 'Punjab', sort_order: 45, is_active: true },
  { id: 'city-jhelum', name: 'Jhelum', province: 'Punjab', sort_order: 54, is_active: true },
  { id: 'city-kasur', name: 'Kasur', province: 'Punjab', sort_order: 58, is_active: true },
  { id: 'city-okara', name: 'Okara', province: 'Punjab', sort_order: 75, is_active: true },
  { id: 'city-sahiwal', name: 'Sahiwal', province: 'Punjab', sort_order: 81, is_active: true },
  { id: 'city-sheikhupura', name: 'Sheikhupura', province: 'Punjab', sort_order: 85, is_active: true },
  { id: 'city-vehari', name: 'Vehari', province: 'Punjab', sort_order: 91, is_active: true },
  { id: 'city-daharki', name: 'Daharki', province: 'Sindh', sort_order: 95, is_active: true },
  { id: 'city-ghotki', name: 'Ghotki', province: 'Sindh', sort_order: 96, is_active: true },
  { id: 'city-abbottabad', name: 'Abbottabad', province: 'Khyber Pakhtunkhwa', sort_order: 120, is_active: true },
  { id: 'city-mardan', name: 'Mardan', province: 'Khyber Pakhtunkhwa', sort_order: 128, is_active: true },
  { id: 'city-muzaffarabad', name: 'Muzaffarabad', province: 'Azad Kashmir', sort_order: 150, is_active: true },
  { id: 'city-mirpur', name: 'Mirpur (AJK)', province: 'Azad Kashmir', sort_order: 151, is_active: true },
  { id: 'city-gilgit', name: 'Gilgit', province: 'Gilgit-Baltistan', sort_order: 160, is_active: true },
];

export function isCityInFreeList(city: string, freeCities: string[]): boolean {
  const clean = city.trim().toLowerCase();
  if (!clean) return false;
  return freeCities.some((fc) => fc.trim().toLowerCase() === clean);
}

export function computeFallbackQuote(
  items: CartStoredItem[],
  city: string,
  couponCode: string,
  settings: DeliverySettingsRow = DEFAULT_DELIVERY_SETTINGS
): QuoteOrderResponse {
  const lines: QuoteOrderLine[] = items.map((item) => {
    const qty = Math.min(20, Math.max(1, item.quantity));
    const lineTotal = Math.round(item.unit_price * qty * 100) / 100;
    return {
      product_id: item.product_id,
      sku: item.sku,
      slug: item.slug,
      name: item.name,
      primary_image_url: item.primary_image_url ?? null,
      part_origin: item.part_origin,
      unit_price: item.unit_price,
      compare_at_price: item.compare_at_price ?? null,
      quantity: qty,
      available_stock: item.stock_qty,
      line_total: lineTotal,
      is_active: true,
      problems: item.stock_qty < qty ? ['out_of_stock'] : [],
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.line_total, 0);
  const cleanCity = city.trim();
  const isFreeCity = isCityInFreeList(cleanCity, settings.free_cities);
  const isCodBlocked = isCityInFreeList(cleanCity, settings.cod_blocked_cities);

  const discount = 0;
  let deliveryCharge = 0;
  let deliveryRule: QuoteOrderResponse['delivery_rule'] = 'flat_rate';

  if (subtotal <= 0) {
    deliveryCharge = 0;
    deliveryRule = 'empty_cart';
  } else if (isFreeCity) {
    deliveryCharge = 0;
    deliveryRule = 'free_city';
  } else if (
    settings.free_over_amount !== null &&
    subtotal - discount >= settings.free_over_amount
  ) {
    deliveryCharge = 0;
    deliveryRule = 'free_over_amount';
  } else {
    deliveryCharge = Number(settings.flat_rate ?? 300);
    deliveryRule = 'flat_rate';
  }

  const total = Math.max(0, subtotal - discount) + deliveryCharge;

  let codAllowed = true;
  let codReason: QuoteOrderResponse['cod_reason'] = null;
  if (!settings.cod_enabled) {
    codAllowed = false;
    codReason = 'cod_disabled';
  } else if (isCodBlocked) {
    codAllowed = false;
    codReason = 'city_blocked';
  } else if (
    settings.cod_max_amount !== null &&
    total > settings.cod_max_amount
  ) {
    codAllowed = false;
    codReason = 'exceeds_max_amount';
  }

  return {
    lines,
    problems: [],
    has_blocking_problems: lines.some((l) => l.problems.length > 0),
    subtotal,
    discount,
    coupon_code: null,
    coupon_valid: false,
    coupon_error: couponCode.trim() ? 'invalid_coupon' : null,
    delivery_charge: deliveryCharge,
    delivery_rule: deliveryRule,
    free_cities: settings.free_cities,
    flat_rate: Number(settings.flat_rate ?? 300),
    free_over_amount: settings.free_over_amount,
    min_order_amount: Number(settings.min_order_amount ?? 0),
    meets_min_order: subtotal >= Number(settings.min_order_amount ?? 0),
    total,
    cod_allowed: codAllowed,
    cod_reason: codReason,
    cod_max_amount: settings.cod_max_amount,
    online_payment_enabled: Boolean(settings.online_payment_enabled),
  };
}

export interface CourierPreset {
  name: string;
  urlTemplate?: (tracking: string) => string;
}

export const PAKISTAN_COURIER_PRESETS: CourierPreset[] = [
  {
    name: 'TCS',
    urlTemplate: (no) => `https://www.tcsexpress.com/track/${encodeURIComponent(no)}`,
  },
  {
    name: 'Leopards Courier',
    urlTemplate: (no) => `https://leopardscourier.com/tracking?track_number=${encodeURIComponent(no)}`,
  },
  {
    name: 'Trax',
    urlTemplate: (no) => `https://trax.pk/tracking?tracking_number=${encodeURIComponent(no)}`,
  },
  {
    name: 'Call Courier',
    urlTemplate: (no) => `https://callcourier.com.pk/tracking/?tc=${encodeURIComponent(no)}`,
  },
  {
    name: 'M&P',
    urlTemplate: (no) => `https://mulphilog.com/tracking?consignment=${encodeURIComponent(no)}`,
  },
  {
    name: 'PostEx',
    urlTemplate: (no) => `https://postex.pk/tracking?order_id=${encodeURIComponent(no)}`,
  },
  {
    name: 'Daewoo FastEx',
    urlTemplate: (no) => `https://daewoo.com.pk/fastex-tracking?cn=${encodeURIComponent(no)}`,
  },
  {
    name: 'Self Delivery / Rider',
  },
];

export function buildCourierTrackingUrl(
  courier: string,
  trackingNo: string
): string | null {
  if (!trackingNo.trim()) return null;
  const match = PAKISTAN_COURIER_PRESETS.find(
    (p) => p.name.toLowerCase() === courier.trim().toLowerCase()
  );
  if (match && match.urlTemplate) {
    return match.urlTemplate(trackingNo.trim());
  }
  return null;
}
