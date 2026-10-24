# PROJECT CONTEXT — Pak Auto Works & Parts

## 1. Business Overview
- **Business Name**: Pak Auto Works & Parts
- **Location**: Workshop situated in Sadiqabad, Punjab, Pakistan (serving Rahim Yar Khan district and shipping nationwide).
- **Primary Offerings**: Full automotive repair workshop (mechanical, electrical, denting/painting, AC, periodic maintenance, computer diagnostics) + genuine OEM, Japanese imported, and aftermarket spare parts and lubricants e-commerce store.
- **Delivery Model**: FREE delivery in Sadiqabad municipality; flat Rs. 300 nationwide delivery outside free zones; configurable free-delivery thresholds; Cash on Delivery (COD) across Pakistan.

## 2. Technical Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React icons.
- **Backend / Database**: Supabase (PostgreSQL, Row-Level Security, Auth, RPC functions, Storage).
- **Internationalization (i18n)**: English (`en`), Urdu (`ur` with RTL layout), Roman Urdu (`ur-roman`).
- **Date & Currency**: Pakistan Standard Time (PKT / UTC+5, `Asia/Karachi`), Pakistani Rupee (`PKR` / `Rs.`).

## 3. Architecture & Directory Boundaries
- All feature modules live under `/src/features/*`:
  - `account`: Customer profile, vehicle garage, saved addresses, and order history (`My Orders`).
  - `admin`: Operations dashboard, bookings, job cards, invoices, orders fulfillment, delivery settings, coupons, catalog products, categories, brands, services, FAQs, messages, site settings.
  - `auth`: Authentication context, protected route wrappers, login, register, password reset.
  - `booking`: 4-step appointment booking wizard with PKT time slot scheduling.
  - `cart`: Global cart context, drawer mini-cart, full cart page, real-time quote validation.
  - `catalogue`: Spare parts catalogue, category trees, vehicle fitment bar, product details.
  - `checkout`: Cash on Delivery single-page checkout with delivery calculation and policies consent.
  - `jobs`: Workshop job cards, stage tracker, invoices, cost estimation.
  - `legal`: Dynamic Markdown policy pages (Privacy, Terms, Returns, Delivery Policy).
  - `orders`: Order lookup, printable receipt / packing slip, order success screens.
  - `services`: Workshop repair services catalogue and details.
  - `settings`: Workshop branding, contact info, working hours, images, demo mode settings.
  - `track`: Unified tracking hub for workshop jobs, bookings, and store orders.
- No legacy `/src/pages` tree exists; routing is consolidated in `/src/app/router.tsx`.

## 4. Phase Completion Status
- **Phase 1**: Foundations, Design System, Branding, i18n (Urdu RTL, Roman Urdu), Supabase Client, Auth & Profiles. [COMPLETE]
- **Phase 2**: Informational Site, Workshop Services, FAQ, Contact Form, Legal Markdown Pages. [COMPLETE]
- **Phase 3**: Online Service Booking Wizard, Capacity Management, Admin Bookings. [COMPLETE]
- **Phase 4**: Workshop Job Cards, Status History, Invoicing, Public Job Tracker (`/track`). [COMPLETE]
- **Phase 5**: Spare Parts & Accessories Catalogue, Vehicle Compatibility, Inventory Tracking, Brands/Categories. [COMPLETE]
- **Phase 6**: Shopping Cart, Cash on Delivery Checkout, Delivery Rules, Order Placement, Tracking, Admin Orders & Delivery Management. [COMPLETE]
- **Phase 8**: Content & Trust (Car Knowledge Center / Blog with translatable Markdown & related services/parts, Cost Estimator with vehicle class multipliers, Next-Service Calculator, Verified Customer Reviews with phone verification & rate limiting, Workshop Gallery with Before/After slider & Lightbox, Admin Blog / Reviews / Gallery / Estimator Rules, Home Trust Sections & Navigation Updates). [COMPLETE]
- **Phase 9**: AI Assistant / Chatbot (Dual-engine: Supabase Edge Function `chat` with Google Gemini + browser-based deterministic `localEngine`, PII-scrubbed `chat_log` and `chat_rate_check` RPCs, trilingual knowledge base, floating launcher & widget, `/admin/chatbot` portal). [COMPLETE — code implemented, local engine unit-tested, Edge function written and ready for deployment]
- **Phase 10a (Add-on)**: Print-Optimized Branding (Added `print_logo_url` to `site_settings`, `supabase/phase10a_print_logo.sql`, Admin Settings ImageField, and `PrintLogo` component rendering `print_logo_url` or charcoal-backed badge across all 3 print pages: job invoice, order receipt/packing slip, payment receipt). [COMPLETE]

## 5. Resume point
Phase 9 is fully implemented and compiled. All tests for `localEngine` pass. Chatbot widget is live on all public routes (hidden on `/admin`, print pages, and `/checkout`). Admin Chatbot portal (`/admin/chatbot`) allows managing settings, knowledge entries, and viewing conversation transcripts. Print pages render dark-text transparent logos on white paper via `print_logo_url`.

