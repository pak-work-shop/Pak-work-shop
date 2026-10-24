import React, { createContext, useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import {
  resolveDirectImageUrl,
  SECTION_A_SITE_IMAGES,
} from '../../lib/defaultImages';
import type { SiteSettingsRow, WeekdayKey, WorkingHoursMap } from '../../types/database';
export { useSiteSettings } from './useSiteSettings';

export const DEFAULT_WORKING_HOURS: Required<WorkingHoursMap> = {
  monday: { isOpen: false, openTime: '09:00', closeTime: '20:00' },
  tuesday: { isOpen: false, openTime: '09:00', closeTime: '20:00' },
  wednesday: { isOpen: false, openTime: '09:00', closeTime: '20:00' },
  thursday: { isOpen: false, openTime: '09:00', closeTime: '20:00' },
  friday: { isOpen: false, openTime: '09:00', closeTime: '20:00' },
  saturday: { isOpen: false, openTime: '09:00', closeTime: '20:00' },
  sunday: { isOpen: false, openTime: '10:00', closeTime: '18:00' },
};

export const WEEKDAY_KEYS: WeekdayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DEFAULT_SITE_SETTINGS: SiteSettingsRow = {
  id: 1,
  business_name: 'Pak Auto Works & Parts',
  tagline: {
    en: 'One-Stop Auto Workshop & Genuine Spare Parts',
    ur: 'مکمل آٹو ورکشاپ اور اصلی کار پارٹس',
    'ur-roman': 'Mukammal Auto Workshop aur Asli Car Parts',
  },
  phone: '03126776844',
  whatsapp: '03126776844',
  email: '',
  address: {
    en: '',
    ur: '',
    'ur-roman': '',
  },
  maps_embed_url: '',
  working_hours: {},
  logo_url: '',
  favicon_url: '',
  facebook_url: '',
  instagram_url: '',
  youtube_url: '',
  tiktok_url: '',
  announcement: {
    en: '',
    ur: '',
    'ur-roman': '',
  },
  announcement_enabled: false,
  hero_image_url: SECTION_A_SITE_IMAGES.hero_image_url,
  about_image_url: SECTION_A_SITE_IMAGES.about_image_url,
  cta_banner_url: SECTION_A_SITE_IMAGES.cta_banner_url,
  og_image_url: '',
  about_title: {
    en: '',
    ur: '',
    'ur-roman': '',
  },
  about_body: {
    en: '',
    ur: '',
    'ur-roman': '',
  },
  demo_mode: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export interface SiteSettingsContextValue {
  settings: SiteSettingsRow;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (
    payload: Partial<Omit<SiteSettingsRow, 'id' | 'created_at' | 'updated_at'>>
  ) => Promise<{ error: string | null }>;
}

export const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: DEFAULT_SITE_SETTINGS,
  loading: false,
  refreshSettings: async () => {},
  updateSettings: async () => ({ error: null }),
});

function normalizeSettingsRow(row: Partial<SiteSettingsRow> | null): SiteSettingsRow {
  if (!row) return DEFAULT_SITE_SETTINGS;
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...row,
    business_name: row.business_name?.trim() || DEFAULT_SITE_SETTINGS.business_name,
    phone: row.phone?.trim() || DEFAULT_SITE_SETTINGS.phone,
    whatsapp: row.whatsapp?.trim() || DEFAULT_SITE_SETTINGS.whatsapp,
    tagline:
      row.tagline && typeof row.tagline === 'object'
        ? { ...DEFAULT_SITE_SETTINGS.tagline, ...row.tagline }
        : DEFAULT_SITE_SETTINGS.tagline,
    address:
      row.address && typeof row.address === 'object'
        ? { ...DEFAULT_SITE_SETTINGS.address, ...row.address }
        : DEFAULT_SITE_SETTINGS.address,
    working_hours:
      row.working_hours && typeof row.working_hours === 'object' ? row.working_hours : {},
    announcement:
      row.announcement && typeof row.announcement === 'object'
        ? { ...DEFAULT_SITE_SETTINGS.announcement, ...row.announcement }
        : DEFAULT_SITE_SETTINGS.announcement,
    announcement_enabled: Boolean(row.announcement_enabled),
    hero_image_url:
      resolveDirectImageUrl(row.hero_image_url) ||
      DEFAULT_SITE_SETTINGS.hero_image_url,
    about_image_url:
      resolveDirectImageUrl(row.about_image_url) ||
      DEFAULT_SITE_SETTINGS.about_image_url,
    cta_banner_url:
      resolveDirectImageUrl(row.cta_banner_url) ||
      DEFAULT_SITE_SETTINGS.cta_banner_url,
    og_image_url: resolveDirectImageUrl(row.og_image_url) || '',
    about_title:
      row.about_title && typeof row.about_title === 'object'
        ? { ...DEFAULT_SITE_SETTINGS.about_title, ...row.about_title }
        : DEFAULT_SITE_SETTINGS.about_title,
    about_body:
      row.about_body && typeof row.about_body === 'object'
        ? { ...DEFAULT_SITE_SETTINGS.about_body, ...row.about_body }
        : DEFAULT_SITE_SETTINGS.about_body,
    demo_mode: Boolean(row.demo_mode),
  };
}

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettingsRow>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState<boolean>(env.isConfigured);

  const refreshSettings = useCallback(async () => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data) {
        setSettings(normalizeSettingsRow(data as SiteSettingsRow));
      }
    } catch {
      // Fall back to defaults gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  // Apply custom favicon if configured in site_settings
  useEffect(() => {
    if (!settings.favicon_url?.trim() || typeof document === 'undefined') return;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = settings.favicon_url.trim();
  }, [settings.favicon_url]);

  const updateSettings = useCallback(
    async (
      payload: Partial<Omit<SiteSettingsRow, 'id' | 'created_at' | 'updated_at'>>
    ): Promise<{ error: string | null }> => {
      if (!env.isConfigured) {
        return { error: 'Not configured' };
      }

      try {
        const { data, error } = await supabase
          .from('site_settings')
          .update(payload)
          .eq('id', 1)
          .select('*')
          .single();

        if (error) {
          return { error: error.message };
        }
        if (data) {
          setSettings(normalizeSettingsRow(data as SiteSettingsRow));
        }
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Unknown error' };
      }
    },
    []
  );

  return (
    <SiteSettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings,
        updateSettings,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}
