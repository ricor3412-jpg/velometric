import * as cheerio from 'cheerio';
import { URL } from 'url';

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function safeFetch(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    return response;
  } catch (e) {
    clearTimeout(timeout);
    return null;
  }
}

// Patterns that indicate low-priority pages (blog posts, products, archives, dates)
const LOW_PRIORITY_PATTERNS = [
  /\/\d{4}\/\d{2}\//,          // Date-based URLs: /2024/01/
  /\/(tag|tags|category|categories|author|archive)\//i,
  /\/(product|products|shop|cart|checkout|my-account)\//i,
  /\/(page|attachment|feed)\//i,
  /\/(wp-admin|wp-login|wp-json|wp-content|wp-includes)\//i,
  /\?(p|page_id|preview)=/i,   // WordPress query params
  /\/(comment|trackback|replyto)/i,
  /\/confirmacion|\/thank-you|\/gracias/i,
];

const NON_HTML_EXT = /\.(jpg|jpeg|png|gif|webp|svg|pdf|docx|xlsx|zip|rar|mp4|mp3|css|js|xml|json|ico|woff2?|ttf|eot)$/i;

function isImportantPage(urlStr) {
  try {
    const urlObj = new URL(urlStr);
    const path = urlObj.pathname;
    
    // Skip non-HTML
    if (NON_HTML_EXT.test(path)) return false;
    
    // Skip low-priority patterns
    for (const pattern of LOW_PRIORITY_PATTERNS) {
      if (pattern.test(urlStr)) return false;
    }
    
    return true;
  } catch (e) { return false; }
}

// Score page importance: fewer segments = more important, long slugs = probably blog posts
function getPagePriority(urlStr) {
  try {
    const path = new URL(urlStr).pathname;
    const segments = path.split('/').filter(s => s.length > 0);
    let priority = segments.length;
    
    // Penalize long slug names (likely blog posts/articles, not structural pages)
    // e.g. "/education-changes-lives-celebrating-10-years" is a post
    // vs "/about" or "/contact-us" which are structural
    const lastSegment = segments[segments.length - 1] || '';
    const dashCount = (lastSegment.match(/-/g) || []).length;
    if (dashCount > 4) priority += 3; // Heavy penalty for long article slugs
    else if (dashCount > 2) priority += 1; // Light penalty

    return priority;
  } catch (e) { return 99; }
}

// Discover pages from sitemap.xml
async function discoverFromSitemap(baseUrl, maxPages) {
  const sitemapUrls = [
    `${baseUrl}sitemap.xml`,
    `${baseUrl}sitemap_index.xml`,
    `${baseUrl}wp-sitemap.xml`,
  ];

  const allPageUrls = [];

  for (const sitemapUrl of sitemapUrls) {
    try {
      console.log(`[Crawler] Trying sitemap: ${sitemapUrl}`);
      const response = await safeFetch(sitemapUrl, 10000);
      if (!response || !response.ok) continue;

      const text = await response.text();
      if (!text.includes('<urlset') && !text.includes('<sitemapindex')) continue;

      const $ = cheerio.load(text, { xmlMode: true });

      // Sitemap index: fetch child sitemaps (prioritize pages sitemap over posts)
      const childSitemaps = [];
      $('sitemapindex sitemap loc').each((i, el) => {
        const loc = $(el).text().trim();
        childSitemaps.push(loc);
      });

      if (childSitemaps.length > 0) {
        console.log(`[Crawler] Found sitemap index with ${childSitemaps.length} child sitemaps`);
        // Prioritize: pages sitemap first, then posts, skip products/tags/categories
        const prioritized = childSitemaps.sort((a, b) => {
          const aIsPages = /page/i.test(a) && !/product/i.test(a);
          const bIsPages = /page/i.test(b) && !/product/i.test(b);
          if (aIsPages && !bIsPages) return -1;
          if (!aIsPages && bIsPages) return 1;
          return 0;
        });

        for (const childUrl of prioritized.slice(0, 4)) {
          try {
            const childResp = await safeFetch(childUrl, 10000);
            if (!childResp || !childResp.ok) continue;
            const childText = await childResp.text();
            const $c = cheerio.load(childText, { xmlMode: true });
            $c('urlset url loc').each((i, el) => {
              const loc = $c(el).text().trim();
              if (loc && isImportantPage(loc)) allPageUrls.push(loc);
            });
          } catch (e) { /* skip */ }
        }
      }

      // Direct urlset
      $('urlset url loc').each((i, el) => {
        const loc = $(el).text().trim();
        if (loc && isImportantPage(loc)) allPageUrls.push(loc);
      });

      if (allPageUrls.length > 0) {
        console.log(`[Crawler] Sitemap discovered ${allPageUrls.length} important URLs (filtered)`);
        break;
      }
    } catch (e) {
      console.log(`[Crawler] Sitemap error: ${e.message}`);
    }
  }

  // Sort by priority: shallow pages first (homepage, /about, /contact before /blog/2024/post-title)
  allPageUrls.sort((a, b) => getPagePriority(a) - getPagePriority(b));

  // Deduplicate
  const unique = [...new Set(allPageUrls)];
  
  console.log(`[Crawler] Top ${Math.min(unique.length, maxPages)} pages selected by priority`);
  return unique.slice(0, maxPages);
}

