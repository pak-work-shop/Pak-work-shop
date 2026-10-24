-- =============================================================================
-- PAK AUTO WORKS & PARTS — APPLY PRODUCT & CATEGORY IMAGES
-- =============================================================================
-- How to use:
--   1. To add real photos later, paste the direct image URLs into the LINK:
--      slots below or into the values list in this script.
--   2. Paste this file into the Supabase SQL Editor and execute.
--   3. Safe to re-run multiple times (idempotent). Empty strings ('') are ignored
--      and will NEVER overwrite existing non-empty images.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- (a) Category Images (16 Categories)
-- -----------------------------------------------------------------------------
with cat_updates (cat_slug, img_url) as (
  values
    ('tyres-wheels', ''),
    ('batteries', ''),
    ('oils-lubricants', ''),
    ('filters', ''),
    ('brakes', ''),
    ('electrical-lighting', ''),
    ('wipers', ''),
    ('suspension-steering', ''),
    ('ac-cooling', ''),
    ('engine-parts', ''),
    ('belts-cooling', ''),
    ('exhaust-intake', ''),
    ('body-exterior-accessories', ''),
    ('seat-covers-mats', ''),
    ('tools-equipment', ''),
    ('interior-car-care', '')
)
update public.product_categories c
set image_url = u.img_url,
    updated_at = now()
from cat_updates u
where c.slug = u.cat_slug
  and u.img_url is not null
  and trim(u.img_url) != '';

-- -----------------------------------------------------------------------------
-- (b) Product Primary Images (48 Products by SKU)
-- -----------------------------------------------------------------------------
with prod_updates (prod_sku, img_url) as (
  values
    ('DEMO-TYR-01', ''),
    ('DEMO-TYR-02', ''),
    ('DEMO-TYR-03', ''),
    ('DEMO-BAT-01', ''),
    ('DEMO-BAT-02', ''),
    ('DEMO-BAT-03', ''),
    ('DEMO-OIL-01', ''),
    ('DEMO-OIL-02', ''),
    ('DEMO-OIL-03', ''),
    ('DEMO-FLT-01', ''),
    ('DEMO-FLT-02', ''),
    ('DEMO-FLT-03', ''),
    ('DEMO-BRK-01', ''),
    ('DEMO-BRK-02', ''),
    ('DEMO-BRK-03', ''),
    ('DEMO-LGT-01', ''),
    ('DEMO-LGT-02', ''),
    ('DEMO-LGT-03', ''),
    ('DEMO-WPR-01', ''),
    ('DEMO-WPR-02', ''),
    ('DEMO-WPR-03', ''),
    ('DEMO-SUS-01', ''),
    ('DEMO-SUS-02', ''),
    ('DEMO-SUS-03', ''),
    ('DEMO-ACP-01', ''),
    ('DEMO-ACP-02', ''),
    ('DEMO-ACP-03', ''),
    ('DEMO-ELC-01', ''),
    ('DEMO-ELC-02', ''),
    ('DEMO-ELC-03', ''),
    ('DEMO-BLT-01', ''),
    ('DEMO-BLT-02', ''),
    ('DEMO-BLT-03', ''),
    ('DEMO-EXH-01', ''),
    ('DEMO-EXH-02', ''),
    ('DEMO-EXH-03', ''),
    ('DEMO-BDY-01', ''),
    ('DEMO-BDY-02', ''),
    ('DEMO-BDY-03', ''),
    ('DEMO-SCM-01', ''),
    ('DEMO-SCM-02', ''),
    ('DEMO-SCM-03', ''),
    ('DEMO-TOL-01', ''),
    ('DEMO-TOL-02', ''),
    ('DEMO-TOL-03', ''),
    ('DEMO-CCA-01', ''),
    ('DEMO-CCA-02', ''),
    ('DEMO-CCA-03', '')
)
update public.products p
set updated_at = now()
from prod_updates u
where p.sku = u.prod_sku
  and u.img_url is not null
  and trim(u.img_url) != '';

-- Upsert primary gallery image rows for non-empty URLs
with prod_updates (prod_sku, img_url) as (
  values
    ('DEMO-TYR-01', ''),
    ('DEMO-TYR-02', ''),
    ('DEMO-TYR-03', ''),
    ('DEMO-BAT-01', ''),
    ('DEMO-BAT-02', ''),
    ('DEMO-BAT-03', ''),
    ('DEMO-OIL-01', ''),
    ('DEMO-OIL-02', ''),
    ('DEMO-OIL-03', ''),
    ('DEMO-FLT-01', ''),
    ('DEMO-FLT-02', ''),
    ('DEMO-FLT-03', ''),
    ('DEMO-BRK-01', ''),
    ('DEMO-BRK-02', ''),
    ('DEMO-BRK-03', ''),
    ('DEMO-LGT-01', ''),
    ('DEMO-LGT-02', ''),
    ('DEMO-LGT-03', ''),
    ('DEMO-WPR-01', ''),
    ('DEMO-WPR-02', ''),
    ('DEMO-WPR-03', ''),
    ('DEMO-SUS-01', ''),
    ('DEMO-SUS-02', ''),
    ('DEMO-SUS-03', ''),
    ('DEMO-ACP-01', ''),
    ('DEMO-ACP-02', ''),
    ('DEMO-ACP-03', ''),
    ('DEMO-ELC-01', ''),
    ('DEMO-ELC-02', ''),
    ('DEMO-ELC-03', ''),
    ('DEMO-BLT-01', ''),
    ('DEMO-BLT-02', ''),
    ('DEMO-BLT-03', ''),
    ('DEMO-EXH-01', ''),
    ('DEMO-EXH-02', ''),
    ('DEMO-EXH-03', ''),
    ('DEMO-BDY-01', ''),
    ('DEMO-BDY-02', ''),
    ('DEMO-BDY-03', ''),
    ('DEMO-SCM-01', ''),
    ('DEMO-SCM-02', ''),
    ('DEMO-SCM-03', ''),
    ('DEMO-TOL-01', ''),
    ('DEMO-TOL-02', ''),
    ('DEMO-TOL-03', ''),
    ('DEMO-CCA-01', ''),
    ('DEMO-CCA-02', ''),
    ('DEMO-CCA-03', '')
)
insert into public.product_images (product_id, url, alt, sort_order, is_primary)
select
  p.id,
  u.img_url,
  p.sku,
  0,
  true
from prod_updates u
join public.products p on p.sku = u.prod_sku
where u.img_url is not null
  and trim(u.img_url) != ''
on conflict do nothing;
