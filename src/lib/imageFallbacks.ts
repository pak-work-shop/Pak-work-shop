import {
  BRAND_ASSETS,
  SECTION_A_SERVICE_IMAGES,
  SECTION_A_SITE_IMAGES,
  SECTION_C_CATEGORY_IMAGES,
  resolveDirectImageUrl,
} from './defaultImages';

const localFallbacks = new Map<string, string>();

function normalizeImageUrl(rawUrl: string): string {
  return rawUrl.trim().split(/[?#]/, 1)[0].replace(/\/+$/, '');
}

function registerFallback(sourceUrl: string, fallbackPath: string): void {
  const key = normalizeImageUrl(sourceUrl);
  if (key) localFallbacks.set(key, fallbackPath);
}

registerFallback(SECTION_A_SITE_IMAGES.hero_image_url, '/demo/hero-home.svg');
registerFallback(SECTION_A_SITE_IMAGES.about_image_url, '/demo/about-workshop.svg');
registerFallback(SECTION_A_SITE_IMAGES.cta_banner_url, '/demo/cta-banner.svg');

for (const [slug, imageUrl] of Object.entries(SECTION_A_SERVICE_IMAGES)) {
  registerFallback(imageUrl, '/demo/service-' + slug + '.svg');
}

const categoryFallbacks: Record<string, string> = {
  'tyres-wheels': '/demo/service-tyres.svg',
  batteries: '/demo/service-battery.svg',
  'oils-lubricants': '/demo/service-oil-change-service.svg',
  filters: '/demo/service-general-inspection.svg',
  brakes: '/demo/service-brakes.svg',
  'electrical-lighting': '/demo/service-electrical.svg',
  wipers: '/demo/service-general-inspection.svg',
  'suspension-steering': '/demo/service-suspension-steering.svg',
  'ac-cooling': '/demo/service-ac-repair.svg',
  'engine-parts': '/demo/service-engine.svg',
  'belts-cooling': '/demo/service-engine.svg',
  'exhaust-intake': '/demo/service-exhaust.svg',
  'body-exterior-accessories': '/demo/service-denting-painting.svg',
  'seat-covers-mats': '/demo/service-car-wash-detailing.svg',
  'tools-equipment': '/demo/service-general-inspection.svg',
  'interior-car-care': '/demo/service-car-wash-detailing.svg',
};

for (const [slug, fallbackPath] of Object.entries(categoryFallbacks)) {
  const imageUrl = SECTION_C_CATEGORY_IMAGES[slug];
  if (imageUrl) registerFallback(imageUrl, fallbackPath);
}

/**
 * Choose a same-site replacement when a previously saved image URL fails.
 * Keep the original URL as the first choice so existing owner images remain visible
 * whenever their host is available.
 */
export function getLocalFallbackForImage(rawUrl: string): string {
  const normalized = normalizeImageUrl(rawUrl);
  const directUrl = normalizeImageUrl(resolveDirectImageUrl(normalized));

  return (
    localFallbacks.get(normalized) ??
    localFallbacks.get(directUrl) ??
    BRAND_ASSETS.product_fallback_url
  );
}
