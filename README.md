# Pak Auto Works & Parts — Phase 1, Phase 2, Phase 3 & Phase 4

A bilingual/trilingual (English, Urdu RTL, Roman Urdu) one-stop auto workshop and car-parts portal built with **React + Vite + TypeScript**, **Tailwind CSS**, and **Supabase** (PostgreSQL + Auth + Row Level Security + Storage).

---

## Scope Completed

### Phase 1 (Foundation)
- **Design System**: Dark Industrial Steel + Safety Orange (`#0E1013`, `#1B1F26`, `#F5F6F8`, `#FF6A00`, `#FFC21A`) with `Rajdhani`, `Inter`, and `Noto Nastaliq Urdu` typography.
- **Trilingual i18n**: Full support for English (`en`), Urdu (`ur`, automatic `dir="rtl"`), and Roman Urdu (`ur-roman`), persisted in `localStorage`.
- **Responsive Layout**: Announcement bar, sticky top bar, header with desktop & mobile navigation, footer, and floating WhatsApp CTA.
- **Authentication & RBAC**: Customer registration, login, forgot/reset password, protected `/account` page, and `AdminRoute` protection for `/admin/*` verified against `public.profiles.role = 'admin'`.

### Phase 2 (Public Information Site & Content Admin)
- **Public Pages**:
  - `/` — Home page with Hero (`site_settings.hero_image_url` or `ImageSlot`), 4 quick-action cards, up to 10 featured services from `public.services`, 4 Why Choose Us cards, 3-step How It Works strip, 5 FAQ teasers from `public.faqs`, CTA banner, and contact strip + `LocalBusiness` JSON-LD.
  - `/services` — Searchable grid of active workshop services with price estimate disclaimer.
  - `/services/:slug` — Detailed service view with "What's Included" checklist, price/duration card, "Book This Service" (`/book?service=<slug>`), pre-filled WhatsApp inquiry button, service-specific FAQs, and 3 related services.
  - `/about` — Editable trilingual title & body from `site_settings`, workshop image slot, and 3 capability pillars.
  - `/contact` — Clickable phone/WhatsApp/email cards, localized address, working hours table, validated Google Maps embed, and rate-limited contact form (`public.submit_contact_message` RPC with honeypot + 60s client cooldown).
  - `/faq` — Category tabs (`all`, `general`, `workshop`, `parts`, `orders`, `payments`) + live search over `public.faqs` + `FAQPage` JSON-LD.
  - `/privacy`, `/terms`, `/returns`, `/delivery-policy` — Trilingual legal pages from `public.legal_pages` with a clear draft disclaimer notice.
- **Admin Content Tools**:
  - `/admin/services` — Full CRUD, reorder, active/featured toggles, and image upload (`site-assets/services/`).
  - `/admin/faqs` — Full CRUD, category filter, reorder, active toggle.
  - `/admin/messages` — Inbox with status filters (`new`, `read`, `replied`, `archived`), unread badge in sidebar, Call/WhatsApp quick reply, and delete confirmation.
  - `/admin/pages` — Trilingual editor for the 4 legal pages.
  - `/admin/settings` — Business identity, logo, working hours, social links, announcement bar, and Phase 2/3 settings.

### Phase 3 (Online Booking System + Demo Data & Illustrations)
- **Public Online Booking (`/book` & `/book/status`)**:
  - **4-Step Booking Wizard**:
    1. **Select Services (1 to 5)**: Pre-selects service when navigated via `/book?service=<slug>`, displays estimated prices and durations.
    2. **Vehicle Details**: Quick-fill from saved customer vehicles (when signed in), dropdown of 12 Pakistan vehicle makes & 50+ models (`public.vehicle_makes`, `public.vehicle_models`) plus custom "Other" make/model input, model year, plate number, fuel type, mileage, problem description, and optional private issue photo upload (`booking-uploads` private bucket).
    3. **Date & Time Slot (PKT, UTC+5)**: Interactive monthly calendar powered by `public.get_month_availability` showing open, full, closed, blocked, and past days; 12-hour slot picker powered by `public.get_available_slots` with remaining capacity indicators; optional vehicle pickup & drop-off request with saved address quick-fill.
    4. **Customer Contact & Review**: Auto-fills name/phone/email for signed-in users, summary card, and atomic submission via `public.create_booking` (`SECURITY DEFINER` RPC with server-side slot capacity validation, working hours check, blocked slot check, and rate-limiting).
  - **Confirmation View**: Displays `BK-XXXXXX` reference number, 1-click Copy button, pre-filled WhatsApp confirmation button, Print / Save PDF button, and quick link to Status Lookup.
  - **Public Booking Status Lookup (`/book/status`)**: Verifies both `BK-XXXXXX` and customer mobile number via `public.lookup_booking_status` RPC without exposing other customers' bookings; includes clickable sample demo bookings when `demo_mode` is active.
