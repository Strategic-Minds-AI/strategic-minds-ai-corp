import { createClientFromRequest } from '../../shared/ownedClient.ts';

// Deterministic business diagnostic engine — no LLM, no credits.
// Performs real HTTP checks: SSL, robots.txt, sitemap, page speed, SEO tags,
// security headers, broken links, mobile responsiveness, conversion elements.

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const { action } = body;

    if (action === 'runAudit') return await runAudit(base44, body, user);
    if (action === 'generateRepairPlan') return await generateRepairPlan(base44, body);
    if (action === 'dashboardStats') return await dashboardStats(base44);
    if (action === 'listAudits') return await listAudits(base44, body);
    if (action === 'getAudit') return await getAudit(base44, body);
    if (action === 'approveFinding') return await approveFinding(base44, body);
    if (action === 'generateOutreach') return await generateOutreach(base44, body);
    if (action === 'runMonitoring') return await runMonitoring(base44, body);
    if (action === 'getSystemMap') return await getSystemMap(base44, body);
    if (action === 'getRevenueLeaks') return await getRevenueLeaks(base44, body);
    if (action === 'getEvidence') return await getEvidence(base44, body);
    if (action === 'getSnapshots') return await getSnapshots(base44, body);
    if (action === 'getReceipts') return await getReceipts(base44, body);
    if (action === 'getTechStack') return await getTechStack(base44, body);

    return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ─── Deterministic hash for IDs ──────────────────────────────────────
