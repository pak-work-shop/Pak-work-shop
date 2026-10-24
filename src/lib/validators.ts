import { z } from 'zod';
import type { TFunction } from 'i18next';

// Matches 03XXXXXXXXX or +923XXXXXXXXX (with optional hyphens/spaces stripped before check)
export const PAK_MOBILE_REGEX = /^(\+92|0)3[0-9]{9}$/;
export const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const DEMO_ASSET_REGEX = /^\/demo\/[a-z0-9-]+\.svg$/i;

export function normalizePakPhoneInput(value: string): string {
  return value.replace(/[\s-]/g, '');
}

export function createPakPhoneSchema(t: TFunction) {
  return z
    .string()
    .trim()
    .transform(normalizePakPhoneInput)
    .refine((val) => PAK_MOBILE_REGEX.test(val), {
      message: t('validation.phoneInvalid'),
    });
}

export function createLoginSchema(t: TFunction) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, { message: t('validation.required') })
      .email({ message: t('validation.emailInvalid') }),
    password: z
      .string()
      .min(1, { message: t('validation.required') }),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

export function createRegisterSchema(t: TFunction) {
  return z
    .object({
      fullName: z
        .string()
        .trim()
        .min(2, { message: t('validation.nameMin') })
        .max(100, { message: t('validation.nameMax') }),
      phone: createPakPhoneSchema(t),
      email: z
        .string()
        .trim()
        .min(1, { message: t('validation.required') })
        .email({ message: t('validation.emailInvalid') }),
      password: z
        .string()
        .min(8, { message: t('validation.passwordMin') }),
      confirmPassword: z
        .string()
        .min(1, { message: t('validation.required') }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordsMustMatch'),
      path: ['confirmPassword'],
    });
}

export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;

export function createForgotPasswordSchema(t: TFunction) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, { message: t('validation.required') })
      .email({ message: t('validation.emailInvalid') }),
  });
}

export type ForgotPasswordFormValues = z.infer<ReturnType<typeof createForgotPasswordSchema>>;

export function createResetPasswordSchema(t: TFunction) {
  return z
    .object({
      password: z
        .string()
        .min(8, { message: t('validation.passwordMin') }),
      confirmPassword: z
        .string()
        .min(1, { message: t('validation.required') }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordsMustMatch'),
      path: ['confirmPassword'],
    });
}

export type ResetPasswordFormValues = z.infer<ReturnType<typeof createResetPasswordSchema>>;

export function createAccountProfileSchema(t: TFunction) {
  return z.object({
    fullName: z
      .string()
      .trim()
      .min(2, { message: t('validation.nameMin') })
      .max(100, { message: t('validation.nameMax') }),
    phone: createPakPhoneSchema(t),
  });
}

export type AccountProfileFormValues = z.infer<ReturnType<typeof createAccountProfileSchema>>;

const optionalUrlSchema = (t: TFunction) =>
  z
    .string()
    .trim()
    .refine(
      (val) => {
        if (!val) return true;
        if (DEMO_ASSET_REGEX.test(val)) return true;
        try {
          const parsed = new URL(val);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: t('validation.urlInvalid') }
    );

export const optionalHttpsUrlSchema = (t: TFunction) =>
  z
    .string()
    .trim()
    .refine(
      (val) => {
        if (!val) return true;
        if (DEMO_ASSET_REGEX.test(val)) return true;
        try {
          const parsed = new URL(val);
          return parsed.protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: t('validation.httpsUrlInvalid') }
    );

const localizedTextSchema = z.object({
  en: z.string().trim(),
  ur: z.string().trim(),
  'ur-roman': z.string().trim(),
});

const requiredEnLocalizedTextSchema = (t: TFunction) =>
  z.object({
    en: z.string().trim().min(2, { message: t('validation.englishRequired') }),
    ur: z.string().trim(),
    'ur-roman': z.string().trim(),
  });

const dayHoursSchema = z.object({
  isOpen: z.boolean(),
  openTime: z.string(),
  closeTime: z.string(),
});

export function createSiteSettingsSchema(t: TFunction) {
  return z.object({
    business_name: z
      .string()
      .trim()
      .min(2, { message: t('validation.required') })
      .max(120),
    tagline: localizedTextSchema,
    phone: createPakPhoneSchema(t),
    whatsapp: createPakPhoneSchema(t),
    email: z
      .string()
      .trim()
      .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: t('validation.emailInvalid'),
      }),
    address: localizedTextSchema,
    maps_embed_url: optionalUrlSchema(t),
    working_hours: z.object({
      monday: dayHoursSchema,
      tuesday: dayHoursSchema,
      wednesday: dayHoursSchema,
      thursday: dayHoursSchema,
      friday: dayHoursSchema,
      saturday: dayHoursSchema,
      sunday: dayHoursSchema,
    }),
    logo_url: optionalHttpsUrlSchema(t),
    print_logo_url: optionalHttpsUrlSchema(t),
    favicon_url: optionalUrlSchema(t),
    facebook_url: optionalUrlSchema(t),
    instagram_url: optionalUrlSchema(t),
    youtube_url: optionalUrlSchema(t),
    tiktok_url: optionalUrlSchema(t),
    announcement: localizedTextSchema,
    announcement_enabled: z.boolean(),
    hero_image_url: optionalHttpsUrlSchema(t),
    about_image_url: optionalHttpsUrlSchema(t),
    cta_banner_url: optionalHttpsUrlSchema(t),
    og_image_url: optionalHttpsUrlSchema(t),
    about_title: localizedTextSchema,
    about_body: localizedTextSchema,
    demo_mode: z.boolean(),
  });
}

export type SiteSettingsFormValues = z.infer<ReturnType<typeof createSiteSettingsSchema>>;

export function createContactFormSchema(t: TFunction) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, { message: t('validation.nameMin') })
      .max(80, { message: t('validation.nameMax80') }),
    phone: createPakPhoneSchema(t),
    email: z
      .string()
      .trim()
      .max(120)
      .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: t('validation.emailInvalid'),
      }),
    subject: z.string().trim().max(120, { message: t('validation.subjectMax') }),
    message: z
      .string()
      .trim()
      .min(10, { message: t('validation.messageMin') })
      .max(2000, { message: t('validation.messageMax') }),
    honeypot: z.string(),
  });
}

