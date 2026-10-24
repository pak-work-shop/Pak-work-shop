import { useContext } from 'react';
import { SiteSettingsContext, type SiteSettingsContextValue } from './SiteSettingsContext';

export function useSiteSettings(): SiteSettingsContextValue {
  return useContext(SiteSettingsContext);
}
