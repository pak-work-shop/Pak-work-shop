import type {
  ChatbotKnowledgeRow,
  DeliverySettingsRow,
  FaqRow,
  PaymentSettingsRow,
  ProductRow,
  ServiceRow,
  SiteSettingsRow,
} from '../../types/database';
import { getLocalized } from '../../i18n/helpers';
import { formatPKR } from '../../lib/format';

export type ChatbotAction =
  | { type: 'book'; service_slugs: string[] }
  | { type: 'products'; product_slugs: string[] }
  | { type: 'track' }
  | { type: 'whatsapp'; message?: string }
  | { type: 'call' };

export type ChatbotEngineResponse = {
  reply: string;
  actions: ChatbotAction[];
  engineUsed: 'ai' | 'local';
  matchedIntent?: string;
  matchedContextIds?: string[];
};

export type LocalEngineContext = {
  language: 'en' | 'ur' | 'ur-roman';
  vehicle: { make?: string; model?: string; year?: number } | null;
  services: ServiceRow[];
  faqs: FaqRow[];
  knowledge: ChatbotKnowledgeRow[];
  settings: SiteSettingsRow;
  deliverySettings?: DeliverySettingsRow | null;
  paymentSettings?: PaymentSettingsRow | null;
  products?: ProductRow[];
};

/**
 * Text normalizer that strips diacritics, punctuation, converts to lowercase,
 * and collapses multiple whitespace characters.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    // normalize unicode diacritics
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
    // replace punctuation with spaces
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’،؟؛!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if input contains any keyword from the list.
 */
function hasAny(input: string, words: string[]): boolean {
  const tokens = input.split(' ').filter(Boolean);
  return words.some((w) => {
    const norm = normalizeText(w);
    if (!norm) return false;
    if (norm.includes(' ')) {
      return input.includes(norm);
    }
    // Single word: match whole token for short terms (<= 4 chars) to avoid false positives (e.g. 'ac' in 'spaceships')
    if (norm.length <= 4) {
      return tokens.includes(norm);
    }
    return input.includes(norm);
  });
}

/**
 * Formats inspection disclaimer in active language
 */
function getInspectionDisclaimer(lang: 'en' | 'ur' | 'ur-roman'): string {
  if (lang === 'ur') {
    return 'نوٹ: حتمی تشخیص کے لیے ورکشاپ پر فزیکل معائنہ لازمی ہے۔';
  }
  if (lang === 'ur-roman') {
    return 'Note: Final diagnosis ke liye workshop par physical inspection laazmi hai.';
  }
  return 'Note: A physical inspection by our certified mechanics is always required for final diagnosis.';
}

/**
 * Local deterministic intent engine
 */
