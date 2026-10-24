import React, { useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Phone, ShieldCheck, ShoppingCart, User, X } from 'lucide-react';
import { useAuth } from '../../features/auth/useAuth';
import { useSiteSettings } from '../../features/settings/useSiteSettings';
import { useCart } from '../../features/cart/CartContext';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { Logo } from '../common/Logo';
import { Button } from '../ui/Button';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { NavItem } from '../../types';
import { cn } from '../../lib/utils';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
}

export function MobileMenu({ isOpen, onClose, navItems }: MobileMenuProps) {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const { settings } = useSiteSettings();
  const { totalQuantity } = useCart();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const phone = settings.phone || '03126776844';
  const whatsappHref = buildWhatsAppUrl(
    settings.whatsapp || phone,
    t('whatsapp.defaultMessage')
  );

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden flex"
      role="dialog"
      aria-modal="true"
      aria-label={t('nav.openMenu')}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Full-height Drawer */}
      <div className="relative z-10 w-full max-w-sm bg-[#1B1F26] border-e border-white/15 h-full flex flex-col justify-between overflow-y-auto p-5 text-[#F5F6F8] shadow-2xl">
        <div>
          {/* Top row */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <div onClick={onClose}>
              <Logo compact />
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label={t('nav.closeMenu')}
              className="p-2 rounded-md text-[#8A93A3] hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Language Switcher */}
          <div className="mb-5">
            <p className="text-xs font-medium text-[#8A93A3] mb-2 text-start">
              {t('nav.language')}
            </p>
            <LanguageSwitcher className="w-full justify-between" />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'block px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors text-start',
                    isActive
                      ? 'bg-[#FF6A00]/15 text-[#FF6A00] font-semibold border-s-2 border-[#FF6A00]'
                      : 'text-[#F5F6F8] hover:bg-white/5'
                  )
                }
              >
                {t(item.labelKey)}
              </NavLink>
            ))}

            <NavLink
              to="/cart"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors text-start',
                  isActive
                    ? 'bg-[#FF6A00]/15 text-[#FF6A00] font-semibold border-s-2 border-[#FF6A00]'
                    : 'text-[#F5F6F8] hover:bg-white/5'
                )
              }
            >
              <span className="inline-flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#FF6A00]" />
                <span>{t('cart.title')}</span>
              </span>
              {totalQuantity > 0 && (
                <span
                  dir="ltr"
                  className="rounded-full bg-[#FF6A00] text-white text-[11px] font-bold font-mono px-2 py-0.5"
                >
                  {totalQuantity}
                </span>
              )}
            </NavLink>
          </nav>
        </div>

        {/* Bottom Actions: Phone, WhatsApp, Auth */}
        <div className="pt-5 mt-6 border-t border-white/10 space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#2A2F38] hover:bg-[#353B46] border border-white/10 px-3 py-2.5 text-xs font-semibold text-white transition-colors"
            >
              <Phone className="w-4 h-4 text-[#FF6A00] shrink-0" />
              <span dir="ltr" className="truncate tabular-nums">
                {phone}
              </span>
            </a>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#16A34A]/20 hover:bg-[#16A34A]/30 border border-[#16A34A]/40 px-3 py-2.5 text-xs font-semibold text-emerald-300 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{t('nav.whatsappUs')}</span>
            </a>
          </div>

          {user ? (
            <div className="space-y-2">
              {isAdmin && (
                <Link to="/admin" onClick={onClose} className="block">
                  <Button
                    variant="secondary"
                    className="w-full"
                    leftIcon={<ShieldCheck className="w-4 h-4 text-[#FF6A00]" />}
                  >
                    {t('nav.adminPanel')}
                  </Button>
                </Link>
              )}
              <Link to="/account" onClick={onClose} className="block">
                <Button
                  variant="primary"
                  className="w-full"
                  leftIcon={<User className="w-4 h-4" />}
                >
                  {t('nav.account')}
                </Button>
              </Link>
            </div>
          ) : (
            <Link to="/login" onClick={onClose} className="block">
              <Button
                variant="primary"
                className="w-full"
                leftIcon={<User className="w-4 h-4" />}
              >
                {t('nav.login')}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