export type ContactFormValues = z.infer<ReturnType<typeof createContactFormSchema>>;

export function createServiceFormSchema(t: TFunction) {
  return z
    .object({
      slug: z
        .string()
        .trim()
        .min(2, { message: t('validation.required') })
        .max(80)
        .refine((val) => SLUG_REGEX.test(val), {
          message: t('validation.slugInvalid'),
        }),
      name: requiredEnLocalizedTextSchema(t),
      short_description: localizedTextSchema,
      description: localizedTextSchema,
      includesText: localizedTextSchema,
      estimated_time: localizedTextSchema,
      price_from_str: z.string().trim(),
      price_to_str: z.string().trim(),
      price_note: localizedTextSchema,
      image_url: optionalHttpsUrlSchema(t),
      icon: z.string().trim().min(1),
      sort_order: z.number().int(),
      is_active: z.boolean(),
      is_featured: z.boolean(),
    })
    .superRefine((data, ctx) => {
      const fromVal = data.price_from_str !== '' ? Number(data.price_from_str) : null;
      const toVal = data.price_to_str !== '' ? Number(data.price_to_str) : null;

      if (fromVal !== null && (Number.isNaN(fromVal) || fromVal < 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.priceNonNegative'),
          path: ['price_from_str'],
        });
      }
      if (toVal !== null && (Number.isNaN(toVal) || toVal < 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.priceNonNegative'),
          path: ['price_to_str'],
        });
      }
      if (
        fromVal !== null &&
        toVal !== null &&
        !Number.isNaN(fromVal) &&
        !Number.isNaN(toVal) &&
        toVal < fromVal
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.priceRangeInvalid'),
          path: ['price_to_str'],
        });
      }
    });
}

export type ServiceFormValues = z.infer<ReturnType<typeof createServiceFormSchema>>;

export function createFaqFormSchema(t: TFunction) {
  return z.object({
    question: requiredEnLocalizedTextSchema(t),
    answer: requiredEnLocalizedTextSchema(t),
    category: z.enum(['general', 'services', 'booking', 'parts', 'delivery', 'payments']),
    service_id: z.string().trim(),
    sort_order: z.number().int(),
    is_active: z.boolean(),
  });
}

export type FaqFormValues = z.infer<ReturnType<typeof createFaqFormSchema>>;

export function createLegalPageFormSchema(t: TFunction) {
  return z.object({
    title: requiredEnLocalizedTextSchema(t),
    content: requiredEnLocalizedTextSchema(t),
    is_published: z.boolean(),
  });
}

export type LegalPageFormValues = z.infer<ReturnType<typeof createLegalPageFormSchema>>;

