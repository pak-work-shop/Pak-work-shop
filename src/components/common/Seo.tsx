import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useSiteSettings } from '../../features/settings/useSiteSettings';
import { getLocalized } from '../../i18n/helpers';

export interface SeoProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function Seo({
  title,
  description,
  canonicalPath,
  ogImage,
  noIndex,
}: SeoProps) {
  const { i18n, t } = useTranslation();
  const { settings } = useSiteSettings();

  const businessName = settings.business_name || 'Pak Auto Works & Parts';
  const fullTitle = title ? `${title} | ${businessName}` : businessName;

  const localizedTagline = getLocalized(settings, 'tagline', i18n.language);
  const metaDescription =
    description || localizedTagline || t('home.seoDescription');

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname =
    canonicalPath ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const canonicalUrl = origin ? `${origin}${pathname}` : undefined;
  const resolvedOgImage = ogImage?.trim() || settings.og_image_url?.trim() || '';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {resolvedOgImage && <meta property="og:image" content={resolvedOgImage} />}
    </Helmet>
  );
}
