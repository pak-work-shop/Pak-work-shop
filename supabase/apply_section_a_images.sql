-- =============================================================================
-- PAK AUTO WORKS & PARTS — APPLY SECTION A IMAGES (A1–A17)
-- =============================================================================
-- Safe to run multiple times (idempotent) in the Supabase SQL Editor.
-- Sets Home Hero (A1), About Image (A2), CTA Banner (A17) in public.site_settings,
-- and all 14 Workshop Service images (A3–A16) in public.services.
-- =============================================================================

-- 1. SITE SETTINGS (A1, A2, A17)
update public.site_settings
set
  hero_image_url = 'https://cdn.phototourl.com/member/2026-10-10-8e816f50-4e8e-4e00-94e3-5873fbb8ff7f.jpg',
  about_image_url = 'https://cdn.phototourl.com/member/2026-10-10-b8d3813a-db0c-4906-a73f-127f73bd4c54.jpg',
  cta_banner_url = 'https://plain-eeur-prod-public.komododecks.com/202610/10/NuygQByhmXqHCeE5pYYz/image.png'
where id = 1;

-- 2. WORKSHOP SERVICES (A3–A16)
-- A3 — Engine Repair & Tuning
update public.services
set image_url = 'https://cdn.phototourl.com/member/2026-10-10-7011f4d3-a3f8-440f-8f49-ff3a3ee31ec7.jpg'
where slug = 'engine';

-- A4 — Denting & Painting
update public.services
set image_url = 'https://cdn.phototourl.com/member/2026-10-10-9a62423f-31c4-4615-8850-269d1f20566d.jpg'
where slug = 'denting-painting';

-- A5 — AC Repair & Service
update public.services
set image_url = 'https://cdn.phototourl.com/member/2026-10-10-fdc8b7bd-9856-4687-a17d-bbb0420cc7b6.jpg'
where slug = 'ac-repair';

-- A6 — Auto Electrical
update public.services
set image_url = 'https://cdn.phototourl.com/member/2026-10-10-a294f282-375b-41f9-93bb-9ef0f6ad4a76.jpg'
where slug = 'electrical';

-- A7 — Tyres
update public.services
set image_url = 'https://cdn.phototourl.com/member/2026-10-10-bcb1d8b4-42a2-46b4-8d62-2c20900d88d5.jpg'
where slug = 'tyres';

-- A8 — Car Wash & Detailing
update public.services
set image_url = 'https://cdn.phototourl.com/member/2026-10-10-64c1c5fc-3470-4c19-8e3c-d36382be33d3.jpg'
where slug = 'car-wash-detailing';

-- A9 — Brakes
update public.services
set image_url = 'https://cdn.phototourl.com/member/2026-10-10-0ad0e96d-931c-44cf-a41f-49c1fe8aa9b2.jpg'
where slug = 'brakes';

-- A10 — Suspension & Steering
update public.services
set image_url = 'https://plain-eeur-prod-public.komododecks.com/202610/10/2tdS7EMNiVYKWW8c2s5e/image.png'
where slug = 'suspension-steering';

-- A11 — Oil Change & Periodic Service
update public.services
set image_url = 'https://plain-eeur-prod-public.komododecks.com/202610/10/s71pHYGAuUiyxdfXpIet/image.jpg'
where slug = 'oil-change-service';

-- A12 — Battery
update public.services
set image_url = 'https://plain-eeur-prod-public.komododecks.com/202610/10/pxnCdhqNBXOmzKu9ssO6/image.jpg'
where slug = 'battery';

-- A13 — Wheel Alignment & Balancing
update public.services
set image_url = 'https://plain-eeur-prod-public.komododecks.com/202610/10/nwz6vbqK7nSjjDuNVCQD/image.png'
where slug = 'wheel-alignment-balancing';

-- A14 — Transmission / Gearbox
update public.services
set image_url = 'https://plain-eeur-prod-public.komododecks.com/202610/10/kyT8ZxsNWafoe63unrAA/image.png'
where slug = 'transmission-gearbox';

-- A15 — Exhaust
update public.services
set image_url = 'https://plain-eeur-prod-public.komododecks.com/202610/10/7C3GbZs175K7YIKAfCdf/image.png'
where slug = 'exhaust';

-- A16 — General Inspection
update public.services
set image_url = 'https://plain-eeur-prod-public.komododecks.com/202610/10/PDlNr4YQspgdc2JsDsh7/image.jpg'
where slug = 'general-inspection';
