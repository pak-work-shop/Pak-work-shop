-- =============================================================================
-- PAK AUTO WORKS & PARTS — REMOVE PHASE 8 DEMO DATA SQL
-- =============================================================================
-- Deletes demo blog posts, demo reviews, and demo gallery items (is_demo = true)
-- before launching into live production.
-- =============================================================================

do $$
begin
  if to_regclass('public.blog_posts') is not null then
    delete from public.blog_posts where is_demo = true;
  end if;

  if to_regclass('public.reviews') is not null then
    -- review_contacts has on delete cascade
    delete from public.reviews where is_demo = true;
  end if;

  if to_regclass('public.gallery_items') is not null then
    delete from public.gallery_items where is_demo = true;
  end if;
end $$;
