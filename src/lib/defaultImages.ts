/**
 * Section A — Owner-supplied images for Home, About, and Workshop Services (A1–A17).
 * Used as default fallbacks when database rows have empty image columns and
 * mirrored in supabase/phase2_content.sql + supabase/apply_section_a_images.sql.
 */

export const SECTION_A_SITE_IMAGES = {
  // A1 — Home page hero image (1600x900)
  hero_image_url:
    '/demo/hero-home.svg',
  // A2 — About page image (1200x800)
  about_image_url:
    '/demo/about-workshop.svg',
  // A17 — "Book Now" CTA banner background (1600x600)
  cta_banner_url:
    '/demo/cta-banner.svg',
} as const;

export const SECTION_A_SERVICE_IMAGES: Record<string, string> = {
  // A3 — Service: Engine Repair & Tuning
  engine:
    '/demo/service-engine.svg',
  // A4 — Service: Denting & Painting
  'denting-painting':
    '/demo/service-denting-painting.svg',
  // A5 — Service: AC Repair & Service
  'ac-repair':
    '/demo/service-ac-repair.svg',
  // A6 — Service: Auto Electrical
  electrical:
    '/demo/service-electrical.svg',
  // A7 — Service: Tyres
  tyres:
    '/demo/service-tyres.svg',
  // A8 — Service: Car Wash & Detailing
  'car-wash-detailing':
    '/demo/service-car-wash-detailing.svg',
  // A9 — Service: Brakes
  brakes:
    '/demo/service-brakes.svg',
  // A10 — Service: Suspension & Steering
  'suspension-steering':
    '/demo/service-suspension-steering.svg',
  // A11 — Service: Oil Change & Periodic Service
  'oil-change-service':
    '/demo/service-oil-change-service.svg',
  // A12 — Service: Battery
  battery:
    '/demo/service-battery.svg',
  // A13 — Service: Wheel Alignment & Balancing
  'wheel-alignment-balancing':
    '/demo/service-wheel-alignment-balancing.svg',
  // A14 — Service: Transmission / Gearbox
  'transmission-gearbox':
    '/demo/service-transmission-gearbox.svg',
  // A15 — Service: Exhaust
  exhaust:
    '/demo/service-exhaust.svg',
  // A16 — Service: General Inspection
  'general-inspection':
    '/demo/service-general-inspection.svg',
};

export const BRAND_ASSETS = {
  // B1 — Logo (600x200, for dark header, footer, invoices, print pages)
  logo_url: '/brand/logo.jpg',
  // B2 — Favicon (512x512 square icon for browser tab)
  favicon_url: '/favicon.png',
  // C17 — "No photo available" product fallback (600x600 neutral dark with gear icon)
  product_fallback_url: '/demo/no-photo.jpg',
} as const;

/**
 * Section C — Parts Store category photos / illustrations (C1–C16, 600x600).
 * Shown on category tiles and as fallbacks on products without their own photo.
 */