async function hashId(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

// ─── Main audit runner ───────────────────────────────────────────────
async function runAudit(base44: any, body: any, user: any) {
  const { company_url, company_name, audit_type = 'full' } = body;
  if (!company_url) return Response.json({ error: 'company_url required' }, { status: 400 });

  const cleanUrl = company_url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const normalizedUrl = company_url.startsWith('http') ? company_url : `https://${cleanUrl}`;
  const auditId = await hashId(`audit:${cleanUrl}:${Date.now()}`);
  const startedAt = new Date().toISOString();
  const startTime = Date.now();

  // Create audit record
  await base44.entities.BusinessAudit.create({
    audit_id: auditId,
    company_name: company_name || cleanUrl,
    company_url: normalizedUrl,
    audit_type,
    status: 'collecting',
    started_at: startedAt,
    scope: JSON.stringify({ url: normalizedUrl, type: audit_type })
  });

  // Run deterministic checks
  const evidence: any[] = [];
  const findings: any[] = [];

  // 1. SSL / HTTPS check
  const sslResult = await checkSSL(normalizedUrl);
  evidence.push(sslResult.evidence);
  if (!sslResult.ok) {
    findings.push({
      title: 'No SSL Certificate / HTTPS Not Enforced',
      description: sslResult.detail,
      category: 'security',
      severity: 'critical',
      confidence: 100,
      business_impact: 'Visitors see security warnings. 85% of users abandon non-HTTPS sites. Google downgrades non-HTTPS sites in search rankings.',
      recommended_repair: 'Install an SSL certificate (Let\'s Encrypt is free) and redirect all HTTP traffic to HTTPS.',
      annual_impact_min: 15000,
      annual_impact_max: 80000
    });
  }

  // 2. Page fetch + HTML analysis
  const pageResult = await fetchPage(normalizedUrl);
  evidence.push(pageResult.evidence);
  if (!pageResult.ok) {
    findings.push({
      title: 'Website Unreachable or Extremely Slow',
      description: pageResult.detail,
      category: 'infrastructure',
      severity: 'critical',
      confidence: 100,
      business_impact: 'Site is down or takes too long to load. Every minute of downtime costs lost revenue and damages SEO.',
      recommended_repair: 'Check server status, DNS configuration, and consider a CDN. Target < 3 second load time.',
      annual_impact_min: 25000,
      annual_impact_max: 150000
    });
  } else {
    const html = pageResult.html;

    // 3. SEO meta tags check
    const seoFindings = checkSEOTags(html, normalizedUrl);
    findings.push(...seoFindings.findings);
    evidence.push(...seoFindings.evidence);

    // 4. Security headers check
    const securityFindings = checkSecurityHeaders(pageResult.headers, normalizedUrl);
    findings.push(...securityFindings.findings);
    evidence.push(...securityFindings.evidence);

    // 5. Performance indicators
    const perfFindings = checkPerformance(pageResult, html);
    findings.push(...perfFindings.findings);
    evidence.push(...perfFindings.evidence);

    // 6. Conversion / UX elements
    const conversionFindings = checkConversionElements(html, normalizedUrl);
    findings.push(...conversionFindings.findings);
    evidence.push(...conversionFindings.evidence);

    // 7. Content quality
    const contentFindings = checkContentQuality(html);
    findings.push(...contentFindings.findings);
    evidence.push(...contentFindings.evidence);

    // 8. Mobile responsiveness
    const mobileFindings = checkMobileReadiness(html);
    findings.push(...mobileFindings.findings);
    evidence.push(...mobileFindings.evidence);
  }

  // 9. Robots.txt + Sitemap
  const robotsResult = await checkRobots(normalizedUrl);
  evidence.push(robotsResult.evidence);
  if (!robotsResult.ok) {
    findings.push({
      title: 'Missing or Misconfigured robots.txt',
      description: robotsResult.detail,
      category: 'seo',
      severity: 'medium',
      confidence: 95,
      business_impact: 'Search engines may not properly crawl and index your site.',
      recommended_repair: 'Create a robots.txt file that allows crawling of public pages and references your sitemap.',
      annual_impact_min: 5000,
      annual_impact_max: 20000
    });
  }

  const sitemapResult = await checkSitemap(normalizedUrl);
  evidence.push(sitemapResult.evidence);
  if (!sitemapResult.ok) {
    findings.push({
      title: 'Missing XML Sitemap',
      description: sitemapResult.detail,
      category: 'seo',
      severity: 'medium',
      confidence: 95,
      business_impact: 'Search engines have no structured map of your pages, slowing indexing and discovery.',
      recommended_repair: 'Generate an XML sitemap (e.g. at /sitemap.xml) and submit it to Google Search Console.',
      annual_impact_min: 3000,
      annual_impact_max: 15000
    });
  }

  // 10. Deep security scan — sensitive paths, WordPress version, broken links
  let techStack: string[] = [];
  if (pageResult.ok) {
    techStack = detectTechStack(pageResult.html);
    evidence.push({ source_type: 'tech_stack', source_uri: normalizedUrl, captured_at: new Date().toISOString(), content_summary: `Detected: ${techStack.join(', ')}`, content_hash: '' });

    const sensitiveFindings = await checkSensitivePaths(normalizedUrl);
    findings.push(...sensitiveFindings.findings);
    evidence.push(...sensitiveFindings.evidence);

    const wpFindings = checkWordPressVersion(pageResult.html);
    findings.push(...wpFindings.findings);
    evidence.push(...wpFindings.evidence);

    const brokenLinkFindings = await checkBrokenLinks(pageResult.html, normalizedUrl);
    findings.push(...brokenLinkFindings.findings);
    evidence.push(...brokenLinkFindings.evidence);
  }

  // Calculate scores
  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;
  const healthScore = Math.max(0, 100 - (criticalCount * 15) - (highCount * 8) - (findings.filter(f => f.severity === 'medium').length * 3));
  const annualLeakMin = findings.reduce((sum, f) => sum + (f.annual_impact_min || 0), 0);
  const annualLeakMax = findings.reduce((sum, f) => sum + (f.annual_impact_max || 0), 0);

  // Generate report
  const report = generateReport(company_name || cleanUrl, normalizedUrl, findings, healthScore, annualLeakMin, annualLeakMax);

  // Update audit record
  await base44.entities.BusinessAudit.update(
    (await base44.entities.BusinessAudit.filter({ audit_id: auditId }, { limit: 1 })).items[0]?.id,
    {
      status: 'reported',
      health_score: healthScore,
      finding_count: findings.length,
      critical_count: criticalCount,
      high_count: highCount,
      leak_count: findings.filter(f => f.annual_impact_max > 0).length,
      annual_leak_min: annualLeakMin,
      annual_leak_max: annualLeakMax,
      evidence_summary: JSON.stringify(evidence.slice(0, 20)),
      report_markdown: report,
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime
    }
  );

  // Create finding records + evidence + revenue leaks
  for (const f of findings) {
    const fid = await hashId(`finding:${auditId}:${f.title}`);
    await base44.entities.AuditFinding.create({
      finding_id: fid,
      audit_id: auditId,
      title: f.title,
      description: f.description,
      category: f.category,
      severity: f.severity,
      evidence_state: f.confidence >= 90 ? 'verified' : 'supported_inference',
      confidence: f.confidence,
      business_impact: f.business_impact,
      recommended_repair: f.recommended_repair,
      annual_impact_min: f.annual_impact_min || 0,
      annual_impact_max: f.annual_impact_max || 0,
      approval_status: 'pending'
    });

    // Create RevenueLeak per finding
    if ((f.annual_impact_max || 0) > 0) {
      const leakId = await hashId(`leak:${auditId}:${fid}`);
      const leakCategory = mapLeakCategory(f.category);
      await base44.entities.RevenueLeak.create({
        leak_id: leakId,
        audit_id: auditId,
        finding_id: fid,
        category: leakCategory,
        description: `${f.title}: ${f.business_impact || ''}`,
        annual_impact_min: f.annual_impact_min || 0,
        annual_impact_max: f.annual_impact_max || 0,
        confidence: f.confidence,
        recovery_potential: f.severity === 'critical' ? 'full' : f.severity === 'high' ? 'partial' : 'minimal',
        status: 'quantified'
      });
    }
  }

  // Create Evidence records
  for (const ev of evidence) {
    const evId = await hashId(`evidence:${auditId}:${ev.source_uri}:${ev.captured_at}`);
    const contentHash = await hashId(ev.content_summary || ev.source_uri);
    await base44.entities.Evidence.create({
      evidence_id: evId,
      audit_id: auditId,
      source_type: ev.source_type,
      source_uri: ev.source_uri,
      captured_at: ev.captured_at,
      content_summary: (ev.content_summary || '').slice(0, 5000),
      content_hash: contentHash,
      raw_snippet: (ev.raw_snippet || '').slice(0, 10000),
      status_code: ev.status_code || null
    });
  }

  // Create ScanSnapshot
  const snapshotId = await hashId(`snapshot:${auditId}:${Date.now()}`);
  await base44.entities.ScanSnapshot.create({
    snapshot_id: snapshotId,
    audit_id: auditId,
    company_url: normalizedUrl,
    health_score: healthScore,
    finding_count: findings.length,
    critical_count: criticalCount,
    high_count: highCount,
    leak_count: findings.filter(f => (f.annual_impact_max || 0) > 0).length,
    annual_leak_min: annualLeakMin,
    annual_leak_max: annualLeakMax,
    tech_stack: JSON.stringify(techStack),
    scanned_at: new Date().toISOString(),
    scan_type: audit_type
  });

  // Create SystemNodes from tech stack
  const nodeIds: Record<string, string> = {};
  for (const tech of techStack) {
    const nodeId = await hashId(`node:${auditId}:${tech}`);
    const nodeType = mapTechToNodeType(tech);
    const nodeRiskCount = findings.filter(f => f.category === 'security' || f.category === 'technical').length;
    await base44.entities.SystemNode.create({
      node_id: nodeId,
      audit_id: auditId,
      node_type: nodeType,
      name: tech,
      detected_from: 'html_pattern',
      health_status: nodeRiskCount > 5 ? 'critical' : nodeRiskCount > 2 ? 'warning' : 'healthy',
      owner_role: nodeType === 'cms' ? 'IT Lead' : nodeType === 'analytics' ? 'Marketing Director' : 'Operations Lead',
      risk_count: nodeRiskCount
    });
    nodeIds[tech] = nodeId;
  }

  // Create SystemEdges — website depends on hosting/cdn, cms feeds analytics, etc.
  const techSet = new Set(techStack);
  if (nodeIds['Cloudflare'] && nodeIds['Website']) {
    // skip — we don't have a "Website" node, edges are between detected tech
  }
  if (techSet.has('WordPress') && techSet.has('Google Analytics')) {
    const edgeId = await hashId(`edge:${auditId}:wp_ga`);
    await base44.entities.SystemEdge.create({
      edge_id: edgeId, audit_id: auditId,
      source_node_id: nodeIds['WordPress'], target_node_id: nodeIds['Google Analytics'],
      relationship: 'feeds_data_to', risk_status: 'unknown',
      description: 'WordPress site feeds traffic data to Google Analytics'
    });
  }
  if (techSet.has('Cloudflare') && techSet.has('WordPress')) {
    const edgeId = await hashId(`edge:${auditId}:cf_wp`);
    await base44.entities.SystemEdge.create({
      edge_id: edgeId, audit_id: auditId,
      source_node_id: nodeIds['Cloudflare'], target_node_id: nodeIds['WordPress'],
      relationship: 'protected_by', risk_status: 'secure',
      description: 'Cloudflare CDN protects and caches WordPress site'
    });
  }

  // Create AuditReceipt
  const receiptId = await hashId(`receipt:${auditId}:${Date.now()}`);
  await base44.entities.AuditReceipt.create({
    receipt_id: receiptId,
    audit_id: auditId,
    system: 'diagnostic_engine',
    action: 'run_audit',
    status: 'success',
    summary: `Audit completed for ${company_name || cleanUrl} — ${findings.length} findings, health ${healthScore}/100, $${annualLeakMin}-${annualLeakMax} annual leak`,
    evidence: JSON.stringify({ audit_id: auditId, url: normalizedUrl, findings: findings.length, health_score: healthScore, tech_stack: techStack }),
    performed_by: user.id,
    created_at: new Date().toISOString()
  });

  return Response.json({
    audit_id: auditId,
    company: company_name || cleanUrl,
    url: normalizedUrl,
    health_score: healthScore,
    finding_count: findings.length,
    critical_count: criticalCount,
    high_count: highCount,
    annual_leak_min: annualLeakMin,
    annual_leak_max: annualLeakMax,
    duration_ms: Date.now() - startTime
  });
}

// ─── Generate repair plan from approved findings ─────────────────────
async function generateRepairPlan(base44: any, body: any) {
  const { audit_id } = body;
  if (!audit_id) return Response.json({ error: 'audit_id required' }, { status: 400 });

  const auditRes = await base44.entities.BusinessAudit.filter({ audit_id }, { limit: 1 });
  const audit = auditRes.items[0];
  if (!audit) return Response.json({ error: 'Audit not found' }, { status: 404 });

  const findingsRes = await base44.entities.AuditFinding.filter({ audit_id }, { limit: 500 });
  const findings = findingsRes.items || [];

  // Sort by severity then impact
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = findings.sort((a, b) => {
    const sevDiff = (severityOrder[a.severity] || 9) - (severityOrder[b.severity] || 9);
    if (sevDiff !== 0) return sevDiff;
    return (b.annual_impact_max || 0) - (a.annual_impact_max || 0);
  });

  const planId = await hashId(`plan:${audit_id}:${Date.now()}`);
  const phase30: any[] = [];
  const phase60: any[] = [];
  const phase90: any[] = [];

  let actionNum = 0;
  for (const f of sorted) {
    actionNum++;
    const actionId = await hashId(`action:${planId}:${actionNum}`);
    const phase = f.severity === 'critical' ? 30 : f.severity === 'high' ? 60 : 90;
    const targetDay = phase === 30 ? Math.min(actionNum * 3, 30) : phase === 60 ? 30 + actionNum * 3 : 60 + actionNum * 3;

    await base44.entities.RepairActionItem.create({
      action_id: actionId,
      plan_id: planId,
      finding_id: f.finding_id,
      title: f.recommended_repair || `Repair: ${f.title}`,
      description: `${f.title}: ${f.business_impact || ''}`,
      phase,
      priority: f.severity === 'critical' ? 1 : f.severity === 'high' ? 3 : 5,
      owner_role: f.category === 'security' ? 'IT Security Lead' : f.category === 'seo' ? 'Marketing Director' : 'Operations Lead',
      effort_estimate: f.severity === 'critical' ? 'high' : f.severity === 'high' ? 'medium' : 'low',
      target_day: targetDay,
      success_metric: `${f.title} resolved — ${f.category} score improved`,
      status: 'pending'
    });

    if (phase === 30) phase30.push(actionId);
    else if (phase === 60) phase60.push(actionId);
    else phase90.push(actionId);
  }

  const estimatedRecovery = findings.reduce((sum, f) => sum + (f.annual_impact_min || 0), 0);

  await base44.entities.RepairPlan.create({
    plan_id: planId,
    audit_id: audit_id,
    title: `Repair Plan — ${audit.company_name}`,
    horizon_days: 90,
    status: 'draft',
    total_actions: sorted.length,
    completed_actions: 0,
    progress_percentage: 0,
    estimated_revenue_recovery: estimatedRecovery,
    phase_30: JSON.stringify(phase30),
    phase_60: JSON.stringify(phase60),
    phase_90: JSON.stringify(phase90),
    created_at: new Date().toISOString()
  });

  return Response.json({
    plan_id: planId,
    total_actions: sorted.length,
    phase_30_count: phase30.length,
    phase_60_count: phase60.length,
    phase_90_count: phase90.length,
    estimated_recovery: estimatedRecovery
  });
}

// ─── Generate outreach draft ──────────────────────────────────────────
async function generateOutreach(base44: any, body: any) {
  const { audit_id } = body;
  if (!audit_id) return Response.json({ error: 'audit_id required' }, { status: 400 });

  const auditRes = await base44.entities.BusinessAudit.filter({ audit_id }, { limit: 1 });
  const audit = auditRes.items[0];
  if (!audit) return Response.json({ error: 'Audit not found' }, { status: 404 });

  const findingsRes = await base44.entities.AuditFinding.filter({ audit_id, severity: { $in: ['critical', 'high'] } }, { limit: 50 });
  const topFindings = (findingsRes.items || []).slice(0, 3);

  const draftId = await hashId(`outreach:${audit_id}:${Date.now()}`);
  const subject = `I found ${audit.critical_count} critical issue${audit.critical_count === 1 ? '' : 's'} on ${audit.company_name}`;
  const totalLeak = audit.annual_leak_max || 0;

  const findingList = topFindings.map((f, i) => `${i + 1}. ${f.title} — estimated impact: $${(f.annual_impact_max || 0).toLocaleString()}/year`).join('\n');

  const body_text = `Hi ${audit.company_name} team,

I ran a diagnostic scan of ${audit.company_url} and found ${audit.finding_count} issue${audit.finding_count === 1 ? '' : 's'} — ${audit.critical_count} critical, ${audit.high_count} high severity.

The biggest problems:

${findingList}

Based on these findings, I estimate ${audit.company_name} is losing between $${(audit.annual_leak_min || 0).toLocaleString()} and $${(audit.annual_leak_max || 0).toLocaleString()} in annual revenue from fixable issues.

Your overall business health score: ${audit.health_score}/100.

I've put together a 30-60-90 day repair plan that addresses each finding with specific actions, owners, and success metrics. Would you like me to share it?

Best regards`;

  await base44.entities.OutreachDraft.create({
    draft_id: draftId,
    audit_id: audit_id,
    company_name: audit.company_name,
    company_url: audit.company_url,
    subject,
    body: body_text,
    evidence_refs: JSON.stringify(topFindings.map(f => f.finding_id)),
    value_summary: `Identified $${(audit.annual_leak_max || 0).toLocaleString()} in annual revenue leaks across ${audit.finding_count} findings. Health score: ${audit.health_score}/100.`,
    approval_status: 'draft',
    send_status: 'draft_only'
  });

  return Response.json({ draft_id: draftId, subject, preview: body_text.slice(0, 200) + '...' });
}

// ─── Dashboard stats ─────────────────────────────────────────────────
async function dashboardStats(base44: any) {
  const [audits, findings, plans, drafts, risks, leaks, evidence, snapshots, receipts, nodes] = await Promise.all([
    base44.entities.BusinessAudit.filter({}, { limit: 500 }),
    base44.entities.AuditFinding.filter({}, { limit: 500 }),
    base44.entities.RepairPlan.filter({}, { limit: 100 }),
    base44.entities.OutreachDraft.filter({}, { limit: 100 }),
    base44.entities.RiskRegister.filter({}, { limit: 100 }),
    base44.entities.RevenueLeak.filter({}, { limit: 500 }),
    base44.entities.Evidence.filter({}, { limit: 500 }),
    base44.entities.ScanSnapshot.filter({}, { limit: 200 }),
    base44.entities.AuditReceipt.filter({}, { limit: 200 }),
    base44.entities.SystemNode.filter({}, { limit: 200 })
  ]);

  const auditItems = audits.items || [];
  const findingItems = findings.items || [];
  const planItems = plans.items || [];
  const draftItems = drafts.items || [];
  const riskItems = risks.items || [];
  const leakItems = leaks.items || [];
  const evidenceItems = evidence.items || [];
  const snapshotItems = snapshots.items || [];
  const receiptItems = receipts.items || [];
  const nodeItems = nodes.items || [];

  const totalLeakMin = auditItems.reduce((s, a) => s + (a.annual_leak_min || 0), 0);
  const totalLeakMax = auditItems.reduce((s, a) => s + (a.annual_leak_max || 0), 0);
  const avgHealth = auditItems.length > 0 ? Math.round(auditItems.reduce((s, a) => s + (a.health_score || 0), 0) / auditItems.length) : 0;

  return Response.json({
    audits: auditItems.length,
    findings: findingItems.length,
    critical_findings: findingItems.filter(f => f.severity === 'critical').length,
    repair_plans: planItems.length,
    pending_plans: planItems.filter(p => p.status === 'draft').length,
    outreach_drafts: draftItems.length,
    pending_outreach: draftItems.filter(d => d.approval_status === 'pending_review').length,
    risks: riskItems.length,
    open_risks: riskItems.filter(r => r.status !== 'resolved').length,
    revenue_leaks: leakItems.length,
    evidence_records: evidenceItems.length,
    scan_snapshots: snapshotItems.length,
    receipts: receiptItems.length,
    system_nodes: nodeItems.length,
    total_leak_min: totalLeakMin,
    total_leak_max: totalLeakMax,
    avg_health_score: avgHealth
  });
}

// ─── List audits ─────────────────────────────────────────────────────
async function listAudits(base44: any, body: any) {
  const limit = body.limit || 50;
  const res = await base44.entities.BusinessAudit.filter({}, { sort: '-created_date', limit });
  return Response.json({ audits: res.items || [] });
}

// ─── Get single audit with findings ──────────────────────────────────
async function getAudit(base44: any, body: any) {
  const { audit_id } = body;
  const auditRes = await base44.entities.BusinessAudit.filter({ audit_id }, { limit: 1 });
  const audit = auditRes.items[0];
  if (!audit) return Response.json({ error: 'Not found' }, { status: 404 });

  const [findingsRes, plansRes, draftsRes, risksRes, leaksRes, evidenceRes, snapshotsRes, nodesRes, edgesRes] = await Promise.all([
    base44.entities.AuditFinding.filter({ audit_id }, { limit: 500 }),
    base44.entities.RepairPlan.filter({ audit_id }, { limit: 50 }),
    base44.entities.OutreachDraft.filter({ audit_id }, { limit: 50 }),
    base44.entities.RiskRegister.filter({ audit_id }, { limit: 50 }),
    base44.entities.RevenueLeak.filter({ audit_id }, { limit: 500, sort: '-annual_impact_max' }),
    base44.entities.Evidence.filter({ audit_id }, { limit: 500, sort: '-captured_at' }),
    base44.entities.ScanSnapshot.filter({ audit_id }, { limit: 100, sort: '-scanned_at' }),
    base44.entities.SystemNode.filter({ audit_id }, { limit: 200 }),
    base44.entities.SystemEdge.filter({ audit_id }, { limit: 200 })
  ]);

  return Response.json({
    audit,
    findings: findingsRes.items || [],
    plans: plansRes.items || [],
    drafts: draftsRes.items || [],
    risks: risksRes.items || [],
    leaks: leaksRes.items || [],
    evidence: evidenceRes.items || [],
    snapshots: snapshotsRes.items || [],
    nodes: nodesRes.items || [],
    edges: edgesRes.items || []
  });
}

// ─── Approve a finding ───────────────────────────────────────────────
async function approveFinding(base44: any, body: any) {
  const { finding_id, status } = body;
  const res = await base44.entities.AuditFinding.filter({ finding_id }, { limit: 1 });
  // filter with options returns {items, ...}
  const finding = res.items[0];
  if (!finding) return Response.json({ error: 'Not found' }, { status: 404 });
  await base44.entities.AuditFinding.update(finding.id, { approval_status: status });
  return Response.json({ ok: true, finding_id, status });
}

// ─── Run monitoring checks ───────────────────────────────────────────
async function runMonitoring(base44: any, body: any) {
  const rulesRes = await base44.entities.MonitoringRule.filter({ active: true }, { limit: 200 });
  const rules = rulesRes.items || [];
  const events: any[] = [];

  for (const rule of rules) {
    if (!rule.check_url) continue;
    const result = await fetchPage(rule.check_url);
    const prevStatus = rule.last_status || 'unknown';
    const newStatus = result.ok ? 'pass' : 'fail';

    if (prevStatus !== 'unknown' && prevStatus !== newStatus) {
      const eventId = await hashId(`event:${rule.rule_id}:${Date.now()}`);
      const eventType = newStatus === 'fail' ? 'alert' : 'recovery';
      await base44.entities.MonitoringEvent.create({
        event_id: eventId,
        rule_id: rule.rule_id,
        audit_id: rule.audit_id,
        event_type: eventType,
        severity: newStatus === 'fail' ? 'critical' : 'info',
        message: `${rule.name}: ${newStatus === 'fail' ? 'DOWN' : 'RECOVERED'} — ${result.detail}`,
        metric_value: result.ok ? '200' : 'error',
        detected_at: new Date().toISOString()
      });
      events.push({ rule_id: rule.rule_id, event_type: eventType, message: result.detail });
    }

    await base44.entities.MonitoringRule.update(rule.id, {
      last_checked_at: new Date().toISOString(),
      last_status: newStatus
    });
  }

  return Response.json({ rules_checked: rules.length, events_generated: events.length, events });
}

// ═════════════════════════════════════════════════════════════════════
// DETERMINISTIC CHECK FUNCTIONS — real HTTP, no LLM
// ═════════════════════════════════════════════════════════════════════

async function checkSSL(url: string) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(8000) });
    const ok = res.url.startsWith('https://') || url.startsWith('https://');
    return {
      ok,
      detail: ok ? 'HTTPS enforced' : 'Site not serving over HTTPS',
      evidence: { source_type: 'ssl_check', source_uri: url, captured_at: new Date().toISOString(), content_summary: ok ? 'HTTPS active' : 'No SSL — HTTP only', content_hash: '' }
    };
  } catch (e) {
    return { ok: false, detail: 'SSL check failed: ' + e.message, evidence: { source_type: 'ssl_check', source_uri: url, captured_at: new Date().toISOString(), content_summary: 'Connection failed', content_hash: '' } };
  }
}

