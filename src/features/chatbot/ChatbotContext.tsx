import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { useSiteSettings } from '../settings/useSiteSettings';
import { useServices } from '../services/useServices';
import { useVehicleFilter } from '../catalogue/VehicleFilterContext';
import {
  processLocalMessage,
  type ChatbotAction,
  type LocalEngineContext,
} from './localEngine';
import type {
  ChatbotKnowledgeRow,
  ChatbotSettingsRow,
  DeliverySettingsRow,
  FaqRow,
  PaymentSettingsRow,
  ProductRow,
  LocalizedText,
} from '../../types/database';
import { getLocalized } from '../../i18n/helpers';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: ChatbotAction[];
  engineUsed?: 'ai' | 'local';
  timestamp: string;
}

interface ChatbotContextValue {
  isOpen: boolean;
  isMinimized: boolean;
  isSending: boolean;
  messages: ChatMessageItem[];
  settings: ChatbotSettingsRow;
  activeEngine: 'ai' | 'local';
  vehicle: { make?: string; model?: string; year?: number } | null;
  unreadCount: number;
  openChat: (initialPrompt?: string) => void;
  closeChat: () => void;
  toggleChat: () => void;
  minimizeChat: () => void;
  restoreChat: () => void;
  sendMessage: (text: string) => Promise<void>;
  resetChat: () => void;
  setVehicle: (vehicle: { make?: string; model?: string; year?: number } | null) => void;
}

const DEFAULT_SETTINGS: ChatbotSettingsRow = {
  id: 1,
  enabled: true,
  engine_mode: 'auto',
  welcome_message: {
    en: 'Assalam-o-Alaikum! I am your Pak Auto Works digital assistant. Tell me about your car or ask about services, parts, prices, and bookings.',
    ur: 'السلام علیکم! میں پاک آٹو ورکس کا ڈیجیٹل اسسٹنٹ ہوں۔ اپنی گاڑی کا مسئلہ بتائیں یا سروسز، پارٹس، قیمتوں اور بکنگ کے بارے میں پوچھیں۔',
    'ur-roman':
      'Assalam-o-Alaikum! Main Pak Auto Works ka digital assistant hoon. Apni gaari ka masla batayein ya services, parts, prices aur booking ke baray mein poochein.',
  },
  quick_replies: [
    {
      label: { en: 'Book a Service', ur: 'سروس بک کریں', 'ur-roman': 'Service Book Karein' },
      prompt: { en: 'I want to book a car service', ur: 'مجھے سروس بک کرنی ہے', 'ur-roman': 'Mujhe service book karni hai' },
    },
    {
      label: { en: 'Service Prices', ur: 'سروسز کی قیمتیں', 'ur-roman': 'Service Prices' },
      prompt: { en: 'What are your service charges?', ur: 'سروسز کے ریٹ کیا ہیں؟', 'ur-roman': 'Services ke rate kya hain?' },
    },
    {
      label: { en: 'Brake Problem', ur: 'بریک کا مسئلہ', 'ur-roman': 'Brake Ka Masla' },
      prompt: { en: 'My car brakes are squeaking', ur: 'گاڑی کے بریک سے آواز آ رہی ہے', 'ur-roman': 'Gaari ke brake se awaz aa rahi hai' },
    },
    {
      label: { en: 'AC Not Cooling', ur: 'اے سی ٹھنڈا نہیں ہے', 'ur-roman': 'AC Thanda Nahi' },
      prompt: { en: 'My car AC is not cooling properly', ur: 'گاڑی کا اے سی ٹھنڈی ہوا نہیں دے رہا', 'ur-roman': 'Gaari ka AC thanda nahi kar raha' },
    },
    {
      label: { en: 'Track My Car', ur: 'کام ٹریک کریں', 'ur-roman': 'Kaam Track Karein' },
      prompt: { en: 'I want to track my repair job or order', ur: 'مجھے اپنا کام یا آرڈر ٹریک کرنا ہے', 'ur-roman': 'Mujhe apna kaam ya order track karna hai' },
    },
    {
      label: { en: 'Delivery Charges', ur: 'ڈیلیوری چارجز', 'ur-roman': 'Delivery Charges' },
      prompt: { en: 'What are the delivery charges for spare parts?', ur: 'اسپیئر پارٹس کی ڈیلیوری کے کیا چارجز ہیں؟', 'ur-roman': 'Spare parts ki delivery ke kya charges hain?' },
    },
  ],
  disclaimer: {
    en: 'Digital assistant guidance only. A physical inspection by our certified technicians is always required for final diagnosis.',
    ur: 'یہ صرف ڈیجیٹل رہنمائی ہے۔ حتمی تشخیص کے لیے ورکشاپ پر فزیکل معائنہ لازمی ہے۔',
    'ur-roman':
      'Sirf digital rehnumai. Final diagnosis ke liye workshop par physical inspection laazmi hai.',
  },
  max_messages_per_session: 30,
  logging_enabled: true,
  updated_at: new Date().toISOString(),
};