// =============================================================================
// PHASE 3 SCHEMAS: Booking, Status Lookup, Customer Vehicles & Addresses
// =============================================================================
export function createBookingLookupSchema(t: TFunction) {
  return z.object({
    booking_no: z
      .string()
      .trim()
      .min(4, { message: t('validation.required') })
      .max(20)
      .transform((val) => val.toUpperCase()),
    phone: createPakPhoneSchema(t),
  });
}

export type BookingLookupFormValues = z.infer<ReturnType<typeof createBookingLookupSchema>>;

export function createVehicleFormSchema(t: TFunction) {
  const maxYear = new Date().getFullYear() + 1;
  return z.object({
    make_id: z.string().trim().min(1, { message: t('validation.required') }),
    model_id: z.string().trim().min(1, { message: t('validation.required') }),
    year: z
      .number({ message: t('validation.yearInvalid') })
      .int()
      .min(1970, { message: t('validation.yearInvalid') })
      .max(maxYear, { message: t('validation.yearInvalid') }),
    plate_number: z
      .string()
      .trim()
      .max(25, { message: t('validation.plateMax') })
      .transform((val) => val.toUpperCase()),
    fuel_type: z.enum(['petrol', 'diesel', 'hybrid', 'cng', 'electric']),
    nickname: z.string().trim().max(60),
  });
}

export type VehicleFormValues = z.infer<ReturnType<typeof createVehicleFormSchema>>;

export function createAddressFormSchema(t: TFunction) {
  return z.object({
    label: z
      .string()
      .trim()
      .min(2, { message: t('validation.required') })
      .max(50),
    full_name: z
      .string()
      .trim()
      .min(2, { message: t('validation.nameMin') })
      .max(100, { message: t('validation.nameMax') }),
    phone: createPakPhoneSchema(t),
    city: z
      .string()
      .trim()
      .min(2, { message: t('validation.required') })
      .max(80),
    address_line: z
      .string()
      .trim()
      .min(5, { message: t('validation.addressMin') })
      .max(300, { message: t('validation.addressMax') }),
    is_default: z.boolean(),
  });
}

export type AddressFormValues = z.infer<ReturnType<typeof createAddressFormSchema>>;

export function createBookingSettingsSchema(t: TFunction) {
  return z.object({
    online_booking_enabled: z.boolean(),
    slot_minutes: z.union([
      z.literal(30),
      z.literal(45),
      z.literal(60),
      z.literal(90),
      z.literal(120),
    ]),
    max_bookings_per_slot: z
      .number()
      .int()
      .min(1, { message: t('validation.required') })
      .max(25),
    min_advance_hours: z
      .number()
      .int()
      .min(0, { message: t('validation.required') })
      .max(168),
    max_advance_days: z
      .number()
      .int()
      .min(1, { message: t('validation.required') })
      .max(90),
    allow_pickup_drop: z.boolean(),
  });
}

export type BookingSettingsFormValues = z.infer<
  ReturnType<typeof createBookingSettingsSchema>
>;

// =============================================================================
// PHASE 4 SCHEMAS: Job Tracking Lookup, Job Cards, Work Items, Notes & Payments
// =============================================================================
export function createJobLookupSchema(t: TFunction) {
  return z.object({
    job_no: z
      .string()
      .trim()
      .min(4, { message: t('validation.required') })
      .max(20)
      .transform((val) => val.toUpperCase()),
    phone: createPakPhoneSchema(t),
    honeypot: z.string().optional(),
  });
}

export type JobLookupFormValues = z.infer<ReturnType<typeof createJobLookupSchema>>;

export function createJobItemFormSchema(t: TFunction) {
  return z.object({
    item_type: z.enum(['service', 'part', 'labor', 'other']),
    description: z
      .string()
      .trim()
      .min(2, { message: t('validation.required') })
      .max(300),
    service_id: z.string().trim().optional(),
    quantity: z
      .number({ message: t('validation.quantityPositive') })
      .positive({ message: t('validation.quantityPositive') })
      .max(99999),
    unit_price: z
      .number({ message: t('validation.priceNonNegative') })
      .min(0, { message: t('validation.priceNonNegative') })
      .max(99999999),
  });
}

export type JobItemFormValues = z.infer<ReturnType<typeof createJobItemFormSchema>>;

export function createJobNoteFormSchema(t: TFunction) {
  return z.object({
    note: z
      .string()
      .trim()
      .min(2, { message: t('validation.required') })
      .max(1000, { message: t('validation.noteMax1000') }),
    is_customer_visible: z.boolean(),
  });
}

export type JobNoteFormValues = z.infer<ReturnType<typeof createJobNoteFormSchema>>;