- **Customer Account Upgrades (`/account`)**:
  - **My Bookings**: Lists bookings linked to the logged-in customer (`user_id`), status badges, status history timeline, and customer self-cancellation via `public.cancel_my_booking` RPC (enforces `cancellation_cutoff_hours` in PKT).
  - **My Vehicles**: Full CRUD for `public.vehicles` (make/model dropdown or custom text, year, plate number, fuel type, default toggle).
  - **My Addresses**: Full CRUD for `public.addresses` (label, recipient name, phone, line1, line2, city, area, landmark, postal code, default toggle).
  - **Profile Settings**: Edit full name and phone number.
- **Admin Bookings & Capacity Management (`/admin/bookings`)**:
  - **Appointments & Walk-ins**: Filter by status, date range (`all`, `today`, `upcoming`, `past`), and search query; inspect customer/vehicle details, generate 1-click signed URLs (10-minute expiry) for private `booking-uploads` photos, update status via `public.admin_update_booking_status` RPC, reschedule date/slot via `public.admin_reschedule_booking` RPC, and record manual Phone / Walk-in bookings.
  - **Blocked Dates & Hours**: Add full-day closures or partial-day time blocks (`public.blocked_slots`) with optional reason.
  - **Booking Settings & Capacity**: Configure `slot_minutes`, `max_bookings_per_slot`, `min_advance_hours`, `max_advance_days`, `allow_pickup_drop`, and `online_booking_enabled`.

### Phase 4 (Job Cards, Live Repair Tracking & Workshop Invoicing)
- **Public Track Page (`/track`)**:
  - **Track Repair Job Tab**: Rate-limited lookup (`public.lookup_job_status` RPC — max 20 attempts/15 min per IP hash + 3s client cooldown) by `JC-XXXXXX` + registered mobile number. Displays a 7-step visual repair stage stepper (`received → inspection → awaiting_approval → in_progress → quality_check → ready → delivered`) plus `on_hold` / `cancelled` banners, vehicle & check-in summary, latest advisor public note, work items (showing prices only when `show_cost_to_customer = true`), customer-visible progress notes timeline, status history timeline, invoice status badge, and pre-filled WhatsApp / Call buttons. Includes clickable demo sample chips (`JC-000201` to `JC-000207`) when `site_settings.demo_mode = true`.
  - **Track Service Booking Tab**: Reuses the Booking Status Lookup component on `/track?tab=booking`.
- **Customer Account — My Jobs & Invoices (`/account?tab=jobs`)**:
  - Lists all `job_cards` where `user_id = auth.uid()`, expandable to view the 7-stage progress bar, work items (with prices when `show_cost_to_customer = true`), customer-visible notes, stage history, and issued/paid invoices (`status in ('issued','partially_paid','paid')`) with a 1-click **Print / Save Invoice PDF** button opening `/invoice/:id/print`.
- **Admin Job Cards & Workshop Management (`/admin/jobs` & `/admin/jobs/:id`)**:
  - **Convert Booking to Job Card**: 1-click conversion from `/admin/bookings` (`public.admin_create_job_from_booking` RPC) that copies customer, vehicle, and booked services into `job_cards` + `job_items` and moves the booking to `in_progress` (preventing duplicate conversion).
  - **Walk-in Job Card Modal**: Create a job card directly (`public.admin_create_job` RPC) with phone-based customer profile lookup (`public.admin_find_customer`), vehicle make/model selector, initial workshop services, complaint, ETA, notes, and `show_cost_to_customer` toggle.
  - **List View & Kanban Board View**: Filter by status, date, and search query; move jobs across allowed transitions with a confirmation modal (`public.admin_update_job_status` RPC).
  - **Job Card Detail (`/admin/jobs/:id`)**:
    1. **Overview Tab**: Edit customer/vehicle details, complaint, ETA, `public_note`, `internal_notes`, `show_cost_to_customer` (with unsaved-changes guard), quick stage transition buttons, and WhatsApp status update prefill.
    2. **Work & Costs Tab**: Full CRUD and reorder for `job_items` (`service`, `part`, `labor`, `other`), quick-fill from `public.services`, auto-calculated `line_total` and subtotal.
    3. **Notes & Timeline Tab**: Add customer-visible or internal-only notes (`public.job_notes`, max 1000 chars, plain text) and view full `job_status_history`.
    4. **Invoice & Payments Tab**: Save draft invoice (`public.admin_save_draft_invoice`), issue official invoice with immutable `items_snapshot` (`public.admin_issue_invoice`), record partial or full payments (`public.admin_record_payment` with overpayment prevention), void an invoice with reason (`public.admin_void_invoice`), and open printable A4 view (`/invoice/:id/print`).