export const SECTION_C_CATEGORY_IMAGES: Record<string, string> = {
  // C1 — Tyres & Wheels
  'tyres-wheels': '/demo/service-tyres.svg',
  // C2 — Batteries
  batteries: '/demo/service-battery.svg',
  // C3 — Engine Oil & Fluids
  'oils-lubricants': '/demo/service-oil-change-service.svg',
  'engine-oil-fluids': '/demo/service-oil-change-service.svg',
  // C4 — Filters
  filters: '/demo/service-general-inspection.svg',
  // C5 — Braking System
  brakes: '/demo/service-brakes.svg',
  'braking-system': '/demo/service-brakes.svg',
  // C6 — Lighting & Bulbs
  'electrical-lighting': '/demo/service-electrical.svg',
  'lighting-bulbs': '/demo/service-electrical.svg',
  // C7 — Wipers (NEW category)
  wipers: '/demo/service-general-inspection.svg',
  // C8 — Suspension & Steering
  'suspension-steering': '/demo/service-suspension-steering.svg',
  // C9 — AC Parts (NEW category)
  'ac-cooling': '/demo/service-ac-repair.svg',
  'ac-parts': '/demo/service-ac-repair.svg',
  // C10 — Ignition & Electrical
  'ignition-electrical': '/demo/service-electrical.svg',
  'engine-parts': '/demo/service-engine.svg',
  // C11 — Belts & Cooling
  'belts-cooling': '/demo/service-engine.svg',
  // C12 — Exhaust & Intake
  'exhaust-intake': '/demo/service-exhaust.svg',
  // C13 — Body & Trim
  'body-exterior-accessories': '/demo/service-denting-painting.svg',
  'body-trim': '/demo/service-denting-painting.svg',
  // C14 — Seat Covers & Mats (NEW category)
  'seat-covers-mats': '/demo/service-car-wash-detailing.svg',
  // C15 — Tools & Equipment (NEW category)
  'tools-equipment': '/demo/service-general-inspection.svg',
  // C16 — Car Care & Accessories
  'interior-car-care': '/demo/service-car-wash-detailing.svg',
  'car-care-accessories': '/demo/service-car-wash-detailing.svg',
};

