import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { requireAgencyAdmin } from '../../shared/agencyAdminAccess.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const adminCheck = await requireAgencyAdmin(base44);
    if (adminCheck.response) return adminCheck.response;

    const sr = base44.asServiceRole;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [leadByType, leadTrend, crmByStatus, postCount, projectCount, orderByStatus, testimonialCount] = await Promise.all([
      sr.entities.Lead.aggregate({ groupBy: 'form_type' }),
      sr.entities.Lead.aggregate({ query: { created_date: { $gte: thirtyDaysAgo } }, dateBucket: { field: 'created_date', unit: 'day' } }),
      sr.entities.CrmContact.aggregate({ groupBy: 'status' }),
      sr.entities.Post.count({}),
      sr.entities.Project.count({}),
      sr.entities.CommerceOrder.aggregate({ groupBy: 'status', sum: 'amount_cents' }),
      sr.entities.Testimonial.count({}),
    ]);

    const { items: domains } = await sr.entities.Domain.filter({ status: 'active' }, { limit: 10, fields: ['domain', 'canonical_url'] });
    const traffic = [];
    for (const d of domains) {
      try {
        const { items: dms } = await sr.entities.DomainMetric.filter({ domain_id: d.id }, { sort: '-snapshot_date', limit: 1, fields: ['gsc_clicks', 'gsc_impressions', 'gsc_ctr', 'gsc_position', 'ga4_users', 'ga4_sessions', 'ga4_pageviews', 'snapshot_date'] });
        if (dms.length > 0) traffic.push({ domain: d.domain, ...dms[0] });
      } catch {}
    }

    return Response.json({
      leads: { by_type: leadByType.rows || [], trend: leadTrend.rows || [] },
      crm: { by_status: crmByStatus.rows || [] },
      content: { posts: postCount, projects: projectCount, testimonials: testimonialCount },
      commerce: { by_status: orderByStatus.rows || [] },
      traffic,
    });
  } catch (error) {
    console.error('dashboardMetrics failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}