- **Admin Invoices List (`/admin/invoices`) & Printable A4 Invoice (`/invoice/:id/print`)**:
  - Summary KPI cards (Total Invoiced, Total Collected, Unpaid Balance), search & status filters, payment recording modal, and clean A4 print layout with `@media print` styling and Demo watermark when `is_demo = true`.

---

## 1. Supabase Setup & SQL Run Order

See **[`supabase/RUN_ORDER.md`](supabase/RUN_ORDER.md)** for the complete SQL execution table. Run the scripts in the **Supabase SQL Editor** in this exact order:

1. **`supabase/phase1_foundation.sql`** — Profiles, `site_settings`, `vehicle_makes`/`vehicle_models`, `vehicles`, `addresses`, `site-assets` bucket, and RBAC helpers.
2. **`supabase/phase2_content.sql`** — Services (14 seeded), FAQs, Legal Pages, and Contact Messages + RPC.
3. **`supabase/phase3_booking.sql`** — Booking settings, blocked slots, bookings, booking services, status history, private `booking-uploads` bucket, and booking RPCs.
4. **`supabase/phase4_jobs.sql`** — Job cards (`JC-000001`), job items, job status history, job notes, invoices (`INV-000001`), job payments, rate-limiting table, RLS policies, and all 9 Phase 4 RPCs.
5. **`supabase/phase3_demo_data.sql`** *(Optional — Demo Mode)* — Enables `demo_mode = true`, populates sample service prices/durations/illustrations, sample bookings, and sample contact messages (`is_demo = true`).
6. **`supabase/phase4_demo_data.sql`** *(Optional — Demo Mode)* — Seeds 9 sample job cards (`JC-000201` to `JC-000209`) across all 9 statuses, sample work items, progress notes, and 5 sample invoices (`INV-000201` to `INV-000205`) across all 5 statuses with sample payments (`is_demo = true`).

---

## 2. How to Remove Demo Data Before Going Live

1. Run **`supabase/remove_demo_data_phase4.sql`** in the Supabase SQL Editor to delete all demo invoices (`is_demo = true`, cascading to `job_payments`) and demo job cards (`is_demo = true`, cascading to `job_items`, `job_status_history`, and `job_notes`).
2. Run **`supabase/remove_demo_data.sql`** to delete all Phase 3 demo bookings, demo blocked slots, and demo contact messages (`is_demo = true`), reset demo service prices/illustrations and demo `site_settings` fields where unchanged, and set `demo_mode = false`.

---

## 3. Configure Authentication & Redirect URLs

1. In Supabase Dashboard, go to **Authentication → Providers → Email**:
   - Ensure **Enable Email provider** is turned **ON**.
2. Go to **Authentication → URL Configuration**:
   - Set **Site URL** to your primary application URL.
   - Under **Redirect URLs**, add **all** environments where your app runs:
     - Local development: `http://localhost:3000/reset-password` and `http://localhost:3000/**`
     - **Google AI Studio Preview URL**: `https://<your-ai-studio-preview-domain>/reset-password` and `https://<your-ai-studio-preview-domain>/**`
     - **Vercel Production URL**: `https://<your-vercel-domain>/reset-password` and `https://<your-vercel-domain>/**`

---

## 4. Promote Your Account to Admin

1. Sign up on the website at `/register` using your email address.
2. Open the **Supabase SQL Editor** and run:
   ```sql
   update public.profiles
   set role = 'admin'
   where id = (
     select id from auth.users where email = 'YOUR_ADMIN_EMAIL@example.com'
   );
   ```
3. Refresh the web app. You will see the **Admin Panel** button in the header and can access `/admin`, `/admin/bookings`, `/admin/jobs`, `/admin/invoices`, `/admin/services`, `/admin/faqs`, `/admin/messages`, `/admin/pages`, and `/admin/settings`.

---

## 5. Local Development & Build Verification

```bash
npm install
npm run dev      # Starts Vite dev server on port 3000
npm run lint     # Runs TypeScript type-checking (tsc --noEmit)
npm run build    # Produces production bundle in dist/
```
