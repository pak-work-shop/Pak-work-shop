# Supabase SQL Execution Order (`Pak Auto Works & Parts`)

Run these scripts **in exact order** inside the **Supabase SQL Editor**. Every script is idempotent and safe to re-run.

---

## 1. Core Schema & Seed Scripts (Required)

| Step | File | Purpose |
| :--- | :--- | :--- |
| **1** | `supabase/phase1_foundation.sql` | Profiles, user roles (`customer`, `staff`, `admin`), `site_settings`, `vehicle_makes`, `vehicle_models`, customer `vehicles` & `addresses`, RLS policies, and `site-assets` storage bucket. |
| **2** | `supabase/phase2_content.sql` | Workshop `service_categories`, 14 trilingual `services`, `faqs`, `legal_pages`, `contact_messages`, and public/admin RLS policies. |
| **3** | `supabase/phase3_booking.sql` | `bookings`, `booking_services`, `booking_status_history`, `blocked_slots`, `booking-photos` storage bucket, availability RPCs (`get_available_slots`, `get_month_availability`), `create_booking`, and `lookup_booking_status`. |
| **4** | `supabase/phase4_jobs.sql` | `job_cards`, `job_items`, `job_status_history`, `invoices`, `invoice_payments`, sequences/triggers (`JC-000001`, `INV-000001`), strict item-price privacy RLS, and RPCs (`admin_create_job_from_booking`, `admin_update_job_status`, `admin_issue_invoice`, `admin_void_invoice`, `admin_record_payment`, `lookup_job_status`, `get_my_job_detail`). |
| **5** | `supabase/phase5_catalogue.sql` | `product_categories` (with 11 top-level categories seeded), `brands`, `products`, `product_images`, `product_vehicles`, `product_services`, `stock_movements`, `product-images` storage bucket, RLS policies, and RPCs (`search_products`, `admin_adjust_stock`). |
| **6** | `supabase/phase6_orders.sql` | `pakistan_cities` (~120 cities, Sadiqabad first), `delivery_settings` (Free in Sadiqabad, Rs. 300 elsewhere), `coupons`, `orders` (`ORD-000001`), `order_items`, `order_status_history`, `user_carts`, `order_lookup_attempts`, RLS policies, and RPCs (`quote_order`, `place_order`, `lookup_order_status`, `cancel_my_order`, `admin_update_order_status`, `admin_set_shipping`, `admin_update_payment_status`). |
| **6b** | `supabase/apply_section_a_images.sql` | Sets all 17 Section A owner-supplied images (Home hero A1, About image A2, 14 Workshop service images A3–A16, and CTA banner A17) in `site_settings` and `services`. |
| **6c** | `supabase/apply_section_c_category_images.sql` | Sets all 16 Section C category photos (C1–C16) on `product_categories` and seeds new automotive store categories. |
| **7** | `supabase/phase7_payments.sql` | `payment_accounts` (Bank transfer, JazzCash, Easypaisa details), `payments`, `payment_logs`, `payment_settings` (single row id = 1), sync trigger with `delivery_settings`, `payment-proofs` private storage bucket, and RPCs (`get_payment_options`, `submit_payment_proof`, `admin_verify_payment`, `admin_reject_payment`, `admin_mark_refunded`, `mock_gateway_start`, `mock_gateway_complete`, `apply_gateway_result`). |
| **8** | `supabase/phase8_content.sql` | `vehicle_models.vehicle_class` classification, `blog_categories`, `blog_posts`, `estimator_rules` (seeded multipliers for hatchback, sedan, suv, pickup, van), `reviews`, `review_contacts` (phone hash verification), `public_reviews` view, `gallery_items` (with before/after support), and RPCs (`submit_review`, `get_review_summary`). |
| **8b** | `supabase/phase9_chatbot.sql` | `chatbot_settings`, `chatbot_knowledge` base, `chat_sessions`, `chat_messages` (masked PII), and RPCs (`chat_rate_check`, `chat_log`). |
| **8c** | `supabase/phase10a_print_logo.sql` | Adds optional `print_logo_url` column to `site_settings` for high-contrast white paper invoice/receipt printing. |

