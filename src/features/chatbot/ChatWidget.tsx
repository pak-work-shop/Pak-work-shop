import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowUp,
  Bot,
  Car,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageCircle,
  Minus,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import { useChatbot } from './useChatbot';
import { useSiteSettings } from '../settings/useSiteSettings';
import { useVehicleFilter } from '../catalogue/VehicleFilterContext';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { getLocalized } from '../../i18n/helpers';
import { ChatInlineTracker } from './ChatInlineTracker';

export function ChatWidget() {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language as 'en' | 'ur' | 'ur-roman') || 'en';
  const isRTL = i18n.dir() === 'rtl';

  const {
    isOpen,
    isMinimized,
    isSending,
    messages,
    settings,
    activeEngine,
    vehicle,
    unreadCount,
    openChat,
    closeChat,
    toggleChat,
    minimizeChat,
    restoreChat,
    sendMessage,
    resetChat,
    setVehicle,
  } = useChatbot();

  const { settings: siteSettings } = useSiteSettings();
  const { makes, models } = useVehicleFilter();

  const [input, setInput] = useState('');
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [selectedMake, setSelectedMake] = useState(vehicle?.make || '');
  const [selectedModel, setSelectedModel] = useState(vehicle?.model || '');
  const [selectedYear, setSelectedYear] = useState(vehicle?.year ? String(vehicle.year) : '');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isSending]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const location = useLocation();

  const isHiddenRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/invoice') ||
    location.pathname.startsWith('/mock-payment-gateway') ||
    location.pathname.startsWith('/pay/mock') ||
    location.pathname === '/checkout' ||
    location.pathname.includes('/print') ||
    location.pathname.includes('/receipt');

  if (!settings.enabled || isHiddenRoute) {
    return null;
  }

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isSending) return;
    const text = input;
    setInput('');
    void sendMessage(text);
  };

  const handleApplyVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMake) {
      setVehicle(null);
    } else {
      setVehicle({
        make: selectedMake,
        model: selectedModel || undefined,
        year: selectedYear ? parseInt(selectedYear, 10) : undefined,
      });
    }
    setShowVehiclePicker(false);
  };

  const whatsappNumber = siteSettings.whatsapp || siteSettings.phone || '03126776844';
  const phoneCallNumber = siteSettings.phone || '03126776844';

  return (
    <>
      {/* 1. Floating Launcher Button (Positioned above WhatsApp button) */}
      {!isOpen && (
        <div className="fixed bottom-20 end-5 z-40">
          <button
            type="button"
            onClick={() => openChat()}
            aria-label={t('chatbot.openChat', 'Ask Car Assistant')}
            title={t('chatbot.openChat', 'Ask Car Assistant')}
            className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#FF6A00] to-[#E05600] px-4 py-3 text-white shadow-xl shadow-[#FF6A00]/25 transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:shadow-[#FF6A00]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E1013]"
          >
            <div className="relative flex items-center justify-center">
              <Bot className="h-5 w-5 text-white transition-transform group-hover:rotate-6" />
              <span className="absolute -top-1 -end-1 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            </div>

            <span className="hidden sm:inline text-xs font-bold tracking-wide uppercase">
              {t('chatbot.launcherLabel', 'Ask Assistant')}
            </span>

            {/* Sparkle icon */}
            <Sparkles className="hidden sm:inline h-3.5 w-3.5 text-amber-200 animate-pulse" />

            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -start-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white ring-2 ring-[#0E1013]">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* 2. Minimized Pill Button */}
      {isOpen && isMinimized && (
        <div className="fixed bottom-20 end-5 z-50">
          <button
            type="button"
            onClick={restoreChat}
            className="flex items-center gap-2 rounded-full bg-[#1A1D23] border border-[#2A2E37] px-4 py-2.5 text-white shadow-2xl transition hover:border-[#FF6A00] hover:bg-[#20242B]"
          >
            <Bot className="h-4 w-4 text-[#FF6A00]" />
            <span className="text-xs font-semibold">
              {t('chatbot.title', 'Pak Auto Works Assistant')}
            </span>
            {unreadCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF6A00] px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
            <ChevronUp className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      )}

      {/* 3. Main Chat Window */}
      {isOpen && !isMinimized && (
        <div
          role="dialog"
          aria-labelledby="chatbot-heading"
          className="fixed bottom-3 end-3 sm:bottom-5 sm:end-5 z-50 flex flex-col w-[calc(100vw-24px)] sm:w-[420px] max-w-[430px] h-[82vh] max-h-[620px] rounded-2xl bg-[#121418] border border-[#262A32] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#232730] bg-[#161920] px-4 py-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF6A00] to-amber-500 text-white shadow-md">
                <Bot className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#161920]" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3
                    id="chatbot-heading"
                    className="truncate text-xs font-bold text-white uppercase tracking-wider"
                  >
                    {t('chatbot.title', 'Pak Auto Assistant')}
                  </h3>
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                      activeEngine === 'ai'
                        ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {activeEngine === 'ai' ? 'AI' : 'Instant'}
                  </span>
                </div>
                <p className="truncate text-[11px] text-gray-400">
                  {vehicle
                    ? `${vehicle.make} ${vehicle.model || ''} ${vehicle.year || ''}`
                    : t('chatbot.subtitle', 'Sadiqabad Auto Specialist')}
                </p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1 shrink-0 text-gray-400">
              <button
                type="button"
                onClick={() => setShowVehiclePicker((p) => !p)}
                aria-label="Set vehicle"
                title={vehicle ? `${vehicle.make} ${vehicle.model || ''}` : 'Set Vehicle'}
                className={`p-1.5 rounded-lg transition ${
                  showVehiclePicker || vehicle
                    ? 'text-[#FF6A00] bg-[#FF6A00]/10'
                    : 'hover:text-white hover:bg-[#232730]'
                }`}
              >
                <Car className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={resetChat}
                aria-label="Reset chat"
                title={t('chatbot.resetTooltip', 'Restart conversation')}
                className="p-1.5 rounded-lg hover:text-white hover:bg-[#232730] transition"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={minimizeChat}
                aria-label="Minimize chat"
                className="p-1.5 rounded-lg hover:text-white hover:bg-[#232730] transition"
              >
                <Minus className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={closeChat}
                aria-label="Close chat"
                className="p-1.5 rounded-lg hover:text-red-400 hover:bg-[#232730] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Collapsible In-Chat Vehicle Selector */}
          {showVehiclePicker && (
            <div className="bg-[#1A1E26] border-b border-[#2A2F3B] p-3 text-xs animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Car className="h-3.5 w-3.5 text-[#FF6A00]" />
                  {t('chatbot.selectVehicle', 'Select Your Car for Tailored Advice')}
                </span>
                {vehicle && (
                  <button
                    type="button"
                    onClick={() => {
                      setVehicle(null);
                      setSelectedMake('');
                      setSelectedModel('');
                      setSelectedYear('');
                      setShowVehiclePicker(false);
                    }}
                    className="text-[10px] text-red-400 hover:underline"
                  >
                    {t('chatbot.clearCar', 'Clear')}
                  </button>
                )}
              </div>

              <form onSubmit={handleApplyVehicle} className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Make (e.g. Toyota)"
                  value={selectedMake}
                  onChange={(e) => setSelectedMake(e.target.value)}
                  className="rounded-lg bg-[#0E1013] border border-[#2C313C] px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:border-[#FF6A00] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Model (e.g. Corolla)"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="rounded-lg bg-[#0E1013] border border-[#2C313C] px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:border-[#FF6A00] focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Year (2020)"
                  min={1980}
                  max={2030}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="rounded-lg bg-[#0E1013] border border-[#2C313C] px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:border-[#FF6A00] focus:outline-none"
                />
                <div className="col-span-3 flex justify-end gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setShowVehiclePicker(false)}
                    className="px-2.5 py-1 text-gray-400 hover:text-white"
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-[#FF6A00] px-3 py-1 font-semibold text-white hover:bg-[#E05600]"
                  >
                    {t('common.apply', 'Apply')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Safety & Physical Inspection Disclaimer */}
          <div className="bg-[#1C1814] border-b border-[#3B2C1B] px-3 py-1.5 text-[11px] text-amber-300/90 leading-tight flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
            <p className="line-clamp-2">
              {getLocalized(settings.disclaimer, currentLang) ||
                t(
                  'chatbot.inspectionDisclaimer',
                  'Digital assistant guidance only. A physical inspection by our certified technicians is always required for final diagnosis.'
                )}
            </p>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#FF6A00] text-white rounded-tr-xs'
                        : 'bg-[#1C2028] text-gray-100 border border-[#2A2E39] rounded-tl-xs'
                    }`}
                  >
                    {/* Assistant / User label if needed */}
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                    {/* Actions rendered for assistant messages */}
                    {!isUser && msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap gap-1.5">
                        {msg.actions.map((act, idx) => {
                          if (act.type === 'book') {
                            const query = act.service_slugs && act.service_slugs.length > 0
                              ? `?service=${encodeURIComponent(act.service_slugs.join(','))}`
                              : '';
                            return (
                              <Link
                                key={idx}
                                to={`/book${query}`}
                                onClick={closeChat}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#FF6A00] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#E05600] transition"
                              >
                                <Wrench className="h-3 w-3" />
                                {t('chatbot.actionBook', 'Book Service')}
                              </Link>
                            );
                          }

                          if (act.type === 'products') {
                            const productUrl =
                              act.product_slugs && act.product_slugs.length === 1
                                ? `/catalogue/product/${encodeURIComponent(act.product_slugs[0])}`
                                : '/catalogue';
                            return (
                              <Link
                                key={idx}
                                to={productUrl}
                                onClick={closeChat}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#2A303C] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#343B4A] transition"
                              >
                                <Search className="h-3 w-3" />
                                {t('chatbot.actionShop', 'Shop Parts')}
                              </Link>
                            );
                          }

                          if (act.type === 'track') {
                            return (
                              <div key={idx} className="w-full">
                                <ChatInlineTracker />
                              </div>
                            );
                          }

                          if (act.type === 'whatsapp') {
                            const wUrl = buildWhatsAppUrl(
                              whatsappNumber,
                              act.message || t('whatsapp.defaultMessage')
                            );
                            return (
                              <a
                                key={idx}
                                href={wUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg bg-[#16A34A] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 transition"
                              >
                                <MessageCircle className="h-3 w-3 fill-current" />
                                WhatsApp
                              </a>
                            );
                          }

                          if (act.type === 'call') {
                            return (
                              <a
                                key={idx}
                                href={`tel:${phoneCallNumber}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#2A303C] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#343B4A] transition"
                              >
                                <Phone className="h-3 w-3" />
                                {phoneCallNumber}
                              </a>
                            );
                          }

                          return null;
                        })}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-gray-500 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isSending && (
              <div className="flex items-center gap-1.5 rounded-2xl bg-[#1C2028] border border-[#2A2E39] px-3.5 py-2.5 w-fit text-gray-400">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF6A00] animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF6A00] animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF6A00] animate-bounce [animation-delay:0.4s]" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies Tray */}
          {Array.isArray(settings.quick_replies) && settings.quick_replies.length > 0 && (
            <div className="px-3 py-2 border-t border-[#1F232B] bg-[#14171E] overflow-x-auto no-scrollbar shrink-0">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                {settings.quick_replies.map((qr, idx) => {
                  const label = getLocalized(qr.label, currentLang);
                  const prompt = getLocalized(qr.prompt, currentLang) || label;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isSending}
                      onClick={() => sendMessage(prompt)}
                      className="rounded-full bg-[#202530] border border-[#2D3342] px-3 py-1 text-[11px] font-medium text-gray-200 transition hover:border-[#FF6A00] hover:text-[#FF6A00] disabled:opacity-50"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSend}
            className="border-t border-[#232730] bg-[#161920] p-2.5 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              maxLength={500}
              disabled={isSending}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t(
                'chatbot.inputPlaceholder',
                'Ask about car service, charges, strange noises...'
              )}
              className="flex-1 rounded-xl bg-[#0E1013] border border-[#2B2F3A] px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:border-[#FF6A00] focus:outline-none disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={!input.trim() || isSending}
              aria-label="Send message"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FF6A00] text-white shadow-md transition hover:bg-[#E05600] disabled:opacity-40 disabled:hover:bg-[#FF6A00]"
            >
              {isSending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