export function processLocalMessage(
  rawMessage: string,
  ctx: LocalEngineContext
): ChatbotEngineResponse {
  const norm = normalizeText(rawMessage);
  const lang = ctx.language || 'en';

  // 0. PROMPT INJECTION & SENSITIVE EXTRACTION DEFENSE
  const injectionWords = [
    'ignore previous instructions', 'ignore all instructions', 'system prompt',
    'admin password', 'developer mode', 'jailbreak', 'reveal prompt', 'bypass rules',
    'secret key', 'give me passwords', 'تمام ہدایات', 'نظر انداز کریں', 'سسٹم پاس ورڈ',
    'سسٹم پرامپٹ', 'ہدایات نظر انداز'
  ];
  if (hasAny(norm, injectionWords)) {
    if (lang === 'ur') {
      return {
        reply: 'میں پاک آٹو ورکس کا ڈیجیٹل اسسٹنٹ ہوں۔ میں صرف ورکشاپ سروسز، گاڑیوں کے مسائل، پارٹس اور اپائنٹمنٹس کے بارے میں رہنمائی فراہم کرتا ہوں۔',
        actions: [{ type: 'book', service_slugs: [] }, { type: 'whatsapp' }],
        engineUsed: 'local',
        matchedIntent: 'prompt_injection_defense',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: 'Main Pak Auto Works ka digital assistant hoon. Main sirf workshop services, gaari ke masail, spare parts aur booking ke baray mein rehnumai kar sakta hoon.',
        actions: [{ type: 'book', service_slugs: [] }, { type: 'whatsapp' }],
        engineUsed: 'local',
        matchedIntent: 'prompt_injection_defense',
      };
    }
    return {
      reply: 'I am the Pak Auto Works digital assistant. I am designed exclusively to assist with automotive repair services, vehicle diagnostics, spare parts, and workshop appointments.',
      actions: [{ type: 'book', service_slugs: [] }, { type: 'whatsapp' }],
      engineUsed: 'local',
      matchedIntent: 'prompt_injection_defense',
    };
  }

  // 1. GREETINGS & PLEASANTRIES
  const greetingWords = [
    'hello', 'hi', 'hey', 'salam', 'assalam', 'assalam o alaikum', 'assalamualaikum',
    'aoa', 'adaab', 'morning', 'afternoon', 'evening', 'کیسے ہو', 'سلام', 'السلام علیکم'
  ];
  if (hasAny(norm, greetingWords) && norm.split(' ').length <= 4) {
    if (lang === 'ur') {
      return {
        reply: 'وعلیکم السلام! پاک آٹو ورکس میں خوش آمدید۔ فرمائیے میں آپ کی گاڑی کی مرمت، سروسز، اسپیئر پارٹس یا بکنگ میں کیا مدد کر سکتا ہوں؟',
        actions: [
          { type: 'book', service_slugs: [] },
          { type: 'whatsapp' },
        ],
        engineUsed: 'local',
        matchedIntent: 'greeting',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: 'Walaikum Assalam! Pak Auto Works mein khush-amdeed. Batayein main aapki gaari ki service, parts, charges ya booking mein kya madad kar sakta hoon?',
        actions: [
          { type: 'book', service_slugs: [] },
          { type: 'whatsapp' },
        ],
        engineUsed: 'local',
        matchedIntent: 'greeting',
      };
    }
    return {
      reply: 'Hello and welcome to Pak Auto Works! How can I assist you with auto maintenance, spare parts, repair estimates, or workshop booking today?',
      actions: [
        { type: 'book', service_slugs: [] },
        { type: 'whatsapp' },
      ],
      engineUsed: 'local',
      matchedIntent: 'greeting',
    };
  }

  // 1b. THANKS
  const thanksWords = ['thank', 'thanks', 'shukriya', 'jazakallah', 'meherbani', 'شکریہ', 'جزاک اللہ'];
  if (hasAny(norm, thanksWords) && norm.split(' ').length <= 4) {
    const thankReply =
      lang === 'ur'
        ? 'آپ کا بہت شکریہ! اگر مزید کوئی سوال ہو تو ضرور بتائیے۔ آپ کا سفر محفوظ رہے!'
        : lang === 'ur-roman'
        ? 'Bohat shukriya! Agar mazeed koi sawal ho to zaroor poochein. Safe travels!'
        : 'You are most welcome! Let us know if you need anything else. Drive safely!';
    return {
      reply: thankReply,
      actions: [],
      engineUsed: 'local',
      matchedIntent: 'thanks',
    };
  }

  // 2. LOCATION / ADDRESS / CONTACT
  const locationWords = [
    'address', 'location', 'workshop address', 'shop address',
    'map', 'directions', 'sadiqabad kahan', 'پتہ', 'ایڈریس', 'لوکیشن',
    'where is', 'kahan hai', 'kidhar hai', 'کہاں ہے'
  ];
  const isTrackingConflict = hasAny(norm, ['track', 'tracking', 'pohncha', 'job card', 'order', 'status']);
  const isLocationQuery =
    !isTrackingConflict &&
    (hasAny(norm, locationWords) ||
      ((norm.includes('kahan') || norm.includes('kidhar') || norm.includes('where') || norm.includes('کہاں')) &&
        (norm.includes('workshop') || norm.includes('shop') || norm.includes('garage') || norm.includes('dukan') || norm.includes('hai') || norm.includes('located'))));

  if (isLocationQuery) {
    const addr = getLocalized(ctx.settings, 'address', lang) || 'Main KLP Road, Sadiqabad, Rahim Yar Khan District, Punjab';
    const phone = ctx.settings.phone || '03126776844';
    if (lang === 'ur') {
      return {
        reply: `ہماری ورکشاپ کا پتہ:\n📍 ${addr}\nفون نمبر: ${phone}\nہم سے واٹس ایپ پر لوکیشن حاصل کر سکتے ہیں یا کال کر سکتے ہیں۔`,
        actions: [{ type: 'whatsapp' }, { type: 'call' }],
        engineUsed: 'local',
        matchedIntent: 'location',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: `Hamari workshop ka pata:\n📍 ${addr}\nPhone: ${phone}\nAap WhatsApp par live location mangwa saktay hain ya call kar saktay hain.`,
        actions: [{ type: 'whatsapp' }, { type: 'call' }],
        engineUsed: 'local',
        matchedIntent: 'location',
      };
    }
    return {
      reply: `Our workshop is located at:\n📍 ${addr}\nPhone: ${phone}\nYou can also request directions on WhatsApp or call our front desk directly.`,
      actions: [{ type: 'whatsapp' }, { type: 'call' }],
      engineUsed: 'local',
      matchedIntent: 'location',
    };
  }

  // 3. OPENING HOURS / TIMING
  const hoursWords = [
    'timing', 'timings', 'opening hours', 'operating hours', 'work hours', 'working hours',
    'kab khul', 'kab open', 'kab band', 'kab close', 'sunday open', 'jumma timing',
    'اوقات', 'کھلنے کے اوقات', 'بند ہونے'
  ];
  const isHoursQuery =
    hasAny(norm, hoursWords) ||
    ((norm.includes('open') || norm.includes('close')) && (norm.includes('workshop') || norm.includes('shop') || norm.includes('kab') || norm.includes('hours'))) ||
    ((norm.includes('time') || norm.includes('ٹائم')) && (norm.includes('opening') || norm.includes('closing') || norm.includes('workshop') || norm.includes('kab')));

  if (isHoursQuery) {
    let hoursStr = 'Monday to Saturday: 9:00 AM – 8:00 PM (Friday break: 1:00 PM – 2:30 PM). Sunday: 10:00 AM – 5:00 PM';
    if (ctx.settings.working_hours) {
      const mon = ctx.settings.working_hours['monday'];
      if (mon && mon.isOpen) {
        hoursStr = `Mon–Sat: ${mon.openTime} – ${mon.closeTime}`;
      }
    }
    if (lang === 'ur') {
      return {
        reply: `ورکشاپ کے کام کے اوقات:\n🕒 ${hoursStr}\nآن لائن سروس بکنگ ویب سائٹ پر 24/7 کھلی رہتی ہے۔`,
        actions: [{ type: 'book', service_slugs: [] }],
        engineUsed: 'local',
        matchedIntent: 'hours',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: `Workshop ke working hours:\n🕒 ${hoursStr}\nOnline service booking website par 24/7 open hai.`,
        actions: [{ type: 'book', service_slugs: [] }],
        engineUsed: 'local',
        matchedIntent: 'hours',
      };
    }
    return {
      reply: `Our workshop operating hours:\n🕒 ${hoursStr}\nOnline appointment booking on our website is available 24/7.`,
      actions: [{ type: 'book', service_slugs: [] }],
      engineUsed: 'local',
      matchedIntent: 'hours',
    };
  }

  // 4. DELIVERY CHARGES & POLICY
  const deliveryWords = [
    'shipping', 'courier', 'charge', 'charges', 'sadiqabad delivery',
    'free delivery', 'parcel', 'charges kitne', 'شپنگ', 'خرچہ ڈیلیوری'
  ];
  const isDeliveryQuery =
    hasAny(norm, deliveryWords) ||
    (norm.includes('delivery') && !norm.includes('cash on delivery') && !hasAny(norm, ['pay', 'payment', 'ادائیگی'])) ||
    (norm.includes('ڈیلیوری') && !hasAny(norm, ['ادائیگی', 'پیسے', 'طریقہ']));

  if (isDeliveryQuery) {
    const flatRate = ctx.deliverySettings?.flat_rate ?? 300;
    const freeCity = ctx.deliverySettings?.free_cities?.[0] || 'Sadiqabad';
    if (lang === 'ur') {
      return {
        reply: `اسپیئر پارٹس کی ڈیلیوری پالیسی:\n• **${freeCity} میونسپلٹی**: 100% مفت ڈیلیوری (Free Delivery)!\n• **دیگر تمام شہر (پاکستان بھر میں)**: فلیٹ ${formatPKR(flatRate)} بذریعہ کورئیر۔\n• کیش آن ڈیلیوری (COD) کی سہولت موجود ہے۔`,
        actions: [{ type: 'products', product_slugs: [] }],
        engineUsed: 'local',
        matchedIntent: 'delivery',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: `Spare parts delivery policy:\n• **${freeCity}**: 100% Free Delivery!\n• **All other cities across Pakistan**: Flat ${formatPKR(flatRate)} via courier.\n• Cash on Delivery (COD) available nationwide.`,
        actions: [{ type: 'products', product_slugs: [] }],
        engineUsed: 'local',
        matchedIntent: 'delivery',
      };
    }
    return {
      reply: `Spare Parts Delivery Policy:\n• **${freeCity}**: 100% FREE Delivery!\n• **All other cities in Pakistan**: Flat ${formatPKR(flatRate)} nationwide courier.\n• Cash on Delivery (COD) is available.`,
      actions: [{ type: 'products', product_slugs: [] }],
      engineUsed: 'local',
      matchedIntent: 'delivery',
    };
  }

  // 5. PAYMENT METHODS (Dynamic based on payment_settings & delivery_settings, NO cards, NO hardcoded bank)
  const paymentWords = [
    'payment', 'pay', 'jazzcash', 'easypaisa', 'bank', 'cod', 'cash on delivery',
    'online pay', 'ادائیگی', 'پیسے', 'جاز کیش', 'ایزی پیسہ', 'بینک'
  ];
  if (hasAny(norm, paymentWords)) {
    const codEnabled = ctx.deliverySettings?.cod_enabled ?? true;
    const manualEnabled = ctx.paymentSettings?.manual_enabled ?? true;

    const enMethods: string[] = [];
    const urMethods: string[] = [];
    const urRomanMethods: string[] = [];

    if (codEnabled) {
      enMethods.push('1. **Cash on Delivery (COD)** for nationwide spare parts orders.');
      urMethods.push('1. **کیش آن ڈیلیوری (COD)** پارٹس کے لیے۔');
      urRomanMethods.push('1. **Cash on Delivery (COD)** spare parts ke liye.');
    }
    if (manualEnabled) {
      enMethods.push(`${enMethods.length + 1}. **Official Bank Transfer & Mobile Wallets** (JazzCash / Easypaisa) with screenshot receipt upload.`);
      urMethods.push(`${urMethods.length + 1}. **بینک اور موبائل والیٹ ٹرانسفر** (جاز کیش / ایزی پیسہ) رسید اپ لوڈ کے ساتھ۔`);
      urRomanMethods.push(`${urRomanMethods.length + 1}. **Direct Bank & Mobile Wallets** (JazzCash / Easypaisa) receipt upload ke sath.`);
    }
    enMethods.push(`${enMethods.length + 1}. **Workshop Service Counter**: Cash or instant mobile transfer upon job card delivery.`);
    urMethods.push(`${urMethods.length + 1}. **ورکشاپ کاؤنٹر پر ادائیگی**: کام مکمل ہونے پر نقد یا فوری موبائل ٹرانسفر۔`);
    urRomanMethods.push(`${urRomanMethods.length + 1}. **Workshop Counter**: Cash ya direct transfer job card delivery ke waqt.`);

    if (lang === 'ur') {
      return {
        reply: `ادائیگی کے طریقے:\n${urMethods.join('\n')}`,
        actions: [{ type: 'products', product_slugs: [] }],
        engineUsed: 'local',
        matchedIntent: 'payment',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: `Payment options:\n${urRomanMethods.join('\n')}`,
        actions: [{ type: 'products', product_slugs: [] }],
        engineUsed: 'local',
        matchedIntent: 'payment',
      };
    }
    return {
      reply: `Accepted Payment Methods:\n${enMethods.join('\n')}`,
      actions: [{ type: 'products', product_slugs: [] }],
      engineUsed: 'local',
      matchedIntent: 'payment',
    };
  }

  // 5b. RETURNS & EXCHANGES POLICY (Confirmed by workshop team on request)
  const returnWords = [
    'return', 'returns', 'exchange', 'refund', 'warranty', 'wapsi', 'badalna', 'واپسی', 'وارنٹی', 'تبادلہ'
  ];
  if (hasAny(norm, returnWords)) {
    if (lang === 'ur') {
      return {
        reply: 'اسپیئر پارٹس کی واپسی اور تبدیلی کی شرائط کی تصدیق ورکشاپ ٹیم سے کی جاتی ہے۔ برائے مہربانی اپنی خریداری کی رسید اور اصل پیکنگ کے ہمراہ واٹس ایپ پر رابطہ کریں یا ورکشاپ تشریف لائیں۔',
        actions: [{ type: 'whatsapp', message: 'I want to inquire about parts return and exchange' }],
        engineUsed: 'local',
        matchedIntent: 'returns_policy',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: 'Spare parts return ya exchange policy workshop team se confirm ki jaati hai. Barah-e-karam apni invoice aur original packaging ke sath WhatsApp par rabta karein ya workshop visit karein.',
        actions: [{ type: 'whatsapp', message: 'I want to inquire about parts return and exchange' }],
        engineUsed: 'local',
        matchedIntent: 'returns_policy',
      };
    }
    return {
      reply: 'Spare parts return and exchange terms are confirmed directly with our workshop team upon request. Please contact our front desk on WhatsApp or visit the workshop with your invoice and original packaging for review.',
      actions: [{ type: 'whatsapp', message: 'I want to inquire about parts return and exchange' }],
      engineUsed: 'local',
      matchedIntent: 'returns_policy',
    };
  }

  // 6. TRACKING INTENT (Job, Order, Booking)
  const trackWords = [
    'track', 'tracking', 'status', 'kahan pohncha', 'mera order', 'mera job', 'job card',
    'car status', 'gari ka kaam', 'order status', 'ٹریک', 'کام ٹریک', 'آرڈر ٹریک'
  ];
  if (hasAny(norm, trackWords)) {
    if (lang === 'ur') {
      return {
        reply: 'گاڑی کے کام یا اسٹور آرڈر کا اسٹیٹس جاننے کے لیے نیچے دیا گیا ٹریکنگ فارم استعمال کریں (جاب / آرڈر نمبر اور رجسٹرڈ فون نمبر درج کریں):',
        actions: [{ type: 'track' }],
        engineUsed: 'local',
        matchedIntent: 'track',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: 'Apni gaari ke repair kaam ya store order ka status maloom karne ke liye neeche tracking form mein reference number aur phone enter karein:',
        actions: [{ type: 'track' }],
        engineUsed: 'local',
        matchedIntent: 'track',
      };
    }
    return {
      reply: 'To track your active workshop repair or parts order, use the tracking form below with your Job/Order number and registered phone:',
      actions: [{ type: 'track' }],
      engineUsed: 'local',
      matchedIntent: 'track',
    };
  }

  // 7. BOOKING INTENT
  const bookingWords = [
    'book', 'booking', 'appointment', 'slot', 'reserve', 'kam karwana', 'service karwani',
    'aana chahta', 'appointment leni', 'بکنگ', 'وقت', 'اپائنٹمنٹ'
  ];
  if (hasAny(norm, bookingWords)) {
    if (lang === 'ur') {
      return {
        reply: 'ورکشاپ میں سروس کے لیے آپ فوری طور پر آن لائن اپائنٹمنٹ بک کر سکتے ہیں۔ اپنی تاریخ، گاڑی کی تفصیل اور وقت کا انتخاب کریں:',
        actions: [{ type: 'book', service_slugs: [] }],
        engineUsed: 'local',
        matchedIntent: 'booking',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: 'Workshop service ke liye aap online appointment book kar saktay hain. Apni gaari, tareekh aur time slot select karein:',
        actions: [{ type: 'book', service_slugs: [] }],
        engineUsed: 'local',
        matchedIntent: 'booking',
      };
    }
    return {
      reply: 'You can easily schedule a workshop service appointment online. Pick your vehicle, preferred date, and available time slot:',
      actions: [{ type: 'book', service_slugs: [] }],
      engineUsed: 'local',
      matchedIntent: 'booking',
    };
  }

  // 8. SPECIFIC SYMPTOM-TO-SERVICE MAPPING (WITH INSPECTION DISCLAIMER)
  const disclaimer = getInspectionDisclaimer(lang);

  // Brake symptoms & service rate lookup
  const isBreakdown = hasAny(norm, ['breakdown', 'break down', 'بریک ڈاؤن', 'بریکڈاؤن', 'بریک ڈاون']);
  const hasBrakeSymptom = hasAny(norm, ['awaz', 'squeak', 'cheekh', 'khatam', 'pedal', 'service', 'rate', 'noise', 'grind', 'checking', 'inspection', 'آواز', 'ختم', 'خراب']);
  const isBrakeParts = !hasBrakeSymptom && hasAny(norm, ['pad', 'pads', 'brake pad', 'brake pads', 'brakepad', 'پیڈز', 'پیڈ']);
  if (!isBreakdown && !isBrakeParts && hasAny(norm, ['brake', 'break', 'brek', 'braking', 'squeak', 'cheekh', 'pedal', 'روٹر', 'بریک'])) {
    const brakeSrv = ctx.services.find((s) => s.slug === 'brakes');
    const priceText = brakeSrv?.price_from
      ? `${formatPKR(brakeSrv.price_from)} – ${formatPKR(brakeSrv.price_to || brakeSrv.price_from)}`
      : 'Quote after inspection';
    const timeText = brakeSrv?.estimated_time || '1–2 hours';

    if (lang === 'ur') {
      return {
        reply: `بریک کے مسائل اور سروس ریٹ:\n• **تجویز کردہ سروس**: بریک انسپکشن اور پیڈ تبدیلی\n• **تخمینی لیبر**: ${priceText}\n• **متوقع وقت**: ${timeText}\n\n⚠️ ${disclaimer}`,
        actions: [
          { type: 'book', service_slugs: brakeSrv ? [brakeSrv.slug] : ['brakes'] },
          { type: 'whatsapp', message: 'I need brake inspection for my car' },
        ],
        engineUsed: 'local',
        matchedIntent: 'symptom_brakes',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: `Brake service aur rates:\n• **Recommended Service**: Brake System Inspection & Service\n• **Estimated Labor**: ${priceText}\n• **Estimated Time**: ${timeText}\n\n⚠️ ${disclaimer}`,
        actions: [
          { type: 'book', service_slugs: brakeSrv ? [brakeSrv.slug] : ['brakes'] },
          { type: 'whatsapp', message: 'I need brake inspection for my car' },
        ],
        engineUsed: 'local',
        matchedIntent: 'symptom_brakes',
      };
    }
    return {
      reply: `Brake system service and rates:\n• **Recommended Service**: Brake System Inspection & Service\n• **Estimated Cost**: ${priceText}\n• **Estimated Time**: ${timeText}\n\n⚠️ ${disclaimer}`,
      actions: [
        { type: 'book', service_slugs: brakeSrv ? [brakeSrv.slug] : ['brakes'] },
        { type: 'whatsapp', message: 'I need brake inspection for my car' },
      ],
      engineUsed: 'local',
      matchedIntent: 'symptom_brakes',
    };
  }

  // AC cooling symptoms & service price lookup
  if (hasAny(norm, ['ac', 'air condition', 'thanda nahi', 'thandi hawa', 'cooling', 'compressor', 'gas leak', 'اے سی', 'کولنگ'])) {
    const acSrv = ctx.services.find((s) => s.slug === 'ac-repair');
    const priceText = acSrv?.price_from
      ? `${formatPKR(acSrv.price_from)} – ${formatPKR(acSrv.price_to || acSrv.price_from)}`
      : 'Quote after inspection';
    const timeText = acSrv?.estimated_time || '1–2 hours';

    if (lang === 'ur') {
      return {
        reply: `کار اے سی سروس اور چارجز:\n• **تجویز کردہ سروس**: کار اے سی کولنگ و گیس چیک اپ\n• **تخمینی لاگت**: ${priceText}\n• **متوقع وقت**: ${timeText}\n\n⚠️ ${disclaimer}`,
        actions: [
          { type: 'book', service_slugs: acSrv ? [acSrv.slug] : ['ac-repair'] },
          { type: 'whatsapp', message: 'I need AC cooling checkup for my car' },
        ],
        engineUsed: 'local',
        matchedIntent: 'symptom_ac',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: `AC repair aur cooling charges:\n• **Recommended Service**: AC Cooling Diagnosis & Refrigerant Service\n• **Estimated Cost**: ${priceText}\n• **Estimated Time**: ${timeText}\n\n⚠️ ${disclaimer}`,
        actions: [
          { type: 'book', service_slugs: acSrv ? [acSrv.slug] : ['ac-repair'] },
          { type: 'whatsapp', message: 'I need AC cooling checkup for my car' },
        ],
        engineUsed: 'local',
        matchedIntent: 'symptom_ac',
      };
    }
    return {
      reply: `Car AC repair and cooling rates:\n• **Recommended Service**: AC Performance & Refrigerant Checkup\n• **Estimated Cost**: ${priceText}\n• **Estimated Time**: ${timeText}\n\n⚠️ ${disclaimer}`,
      actions: [
        { type: 'book', service_slugs: acSrv ? [acSrv.slug] : ['ac-repair'] },
        { type: 'whatsapp', message: 'I need AC cooling checkup for my car' },
      ],
      engineUsed: 'local',
      matchedIntent: 'symptom_ac',
    };
  }

  // Exhaust smoke symptoms
  if (hasAny(norm, ['exhaust smoke', 'white smoke', 'black smoke', 'blue smoke', 'silencer dhuan', 'exhaust dhuan', 'سائلنسر سے دھواں', 'سفید دھواں', 'کالا دھواں', 'نیلا دھواں'])) {
    const engSrv = ctx.services.find((s) => s.slug === 'engine');
    if (lang === 'ur') {
      return {
        reply: `سائلنسر سے دھوئیں کے اخراج کی عام وجوہات:\n• **نیلا دھواں**: انجن آئل جلنے یا پسٹن رنگز کمزور ہونے کی علامت۔\n• **کالا دھواں**: اضافی فیول مکسچر یا خراب انژیکٹرز۔\n• **سفید گاڑھا دھواں**: کولنٹ لیک یا ہیڈ گیسکٹ خرابی کا اشارہ۔\n\n⚠️ ${disclaimer}`,
        actions: [{ type: 'book', service_slugs: engSrv ? [engSrv.slug] : ['engine'] }, { type: 'whatsapp' }],
        engineUsed: 'local',
        matchedIntent: 'symptom_exhaust_smoke',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: `Exhaust se dhuan nikalne ki wajohat:\n• **Neela dhuan**: Engine oil jalne ya piston rings wear ki nishani.\n• **Kala dhuan**: Fuel over-rich mixture ya faulty injectors.\n• **Safaid thick dhuan**: Coolant leak ya blown head gasket.\n\n⚠️ ${disclaimer}`,
        actions: [{ type: 'book', service_slugs: engSrv ? [engSrv.slug] : ['engine'] }, { type: 'whatsapp' }],
        engineUsed: 'local',
        matchedIntent: 'symptom_exhaust_smoke',
      };
    }
    return {
      reply: `Tailpipe exhaust smoke indicators:\n• **Blue Smoke**: Burning engine oil from worn valve seals or piston rings.\n• **Black Smoke**: Excessive fuel combustion, dirty air filter, or leaking injectors.\n• **Thick White Smoke**: Coolant entering combustion chambers (head gasket issue).\n\n⚠️ ${disclaimer}`,
      actions: [{ type: 'book', service_slugs: engSrv ? [engSrv.slug] : ['engine'] }, { type: 'whatsapp' }],
      engineUsed: 'local',
      matchedIntent: 'symptom_exhaust_smoke',
    };
  }

  // Suspension noise symptoms
  if (hasAny(norm, ['suspension', 'khat khat', 'khadke', 'bushing', 'shock absorber', 'shocks', 'clunk', 'clunking', 'jharke', 'سسپنشن', 'جھٹکے', 'کھٹ کھٹ'])) {
    const suspSrv = ctx.services.find((s) => s.slug === 'suspension' || s.slug === 'wheel-alignment-balancing');
    const priceText = suspSrv?.price_from ? formatPKR(suspSrv.price_from) : 'Inspection';
    if (lang === 'ur') {
      return {
        reply: `سسپنشن سے آواز (کھٹ کھٹ یا جھٹکے لگنا) عموما بشنگز، بال جوائنٹس، یا خراب شاک ابزرور کی وجہ سے ہوتی ہے۔\n• **تجویز کردہ سروس**: سسپنشن اور انڈر کیرج معائنہ\n• **تخمینی لیبر**: تقریبا ${priceText}\n\n⚠️ ${disclaimer}`,
        actions: [{ type: 'book', service_slugs: suspSrv ? [suspSrv.slug] : ['suspension'] }, { type: 'whatsapp' }],
        engineUsed: 'local',
        matchedIntent: 'symptom_suspension_noise',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: `Suspension se khat khat awaz ya bumps par jhatke lagna bush, ball joint ya weak shock absorber ki nishani hai.\n• **Recommended Service**: Suspension & Undercarriage Inspection\n• **Labor Estimate**: Around ${priceText}\n\n⚠️ ${disclaimer}`,
        actions: [{ type: 'book', service_slugs: suspSrv ? [suspSrv.slug] : ['suspension'] }, { type: 'whatsapp' }],
        engineUsed: 'local',
        matchedIntent: 'symptom_suspension_noise',
      };
    }
    return {
      reply: `Suspension clunking, squeaks over speed bumps, or harsh vibrations usually indicate worn rubber bushings, ball joints, tie rod ends, or leaking shock absorbers.\n• **Recommended Service**: Suspension & Undercarriage Safety Check\n• **Estimated Inspection**: Starting around ${priceText}\n\n⚠️ ${disclaimer}`,
      actions: [{ type: 'book', service_slugs: suspSrv ? [suspSrv.slug] : ['suspension'] }, { type: 'whatsapp' }],
      engineUsed: 'local',
      matchedIntent: 'symptom_suspension_noise',
    };
  }

  // Engine overheating symptoms
  if (hasAny(norm, ['overheat', 'garam', 'radiator', 'coolant', 'smoke', 'dhuan', 'انجن اوور ہیٹ', 'ریڈی ایٹر', 'انجن گرم'])) {
    const engSrv = ctx.services.find((s) => s.slug === 'engine');
    if (lang === 'ur') {
      return {
        reply: `اگر انجن اوور ہیٹ ہو رہا ہو تو فوری طور پر محفوظ جگہ گاڑی روک کر انجن بند کر دیں! ریڈی ایٹر کا ڈھکن گرم حالت میں ہرگز نہ کھولیں۔\n• **ممکنہ وجوہات**: کولنٹ کی کمی، فین خراب ہونا، یا تھرموسٹیٹ والو جام ہونا۔\n\n⚠️ ${disclaimer}`,
        actions: [
          { type: 'book', service_slugs: engSrv ? [engSrv.slug] : ['engine'] },
          { type: 'call' },
        ],
        engineUsed: 'local',
        matchedIntent: 'symptom_overheat',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: `Agar engine garam ho raha hai to foran gaari rok kar engine band karein! Garam halat mein radiator cap hargiz na kholein.\n• **Wajohat**: Coolant leak, fan fault, ya thermostat valve stuck.\n\n⚠️ ${disclaimer}`,
        actions: [
          { type: 'book', service_slugs: engSrv ? [engSrv.slug] : ['engine'] },
          { type: 'call' },
        ],
        engineUsed: 'local',
        matchedIntent: 'symptom_overheat',
      };
    }
    return {
      reply: `If your engine is overheating, safely pull over immediately and turn off the engine! Never open a hot radiator cap.\n• **Common causes**: Low coolant, failed electric fan, or stuck thermostat valve.\n\n⚠️ ${disclaimer}`,
      actions: [
        { type: 'book', service_slugs: engSrv ? [engSrv.slug] : ['engine'] },
        { type: 'call' },
      ],
      engineUsed: 'local',
      matchedIntent: 'symptom_overheat',
    };
  }

  // Battery / Starting symptoms
  const isBatteryTips = hasAny(norm, ['tips', 'tip', 'life tips', 'guide', 'maintenance tips', 'تجاویز']);
  if (!isBatteryTips && hasAny(norm, ['battery', 'start nahi', 'starting', 'crank', 'self', 'battri', 'بیٹری', 'اسٹارٹ'])) {
    const battSrv = ctx.services.find((s) => s.slug === 'battery');
    const priceText = battSrv?.price_from ? formatPKR(battSrv.price_from) : 'Inspection';
    if (lang === 'ur') {
      return {
        reply: `گاڑی اسٹارٹ نہ ہونے کی صورت میں بیٹری کے ٹرمینلز پر کائی یا کم وولٹیج ہو سکتا ہے۔\n• **تجویز کردہ سروس**: بیٹری ٹیسٹنگ و وولٹیج چیک\n• **لاگت**: تقریبا ${priceText}\n\n⚠️ ${disclaimer}`,
        actions: [
          { type: 'book', service_slugs: battSrv ? [battSrv.slug] : ['battery'] },
          { type: 'whatsapp' },
        ],
        engineUsed: 'local',
        matchedIntent: 'symptom_battery',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: `Gaari start na hone par battery terminals par corrosion ya weak cells ho saktay hain.\n• **Recommended Service**: Battery Voltage & Alternator Test\n• **Cost**: Approx ${priceText}\n\n⚠️ ${disclaimer}`,
        actions: [
          { type: 'book', service_slugs: battSrv ? [battSrv.slug] : ['battery'] },
          { type: 'whatsapp' },
        ],
        engineUsed: 'local',
        matchedIntent: 'symptom_battery',
      };
    }
    return {
      reply: `Sluggish cranking or no-start usually stems from battery degradation, loose terminals, or alternator charging failure.\n• **Recommended Service**: Battery & Alternator Electrical Test\n• **Cost**: Starting around ${priceText}\n\n⚠️ ${disclaimer}`,
      actions: [
        { type: 'book', service_slugs: battSrv ? [battSrv.slug] : ['battery'] },
        { type: 'whatsapp' },
      ],
      engineUsed: 'local',
      matchedIntent: 'symptom_battery',
    };
  }

  // Oil change / Maintenance
  if (hasAny(norm, ['oil', 'mobil oil', 'engine oil', 'filter', 'tuning', 'تیل', 'آئل', 'ٹیوننگ'])) {
    const oilSrv = ctx.services.find((s) => s.slug === 'oil-change-service');
    const priceText = oilSrv?.price_from
      ? `${formatPKR(oilSrv.price_from)} – ${formatPKR(oilSrv.price_to || oilSrv.price_from)}`
      : 'Starting from Rs. 2,500';

    if (lang === 'ur') {
      return {
        reply: `انجن آئل اور فلٹر سروس:\n• **تجویز کردہ دورانیہ**: عام طور پر 5,000 سے 8,000 کلومیٹر کی رینج میں (مخصوص گریڈ اور مینوفیکچرر کے لیے گاڑی کا آنرز مینوئل ضرور چیک کریں)۔\n• **سروس لیبر**: ${priceText} (آئل اور فلٹر الگ چارج ہوتے ہیں)۔\n\n⚠️ ${disclaimer}\n\nآپ ابھی اپنا ٹائم سلاٹ بک کر سکتے ہیں!`,
        actions: [
          { type: 'book', service_slugs: oilSrv ? [oilSrv.slug] : ['oil-change-service'] },
        ],
        engineUsed: 'local',
        matchedIntent: 'oil_change',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: `Engine oil aur filter service:\n• **Typical Interval**: Aam tor par 5,000 se 8,000 km range (apni gaari ka owner's manual zaroor check karein).\n• **Labor Cost**: ${priceText} + oil & filter.\n\n⚠️ ${disclaimer}\n\nAap abhi apna time slot book kar saktay hain!`,
        actions: [
          { type: 'book', service_slugs: oilSrv ? [oilSrv.slug] : ['oil-change-service'] },
        ],
        engineUsed: 'local',
        matchedIntent: 'oil_change',
      };
    }
    return {
      reply: `Engine Oil & Filter Service:\n• **Typical Interval**: Recommended typical range is 5,000 to 8,000 km (always check your owner's manual for recommended oil specification and interval).\n• **Service Cost**: ${priceText} (plus lubricant and filter).\n\n⚠️ ${disclaimer}\n\nBook your maintenance bay appointment online:`,
      actions: [
        { type: 'book', service_slugs: oilSrv ? [oilSrv.slug] : ['oil-change-service'] },
      ],
      engineUsed: 'local',
      matchedIntent: 'oil_change',
    };
  }

  // Check engine light & warning lights
  if (hasAny(norm, ['check engine', 'warning light', 'warning lights', 'obd', 'scanner', 'batti', 'وارننگ لائٹ', 'چیک انجن', 'abs light', 'airbag light', 'oil light'])) {
    const engSrv = ctx.services.find((s) => s.slug === 'engine');
    if (lang === 'ur') {
      return {
        reply: `چیک انجن یا ڈیش بورڈ وارننگ لائٹس (جیسے ABS، ایئر بیگ، آئل پریشر) گاڑی کے سنسر میں خرابی کی علامت ہوتی ہیں۔\n• پاک آٹو ورکس پر جدید کمپیوٹرائزڈ OBD-II اسکیننگ اور تشخیص کی سہولت دستیاب ہے۔\n\n⚠️ ${disclaimer}`,
        actions: [
          { type: 'book', service_slugs: engSrv ? [engSrv.slug] : ['engine'] },
        ],
        engineUsed: 'local',
        matchedIntent: 'warning_lights',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: `Check engine ya dashboard warning lights (ABS, airbag, engine, oil light) sensor error ki nishani hoti hain.\n• Pak Auto Works par computerized OBD-II scanning bay mojood hai jo exact error code detect karti hai.\n\n⚠️ ${disclaimer}`,
        actions: [
          { type: 'book', service_slugs: engSrv ? [engSrv.slug] : ['engine'] },
        ],
        engineUsed: 'local',
        matchedIntent: 'warning_lights',
      };
    }
    return {
      reply: `Dashboard warning lights (Check Engine, ABS, Airbag, Battery, Oil Pressure) signal an active diagnostic trouble code recorded by the ECU.\n• Our workshop utilizes computerized OBD-II scanners to pinpoint the exact circuit or sensor fault.\n\n⚠️ ${disclaimer}`,
      actions: [
        { type: 'book', service_slugs: engSrv ? [engSrv.slug] : ['engine'] },
      ],
      engineUsed: 'local',
      matchedIntent: 'warning_lights',
    };
  }

  // Tyre puncture / Tyre pressure / Wheel alignment
  if (hasAny(norm, ['tyre', 'tire', 'puncture', 'puncher', 'air pressure', 'psi', 'flat tyre', 'flat tire', 'alignment', 'wheel balancing', 'ٹائر', 'پنکچر', 'الائنمنٹ'])) {
    const alignSrv = ctx.services.find((s) => s.slug === 'wheel-alignment-balancing' || s.slug === 'suspension');
    const priceText = alignSrv?.price_from ? `${formatPKR(alignSrv.price_from)}` : 'Rs. 1,500';
    if (lang === 'ur') {
      return {
        reply: `ٹائر اور پہیوں کی دیکھ بھال:\n• **تجویز کردہ پریشر**: عام طور پر 30 سے 35 PSI کولڈ حالت میں (گاڑی کا آنرز مینوئل یا دروازے پر لگا ٹائر پلیکارڈ ضرور چیک کریں)۔\n• **پہیوں کی الائنمنٹ و بیلنسنگ**: عام طور پر ہر 8,000 سے 10,000 کلومیٹر پر یا اسٹیئرنگ کھنچنے پر چیک کروائیں (آنرز مینوئل ملاحظہ فرمائیں)۔\n• **سروس چارجز**: تقریبا ${priceText} سے شروع۔\n\n⚠️ ${disclaimer}`,
        actions: [
          { type: 'book', service_slugs: alignSrv ? [alignSrv.slug] : [] },
          { type: 'whatsapp' },
        ],
        engineUsed: 'local',
        matchedIntent: 'tyre_puncture',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: `Tyre aur wheel maintenance:\n• **Recommended Air Pressure**: Aam tor par typical range 30–35 PSI thandi halat mein (apni gaari ka owner's manual ya door-jamb tyre placard check karein).\n• **Wheel Alignment & Balancing**: Har 8,000–10,000 km par alignment check karein (check your owner's manual).\n• **Service Cost**: Starting around ${priceText}.\n\n⚠️ ${disclaimer}`,
        actions: [
          { type: 'book', service_slugs: alignSrv ? [alignSrv.slug] : [] },
          { type: 'whatsapp' },
        ],
        engineUsed: 'local',
        matchedIntent: 'tyre_puncture',
      };
    }
    return {
      reply: `Tyre pressure, puncture, and alignment guidelines:\n• **Recommended Pressure**: Typical range is 30 to 35 PSI cold (always check your owner's manual or the door-jamb tyre placard for vehicle-specific cold tyre specs).\n• **Wheel Alignment & Balancing**: Recommended range every 8,000 to 10,000 km or whenever steering pulls (check your owner's manual).\n• **Estimated Service**: Starting around ${priceText}.\n\n⚠️ ${disclaimer}`,
      actions: [
        { type: 'book', service_slugs: alignSrv ? [alignSrv.slug] : [] },
        { type: 'whatsapp' },
      ],
      engineUsed: 'local',
      matchedIntent: 'tyre_puncture',
    };
  }

  // Maintenance basics & Periodic tuning
  if (hasAny(norm, ['maintenance basics', 'periodic maintenance', 'routine service', 'general service', 'tune up', 'tuning', 'جنرل سروس', 'دیکھ بھال', 'regular service'])) {
    const tuneSrv = ctx.services.find((s) => s.slug === 'engine' || s.slug === 'oil-change-service');
    if (lang === 'ur') {
      return {
        reply: `گاڑی کی بنیادی اور وقتا فوقتا دیکھ بھال (Maintenance Basics):\n1. **انجن آئل و فلٹر**: ہر 5,000 کلومیٹر پر تبدیل کریں۔\n2. **ایئر و کیبن فلٹرز**: ہر سروس پر صاف کریں، ہر 10,000 کلومیٹر پر تبدیل کریں۔\n3. **بریک و کولنٹ لیول**: ماہانہ چیک کریں۔\n4. **بیٹری ٹرمینلز**: صاف اور زنگ سے پاک رکھیں۔\n\nہمارے پاس مکمل کمپیوٹرائزڈ پیریوڈک مینٹیننس پیکیج دستیاب ہے!`,
        actions: [
          { type: 'book', service_slugs: tuneSrv ? [tuneSrv.slug] : ['oil-change-service'] },
        ],
        engineUsed: 'local',
        matchedIntent: 'maintenance_basics',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: `Gaari ki periodic maintenance basics:\n1. **Engine Oil & Filter**: Har 5,000 km par change karwayein.\n2. **Air & AC Filters**: Har service par blow karwayein, 10,000 km par new daalein.\n3. **Brakes & Coolant**: Mahana level check karein.\n4. **Battery Terminals**: Corrosion se saaf rakhein.\n\nPak Auto Works par complete periodic general service book kar saktay hain!`,
        actions: [
          { type: 'book', service_slugs: tuneSrv ? [tuneSrv.slug] : ['oil-change-service'] },
        ],
        engineUsed: 'local',
        matchedIntent: 'maintenance_basics',
      };
    }
    return {
      reply: `Vehicle periodic maintenance basics:\n1. **Engine Oil & Filter**: Renew every 5,000–8,000 km.\n2. **Air & Cabin Filters**: Inspect each service, replace every 10,000 km.\n3. **Coolant & Brake Fluids**: Inspect levels and condition monthly.\n4. **Battery Care**: Keep terminals clean and check charging voltage annually.\n\nYou can book a comprehensive periodic inspection online:`,
      actions: [
        { type: 'book', service_slugs: tuneSrv ? [tuneSrv.slug] : ['oil-change-service'] },
      ],
      engineUsed: 'local',
      matchedIntent: 'maintenance_basics',
    };
  }

  // 9. SERVICE PRICE & DIRECT MATCH LOOKUP
  for (const srv of ctx.services) {
    const srvName = normalizeText(getLocalized(srv, 'name', lang) || srv.slug);
    const srvSlug = srv.slug.replace(/-/g, ' ');
    if (norm.includes(srvName) || norm.includes(srvSlug)) {
      const priceText = srv.price_from
        ? `${formatPKR(srv.price_from)} – ${formatPKR(srv.price_to || srv.price_from)}`
        : 'Quote after inspection';
      const timeText = srv.estimated_time || '1–2 hours';
      const desc = getLocalized(srv, 'short_description', lang) || '';

      if (lang === 'ur') {
        return {
          reply: `سروس کی تفصیل: **${getLocalized(srv, 'name', 'ur')}**\n• **تخمینی قیمت**: ${priceText}\n• **متوقع وقت**: ${timeText}\n${desc ? `• ${desc}\n` : ''}\nآپ یہ سروس ابھی بک کر سکتے ہیں:`,
          actions: [{ type: 'book', service_slugs: [srv.slug] }],
          engineUsed: 'local',
          matchedIntent: 'service_detail',
        };
      }
      if (lang === 'ur-roman') {
        return {
          reply: `Service Details: **${getLocalized(srv, 'name', 'ur-roman')}**\n• **Estimated Price**: ${priceText}\n• **Estimated Time**: ${timeText}\n${desc ? `• ${desc}\n` : ''}\nAap yeh service online book kar saktay hain:`,
          actions: [{ type: 'book', service_slugs: [srv.slug] }],
          engineUsed: 'local',
          matchedIntent: 'service_detail',
        };
      }
      return {
        reply: `Service Details: **${getLocalized(srv, 'name', 'en')}**\n• **Estimated Price**: ${priceText}\n• **Estimated Time**: ${timeText}\n${desc ? `• ${desc}\n` : ''}\nYou can schedule this service appointment online:`,
        actions: [{ type: 'book', service_slugs: [srv.slug] }],
        engineUsed: 'local',
        matchedIntent: 'service_detail',
      };
    }
  }

  // 10. LIST OF SERVICES QUERY
  if (hasAny(norm, ['services', 'all services', 'list', 'kaam kya hai', 'konsi service', 'سروسز'])) {
    const list = ctx.services
      .slice(0, 6)
      .map((s) => `• ${getLocalized(s, 'name', lang)}`)
      .join('\n');
    if (lang === 'ur') {
      return {
        reply: `پاک آٹو ورکس کی چند اہم سروسز:\n${list}\n\nمزید معلومات کے لیے سروسز پیج ملاحظہ کریں یا آن لائن بکنگ کریں:`,
        actions: [{ type: 'book', service_slugs: [] }],
        engineUsed: 'local',
        matchedIntent: 'service_list',
      };
    }
    if (lang === 'ur-roman') {
      return {
        reply: `Pak Auto Works ki popular services:\n${list}\n\nTamam services dekhne ke liye book appointment button par click karein:`,
        actions: [{ type: 'book', service_slugs: [] }],
        engineUsed: 'local',
        matchedIntent: 'service_list',
      };
    }
    return {
      reply: `Popular Workshop Services at Pak Auto Works:\n${list}\n\nYou can select any service and schedule an appointment online:`,
      actions: [{ type: 'book', service_slugs: [] }],
      engineUsed: 'local',
      matchedIntent: 'service_list',
    };
  }

  // 11. KNOWLEDGE BASE & FAQ KEYWORD MATCHING
  let bestScore = 0;
  let bestKnowledge: ChatbotKnowledgeRow | null = null;

  for (const kb of ctx.knowledge || []) {
    let score = 0;
    const titleNorm = normalizeText(getLocalized(kb, 'title', lang));
    const contentNorm = normalizeText(getLocalized(kb, 'content', lang));
    const kwList = [
      ...(kb.keywords?.en || []),
      ...(kb.keywords?.ur || []),
      ...(kb.keywords?.['ur-roman'] || []),
    ];

    for (const kw of kwList) {
      const nKw = normalizeText(kw);
      if (nKw && norm.includes(nKw)) {
        score += 3;
      }
    }
    if (titleNorm && norm.includes(titleNorm)) score += 5;
    const tokens = norm.split(' ').filter((w) => w.length >= 3);
    for (const tok of tokens) {
      if (titleNorm.includes(tok)) score += 1;
      if (contentNorm.includes(tok)) score += 0.5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestKnowledge = kb;
    }
  }

  if (bestKnowledge && bestScore >= 3) {
    const kbReply = getLocalized(bestKnowledge, 'content', lang);
    return {
      reply: kbReply,
      actions: [{ type: 'whatsapp' }],
      engineUsed: 'local',
      matchedIntent: 'knowledge_base',
      matchedContextIds: [bestKnowledge.id],
    };
  }

  // 12. FAQ MATCHING
  for (const f of ctx.faqs || []) {
    const qNorm = normalizeText(getLocalized(f, 'question', lang));
    if (qNorm && (norm.includes(qNorm) || qNorm.includes(norm))) {
      return {
        reply: getLocalized(f, 'answer', lang),
        actions: [{ type: 'whatsapp' }],
        engineUsed: 'local',
        matchedIntent: 'faq',
        matchedContextIds: [f.id],
      };
    }
  }

  // 13. PARTS SEARCH MATCH
  const partsWords = [
    'part', 'parts', 'spare parts', 'price of', 'kharidna', 'خریدنا', 'اسپیئر پارٹس',
    'filter', 'filters', 'plug', 'plugs', 'belt', 'belts', 'pad', 'pads', 'brake pad', 'brake pads',
    'bulb', 'bulbs', 'wiper', 'wipers', 'fuse', 'fuses', 'سامان', 'پارٹس', 'پیڈ', 'پیڈز'
  ];
  if (hasAny(norm, partsWords)) {
    let vehName = ctx.vehicle?.make
      ? `${ctx.vehicle.make} ${ctx.vehicle.model || ''} ${ctx.vehicle.year || ''}`.trim()
      : '';
    if (!vehName) {
      if (norm.includes('corolla')) vehName = 'Toyota Corolla';
      else if (norm.includes('civic')) vehName = 'Honda Civic';
      else if (norm.includes('city')) vehName = 'Honda City';
      else if (norm.includes('alto') || norm.includes('cultus')) vehName = 'Suzuki';
    }

    const matchedProducts = (ctx.products || []).filter((p) => {
      const pName = normalizeText(getLocalized(p, 'name', lang) || p.slug);
      return norm.includes(pName) || pName.split(' ').some((tok) => tok.length >= 4 && norm.includes(tok));
    }).slice(0, 3);

    if (matchedProducts.length > 0) {
      const pList = matchedProducts
        .map((p) => `• ${getLocalized(p, 'name', lang)}: ${formatPKR(p.price)}`)
        .join('\n');
      if (lang === 'ur') {
        return {
          reply: `${vehName ? `آپ کی گاڑی (${vehName}) کے لیے ` : ''}ہمارے اسٹور میں دستیاب متعلقہ پارٹس:\n${pList}\n\nتمام اشیاء تصدیق شدہ فٹمنٹ کے ساتھ دستیاب ہیں:`,
          actions: [{ type: 'products', product_slugs: matchedProducts.map((p) => p.slug) }],
          engineUsed: 'local',
          matchedIntent: 'parts_search',
        };
      }
      if (lang === 'ur-roman') {
        return {
          reply: `${vehName ? `Aap ki gaari (${vehName}) ke liye ` : ''}hamaray store mein available related parts:\n${pList}\n\nTamam parts verified fitment ke sath dispatch hotay hain:`,
          actions: [{ type: 'products', product_slugs: matchedProducts.map((p) => p.slug) }],
          engineUsed: 'local',
          matchedIntent: 'parts_search',
        };
      }
      return {
        reply: `${vehName ? `Compatible parts for your ${vehName} in our catalogue:\n` : 'Compatible spare parts available in our store:\n'}${pList}\n\nAll parts are verified for vehicle compatibility prior to dispatch:`,
        actions: [{ type: 'products', product_slugs: matchedProducts.map((p) => p.slug) }],
        engineUsed: 'local',
        matchedIntent: 'parts_search',
      };
    }
  }

  // 14. FALLBACK / UNKNOWN INTENT (POLITE HANDOFF WITH WHATSAPP & BOOKING)
  if (lang === 'ur') {
    return {
      reply: 'معذرت، میں آپ کی بات پوری طرح نہیں سمجھ سکا۔ آپ ہماری سروسز دیکھ سکتے ہیں، اپائنٹمنٹ بک کر سکتے ہیں، یا براہ راست واٹس ایپ پر ہمارے ورکشاپ ٹیکنیشن سے بات کر سکتے ہیں:',
      actions: [
        { type: 'book', service_slugs: [] },
        { type: 'whatsapp', message: rawMessage },
        { type: 'call' },
      ],
      engineUsed: 'local',
      matchedIntent: 'unknown_fallback',
    };
  }
  if (lang === 'ur-roman') {
    return {
      reply: 'Mazzrat, main aapka sawal theek se samajh nahi saka. Aap online service book kar saktay hain ya WhatsApp par hamare workshop staff se direct rabta kar saktay hain:',
      actions: [
        { type: 'book', service_slugs: [] },
        { type: 'whatsapp', message: rawMessage },
        { type: 'call' },
      ],
      engineUsed: 'local',
      matchedIntent: 'unknown_fallback',
    };
  }
  return {
    reply: 'I apologize, but I did not fully understand your query. You can browse our services, schedule a workshop booking, or chat directly with our master technicians on WhatsApp:',
    actions: [
      { type: 'book', service_slugs: [] },
      { type: 'whatsapp', message: rawMessage },
      { type: 'call' },
    ],
    engineUsed: 'local',
    matchedIntent: 'unknown_fallback',
  };
}