const SESSION_STORAGE_KEY = 'paw_chat_session_id';
const MESSAGES_STORAGE_KEY = 'paw_chat_messages_v1';
const MINIMIZED_STORAGE_KEY = 'paw_chat_minimized';

const ChatbotContext = createContext<ChatbotContextValue | undefined>(undefined);

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '00000000-0000-0000-0000-000000000000';
  let sid = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sid || sid.length < 10) {
    sid = crypto.randomUUID ? crypto.randomUUID() : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
  }
  return sid;
}

export function ChatbotProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language as 'en' | 'ur' | 'ur-roman') || 'en';

  const { settings: siteSettings } = useSiteSettings();
  const { services } = useServices();
  const { selectedVehicle } = useVehicleFilter();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeEngine, setActiveEngine] = useState<'ai' | 'local'>('local');
  const [chatbotSettings, setChatbotSettings] = useState<ChatbotSettingsRow>(DEFAULT_SETTINGS);

  // Auxiliary context data for local engine
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [knowledge, setKnowledge] = useState<ChatbotKnowledgeRow[]>([]);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettingsRow | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettingsRow | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);

  // Manual vehicle override if user picks vehicle inside chat
  const [manualVehicle, setManualVehicle] = useState<{
    make?: string;
    model?: string;
    year?: number;
  } | null>(null);

  // Combined vehicle
  const currentVehicle = useMemo(() => {
    if (manualVehicle) return manualVehicle;
    if (selectedVehicle?.makeName) {
      return {
        make: selectedVehicle.makeName,
        model: selectedVehicle.modelName || undefined,
        year: selectedVehicle.year || undefined,
      };
    }
    return null;
  }, [manualVehicle, selectedVehicle]);

  // Session ID
  const sessionIdRef = useRef<string>(getOrCreateSessionId());

  // Messages
  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.sessionStorage.getItem(MESSAGES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_err) {
      // ignore
    }
    return [];
  });

  // Save messages to sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    } catch (_err) {
      // ignore
    }
  }, [messages]);

  // Fetch settings & context data on mount
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!env.isConfigured) return;

      // 1. Settings
      try {
        const { data: sData } = await supabase
          .from('chatbot_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (!cancelled && sData) {
          setChatbotSettings(sData as ChatbotSettingsRow);
        }
      } catch (_err) {
        // Keep defaults
      }

      // 2. FAQs
      try {
        const { data: fData } = await supabase
          .from('faqs')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(20);

        if (!cancelled && fData) {
          setFaqs(fData as FaqRow[]);
        }
      } catch (_err) {
        // ignore
      }

      // 3. Knowledge Base
      try {
        const { data: kData } = await supabase
          .from('chatbot_knowledge')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(30);

        if (!cancelled && kData) {
          setKnowledge(kData as ChatbotKnowledgeRow[]);
        }
      } catch (_err) {
        // ignore
      }

      // 4. Delivery & Payment Settings
      try {
        const [dRes, pRes, prodRes] = await Promise.all([
          supabase.from('delivery_settings').select('*').limit(1).maybeSingle(),
          supabase.from('payment_settings').select('*').eq('id', 1).maybeSingle(),
          supabase.from('products').select('*').eq('is_active', true).limit(30),
        ]);

        if (!cancelled) {
          if (dRes.data) setDeliverySettings(dRes.data as DeliverySettingsRow);
          if (pRes.data) setPaymentSettings(pRes.data as PaymentSettingsRow);
          if (prodRes.data) setProducts(prodRes.data as ProductRow[]);
        }
      } catch (_err) {
        // ignore
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  // When chat opens for the first time with 0 messages, insert welcome message
  const ensureWelcomeMessage = useCallback(() => {
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      const welcomeText = getLocalized(chatbotSettings.welcome_message, currentLang);
      return [
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: welcomeText,
          timestamp: new Date().toISOString(),
          engineUsed: 'local',
        },
      ];
    });
  }, [chatbotSettings.welcome_message, currentLang]);

  // Window controls
  const openChat = useCallback((initialPrompt?: string) => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
    ensureWelcomeMessage();

    if (initialPrompt && initialPrompt.trim()) {
      void sendMessage(initialPrompt.trim());
    }
  }, [ensureWelcomeMessage]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsMinimized(false);
        setUnreadCount(0);
        ensureWelcomeMessage();
      }
      return next;
    });
  }, [ensureWelcomeMessage]);

  const minimizeChat = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const restoreChat = useCallback(() => {
    setIsMinimized(false);
    setUnreadCount(0);
  }, []);

  const resetChat = useCallback(() => {
    const newSid = crypto.randomUUID ? crypto.randomUUID() : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionIdRef.current = newSid;
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, newSid);
      window.sessionStorage.removeItem(MESSAGES_STORAGE_KEY);
    }
    const welcomeText = getLocalized(chatbotSettings.welcome_message, currentLang);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: welcomeText,
        timestamp: new Date().toISOString(),
        engineUsed: 'local',
      },
    ]);
  }, [chatbotSettings.welcome_message, currentLang]);

  // Send message implementation
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      const userMsg: ChatMessageItem = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsSending(true);

      const sid = sessionIdRef.current;
      const lang = currentLang;
      const vehicle = currentVehicle;

      // Rate limit check via RPC if available
      try {
        if (env.isConfigured) {
          const { data: rateCheck } = await supabase.rpc('chat_rate_check', {
            p_session_id: sid,
          });
          if (rateCheck && rateCheck.allowed === false) {
            const limitReply =
              lang === 'ur'
                ? 'پیغام کی حد ختم ہو گئی ہے۔ براہ کرم کچھ دیر بعد دوبارہ کوشش کریں یا واٹس ایپ پر رابطہ کریں۔'
                : lang === 'ur-roman'
                ? 'Message limit poori ho gayi hai. Barah-e-karam thori der baad koshish karein ya WhatsApp par rabta karein.'
                : 'Session message limit reached. Please contact our workshop directly via WhatsApp or phone for immediate assistance.';

            const assistantMsg: ChatMessageItem = {
              id: `asst-${Date.now()}`,
              role: 'assistant',
              content: limitReply,
              actions: [{ type: 'whatsapp' }, { type: 'call' }],
              timestamp: new Date().toISOString(),
              engineUsed: 'local',
            };
            setMessages((prev) => [...prev, assistantMsg]);
            setIsSending(false);
            return;
          }
        }
      } catch (_err) {
        // Non-blocking rate check
      }

      // Engine Selection
      let finalReply = '';
      let finalActions: ChatbotAction[] = [];
      let usedEngine: 'ai' | 'local' = 'local';

      // 1. Try AI engine if mode is 'auto' and Supabase is configured
      if (chatbotSettings.engine_mode === 'auto' && env.isConfigured) {
        try {
          const historyPayload = [...messages, userMsg].slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          }));

          const { data: aiRes, error: aiErr } = await supabase.functions.invoke('chat', {
            body: {
              session_id: sid,
              language: lang,
              vehicle,
              messages: historyPayload,
            },
          });

          if (!aiErr && aiRes && !aiRes.fallback && typeof aiRes.reply === 'string') {
            finalReply = aiRes.reply;
            finalActions = Array.isArray(aiRes.actions) ? aiRes.actions : [];
            usedEngine = 'ai';
          }
        } catch (_edgeErr) {
          // Gracefully fall through to localEngine
        }
      }

      // 2. If AI engine was not used or failed/fell back, execute local deterministic engine
      if (!finalReply) {
        const localCtx: LocalEngineContext = {
          language: lang,
          vehicle,
          services,
          faqs,
          knowledge,
          settings: siteSettings,
          deliverySettings,
          paymentSettings,
          products,
        };

        const localRes = processLocalMessage(trimmed, localCtx);
        finalReply = localRes.reply;
        finalActions = localRes.actions;
        usedEngine = 'local';
      }

      setActiveEngine(usedEngine);

      const assistantMsg: ChatMessageItem = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: finalReply,
        actions: finalActions,
        engineUsed: usedEngine,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsSending(false);

      if (isMinimized || !isOpen) {
        setUnreadCount((c) => c + 1);
      }

      // 3. Background logging via chat_log RPC (masks PII / 7+ digit sequences)
      if (chatbotSettings.logging_enabled && env.isConfigured) {
        try {
          void supabase.rpc('chat_log', {
            p_session_id: sid,
            p_language: lang,
            p_vehicle: vehicle ? (vehicle as Record<string, unknown>) : null,
            p_engine: usedEngine,
            p_user_message: trimmed,
            p_assistant_message: finalReply,
          });
        } catch (_logErr) {
          // ignore
        }
      }
    },
    [
      isSending,
      currentLang,
      currentVehicle,
      chatbotSettings.engine_mode,
      chatbotSettings.logging_enabled,
      messages,
      services,
      faqs,
      knowledge,
      siteSettings,
      deliverySettings,
      paymentSettings,
      products,
      isMinimized,
      isOpen,
    ]
  );

  const value = useMemo<ChatbotContextValue>(
    () => ({
      isOpen,
      isMinimized,
      isSending,
      messages,
      settings: chatbotSettings,
      activeEngine,
      vehicle: currentVehicle,
      unreadCount,
      openChat,
      closeChat,
      toggleChat,
      minimizeChat,
      restoreChat,
      sendMessage,
      resetChat,
      setVehicle: setManualVehicle,
    }),
    [
      isOpen,
      isMinimized,
      isSending,
      messages,
      chatbotSettings,
      activeEngine,
      currentVehicle,
      unreadCount,
      openChat,
      closeChat,
      toggleChat,
      minimizeChat,
      restoreChat,
      sendMessage,
      resetChat,
    ]
  );

  return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>;
}

export function useChatbot(): ChatbotContextValue {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
}
