import React from 'react';
import { Helmet } from 'react-helmet-async';
import type {
  BrandRow,
  FaqRow,
  ProductRow,
  ServiceRow,
  SiteSettingsRow,
} from '../../types/database';
import { getLocalized } from '../../i18n/helpers';
import { WEEKDAY_KEYS } from '../../features/settings/SiteSettingsContext';

export interface JsonLdProps {
  data:
    | Record<string, unknown>
    | ReadonlyArray<Record<string, unknown> | null>
    | null;
}

/**
 * Renders a <script type="application/ld+json"> block safely by serializing with
 * JSON.stringify and escaping every '<' character as '\u003c'.
 */
export function JsonLd({ data }: JsonLdProps) {
  if (!data) return null;
  const payload = Array.isArray(data) ? data.filter(Boolean) : data;
  if (Array.isArray(payload) && payload.length === 0) return null;
  const safeJson = JSON.stringify(payload).replace(/</g, '\\u003c');

  return (
    <Helmet>
      <script type="application/ld+json">{safeJson}</script>
    </Helmet>
  );
}

const SCHEMA_DAY_MAP: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

/**
 * Builds AutoRepair (LocalBusiness) JSON-LD using only fields present in site_settings.
 * Never invents missing address, hours, ratings, or coordinates.
 */
export function buildLocalBusinessJsonLd(
  settings: SiteSettingsRow,
  lang: string,
  reviewsSummary?: { averageRating: number; totalCount: number; isDemo?: boolean } | null
): Record<string, unknown> {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const name = settings.business_name?.trim() || 'Pak Auto Works & Parts';
  const telephone = settings.phone?.trim() || '03126776844';
  const addressText = getLocalized(settings, 'address', lang);
  const image =
    settings.logo_url?.trim() ||
    settings.hero_image_url?.trim() ||
    settings.og_image_url?.trim() ||
    '';

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    name,
    telephone,
  };

  if (origin) {
    ld.url = origin;
  }

  if (image) {
    ld.image = image;
  }

  if (settings.email?.trim()) {
    ld.email = settings.email.trim();
  }

  if (addressText) {
    ld.address = {
      '@type': 'PostalAddress',
      streetAddress: addressText,
      addressCountry: 'PK',
    };
  }

  const openSpecs = WEEKDAY_KEYS.filter(
    (day) => settings.working_hours && settings.working_hours[day]?.isOpen
  ).map((day) => {
    const entry = settings.working_hours[day]!;
    return {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: SCHEMA_DAY_MAP[day],
      opens: entry.openTime,
      closes: entry.closeTime,
    };
  });

  if (openSpecs.length > 0) {
    ld.openingHoursSpecification = openSpecs;
  }

  // AggregateRating emitted ONLY when demo_mode is false AND at least 5 real approved reviews exist
  if (
    reviewsSummary &&
    !settings.demo_mode &&
    !reviewsSummary.isDemo &&
    reviewsSummary.totalCount >= 5 &&
    reviewsSummary.averageRating > 0
  ) {
    ld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(reviewsSummary.averageRating.toFixed(1)),
      reviewCount: reviewsSummary.totalCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return ld;
}

/**
 * Builds Service JSON-LD for /services/:slug.
 * Includes offers/priceSpecification only if price_from or price_to is actually set.
 */
export function buildServiceJsonLd(
  service: ServiceRow,
  settings: SiteSettingsRow,
  lang: string
): Record<string, unknown> {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const serviceName = getLocalized(service, 'name', lang);
  const serviceDesc =
    getLocalized(service, 'description', lang) ||
    getLocalized(service, 'short_description', lang);

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceName,
    provider: {
      '@type': 'AutoRepair',
      name: settings.business_name?.trim() || 'Pak Auto Works & Parts',
      telephone: settings.phone?.trim() || '03126776844',
    },
  };

  if (serviceDesc) {
    ld.description = serviceDesc;
  }

  if (origin) {
    ld.url = `${origin}/services/${service.slug}`;
  }

  if (service.image_url?.trim()) {
    ld.image = service.image_url.trim();
  }

  if (service.price_from !== null && service.price_to !== null) {
    ld.offers = {
      '@type': 'AggregateOffer',
      priceCurrency: 'PKR',
      lowPrice: Number(service.price_from),
      highPrice: Number(service.price_to),
    };
  } else if (service.price_from !== null) {
    ld.offers = {
      '@type': 'Offer',
      priceCurrency: 'PKR',
      price: Number(service.price_from),
    };
  }

  return ld;
}

