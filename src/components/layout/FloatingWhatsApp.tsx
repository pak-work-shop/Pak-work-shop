import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { useSiteSettings } from '../../features/settings/useSiteSettings';
import { buildWhatsAppUrl } from '../../lib/whatsapp';

/**
 * Fixed floating WhatsApp launcher positioned at bottom-end corner.
 * Reserves vertical space above it (`bottom-20` slot) for the Phase 9 AI Chatbot launcher
 * so the two buttons never overlap.
 */
export function FloatingWhatsApp() {
  const { t } = useTranslation();
  const { settings } = useSiteSettings();

  const whatsappNumber = settings.whatsapp || settings.phone || '03126776844';
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, t('whatsapp.defaultMessage'));

  return (
    <div
      className="fixed bottom-5 end-5 z-40 flex flex-col items-end gap-3 pointer-events-none"
      data-slot="floating-action-stack"
    >
      {/* Reserved slot above for Phase 9 AI Chatbot launcher (do not build chatbot in Phase 1) */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('whatsapp.floatingLabel')}
        title={t('whatsapp.floatingLabel')}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-[#16A34A] hover:bg-emerald-700 text-white px-4 py-3 shadow-lg transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E1013]"
      >
        <MessageCircle className="w-5 h-5 fill-current shrink-0" />
        <span className="hidden sm:inline text-xs font-semibold whitespace-nowrap">
          {t('whatsapp.floatingLabel')}
        </span>
      </a>
    </div>
  );
}