async function fetchPage(url: string) {
  try {
    const start = Date.now();
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(12000) });
    const loadMs = Date.now() - start;
    const html = await res.text();
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => { headers[k] = v; });
    return {
      ok: res.ok,
      status: res.status,
      html,
      headers,
      loadMs,
      detail: res.ok ? `HTTP ${res.status} — ${loadMs}ms` : `HTTP ${res.status}`,
      evidence: { source_type: 'page_fetch', source_uri: url, captured_at: new Date().toISOString(), content_summary: `HTTP ${res.status}, ${loadMs}ms, ${html.length} bytes`, content_hash: '' }
    };
  } catch (e) {
    return { ok: false, html: '', headers: {}, loadMs: 0, detail: 'Fetch failed: ' + e.message, evidence: { source_type: 'page_fetch', source_uri: url, captured_at: new Date().toISOString(), content_summary: 'Fetch error: ' + e.message, content_hash: '' } };
  }
}

function checkSEOTags(html: string, url: string) {
  const findings: any[] = [];
  const evidence: any[] = [];
  const evBase = { source_type: 'seo_meta', source_uri: url, captured_at: new Date().toISOString() };

  // Title tag
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (!titleMatch || titleMatch[1].trim().length < 10) {
    findings.push({
      title: 'Missing or Too Short Page Title',
      description: 'The <title> tag is missing or under 10 characters. This is the #1 on-page SEO factor.',
      category: 'seo', severity: 'high', confidence: 100,
      business_impact: 'Poor title tags reduce click-through rate from search results by up to 40% and hurt rankings.',
      recommended_repair: 'Write a unique, descriptive title tag of 50-60 characters for every page.',
      annual_impact_min: 8000, annual_impact_max: 35000
    });
  }
  evidence.push({ ...evBase, content_summary: `Title: ${titleMatch ? titleMatch[1].slice(0, 80) : 'MISSING'}` });

  // Meta description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  if (!descMatch || descMatch[1].trim().length < 50) {
    findings.push({
      title: 'Missing or Inadequate Meta Description',
      description: 'Meta description is missing or under 50 characters. This appears in search results and affects CTR.',
      category: 'seo', severity: 'medium', confidence: 100,
      business_impact: 'Pages without meta descriptions get 20-30% fewer clicks from search results.',
      recommended_repair: 'Write a compelling meta description of 150-160 characters for every page.',
      annual_impact_min: 3000, annual_impact_max: 15000
    });
  }
  evidence.push({ ...evBase, content_summary: `Meta desc: ${descMatch ? descMatch[1].slice(0, 80) : 'MISSING'}` });

  // Open Graph tags
  if (!html.match(/<meta[^>]+property=["']og:title["']/i)) {
    findings.push({
      title: 'Missing Open Graph Tags',
      description: 'No og:title tag found. Links shared on social media will not have proper previews.',
      category: 'seo', severity: 'low', confidence: 100,
      business_impact: 'Social media shares show broken or generic previews, reducing social traffic by up to 50%.',
      recommended_repair: 'Add og:title, og:description, and og:image meta tags.',
      annual_impact_min: 1000, annual_impact_max: 8000
    });
  }

  // H1 tag
  const h1Matches = html.match(/<h1[^>]*>/gi);
  if (!h1Matches || h1Matches.length === 0) {
    findings.push({
      title: 'No H1 Heading Tag',
      description: 'The page has no H1 tag. H1 is critical for both SEO and accessibility.',
      category: 'seo', severity: 'high', confidence: 100,
      business_impact: 'Missing H1 tags hurt search rankings and screen reader navigation.',
      recommended_repair: 'Add exactly one H1 tag per page with the primary keyword.',
      annual_impact_min: 5000, annual_impact_max: 20000
    });
  } else if (h1Matches.length > 1) {
    findings.push({
      title: 'Multiple H1 Tags',
      description: `Found ${h1Matches.length} H1 tags. Only one H1 per page is recommended.`,
      category: 'seo', severity: 'low', confidence: 100,
      business_impact: 'Multiple H1s dilute SEO signal and confuse search engines.',
      recommended_repair: 'Use only one H1 tag per page; use H2-H6 for subheadings.',
      annual_impact_min: 1000, annual_impact_max: 5000
    });
  }

  // Canonical
  if (!html.match(/<link[^>]+rel=["']canonical["']/i)) {
    findings.push({
      title: 'Missing Canonical URL Tag',
      description: 'No canonical link tag found. This can cause duplicate content issues.',
      category: 'seo', severity: 'medium', confidence: 100,
      business_impact: 'Without canonical tags, search engines may index duplicate URLs, splitting ranking signals.',
      recommended_repair: 'Add a <link rel="canonical"> tag to every page.',
      annual_impact_min: 2000, annual_impact_max: 10000
    });
  }

  // Schema markup
  if (!html.match(/application\/ld\+json/i)) {
    findings.push({
      title: 'No Structured Data (Schema.org)',
      description: 'No JSON-LD structured data found. Rich snippets are not available in search results.',
      category: 'seo', severity: 'medium', confidence: 95,
      business_impact: 'Sites without structured data miss rich snippets, reducing CTR by 15-30%.',
      recommended_repair: 'Add JSON-LD structured data (Organization, LocalBusiness, Product, etc.).',
      annual_impact_min: 3000, annual_impact_max: 15000
    });
  }

  return { findings, evidence };
}

function checkSecurityHeaders(headers: Record<string, string>, url: string) {
  const findings: any[] = [];
  const evidence: any[] = [];
  const evBase = { source_type: 'security_headers', source_uri: url, captured_at: new Date().toISOString() };

  const checks = [
    { header: 'strict-transport-security', label: 'HSTS (Strict-Transport-Security)', severity: 'high', impact: 'Without HSTS, users can be downgraded to HTTP and intercepted via MITM attacks.', repair: 'Add Strict-Transport-Security header with max-age of at least 1 year.', min: 5000, max: 30000 },
    { header: 'content-security-policy', label: 'Content Security Policy (CSP)', severity: 'high', impact: 'Without CSP, the site is vulnerable to XSS attacks.', repair: 'Add a Content-Security-Policy header restricting resource sources.', min: 5000, max: 25000 },
    { header: 'x-frame-options', label: 'X-Frame-Options (Clickjacking Protection)', severity: 'medium', impact: 'Without X-Frame-Options, the site can be embedded in iframes for clickjacking attacks.', repair: 'Add X-Frame-Options: DENY or SAMEORIGIN header.', min: 2000, max: 10000 },
    { header: 'x-content-type-options', label: 'X-Content-Type-Options', severity: 'low', impact: 'Without this header, browsers may MIME-sniff, leading to security issues.', repair: 'Add X-Content-Type-Options: nosniff header.', min: 1000, max: 5000 }
  ];

  for (const c of checks) {
    const found = headers[c.header] || headers[c.header.toLowerCase()];
    if (!found) {
      findings.push({
        title: `Missing Security Header: ${c.label}`,
        description: `The ${c.header} header is not set. ${c.impact}`,
        category: 'security', severity: c.severity, confidence: 100,
        business_impact: c.impact,
        recommended_repair: c.repair,
        annual_impact_min: c.min, annual_impact_max: c.max
      });
    }
  }
  evidence.push({ ...evBase, content_summary: `Headers checked: ${checks.map(c => c.header).join(', ')}` });

  return { findings, evidence };
}

function checkPerformance(pageResult: any, html: string) {
  const findings: any[] = [];
  const evidence: any[] = [];
  const evBase = { source_type: 'performance', source_uri: pageResult.evidence?.source_uri, captured_at: new Date().toISOString() };

  // Load time
  if (pageResult.loadMs > 3000) {
    findings.push({
      title: `Slow Page Load: ${(pageResult.loadMs / 1000).toFixed(1)}s`,
      description: `Page took ${pageResult.loadMs}ms to load. Google recommends under 3 seconds. 53% of mobile users abandon sites over 3s.`,
      category: 'performance', severity: pageResult.loadMs > 5000 ? 'critical' : 'high', confidence: 100,
      business_impact: 'Every 1 second of delay reduces conversions by 7% and page views by 11%.',
      recommended_repair: 'Optimize images, minify CSS/JS, enable compression, use a CDN, and reduce server response time.',
      annual_impact_min: 10000, annual_impact_max: 50000
    });
  }
  evidence.push({ ...evBase, content_summary: `Load time: ${pageResult.loadMs}ms` });

  // Render-blocking resources (rough heuristic)
  const scriptCount = (html.match(/<script[^>]*>/gi) || []).length;
  const cssCount = (html.match(/<link[^>]+rel=["']stylesheet["']/gi) || []).length;
  if (scriptCount > 10) {
    findings.push({
      title: `Excessive Script Tags: ${scriptCount}`,
      description: `Found ${scriptCount} script tags. Too many scripts block rendering and slow page load.`,
      category: 'performance', severity: 'medium', confidence: 90,
      business_impact: 'Excessive scripts increase load time, reduce Core Web Vitals scores, and hurt SEO.',
      recommended_repair: 'Defer non-critical scripts, combine and minify JS files, and use async loading.',
      annual_impact_min: 3000, annual_impact_max: 15000
    });
  }

  // Image optimization
  const imgCount = (html.match(/<img[^>]*>/gi) || []).length;
  const lazyImgs = (html.match(/loading=["']lazy["']/gi) || []).length;
  if (imgCount > 3 && lazyImgs < imgCount / 2) {
    findings.push({
      title: 'Images Not Using Lazy Loading',
      description: `Found ${imgCount} images but only ${lazyImgs} use loading="lazy". Unoptimized images waste bandwidth and slow initial render.`,
      category: 'performance', severity: 'medium', confidence: 90,
      business_impact: 'Unoptimized images are the #1 cause of slow page loads, increasing bounce rate.',
      recommended_repair: 'Add loading="lazy" to below-the-fold images and use modern formats (WebP, AVIF).',
      annual_impact_min: 2000, annual_impact_max: 12000
    });
  }

  return { findings, evidence };
}

function checkConversionElements(html: string, url: string) {
  const findings: any[] = [];
  const evidence: any[] = [];
  const evBase = { source_type: 'conversion_audit', source_uri: url, captured_at: new Date().toISOString() };

  // CTA buttons
  const ctaPatterns = /(<button[^>]*>|<a[^>]+class=["'][^"']*\b(btn|button|cta)\b)/gi;
  const ctaCount = (html.match(ctaPatterns) || []).length;
  if (ctaCount < 1) {
    findings.push({
      title: 'No Clear Call-to-Action Buttons',
      description: 'No prominent CTA buttons found. Visitors don\'t know what action to take next.',
      category: 'conversion', severity: 'high', confidence: 85,
      business_impact: 'Pages without clear CTAs lose 30-50% of potential conversions.',
      recommended_repair: 'Add prominent, action-oriented CTA buttons above the fold (e.g. "Get Started", "Schedule a Call").',
      annual_impact_min: 15000, annual_impact_max: 60000
    });
  }
  evidence.push({ ...evBase, content_summary: `CTA elements found: ${ctaCount}` });

  // Contact form
  const hasForm = /<form[^>]*>/i.test(html);
  if (!hasForm) {
    findings.push({
      title: 'No Contact Form',
      description: 'No form found on the page. Visitors cannot easily reach out without picking up the phone.',
      category: 'conversion', severity: 'high', confidence: 85,
      business_impact: 'Missing contact forms reduce lead capture by 25-40%.',
      recommended_repair: 'Add a contact or lead capture form with minimal required fields.',
      annual_impact_min: 10000, annual_impact_max: 45000
    });
  }

  // Phone number
  const hasPhone = /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/.test(html) || /tel:/i.test(html);
  if (!hasPhone) {
    findings.push({
      title: 'No Visible Phone Number',
      description: 'No phone number detected. Mobile users cannot tap-to-call.',
      category: 'conversion', severity: 'medium', confidence: 80,
      business_impact: 'Missing phone numbers reduce mobile conversions by 15-20%.',
      recommended_repair: 'Add a clickable tel: link with your business phone number in the header.',
      annual_impact_min: 3000, annual_impact_max: 15000
    });
  }

  return { findings, evidence };
}

function checkContentQuality(html: string) {
  const findings: any[] = [];
  const evidence: any[] = [];

  // Strip tags to get text
  const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = text.split(/\s+/).length;

  if (wordCount < 300) {
    findings.push({
      title: 'Thin Content — Under 300 Words',
      description: `Page has only ${wordCount} words of visible content. Google considers pages under 300 words as "thin content."`,
      category: 'content', severity: 'medium', confidence: 95,
      business_impact: 'Thin content pages rank poorly and provide little value to visitors, reducing organic traffic.',
      recommended_repair: 'Expand page content to at least 500-800 words of valuable, relevant information.',
      annual_impact_min: 3000, annual_impact_max: 15000
    });
  }

  // Check for analytics
  if (!html.match(/google-analytics|gtag|googletagmanager|gtag\(/i)) {
    findings.push({
      title: 'No Analytics Tracking Detected',
      description: 'No Google Analytics or GTM found. You cannot measure traffic, conversions, or user behavior.',
      category: 'technical', severity: 'high', confidence: 95,
      business_impact: 'Without analytics, you are blind to user behavior, conversion rates, and traffic sources.',
      recommended_repair: 'Install Google Analytics 4 or Google Tag Manager.',
      annual_impact_min: 5000, annual_impact_max: 25000
    });
  }

  return { findings, evidence };
}

function checkMobileReadiness(html: string) {
  const findings: any[] = [];
  const evidence: any[] = [];

  const viewportMatch = html.match(/<meta[^>]+name=["']viewport["']/i);
  if (!viewportMatch) {
    findings.push({
      title: 'Missing Viewport Meta Tag',
      description: 'No viewport meta tag found. The site will not display correctly on mobile devices.',
      category: 'ux', severity: 'critical', confidence: 100,
      business_impact: '60% of web traffic is mobile. Without a viewport tag, mobile users see a broken layout and bounce.',
      recommended_repair: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head>.',
      annual_impact_min: 20000, annual_impact_max: 100000
    });
  }

  return { findings, evidence };
}

async function checkRobots(url: string) {
  const robotsUrl = new URL('/robots.txt', url).href;
  try {
    const res = await fetch(robotsUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { ok: false, detail: `robots.txt returned HTTP ${res.status}`, evidence: { source_type: 'robots_txt', source_uri: robotsUrl, captured_at: new Date().toISOString(), content_summary: `HTTP ${res.status}`, content_hash: '' } };
    const content = await res.text();
    return { ok: true, detail: 'robots.txt found', evidence: { source_type: 'robots_txt', source_uri: robotsUrl, captured_at: new Date().toISOString(), content_summary: content.slice(0, 200), content_hash: '' } };
  } catch (e) {
    return { ok: false, detail: 'robots.txt not reachable: ' + e.message, evidence: { source_type: 'robots_txt', source_uri: robotsUrl, captured_at: new Date().toISOString(), content_summary: 'Fetch error', content_hash: '' } };
  }
}

async function checkSitemap(url: string) {
  const sitemapUrl = new URL('/sitemap.xml', url).href;
  try {
    const res = await fetch(sitemapUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { ok: false, detail: `sitemap.xml returned HTTP ${res.status}`, evidence: { source_type: 'sitemap_xml', source_uri: sitemapUrl, captured_at: new Date().toISOString(), content_summary: `HTTP ${res.status}`, content_hash: '' } };
    const content = await res.text();
    const urlCount = (content.match(/<url>/gi) || []).length;
    return { ok: true, detail: `sitemap.xml found — ${urlCount} URLs`, evidence: { source_type: 'sitemap_xml', source_uri: sitemapUrl, captured_at: new Date().toISOString(), content_summary: `${urlCount} URLs`, content_hash: '' } };
  } catch (e) {
    return { ok: false, detail: 'sitemap.xml not reachable: ' + e.message, evidence: { source_type: 'sitemap_xml', source_uri: sitemapUrl, captured_at: new Date().toISOString(), content_summary: 'Fetch error', content_hash: '' } };
  }
}

// ─── Deep security: tech stack detection ──────────────────────────────
function detectTechStack(html: string): string[] {
  const stack: string[] = [];
  const checks: [string, RegExp][] = [
    ['React', /react|_next\/static|__NEXT_DATA__/i],
    ['Vue.js', /vue\.js|vuejs|__vue/i],
    ['Angular', /angular|ng-app/i],
    ['WordPress', /wp-content|wp-includes|wordpress/i],
    ['Shopify', /shopify|cdn\.shopify/i],
    ['Squarespace', /squarespace/i],
    ['Wix', /wix\.com|wixstatic/i],
    ['HubSpot CMS', /hubspot|hs-scripts/i],
    ['Google Analytics', /google-analytics|gtag\(|googletagmanager/i],
    ['Facebook Pixel', /facebook\.com\/tr|fbq\(/i],
    ['Hotjar', /hotjar/i],
    ['Cloudflare', /cloudflare/i],
    ['jQuery', /jquery/i],
    ['Bootstrap', /bootstrap/i],
    ['Tailwind CSS', /tailwind/i],
    ['Intercom', /intercom/i],
    ['Zendesk', /zendesk/i],
    ['Salesforce', /salesforce/i],
    ['Marketo', /marketo/i],
    ['Segment', /segment\.io|analytics\.js/i]
  ];
  for (const [name, re] of checks) { if (re.test(html)) stack.push(name); }
  return stack;
}

// ─── Deep security: sensitive path probing ────────────────────────────
async function checkSensitivePaths(url: string) {
  const findings: any[] = [];
  const evidence: any[] = [];
  const sensitivePaths = ['/wp-admin/', '/admin', '/.git/config', '/.env', '/wp-config.php', '/phpinfo.php', '/.DS_Store', '/backup/', '/.htaccess'];

  const checks = await Promise.all(sensitivePaths.map(async (p) => {
    try {
      const checkUrl = new URL(p, url).href;
      const res = await fetch(checkUrl, { method: 'GET', signal: AbortSignal.timeout(8000), redirect: 'follow' });
      return { path: p, status: res.status, ok: res.ok };
    } catch { return { path: p, status: 0, ok: false }; }
  }));

  for (const check of checks) {
    if (check.ok && check.status === 200) {
      const isGit = check.path.includes('.git');
      const isEnv = check.path.includes('.env');
      const isAdmin = check.path.includes('admin') || check.path.includes('wp-admin');
      const isConfig = check.path.includes('config') || check.path.includes('htaccess');
      if (isGit || isEnv || isConfig) {
        findings.push({
          title: `Exposed Sensitive File: ${check.path}`,
          description: `The path ${check.path} is publicly accessible and returns HTTP 200.`,
          category: 'security', severity: 'critical', confidence: 98,
          business_impact: 'Attackers can read credentials and source code — leading to full system compromise.',
          recommended_repair: `Restrict access to ${check.path} via server configuration or .htaccess rules.`,
          annual_impact_min: 30000, annual_impact_max: 150000
        });
      } else if (isAdmin) {
        findings.push({
          title: `Exposed Admin Panel: ${check.path}`,
          description: `The admin panel at ${check.path} is publicly accessible.`,
          category: 'security', severity: 'high', confidence: 85,
          business_impact: 'Brute-force attacks on admin panels are a leading cause of site takeovers.',
          recommended_repair: 'Add IP restrictions, 2FA, and rate limiting to the admin panel.',
          annual_impact_min: 10000, annual_impact_max: 50000
        });
      }
      evidence.push({ source_type: 'sensitive_path', source_uri: new URL(check.path, url).href, captured_at: new Date().toISOString(), content_summary: `HTTP ${check.status} — exposed`, content_hash: '' });
    }
  }
  return { findings, evidence };
}

// ─── Deep security: WordPress version detection ──────────────────────
function checkWordPressVersion(html: string) {
  const findings: any[] = [];
  const evidence: any[] = [];
  if (/wp-content|wp-includes/i.test(html)) {
    const versionMatch = html.match(/wp-includes\/[^?]*\?ver=([0-9.]+)/i);
    if (versionMatch) {
      const ver = parseFloat(versionMatch[1]);
      if (ver < 6.0) {
        findings.push({
          title: `Outdated WordPress Version (${versionMatch[1]})`,
          description: `WordPress version ${versionMatch[1]} was detected. Versions below 6.0 have known vulnerabilities.`,
          category: 'security', severity: 'high', confidence: 88,
          business_impact: 'Outdated WordPress is the #1 cause of website compromises.',
          recommended_repair: 'Update WordPress to the latest version immediately.',
          annual_impact_min: 8000, annual_impact_max: 40000
        });
      }
      evidence.push({ source_type: 'tech_stack', source_uri: '', captured_at: new Date().toISOString(), content_summary: `WordPress ${versionMatch[1]} detected`, content_hash: '' });
    }
  }
  return { findings, evidence };
}

// ─── Deep security: broken link checker ──────────────────────────────
async function checkBrokenLinks(html: string, baseUrl: string) {
  const findings: any[] = [];
  const evidence: any[] = [];
  const linkRegex = /<a[^>]+href=["']([^"']+)["']/gi;
  const internalLinks: string[] = [];
  let m;
  const baseOrigin = baseUrl.replace(/\/$/, '').split('#')[0];
  while ((m = linkRegex.exec(html)) !== null) {
    try {
      const fullUrl = new URL(m[1], baseUrl).href;
      if (fullUrl.startsWith(baseOrigin)) internalLinks.push(fullUrl);
    } catch {}
  }
  const uniqueLinks = [...new Set(internalLinks)].slice(0, 8);
  if (uniqueLinks.length === 0) return { findings, evidence };

  const checks = await Promise.all(uniqueLinks.map(async (l) => {
    try { const res = await fetch(l, { method: 'HEAD', signal: AbortSignal.timeout(8000) }); return { url: l, status: res.status }; }
    catch { return { url: l, status: 0 }; }
  }));
  const broken = checks.filter(c => c.status === 404 || c.status === 0);
  if (broken.length > 0) {
    findings.push({
      title: `${broken.length} Broken Internal Link${broken.length > 1 ? 's' : ''}`,
      description: `Found ${broken.length} broken internal link(s): ${broken.map(b => b.url).join(', ').slice(0, 200)}`,
      category: 'technical', severity: 'medium', confidence: 92,
      business_impact: 'Broken links hurt SEO rankings and reduce conversions.',
      recommended_repair: 'Fix or redirect broken links. Set up 301 redirects.',
      annual_impact_min: 3000, annual_impact_max: 15000
    });
    evidence.push({ source_type: 'broken_link', source_uri: baseUrl, captured_at: new Date().toISOString(), content_summary: `${broken.length} broken links found`, content_hash: '' });
  }
  return { findings, evidence };
}

// ─── Map finding category to revenue leak category ───────────────────
function mapLeakCategory(cat: string): string {
  const map: Record<string, string> = {
    'conversion': 'conversion_loss',
    'seo': 'seo_traffic_loss',
    'security': 'security_breach_risk',
    'performance': 'performance_penalty',
    'ux': 'trust_deficit',
    'content': 'content_gap',
    'technical': 'infrastructure_cost',
    'infrastructure': 'infrastructure_cost',
    'compliance': 'compliance_fine_risk'
  };
  return map[cat] || 'conversion_loss';
}

// ─── Map tech name to system node type ────────────────────────────────
function mapTechToNodeType(tech: string): string {
  const map: Record<string, string> = {
    'WordPress': 'cms', 'Shopify': 'cms', 'Squarespace': 'cms', 'Wix': 'cms', 'HubSpot CMS': 'cms',
    'React': 'framework', 'Vue.js': 'framework', 'Angular': 'framework',
    'Google Analytics': 'analytics', 'Facebook Pixel': 'advertising', 'Hotjar': 'analytics',
    'Cloudflare': 'cdn', 'jQuery': 'framework', 'Bootstrap': 'framework', 'Tailwind CSS': 'framework',
    'Intercom': 'support', 'Zendesk': 'support', 'Salesforce': 'crm', 'Marketo': 'email_marketing',
    'Segment': 'analytics'
  };
  return map[tech] || 'other';
}

// ─── Get system map (nodes + edges) ───────────────────────────────────
async function getSystemMap(base44: any, body: any) {
  const { audit_id } = body;
  if (!audit_id) return Response.json({ error: 'audit_id required' }, { status: 400 });
  const [nodesRes, edgesRes] = await Promise.all([
    base44.entities.SystemNode.filter({ audit_id }, { limit: 200 }),
    base44.entities.SystemEdge.filter({ audit_id }, { limit: 200 })
  ]);
  return Response.json({ nodes: nodesRes.items || [], edges: edgesRes.items || [] });
}

// ─── Get revenue leaks for an audit ───────────────────────────────────
async function getRevenueLeaks(base44: any, body: any) {
  const { audit_id } = body;
  if (!audit_id) return Response.json({ error: 'audit_id required' }, { status: 400 });
  const res = await base44.entities.RevenueLeak.filter({ audit_id }, { limit: 500, sort: '-annual_impact_max' });
  return Response.json({ leaks: res.items || [] });
}

// ─── Get evidence for an audit ───────────────────────────────────────
async function getEvidence(base44: any, body: any) {
  const { audit_id } = body;
  if (!audit_id) return Response.json({ error: 'audit_id required' }, { status: 400 });
  const res = await base44.entities.Evidence.filter({ audit_id }, { limit: 500, sort: '-captured_at' });
  return Response.json({ evidence: res.items || [] });
}

// ─── Get scan snapshots for an audit ──────────────────────────────────
async function getSnapshots(base44: any, body: any) {
  const { audit_id } = body;
  if (!audit_id) return Response.json({ error: 'audit_id required' }, { status: 400 });
  const res = await base44.entities.ScanSnapshot.filter({ audit_id }, { limit: 100, sort: '-scanned_at' });
  return Response.json({ snapshots: res.items || [] });
}

// ─── Get audit receipts ──────────────────────────────────────────────
async function getReceipts(base44: any, body: any) {
  const { audit_id } = body;
  const query = audit_id ? { audit_id } : {};
  const res = await base44.entities.AuditReceipt.filter(query, { limit: 200, sort: '-created_date' });
  return Response.json({ receipts: res.items || [] });
}

// ─── Get tech stack for an audit ─────────────────────────────────────
async function getTechStack(base44: any, body: any) {
  const { audit_id } = body;
  if (!audit_id) return Response.json({ error: 'audit_id required' }, { status: 400 });
  const res = await base44.entities.SystemNode.filter({ audit_id }, { limit: 100 });
  return Response.json({ tech: (res.items || []).map(n => ({ name: n.name, type: n.node_type, health: n.health_status, risks: n.risk_count })) });
}

function generateReport(company: string, url: string, findings: any[], healthScore: number, leakMin: number, leakMax: number) {
  const critical = findings.filter(f => f.severity === 'critical');
  const high = findings.filter(f => f.severity === 'high');
  const medium = findings.filter(f => f.severity === 'medium');
  const low = findings.filter(f => f.severity === 'low');

  let report = `# Business Diagnostic Report — ${company}\n\n`;
  report += `**URL:** ${url}\n`;
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Health Score:** ${healthScore}/100\n`;
  report += `**Estimated Annual Revenue Leak:** $${leakMin.toLocaleString()} — $${leakMax.toLocaleString()}\n\n`;
  report += `## Executive Summary\n\n`;
  report += `This diagnostic identified ${findings.length} issue${findings.length === 1 ? '' : 's'} across ${company}'s digital presence:\n\n`;
  report += `- **${critical.length}** critical severity\n`;
  report += `- **${high.length}** high severity\n`;
  report += `- **${medium.length}** medium severity\n`;
  report += `- **${low.length}** low severity\n\n`;
  report += `## Critical Findings\n\n`;
  for (const f of critical) {
    report += `### ${f.title}\n`;
    report += `- **Impact:** ${f.business_impact}\n`;
    report += `- **Repair:** ${f.recommended_repair}\n`;
    report += `- **Est. Annual Cost:** $${(f.annual_impact_min || 0).toLocaleString()} — $${(f.annual_impact_max || 0).toLocaleString()}\n\n`;
  }
  report += `## High Severity Findings\n\n`;
  for (const f of high) {
    report += `### ${f.title}\n`;
    report += `- **Impact:** ${f.business_impact}\n`;
    report += `- **Repair:** ${f.recommended_repair}\n\n`;
  }
  report += `## Recommended Next Steps\n\n`;
  report += `1. Address all critical findings within 30 days\n`;
  report += `2. Resolve high severity issues within 60 days\n`;
  report += `3. Implement monitoring to prevent regression\n`;
  report += `4. Generate a detailed 30-60-90 day repair plan\n`;

  return report;
}