const KOMMODO_SHARE_TO_DIRECT_MAP: Record<string, string> = {
  // Section A
  'https://kommodo.ai/i/2tdS7EMNiVYKWW8c2s5e':
    'https://plain-eeur-prod-public.komododecks.com/202610/10/2tdS7EMNiVYKWW8c2s5e/image.png',
  'https://kommodo.ai/i/s71pHYGAuUiyxdfXpIet':
    'https://plain-eeur-prod-public.komododecks.com/202610/10/s71pHYGAuUiyxdfXpIet/image.jpg',
  'https://kommodo.ai/i/pxnCdhqNBXOmzKu9ssO6':
    'https://plain-eeur-prod-public.komododecks.com/202610/10/pxnCdhqNBXOmzKu9ssO6/image.jpg',
  'https://kommodo.ai/i/nwz6vbqK7nSjjDuNVCQD':
    'https://plain-eeur-prod-public.komododecks.com/202610/10/nwz6vbqK7nSjjDuNVCQD/image.png',
  'https://kommodo.ai/i/kyT8ZxsNWafoe63unrAA':
    'https://plain-eeur-prod-public.komododecks.com/202610/10/kyT8ZxsNWafoe63unrAA/image.png',
  'https://kommodo.ai/i/7C3GbZs175K7YIKAfCdf':
    'https://plain-eeur-prod-public.komododecks.com/202610/10/7C3GbZs175K7YIKAfCdf/image.png',
  'https://kommodo.ai/i/PDlNr4YQspgdc2JsDsh7':
    'https://plain-eeur-prod-public.komododecks.com/202610/10/PDlNr4YQspgdc2JsDsh7/image.jpg',
  'https://kommodo.ai/i/NuygQByhmXqHCeE5pYYz':
    'https://plain-eeur-prod-public.komododecks.com/202610/10/NuygQByhmXqHCeE5pYYz/image.png',
  // Section C Category links (C1–C16)
  'https://kommodo.ai/i/ytnfvcA70GNdIDyZfAMq':
    'https://plain-eeur-prod-public.komododecks.com/202610/14/ytnfvcA70GNdIDyZfAMq/image.png',
  'https://kommodo.ai/i/o3W5EwwTRxsH9rffpR6v':
    'https://plain-eeur-prod-public.komododecks.com/202610/14/o3W5EwwTRxsH9rffpR6v/image.png',
  'https://kommodo.ai/i/Bnh6KN8yADd6hcSesOdk':
    'https://plain-eeur-prod-public.komododecks.com/202610/14/Bnh6KN8yADd6hcSesOdk/image.png',
  'https://kommodo.ai/i/W2rQDvxbMhm7JcAT4nbG':
    'https://plain-eeur-prod-public.komododecks.com/202610/14/W2rQDvxbMhm7JcAT4nbG/image.png',
  'https://kommodo.ai/i/98q54OUL7nKF5GujnAhZ':
    'https://plain-eeur-prod-public.komododecks.com/202610/14/98q54OUL7nKF5GujnAhZ/image.png',
  'https://kommodo.ai/i/99JTVbuDfcuzyPiokHq5':
    'https://plain-eeur-prod-public.komododecks.com/202610/14/99JTVbuDfcuzyPiokHq5/image.png',
  'https://kommodo.ai/i/VGawU65tPKznMuC0HDo5':
    'https://plain-eeur-prod-public.komododecks.com/202610/14/VGawU65tPKznMuC0HDo5/image.png',
  'https://kommodo.ai/i/VRctkVPtkhZQtm9LTFNx':
    'https://plain-eeur-prod-public.komododecks.com/202610/14/VRctkVPtkhZQtm9LTFNx/image.webp',
  'https://kommodo.ai/i/IpxAx5ArH5Ouc5BLBRt6':
    'https://plain-eeur-prod-public.komododecks.com/202610/14/IpxAx5ArH5Ouc5BLBRt6/image.png',
  'https://kommodo.ai/i/WFNTPDUDIXM7GYFLZJa7':
    'https://plain-eeur-prod-public.komododecks.com/202610/14/WFNTPDUDIXM7GYFLZJa7/image.png',
  'https://kommodo.ai/i/nFh1IXIrxq8VTMN6YGWu':
    'https://plain-eeur-prod-public.komododecks.com/202610/14/nFh1IXIrxq8VTMN6YGWu/image.jpg',
  'https://kommodo.ai/i/UFeavmffaJiDQlmB9lmu':
    'https://plain-eeur-prod-public.komododecks.com/202610/14/UFeavmffaJiDQlmB9lmu/image.webp',
  'https://kommodo.ai/i/XnNdMfRGwEFdCfnWP0oj':
    'https://plain-eeur-prod-public.komododecks.com/202610/14/XnNdMfRGwEFdCfnWP0oj/image.png',
  'https://kommodo.ai/i/2z20LsklqwlO39dSpX53':
    'https://plain-eeur-prod-public.komododecks.com/202610/14/2z20LsklqwlO39dSpX53/image.png',
  'https://kommodo.ai/i/ITol4athZdM3YPigZ8Uh':
    'https://plain-eeur-prod-public.komododecks.com/202610/14/ITol4athZdM3YPigZ8Uh/image.png',
  'https://kommodo.ai/i/P0MbpOozfG0KF1lCnECW':
    'https://plain-eeur-prod-public.komododecks.com/202610/14/P0MbpOozfG0KF1lCnECW/image.png',
};

/**
 * Resolves any known Kommodo share page link (`https://kommodo.ai/i/...`) to its
 * direct CDN image file URL, or returns the trimmed URL as-is.
 */
export function resolveDirectImageUrl(rawUrl?: string | null): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  if (KOMMODO_SHARE_TO_DIRECT_MAP[withoutTrailingSlash]) {
    return KOMMODO_SHARE_TO_DIRECT_MAP[withoutTrailingSlash];
  }
  return trimmed;
}

/**
 * Gets a high-resolution category photo for any category slug or icon name.
 */
export function getCategoryPhoto(slugOrName?: string | null): string {
  const key = (slugOrName || '').toLowerCase().trim();
  if (!key) return BRAND_ASSETS.product_fallback_url;
  if (SECTION_C_CATEGORY_IMAGES[key]) {
    return SECTION_C_CATEGORY_IMAGES[key];
  }
  for (const [catKey, url] of Object.entries(SECTION_C_CATEGORY_IMAGES)) {
    if (key.includes(catKey) || catKey.includes(key)) {
      return url;
    }
  }
  return BRAND_ASSETS.product_fallback_url;
}