/**
 * Builds FAQPage JSON-LD for /faq.
 */
export function buildFaqPageJsonLd(
  faqs: FaqRow[],
  lang: string
): Record<string, unknown> | null {
  const entities = faqs
    .map((faq) => {
      const q = getLocalized(faq, 'question', lang);
      const a = getLocalized(faq, 'answer', lang);
      if (!q || !a) return null;
      return {
        '@type': 'Question',
        name: q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: a,
        },
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (entities.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entities,
  };
}

/**
 * Builds BreadcrumbList JSON-LD for catalogue & product detail pages.
 */
export function buildBreadcrumbJsonLd(
  items: ReadonlyArray<{ name: string; url: string }>
): Record<string, unknown> | null {
  if (!items || items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Builds Product JSON-LD for /shop/product/:slug.
 * Emits sku, brand, image (if present), and offers with PKR price and availability.
 */
export function buildProductJsonLd(
  product: ProductRow,
  brand: BrandRow | null,
  primaryImageUrl: string | null,
  settings: SiteSettingsRow,
  lang: string
): Record<string, unknown> {
  const siteUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://pakautoworks.pk';
  const productName = getLocalized(product, 'name', lang) || product.sku;
  const productDesc =
    getLocalized(product, 'short_description', lang) ||
    getLocalized(product, 'description', lang) ||
    '';
  const businessName =
    settings.business_name?.trim() || 'Pak Auto Works & Parts';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    sku: product.sku,
    url: `${siteUrl}/catalogue/product/${product.slug}`,
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/catalogue/product/${product.slug}`,
      priceCurrency: 'PKR',
      price: Number(product.price),
      availability:
        product.stock_qty > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'AutoRepair',
        name: businessName,
      },
    },
  };

  if (productDesc) {
    schema.description = productDesc;
  }

  if (primaryImageUrl && primaryImageUrl.trim()) {
    schema.image = [primaryImageUrl.trim()];
  }

  if (brand?.name) {
    schema.brand = {
      '@type': 'Brand',
      name: brand.name,
    };
  }

  return schema;
}

/**
 * Builds Article JSON-LD for /blog/:slug.
 */
export function buildArticleJsonLd(
  post: {
    title: any;
    excerpt?: any;
    slug: string;
    cover_image_url?: string | null;
    published_at?: string | null;
    updated_at?: string | null;
    author_name?: string | null;
  },
  settings: SiteSettingsRow,
  lang: string
): Record<string, unknown> {
  const siteUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://pakautoworks.pk';
  const title = getLocalized(post, 'title', lang) || 'Article';
  const description = getLocalized(post, 'excerpt', lang) || '';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    url: `${siteUrl}/blog/${post.slug}`,
    publisher: {
      '@type': 'AutoRepair',
      name: settings.business_name?.trim() || 'Pak Auto Works & Parts',
      logo: settings.logo_url?.trim() || undefined,
    },
  };

  if (description) {
    schema.description = description;
  }
  if (post.cover_image_url?.trim()) {
    schema.image = [post.cover_image_url.trim()];
  }
  if (post.published_at) {
    schema.datePublished = post.published_at;
  }
  if (post.updated_at) {
    schema.dateModified = post.updated_at;
  }
  if (post.author_name?.trim()) {
    schema.author = {
      '@type': 'Person',
      name: post.author_name.trim(),
    };
  }

  return schema;
}
