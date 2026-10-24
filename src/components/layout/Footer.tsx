import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useSiteSettings } from '../../features/settings/useSiteSettings';
import { WEEKDAY_KEYS } from '../../features/settings/SiteSettingsContext';
import { useServices } from '../../features/services/useServices';
import { getLocalized } from '../../i18n/helpers';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { Logo } from '../common/Logo';
import { cn } from '../../lib/utils';

export function Footer() {
  const { t, i18n } = useTranslation();
  const { settings } = useSiteSettings();
  const { services: featuredServices } = useServices({
    featuredOnly: true,
    limit: 6,
  });

  const businessName = settings.business_name || 'Pak Auto Works & Parts';
  const tagline = getLocalized(settings, 'tagline', i18n.language);
  const address = getLocalized(settings, 'address', i18n.language);
  const phone = settings.phone || '03126776844';
  const whatsapp = settings.whatsapp || phone;
  const whatsappHref = buildWhatsAppUrl(whatsapp, t('whatsapp.defaultMessage'));

  // Determine if any working hours are explicitly configured as open
  const configuredDays = WEEKDAY_KEYS.filter(
    (day) => settings.working_hours && settings.working_hours[day]?.isOpen
  );

  const socialLinks = [
    { label: 'Facebook', url: settings.facebook_url?.trim() },
    { label: 'Instagram', url: settings.instagram_url?.trim() },
    { label: 'YouTube', url: settings.youtube_url?.trim() },
    { label: 'TikTok', url: settings.tiktok_url?.trim() },
  ].filter((item): item is { label: string; url: string } => Boolean(item.url));

  const currentYear = new Date().getFullYear();
  const hasServicesColumn = featuredServices.length > 0;

  return (
    <footer className="bg-[#0E1013] border-t border-white/10 text-[#8A93A3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div
          className={cn(
            'grid grid-cols-1 md:grid-cols-2 gap-10 text-start',
            hasServicesColumn ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
          )}
        >
          {/* Column 1: Business Identity */}
          <div className="space-y-4">
            <Logo />
            {tagline && <p className="text-xs font-semibold text-[#F5F6F8]">{tagline}</p>}
            <p className="text-sm leading-relaxed">{t('footer.description')}</p>

            {socialLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#F5F6F8] hover:text-[#FF6A00] underline underline-offset-4 transition-colors"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h2 className="text-base font-bold font-heading text-white mb-4">
              {t('footer.quickLinks')}
            </h2>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/book" className="hover:text-[#FF6A00] transition-colors">
                  {t('nav.bookService')}
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-[#FF6A00] transition-colors">
                  {t('nav.shopParts')}
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-[#FF6A00] transition-colors">
                  {t('nav.trackJob')}
                </Link>
              </li>
              <li>
                <Link
                  to="/track?tab=order"
                  className="hover:text-[#FF6A00] transition-colors"
                >
                  {t('footer.trackOrder')}
                </Link>
              </li>
              <li>
                <Link
                  to="/tools"
                  className="hover:text-[#FF6A00] transition-colors"
                >
                  {t('footer.toolsHub', 'Workshop Tools')}
                </Link>
              </li>
              <li>
                <Link
                  to="/tools/cost-estimator"
                  className="hover:text-[#FF6A00] transition-colors"
                >
                  {t('footer.costEstimator')}
                </Link>
              </li>
              <li>
                <Link
                  to="/tools/next-service"
                  className="hover:text-[#FF6A00] transition-colors"
                >
                  {t('footer.nextServiceCalculator', 'Next-Service Calculator')}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-[#FF6A00] transition-colors">
                  {t('nav.guides')}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#FF6A00] transition-colors">
                  {t('footer.faq')}
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-[#FF6A00] transition-colors">
                  {t('footer.gallery')}
                </Link>
              </li>
              <li>
                <Link to="/reviews" className="hover:text-[#FF6A00] transition-colors">
                  {t('footer.reviews')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Workshop Services (Up to 6 featured services from database; hidden if none) */}
          {hasServicesColumn && (
            <div>
              <h2 className="text-base font-bold font-heading text-white mb-4">
                {t('footer.workshopServices')}
              </h2>
              <ul className="space-y-2.5 text-sm">
                {featuredServices.map((service) => (
                  <li key={service.id}>
                    <Link
                      to={`/services/${service.slug}`}
                      className="hover:text-[#FF6A00] transition-colors"
                    >
                      {getLocalized(service, 'name', i18n.language)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Column 4: Contact & Working Hours */}
          <div className="space-y-3 text-sm">
            <h2 className="text-base font-bold font-heading text-white mb-4">
              {t('footer.contactInfo')}
            </h2>

            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#FF6A00] shrink-0" />
              <a
                href={`tel:${phone}`}
                dir="ltr"
                className="text-[#F5F6F8] hover:text-[#FF6A00] tabular-nums transition-colors"
              >
                {phone}
              </a>
            </div>

            <div className="flex items-center gap-2.5">
              <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="text-[#F5F6F8] hover:text-emerald-400 tabular-nums transition-colors"
              >
                {whatsapp}
              </a>
            </div>

            {settings.email?.trim() && (
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#FF6A00] shrink-0" />
                <a
                  href={`mailto:${settings.email.trim()}`}
                  className="text-[#F5F6F8] hover:text-[#FF6A00] transition-colors break-all"
                >
                  {settings.email.trim()}
                </a>
              </div>
            )}

            {address && (
              <div className="flex items-start gap-2.5 pt-1">
                <MapPin className="w-4 h-4 text-[#FF6A00] shrink-0 mt-1" />
                <span className="text-[#F5F6F8]">{address}</span>
              </div>
            )}

            {configuredDays.length > 0 && (
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Clock className="w-3.5 h-3.5 text-[#FF6A00]" />
                  <span>{t('home.hoursLabel')}</span>
                </div>
                <ul className="space-y-1 text-xs">
                  {configuredDays.map((day) => {
                    const entry = settings.working_hours[day];
                    if (!entry) return null;
                    return (
                      <li key={day} className="flex items-center justify-between gap-2">
                        <span>{t(`admin.settings.weekdays.${day}`)}</span>
                        <span dir="ltr" className="text-[#F5F6F8] tabular-nums">
                          {entry.openTime} – {entry.closeTime}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>
            © {currentYear} {businessName}. {t('footer.allRightsReserved')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/privacy" className="hover:text-white transition-colors">
              {t('footer.privacy')}
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/terms" className="hover:text-white transition-colors">
              {t('footer.terms')}
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/returns" className="hover:text-white transition-colors">
              {t('footer.returns')}
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/delivery-policy" className="hover:text-white transition-colors">
              {t('footer.delivery')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
