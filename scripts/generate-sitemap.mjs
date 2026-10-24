import fs from 'node:fs';
import path from 'node:path';

/**
 * Pak Auto Works & Parts - Sitemap Generator
 * Runs as a prebuild step without external dependencies.
 * Respects VITE_SITE_URL, gracefully degrades if Supabase credentials are not present.
 */

const SITE_URL = (process.env.VITE_SITE_URL || 'https://pakautoworks.com').replace(/\/+$/, '');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const STATIC_ROUTES = [
  { path: '', changefreq: 'daily', priority: '1.0' },
  { path: '/services', changefreq: 'weekly', priority: '0.9' },
  { path: '/catalogue', changefreq: 'daily', priority: '0.9' },
  { path: '/book', changefreq: 'weekly', priority: '0.8' },
  { path: '/tools/cost-estimator', changefreq: 'monthly', priority: '0.8' },
  { path: '/tools/next-service-calculator', changefreq: 'monthly', priority: '0.8' },
  { path: '/blog', changefreq: 'weekly', priority: '0.8' },
  { path: '/gallery', changefreq: 'monthly', priority: '0.7' },
  { path: '/reviews', changefreq: 'weekly', priority: '0.7' },
  { path: '/faq', changefreq: 'monthly', priority: '0.7' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/delivery-policy', changefreq: 'monthly', priority: '0.5' },
  { path: '/returns', changefreq: 'monthly', priority: '0.4' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
];

async function fetchDynamicSlugs(table, query) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  try {
    const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/${table}?${query}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (_err) {
    return [];
  }
}

async function main() {
  console.log('===> Generating public/sitemap.xml for', SITE_URL);
  const now = new Date().toISOString().split('T')[0];

  const urls = [...STATIC_ROUTES.map((r) => ({
    loc: `${SITE_URL}${r.path}`,
    lastmod: now,
    changefreq: r.changefreq,
    priority: r.priority,
  }))];

  // Try fetching dynamic records
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const [services, categories, products, blogPosts] = await Promise.all([
        fetchDynamicSlugs('services', 'is_active=eq.true&select=slug,updated_at'),
        fetchDynamicSlugs('product_categories', 'is_active=eq.true&select=slug,updated_at'),
        fetchDynamicSlugs('products', 'is_active=eq.true&select=slug,updated_at&limit=500'),
        fetchDynamicSlugs('blog_posts', 'status=eq.published&select=slug,updated_at'),
      ]);

      services.forEach((s) => {
        if (s.slug) {
          urls.push({
            loc: `${SITE_URL}/services/${encodeURIComponent(s.slug)}`,
            lastmod: (s.updated_at || now).split('T')[0],
            changefreq: 'weekly',
            priority: '0.8',
          });
        }
      });

      categories.forEach((c) => {
        if (c.slug) {
          urls.push({
            loc: `${SITE_URL}/catalogue/category/${encodeURIComponent(c.slug)}`,
            lastmod: (c.updated_at || now).split('T')[0],
            changefreq: 'weekly',
            priority: '0.8',
          });
        }
      });

      products.forEach((p) => {
        if (p.slug) {
          urls.push({
            loc: `${SITE_URL}/catalogue/product/${encodeURIComponent(p.slug)}`,
            lastmod: (p.updated_at || now).split('T')[0],
            changefreq: 'weekly',
            priority: '0.7',
          });
        }
      });

      blogPosts.forEach((b) => {
        if (b.slug) {
          urls.push({
            loc: `${SITE_URL}/blog/${encodeURIComponent(b.slug)}`,
            lastmod: (b.updated_at || now).split('T')[0],
            changefreq: 'monthly',
            priority: '0.7',
          });
        }
      });

      console.log(`[INFO] Added ${services.length} services, ${categories.length} categories, ${products.length} products, ${blogPosts.length} guides.`);
    } catch (err) {
      console.warn('[WARN] Could not fetch dynamic slugs from Supabase, falling back to static routes:', err.message);
    }
  } else {
    console.log('[INFO] Supabase credentials not provided in environment; generating static-routes sitemap.');
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  const outPath = path.resolve('public/sitemap.xml');
  fs.writeFileSync(outPath, xml, 'utf8');
  console.log(`[PASS] Wrote sitemap with ${urls.length} URLs to public/sitemap.xml`);
}

main().catch((err) => {
  console.error('[ERROR] Failed to generate sitemap:', err);
  // Do not fail build if network is unavailable
  process.exit(0);
});