---

## 2. Optional Demo Data Scripts (When `site_settings.demo_mode = true`)

Run these only if you want sample workshop bookings, active job cards, invoices, parts catalogue items, coupons, orders, guides, reviews, gallery items, and chatbot knowledge for previewing the app:

| Step | File | Purpose |
| :--- | :--- | :--- |
| **9** | `supabase/phase3_demo_data.sql` | Enables `demo_mode = true`, sets sample PKR service prices, sample Sadiqabad address/working hours, demo bookings (`03000000001`–`03000000007`), and demo contact messages. |
| **10** | `supabase/phase4_demo_data.sql` | Seeds 5 realistic demo job cards across repair stages (`JC-000001` to `JC-000005`), work items, status history, and 3 demo invoices (`paid`, `partially_paid`, `issued`). |
| **11** | `supabase/phase5_demo_data.sql` | Seeds 10 demo automotive brands and 24 realistic demo products across all 11 categories with trilingual names/specs, PKR prices, stock states (in-stock, low-stock, out-of-stock), vehicle compatibility links, and workshop service links. |
| **12** | `supabase/phase6_demo_data.sql` | Seeds 3 demo coupons (`DEMO10`, `WELCOME500`, `EXPIRED20`) and 10 realistic demo orders (`ORD-000201` to `ORD-000210`) across all stages (`placed`, `confirmed`, `packed`, `shipped`, `delivered`, `cancelled`, `returned`) and payment methods (`cod`, `manual`, `online`). |
| **13** | `supabase/phase7_demo_data.sql` | Seeds 3 workshop payment accounts (Meezan Bank, JazzCash, Easypaisa), sets `payment_settings` (manual enabled, mock gateway enabled in demo mode), and links demo payments & audit logs across demo orders. |
| **14** | `supabase/phase8_demo_data.sql` | Seeds 4 blog categories, 8 published guides (useful, accurate advice, "check owner's manual", trilingual), 12 sample customer reviews (marked "Demo Customer", mixed 3–5 stars, 2 pending, 1 hidden, 2 replies), and 12 gallery items across all categories with 3 interactive before/after pairs. |
| **15** | `supabase/phase9_demo_data.sql` | Seeds 17 trilingual knowledge base articles (warning lights, oil change, tyre care, battery, AC care, monsoon, overheating, booking, tracking, payment, delivery, returns, compatibility, workshop hours) and 6 sample chat sessions. |

---

## 3. Removing Demo Data (Switching to Live Production)

When you are ready to remove demo records:

- **Remove Phase 9 Demo Chatbot Knowledge & Sessions Only**: Run `supabase/remove_demo_data_phase9.sql` in the Supabase SQL Editor.
- **Remove Phase 8 Demo Blog, Reviews & Gallery Only**: Run `supabase/remove_demo_data_phase8.sql` in the Supabase SQL Editor.
- **Remove Phase 7 Demo Payments & Accounts Only**: Run `supabase/remove_demo_data_phase7.sql` in the Supabase SQL Editor.
- **Remove Phase 6 Demo Orders & Coupons Only**: Run `supabase/remove_demo_data_phase6.sql` in the Supabase SQL Editor.
- **Remove All Demo Data (Phases 1–9)**: Run `supabase/remove_demo_data.sql` in the Supabase SQL Editor (or click **"Remove All Demo Data"** in `/admin/settings`).
  This deletes all rows where `is_demo = true` across `chatbot_knowledge`, `chat_sessions`, `blog_posts`, `reviews`, `gallery_items`, `payments`, `payment_accounts`, `orders`, `coupons`, `products`, `brands`, `product_categories`, `invoices`, `job_cards`, `bookings`, `blocked_slots`, and `contact_messages`, resets any demo settings, and sets `site_settings.demo_mode = false`.

