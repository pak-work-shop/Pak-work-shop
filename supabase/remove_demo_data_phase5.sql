-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 5 DEMO DATA REMOVAL SCRIPT
-- =============================================================================
-- Cleanly removes all Phase 5 demo products, fictional brands, fitment links,
-- images, stock movements, and categories tagged with is_demo = true.
-- Safe to re-run multiple times (idempotent).
-- =============================================================================

do $$
begin
  if to_regclass('public.stock_movements') is not null then
    delete from public.stock_movements
    where product_id in (select id from public.products where is_demo = true);
  end if;

  if to_regclass('public.product_vehicles') is not null then
    delete from public.product_vehicles
    where product_id in (select id from public.products where is_demo = true);
  end if;

  if to_regclass('public.product_services') is not null then
    delete from public.product_services
    where product_id in (select id from public.products where is_demo = true);
  end if;

  if to_regclass('public.product_images') is not null then
    delete from public.product_images
    where product_id in (select id from public.products where is_demo = true);
  end if;

  if to_regclass('public.products') is not null then
    delete from public.products where is_demo = true;
  end if;

  if to_regclass('public.brands') is not null then
    delete from public.brands where is_demo = true;
  end if;

  if to_regclass('public.product_categories') is not null then
    delete from public.product_categories where is_demo = true;
  end if;

  raise notice 'Phase 5 demo catalogue data removed successfully.';
end;
$$;
