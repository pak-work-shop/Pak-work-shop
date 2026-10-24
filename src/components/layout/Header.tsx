import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Car,
  ChevronDown,
  Menu,
  Megaphone,
  Phone,
  ShieldCheck,
  ShoppingCart,
  User,
} from 'lucide-react';
import { useAuth } from '../../features/auth/useAuth';
import { useSiteSettings } from '../../features/settings/useSiteSettings';
import { useVehicleFilter } from '../../features/catalogue/VehicleFilterContext';
import { useCart } from '../../features/cart/CartContext';
import { getLocalized } from '../../i18n/helpers';
import { Logo } from '../common/Logo';
import { DemoModeBanner } from '../common/DemoModeBanner';
import { Button } from '../ui/Button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileMenu } from './MobileMenu';
import type { NavItem } from '../../types';
import { cn } from '../../lib/utils';

export const MAIN_NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.home', href: '/' },
  { labelKey: 'nav.services', href: '/services' },
  { labelKey: 'nav.bookService', href: '/book' },
  { labelKey: 'nav.shopParts', href: '/shop' },
  { labelKey: 'nav.trackJob', href: '/track' },
  { labelKey: 'nav.guides', href: '/blog' },
  { labelKey: 'nav.tools', href: '/tools' },
  { labelKey: 'nav.gallery', href: '/gallery' },
  { labelKey: 'nav.reviews', href: '/reviews' },
  { labelKey: 'nav.about', href: '/about' },
  { labelKey: 'nav.contact', href: '/contact' },
];

export function Header() {
  const { t, i18n } = useTranslation();
  const { user, isAdmin } = useAuth();
  const { settings } = useSiteSettings();
  const { hasSelection, selectionLabel } = useVehicleFilter();
  const { totalQuantity, openDrawer } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const primaryDesktopNav = MAIN_NAV_ITEMS.slice(0, 5);
  const secondaryDesktopNav = MAIN_NAV_ITEMS.slice(5);

  const phone = settings.phone || '03126776844';
  const announcementText = getLocalized(settings, 'announcement', i18n.language);
  const showAnnouncement = settings.announcement_enabled && announcementText.length > 0;

  return (
    <>
      <DemoModeBanner />
      {showAnnouncement && (
        <div
          role="region"
          aria-label="Announcement"
          className="bg-[#FF6A00] text-white px-4 py-1.5 text-xs sm:text-sm font-medium text-center"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <Megaphone className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{announcementText}</span>
          </div>
        </div>
      )}

      <header
        className={cn(
          'sticky top-0 z-40 w-full bg-[#0E1013]/95 backdrop-blur-md border-b border-white/10 transition-all duration-150',
          isScrolled ? 'py-2 shadow-lg' : 'py-3.5'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Title */}
          <Logo compact={isScrolled} />

          {/* Zone 2: Desktop Navigation (5 primary links + More menu) */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium"
          >
            {primaryDesktopNav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  cn(
                    'py-1 transition-colors whitespace-nowrap border-b-2',
                    isActive
                      ? 'text-white border-[#FF6A00] font-semibold'
                      : 'text-[#8A93A3] border-transparent hover:text-white'
                  )
                }
              >
                {t(item.labelKey)}
              </NavLink>
            ))}

            {/* More Dropdown for Guides, About, Contact */}
            <div
              className="relative"
              onMouseEnter={() => setMoreDropdownOpen(true)}
              onMouseLeave={() => setMoreDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => setMoreDropdownOpen((prev) => !prev)}
                aria-expanded={moreDropdownOpen}
                className="inline-flex items-center gap-1 py-1 text-[#8A93A3] hover:text-white transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00] rounded-sm"
              >
                <span>{t('nav.more')}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {moreDropdownOpen && (
                <div className="absolute top-full end-0 pt-2 w-48 z-50">
                  <div className="rounded-md bg-[#1B1F26] border border-white/15 py-1.5 shadow-xl">
                    {secondaryDesktopNav.map((item) => (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        onClick={() => setMoreDropdownOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'block px-4 py-2 text-xs font-medium text-start transition-colors',
                            isActive
                              ? 'bg-[#FF6A00]/15 text-[#FF6A00] font-semibold'
                              : 'text-[#F5F6F8] hover:bg-white/5'
                          )
                        }
                      >
                        {t(item.labelKey)}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Zone 3: Actions (My Car, Language, Call, Account/Login, Mobile Trigger) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {hasSelection && (
              <Link
                to="/shop"
                title={t('shop.vehicleSelector.activeTitle')}
                className="hidden xl:inline-flex items-center gap-1.5 rounded-md bg-[#1B1F26] hover:bg-[#2A2F38] border border-emerald-500/40 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 transition-colors max-w-[180px]"
              >
                <Car className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{selectionLabel}</span>
              </Link>
            )}

            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            <a
              href={`tel:${phone}`}
              aria-label={`${t('nav.callNow')}: ${phone}`}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-[#1B1F26] hover:bg-[#2A2F38] border border-white/15 px-3 py-2 text-xs font-semibold text-[#F5F6F8] transition-colors whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5 text-[#FF6A00] shrink-0" />
              <span dir="ltr" className="tabular-nums">
                {phone}
              </span>
            </a>

            {user ? (
              <div className="hidden lg:flex items-center gap-2">
                {isAdmin && (
                  <Link to="/admin">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<ShieldCheck className="w-4 h-4 text-[#FF6A00]" />}
                    >
                      {t('nav.adminPanel')}
                    </Button>
                  </Link>
                )}
                <Link to="/account">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<User className="w-4 h-4" />}
                  >
                    {t('nav.account')}
                  </Button>
                </Link>
              </div>
            ) : (
              <Link to="/login" className="hidden lg:block">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<User className="w-4 h-4" />}
                >
                  {t('nav.login')}
                </Button>
              </Link>
            )}

            {/* Cart Trigger Button */}
            <button
              type="button"
              onClick={openDrawer}
              aria-label={t('cart.openCartAria', { count: totalQuantity })}
              className="relative inline-flex items-center justify-center p-2 rounded-md bg-[#1B1F26] border border-white/15 text-[#F5F6F8] hover:border-[#FF6A00] hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
            >
              <ShoppingCart className="w-5 h-5 text-[#FF6A00]" />
              {totalQuantity > 0 && (
                <span
                  dir="ltr"
                  className="absolute -top-1.5 -end-1.5 min-w-[18px] h-[18px] rounded-full bg-[#FF6A00] text-white text-[10px] font-extrabold font-mono flex items-center justify-center px-1 shadow-md"
                >
                  {totalQuantity}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={t('nav.openMenu')}
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md bg-[#1B1F26] border border-white/15 text-[#F5F6F8] hover:border-[#FF6A00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navItems={MAIN_NAV_ITEMS}
      />
    </>
  );
}