export function createRecordPaymentSchema(t: TFunction, maxBalance?: number) {
  return z
    .object({
      amount: z
        .number({ message: t('validation.amountPositive') })
        .positive({ message: t('validation.amountPositive') }),
      method: z.enum([
        'cash',
        'bank_transfer',
        'jazzcash',
        'easypaisa',
        'card',
        'other',
      ]),
      reference: z.string().trim().max(100).optional(),
      note: z.string().trim().max(500).optional(),
    })
    .superRefine((data, ctx) => {
      if (
        typeof maxBalance === 'number' &&
        Math.round(data.amount * 100) > Math.round(maxBalance * 100)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.paymentExceedsBalance'),
          path: ['amount'],
        });
      }
    });
}

export type RecordPaymentFormValues = z.infer<
  ReturnType<typeof createRecordPaymentSchema>
>;

// =============================================================================
// PHASE 6 SCHEMAS: Checkout, Order Lookup, Delivery Settings & Coupons
// =============================================================================
export function createCheckoutFormSchema(t: TFunction) {
  return z.object({
    customer_name: z
      .string()
      .trim()
      .min(2, { message: t('validation.nameMin') })
      .max(100, { message: t('validation.nameMax') }),
    customer_phone: createPakPhoneSchema(t),
    customer_email: z
      .string()
      .trim()
      .max(120)
      .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: t('validation.emailInvalid'),
      }),
    city: z
      .string()
      .trim()
      .min(2, { message: t('validation.required') })
      .max(80),
    address_line: z
      .string()
      .trim()
      .min(5, { message: t('validation.addressMin') })
      .max(300, { message: t('validation.addressMax') }),
    address_notes: z.string().trim().max(300),
    customer_notes: z.string().trim().max(1000),
    payment_method: z.enum(['cod', 'online']),
    save_address: z.boolean(),
    address_label: z.string().trim().max(50),
    honeypot: z.string(),
  });
}

export type CheckoutFormValues = z.infer<
  ReturnType<typeof createCheckoutFormSchema>
>;

export function createOrderLookupSchema(t: TFunction) {
  return z.object({
    order_no: z
      .string()
      .trim()
      .min(4, { message: t('validation.required') })
      .max(20)
      .transform((val) => val.toUpperCase()),
    phone: createPakPhoneSchema(t),
  });
}

export type OrderLookupFormValues = z.infer<
  ReturnType<typeof createOrderLookupSchema>
>;

export function createCouponFormSchema(t: TFunction) {
  return z
    .object({
      code: z
        .string()
        .trim()
        .min(2, { message: t('validation.required') })
        .max(40)
        .transform((val) => val.toUpperCase()),
      discount_type: z.enum(['percent', 'fixed']),
      value: z
        .number({ message: t('validation.amountPositive') })
        .positive({ message: t('validation.amountPositive') }),
      min_order: z
        .number({ message: t('validation.priceNonNegative') })
        .min(0, { message: t('validation.priceNonNegative') }),
      max_discount_str: z.string().trim(),
      starts_at: z.string().trim(),
      expires_at: z.string().trim(),
      usage_limit_str: z.string().trim(),
      is_active: z.boolean(),
    })
    .superRefine((data, ctx) => {
      if (data.discount_type === 'percent' && data.value > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('admin.coupons.errors.percentMax100'),
          path: ['value'],
        });
      }
      if (data.max_discount_str !== '') {
        const num = Number(data.max_discount_str);
        if (Number.isNaN(num) || num <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('validation.amountPositive'),
            path: ['max_discount_str'],
          });
        }
      }
      if (data.usage_limit_str !== '') {
        const lim = Number(data.usage_limit_str);
        if (!Number.isInteger(lim) || lim < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('validation.quantityPositive'),
            path: ['usage_limit_str'],
          });
        }
      }
    });
}

export type CouponFormValues = z.infer<
  ReturnType<typeof createCouponFormSchema>
>;

export function createDeliverySettingsSchema(t: TFunction) {
  return z.object({
    flat_rate: z
      .number({ message: t('validation.priceNonNegative') })
      .min(0, { message: t('validation.priceNonNegative') })
      .max(50000),
    free_over_amount_str: z.string().trim(),
    min_order_amount: z
      .number({ message: t('validation.priceNonNegative') })
      .min(0, { message: t('validation.priceNonNegative') })
      .max(1000000),
    cod_enabled: z.boolean(),
    cod_max_amount_str: z.string().trim(),
    online_payment_enabled: z.boolean(),
  });
}

export type DeliverySettingsFormValues = z.infer<
  ReturnType<typeof createDeliverySettingsSchema>
>;


