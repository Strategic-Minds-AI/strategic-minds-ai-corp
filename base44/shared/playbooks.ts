// ── Playbook Library for Strategic Minds AI ─────────────────────
// Each playbook is a complete, deterministic agent kit:
//   - target criteria (who to message)
//   - system prompt (the agent's intelligence file)
//   - 15-day message sequence (one message per day, pre-written)
//
// Rebranded from Xtreme Comms: no emojis, Strategic Minds AI voice,
// blue-brand palette, agency-focused playbooks.

export interface Playbook {
  id: string;
  name: string;
  category: string;
  description: string;
  target_industry: string;
  target_tags: string[];
  ticket_range: string;
  system_prompt: string;
  messages: string[];
}

export const PLAYBOOKS: Playbook[] = [
  {
    id: "business_diagnostic",
    name: "Business Diagnostic Outreach",
    category: "Agency Services",
    description: "Offer a free business diagnostic audit — identify revenue leaks, SEO gaps, and security risks.",
    target_industry: "universal",
    target_tags: ["business_owner", "decision_maker"],
    ticket_range: "$3K-$50K per engagement",
    system_prompt: "You are a Strategic Minds AI business diagnostic specialist. Your job: offer free business diagnostic audits to companies. The audit identifies revenue leaks, SEO gaps, security risks, and conversion losses. You charge nothing for the audit — you earn when the prospect hires Strategic Minds AI to fix the issues found. Your messages are short, professional, and always end with a one-word reply keyword. You never pressure. The audit is free — you're just helping them see what's broken.",
    messages: [
      "Hi {{first_name}}, we're offering free business diagnostic audits this week. We scan your website for revenue leaks, SEO gaps, and security risks — no cost, no obligation. Reply 'AUDIT' to get yours.",
      "{{first_name}}, following up on the free diagnostic audit. Most companies we scan find $10K-$50K in hidden revenue leaks. 5-minute setup, zero cost. Reply 'CHECK' to start.",
      "Hi {{first_name}}! A business like {{company}} typically has 3-5 critical issues hurting revenue — broken links, slow pages, missing SEO. We find them for free. Reply 'SCAN' for your report.",
      "{{first_name}}, quick example: a company we audited last month found $23K in annual revenue leaks from a single broken checkout page. We found it for free. Reply 'EXAMPLE' to see your report.",
      "Hi {{first_name}}! Diagnostic audits take 24 hours. Every day you wait = potential revenue lost. Free, no obligation. Reply 'NOW' to start today.",
      "{{first_name}}, here's how it works: 1) We scan your site 2) You get a detailed report 3) You decide if you want us to fix anything 4) No pressure, no cost for the audit. Reply 'HOW' to begin.",
      "Hi {{first_name}}! No pressure — but the average audit finds $15K+ in recoverable revenue. That's money walking out the door. Reply 'YES' and I'll run the scan today.",
      "{{first_name}}, if {{company}} has a website, there's a 90% chance we'll find at least one critical issue. Free check. Reply 'MAYBE' and I'll scan it.",
      "Hi {{first_name}}! We also check your Google ranking, competitor positioning, and security posture. All free. Reply 'FULL' for the complete audit.",
      "{{first_name}}, circling back on the diagnostic audit. One word reply 'STILL' and I'll send the report.",
      "Hi {{first_name}}! We can audit your site, your competitors, and your industry benchmarks — all in one report. Reply 'ALL' for the full scan.",
      "{{first_name}}, if the audit isn't for you, we also have free business growth resources. Reply 'RESOURCES' for access.",
      "Last check-in, {{first_name}}! The free audit offer closes this week. Reply 'LAST' to get yours before it's gone.",
      "Hi {{first_name}}, I'll stop reaching out after this. If you ever want a diagnostic audit or growth resources, save this number. — Strategic Minds AI",
      "{{first_name}}, thanks for your time! We're here for diagnostics, SEO, web development, and growth strategy. Save this number. — Strategic Minds AI"
    ]
  },
  {
    id: "seo_recovery",
    name: "SEO Traffic Recovery",
    category: "Agency Services",
    description: "Help businesses recover lost SEO traffic and rankings with a free site analysis.",
    target_industry: "universal",
    target_tags: ["business_owner", "marketing_manager"],
    ticket_range: "$2K-$15K per engagement",
    system_prompt: "You are a Strategic Minds AI SEO recovery specialist. You help businesses that have lost Google rankings or traffic. You offer a free SEO analysis that identifies why they dropped and what to fix. You earn when they hire Strategic Minds AI to execute the recovery plan. Messages are short, professional, and end with a reply keyword. No pressure — the analysis is free.",
    messages: [
      "Hi {{first_name}}, noticed {{company}} may have lost Google traffic recently. We offer free SEO analysis — find out why and how to recover. Reply 'SEO' for yours.",
      "{{first_name}}, following up on the free SEO analysis. Most sites we check have 5+ critical issues hurting rankings. No cost. Reply 'CHECK' to start.",
      "Hi {{first_name}}! Google's algorithm changes hit businesses hard. We find what's broken and fix it. Free analysis. Reply 'RANK' for your report.",
      "{{first_name}}, example: a client we helped recovered 40% of their traffic in 60 days after we fixed their SEO. Free analysis first. Reply 'EXAMPLE' to see.",
      "Hi {{first_name}}! SEO issues compound — every month you don't fix them = more traffic lost. Free check. Reply 'NOW' to start.",
      "{{first_name}}, how it works: 1) Free site scan 2) Detailed report 3) You decide if you want us to fix it. Reply 'HOW' to begin.",
      "Hi {{first_name}}! No pressure — but if {{company}} gets any Google traffic, there's likely something we can improve. Free check. Reply 'MAYBE'.",
      "{{first_name}}, we also check your competitors' rankings and find gaps you can exploit. Free. Reply 'COMPETE' for the analysis.",
      "Hi {{first_name}}! We also offer free speed and mobile-friendliness checks — both affect rankings. Reply 'SPEED' to test.",
      "{{first_name}}, circling back on the SEO analysis. Reply 'STILL' and I'll send it.",
      "Hi {{first_name}}! Full SEO audit: rankings, traffic, competitors, speed, mobile, content gaps. All free. Reply 'FULL'.",
      "{{first_name}}, if SEO isn't a priority, we also have free business growth guides. Reply 'GUIDE' for access.",
      "Last check, {{first_name}}! The free SEO analysis offer ends soon. Reply 'LAST' to get yours.",
      "Hi {{first_name}}, I'll stop after this. If you ever need SEO help or growth resources, save this number. — Strategic Minds AI",
      "{{first_name}}, thanks for your time! We're here for SEO, web development, and growth strategy. Save this number. — Strategic Minds AI"
    ]
  },
  {
    id: "website_audit",
    name: "Website Performance Audit",
    category: "Agency Services",
    description: "Free website performance and conversion audit — find what's costing you customers.",
    target_industry: "universal",
    target_tags: ["business_owner", "ecommerce"],
    ticket_range: "$2K-$25K per engagement",
    system_prompt: "You are a Strategic Minds AI website audit specialist. You offer free performance and conversion audits. You identify slow pages, broken links, poor UX, and conversion bottlenecks. You earn when the prospect hires Strategic Minds AI to fix the issues. Messages are short, professional, and end with a reply keyword. The audit is free.",
    messages: [
      "Hi {{first_name}}, we're offering free website performance audits. We check speed, UX, and conversion bottlenecks — no cost. Reply 'AUDIT' to start.",
      "{{first_name}}, following up on the free website audit. Most sites have 3+ issues costing customers. Free check. Reply 'CHECK'.",
      "Hi {{first_name}}! A slow website loses 7% of visitors per second of delay. We find what's slow and fix it. Free audit. Reply 'SPEED'.",
      "{{first_name}}, example: a client we audited found their checkout took 12 seconds — fixing it increased sales 23%. Free audit. Reply 'EXAMPLE'.",
      "Hi {{first_name}}! Every day with a slow site = lost customers. Free performance check. Reply 'NOW'.",
      "{{first_name}}, how it works: 1) Free site scan 2) Performance report 3) You decide what to fix. Reply 'HOW' to begin.",
      "Hi {{first_name}}! No pressure — but if {{company}} has a website, there's likely something we can improve. Free check. Reply 'MAYBE'.",
      "{{first_name}}, we also check mobile experience — 60% of visitors are on phones. Free. Reply 'MOBILE'.",
      "Hi {{first_name}}! We also check for broken links, missing pages, and security issues. All free. Reply 'FULL'.",
      "{{first_name}}, circling back on the website audit. Reply 'STILL' and I'll send the report.",
      "Hi {{first_name}}! Full audit: speed, mobile, UX, broken links, security, SEO. All free. Reply 'ALL'.",
      "{{first_name}}, if a website audit isn't for you, we also have free growth resources. Reply 'RESOURCES'.",
      "Last check, {{first_name}}! Free audit offer ends soon. Reply 'LAST' to get yours.",
      "Hi {{first_name}}, I'll stop after this. If you ever need a website audit or growth help, save this number. — Strategic Minds AI",
      "{{first_name}}, thanks for your time! We're here for audits, web development, and growth. Save this number. — Strategic Minds AI"
    ]
  },
];

export function getPlaybook(id: string): Playbook | undefined {
  return PLAYBOOKS.find(p => p.id === id);
}

export function listPlaybooks(): Playbook[] {
  return PLAYBOOKS;
}