import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const BASE_URL = 'https://strategic-ai-consulting.base44.app';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const posts = await sr.entities.Post.filter({}, { sort: 'publish_date', limit: 500, fields: ['slug', 'publish_date', 'updated_date'] });
    const projects = await sr.entities.Project.filter({}, { sort: 'publish_date', limit: 500, fields: ['slug', 'publish_date', 'updated_date'] });

    const postItems = posts.items || posts;
    const projectItems = projects.items || projects;

    const staticPages = ['', 'about', 'services', 'pricing', 'projects', 'blog', 'contact', 'seo-agency', 'consulting'];
    const now = new Date().toISOString();
    const urls = [];

    for (const path of staticPages) {
      const loc = path ? `${BASE_URL}/${path}` : BASE_URL;
      urls.push({ loc, lastmod: now, priority: path === '' ? '1.0' : '0.8', changefreq: 'weekly' });
    }
    for (const post of postItems) {
      if (post.slug) urls.push({ loc: `${BASE_URL}/blog/post/${post.slug}`, lastmod: post.updated_date || post.publish_date || now, priority: '0.6', changefreq: 'monthly' });
    }
    for (const project of projectItems) {
      if (project.slug) urls.push({ loc: `${BASE_URL}/projects/${project.slug}`, lastmod: project.updated_date || project.publish_date || now, priority: '0.7', changefreq: 'monthly' });
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n')}\n</urlset>`;

    let sitemapUrl = null;
    let uploadError = null;
    try {
      const file = new File([xml], 'sitemap.xml', { type: 'application/xml' });
      const uploadResult = await sr.integrations.Core.UploadPublicFile({ file });
      sitemapUrl = uploadResult.file_url;
    } catch (e) {
      uploadError = e.message;
      console.error('Sitemap upload failed:', e.message);
    }

    let gscResult = 'not attempted';
    if (sitemapUrl) {
      try {
        const conn = await sr.connectors.getConnection('google_search_console');
        const accessToken = conn.accessToken;
        const siteUrl = encodeURIComponent(`${BASE_URL}/`);
        const feedPath = encodeURIComponent(sitemapUrl);
        const submitRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/sitemaps/${feedPath}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: sitemapUrl, type: 'sitemap' }),
        });
        if (submitRes.ok) gscResult = 'submitted to Google Search Console';
        else if (submitRes.status === 403) {
          gscResult = 'GSC write scope needed — re-authorize with webmasters scope to auto-submit';
        } else {
          gscResult = `GSC returned ${submitRes.status}`;
        }
      } catch (e) { gscResult = `GSC submission skipped: ${e.message}`; }
      try { await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`); } catch {}
    }

    return Response.json({ ok: !!sitemapUrl, sitemap_url: sitemapUrl, url_count: urls.length, gsc: gscResult, upload_error: uploadError, xml_preview: xml.slice(0, 500) });
  } catch (error) {
    console.error('generateSitemap failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}