// Discover pages from navigation menu links (for SPAs and sites without sitemaps)
async function discoverFromNavigation(startUrl, maxPages) {
  const normalizeUrl = (u) => {
    try {
      const urlObj = new URL(u);
      urlObj.hash = '';
      urlObj.search = '';
      let href = urlObj.href;
      if (urlObj.pathname !== '/' && href.endsWith('/')) href = href.slice(0, -1);
      return href;
    } catch (e) { return u; }
  };

  let crawlStart = startUrl;
  if (!crawlStart.endsWith('/')) crawlStart += '/';

  const baseDomain = new URL(crawlStart).hostname.replace(/^www\./, '');

  console.log(`[Crawler] Fetching homepage to extract navigation links...`);
  const response = await safeFetch(crawlStart);
  if (!response || !response.ok) {
    console.log(`[Crawler] Could not fetch homepage`);
    return [crawlStart];
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Check if this is a single-page app (most links are hash anchors)
  let hashLinks = 0;
  let totalLinks = 0;
  $('a[href]').each((i, el) => {
    const href = $(el).attr('href') || '';
    if (href.startsWith('#') || href.includes('/#')) hashLinks++;
    totalLinks++;
  });

  if (totalLinks > 0 && (hashLinks / totalLinks) > 0.5) {
    console.log(`[Crawler] Single-page app detected (${hashLinks}/${totalLinks} hash links). Only auditing homepage.`);
    return [crawlStart];
  }

  // Extract links - prioritize nav/header/footer links (main navigation)
  const navLinks = new Set();
  const otherLinks = new Set();

  // Priority 1: Links inside nav, header, footer elements
  $('nav a[href], header a[href], footer a[href], [role="navigation"] a[href], .menu a[href], .nav a[href]').each((i, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
    const clean = href.split('#')[0];
    if (!clean) return;
    try {
      const abs = normalizeUrl(new URL(clean, crawlStart).href);
      const domain = new URL(abs).hostname.replace(/^www\./, '');
      if (domain === baseDomain && isImportantPage(abs)) navLinks.add(abs);
    } catch (e) {}
  });

  // Priority 2: All other links on the page
  $('a[href]').each((i, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
    const clean = href.split('#')[0];
    if (!clean) return;
    try {
      const abs = normalizeUrl(new URL(clean, crawlStart).href);
      const domain = new URL(abs).hostname.replace(/^www\./, '');
      if (domain === baseDomain && isImportantPage(abs) && !navLinks.has(abs)) otherLinks.add(abs);
    } catch (e) {}
  });

  // Combine: homepage first, then nav links sorted by depth, then other links sorted by depth
  const homeNorm = normalizeUrl(crawlStart);
  const result = [crawlStart];
  
  const sortedNav = [...navLinks].filter(u => normalizeUrl(u) !== homeNorm).sort((a, b) => getPagePriority(a) - getPagePriority(b));
  const sortedOther = [...otherLinks].sort((a, b) => getPagePriority(a) - getPagePriority(b));

  for (const u of [...sortedNav, ...sortedOther]) {
    if (result.length >= maxPages) break;
    result.push(u);
  }

  console.log(`[Crawler] Navigation discovery: ${navLinks.size} menu links, ${otherLinks.size} other links`);
  return result;
}

export async function crawlWebsite(startUrl, maxPages = 10) {
  let crawlStart = startUrl;
  if (!crawlStart.endsWith('/')) crawlStart += '/';

  console.log(`[Crawler] Starting smart discovery for ${crawlStart}`);

  // Strategy 1: Sitemap (fast, comprehensive)
  const sitemapUrls = await discoverFromSitemap(crawlStart, maxPages);
  if (sitemapUrls.length >= 3) {
    console.log(`[Crawler] ✓ Using sitemap: ${sitemapUrls.length} important pages`);
    return sitemapUrls;
  }

  // Strategy 2: Navigation-based discovery (for SPAs, small sites, no sitemap)
  console.log(`[Crawler] Sitemap insufficient (${sitemapUrls.length}). Using navigation discovery...`);
  const navUrls = await discoverFromNavigation(crawlStart, maxPages);

  // Merge both, deduplicated, limited
  const merged = [...new Set([...sitemapUrls, ...navUrls])];
  // Sort by priority again
  merged.sort((a, b) => getPagePriority(a) - getPagePriority(b));
  const result = merged.slice(0, maxPages);

  console.log(`[Crawler] ✓ Final: ${result.length} pages to audit`);
  return result;
}
