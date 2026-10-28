-- Add covering indexes for foreign keys flagged by Supabase performance advisor.
-- Additive and safe to apply repeatedly.
CREATE INDEX IF NOT EXISTS idx_booking_services_service_id ON public.booking_services (service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_make_id ON public.bookings (make_id);
CREATE INDEX IF NOT EXISTS idx_bookings_model_id ON public.bookings (model_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_make_id ON public.job_cards (make_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_model_id ON public.job_cards (model_id);
CREATE INDEX IF NOT EXISTS idx_job_items_service_id ON public.job_items (service_id);
CREATE INDEX IF NOT EXISTS idx_job_notes_created_by ON public.job_notes (created_by);
CREATE INDEX IF NOT EXISTS idx_job_payments_received_by ON public.job_payments (received_by);
CREATE INDEX IF NOT EXISTS idx_job_status_history_changed_by ON public.job_status_history (changed_by);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_by ON public.order_status_history (changed_by);
CREATE INDEX IF NOT EXISTS idx_payments_verified_by ON public.payments (verified_by);
CREATE INDEX IF NOT EXISTS idx_product_vehicles_model_id ON public.product_vehicles (model_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_by ON public.stock_movements (created_by);
