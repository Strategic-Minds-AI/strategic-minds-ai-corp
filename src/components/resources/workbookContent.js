export const workbookChapters = [
  {
    title: 'Map your customer journey',
    outcome: 'Plug the single biggest leak between first contact and repeat business.',
    secret: 'The 5-minute cliff: leads contacted within 5 minutes are 9x more likely to convert. But speed is not about hiring — it is about an instant, specific acknowledgment that buys trust while you prepare a real answer. Generic auto-replies kill the lead; specific ones warm it. Send: "Got your question about [exact topic]. [Name] will reply by [time] with a real answer, not a sales pitch." That one message outperforms every follow-up sequence most businesses ever build.',
    steps: [
      'Write down every stage: discovery, inquiry, decision, delivery, repeat purchase.',
      'For each stage, record the customer question, the owner, and the typical wait time.',
      'Find the stage with the longest gap — that is where 40-60% of your leads leak out.',
      'Build a specific, instant acknowledgment for that one stage. Test it for two weeks.'
    ],
    example: 'A home-services company notices new inquiries wait until morning for a reply — a 14-hour gap. It adds an instant text: "Got your request for a kitchen remodel estimate. Sarah will call you by 10am with real pricing." Response time drops to 9 minutes. Booked consultations rise 35% in 30 days. Cost: $0 and 20 minutes of setup.',
    metric: 'Median time to first useful response (target: under 5 minutes); booked consultations per qualified inquiry.',
    exercise: 'Which stage has the longest gap? What specific acknowledgment will you send instantly, and who owns the human follow-up?',
    prompt: 'Act as a customer-experience planner. For a [business type] serving [audience], map five stages from discovery to repeat purchase. Identify the stage with the highest drop-off and draft a specific, instant acknowledgment message for it. Include exact wording, timing, and owner. Do not invent customer research.',
    service: 'CRM & Revenue Automation',
    serviceId: 'crm',
    deliverable: 'A connected lead-to-booking workflow with instant acknowledgment and clear ownership.'
  },
  {
    title: 'Make your value clear',
    outcome: 'Make the right prospect instantly understand why your offer is for them.',
    secret: 'The constraint sells: the more you narrow your promise, the wider your market becomes. "We cut no-shows 30% for dental practices using automated reminders" beats "We help businesses grow" — because specific claims are believable and shareable, while vague claims are invisible. Your constraint (who it is for + what outcome + what mechanism) is not a limitation. It is your positioning. Most businesses are afraid to get specific because they think it shrinks their market. It does the opposite: it makes you referable.',
    steps: [
      'Choose one audience and one costly problem you understand deeply.',
      'State the outcome in plain language and attach evidence you can substantiate.',
      'Name the mechanism — how you produce the result, not just that you do.',
      'Use the same promise on your homepage, inquiry form, and sales materials — verbatim.'
    ],
    example: 'An operations consultant replaces "innovative solutions for everyone" with "We help independent clinics reduce appointment admin by connecting booking, reminders, and follow-up into one workflow." Referrals triple in 90 days because clients can finally explain what she does in one sentence.',
    metric: 'Qualified inquiries per relevant page visit; track lead quality, not just volume.',
    exercise: 'Complete this: We help [audience] solve [problem] through [mechanism], so they can [outcome].',
    prompt: 'Act as a positioning editor. Rewrite this offer for [audience]: [offer]. Produce three concise value propositions, one headline, and one call to action. Each must name the audience, outcome, and mechanism. Use only these verified facts: [facts]. Avoid superlatives and invented testimonials.',
    service: 'Websites & Digital Experiences',
    serviceId: 'websites',
    deliverable: 'A focused landing page that connects specific messaging to a useful next action.'
  },
  {
    title: 'Follow up consistently',
    outcome: 'Give every qualified inquiry an owner and a sequence that earns the meeting.',
    secret: 'Give before you ask: the 3-touch value sequence. Touch 1 — share one relevant insight they can use today. Touch 2 — share one proof (a case study, a metric, a result). Touch 3 — ask one simple question. Never request a meeting before delivering value twice. Most follow-up sequences fail because every touch asks for something. The trick: make each touch about the buyer, not about you. A sequence that gives value first converts 2-3x higher than one that leads with a meeting request.',
    steps: [
      'Track source, stage, owner, next action, and due date in one lead list.',
      'Set a realistic first-response target and review overdue actions daily.',
      'Build a 3-touch sequence: insight, proof, question — in that order.',
      'Pause immediately when someone declines or opts out. No endless sequences.'
    ],
    example: 'A design studio sends a relevant project example after the first call (insight), then a case study with a real metric (proof), then asks: "Would a 15-minute scope call help, or should I check back next quarter?" (question). Reply rates double versus their old sequence, which led with "Book your consultation now."',
    metric: 'Inquiries with an assigned next action per open inquiry; replies per follow-up sent.',
    exercise: 'Draft your 3-touch sequence: what insight, what proof, and what question will you send?',
    prompt: 'Draft a three-message follow-up sequence for an interested [buyer type] who asked about [service]. Use [verified context]. Each message under 100 words. Touch 1: one useful insight. Touch 2: one proof point. Touch 3: one simple question. Make declining easy. Do not imply consent for unrelated marketing.',
    service: 'CRM & Revenue Automation',
    serviceId: 'crm',
    deliverable: 'A CRM pipeline with consent-aware, value-first follow-ups and visible sales activity.'
  },
  {
    title: 'Automate one repetitive task',
    outcome: 'Recover time without losing control of quality or creating silent failures.',
    secret: 'Automate the exceptions, not the happy path: map what goes wrong before you automate what goes right. Build for the 20% edge cases, flag them for humans, and let the 80% flow. The number one automation failure is not a broken workflow — it is a silent error that compounds for weeks before anyone notices. A human checkpoint on exceptions costs minutes and prevents disasters. Design the failure path first, then the success path. If you cannot describe what happens when the automation breaks, you are not ready to ship it.',
    steps: [
      'Choose a frequent task with predictable inputs and an accountable owner.',
      'Map the trigger, steps, exceptions, approval point, and rollback path — in that order.',
      'Build the exception-handling and alerting first, then the happy path.',
      'Pilot with a small sample. Compare errors and time before and after. Then scale.'
    ],
    example: 'A consultancy automates meeting action items into its project tracker. But first it builds an exception check: if the source document is missing an owner or date, the workflow flags it for review instead of guessing. In the first month, 15% of items are flagged — caught before they became lost tasks. The 85% that flow through save 200 minutes per week.',
    metric: 'Time saved minus review and maintenance time; exceptions caught per week (a healthy number, not zero).',
    exercise: 'Name the trigger, required inputs, human approval point, failure path, and expected net time saved.',
    prompt: 'Plan a safe automation for [repetitive task] using [current tools]. Describe trigger, inputs, transformations, approval, exceptions, monitoring, and rollback. Design the failure path first. Estimate effort using explicitly stated assumptions. List what requires validation before deployment.',
    service: 'AI Automation & Agents',
    serviceId: 'automation',
    deliverable: 'A tested workflow with exception handling, human oversight, and monitoring built in from day one.'
  },
  {
    title: 'Connect your information',
    outcome: 'Make trusted information easier to find and safer to use.',
    secret: 'One home per record: every data type needs exactly one source of truth. Duplicates do not cause confusion — conflicting duplicates do. Define a golden record for each entity (customer, project, invoice) and make every other system reference it, not copy it. Sync is safer than duplicate. The moment two systems both own the same field, you have a data quality problem that grows silently. The trick: assign one system as the authority for each field, and every other system reads from it. This is the difference between a system that stays clean for years and one that rots in months.',
    steps: [
      'List every system holding customer, project, financial, and policy information.',
      'Choose one source of truth and one accountable owner for each data category.',
      'Define which system owns which fields — no field has two owners.',
      'Set access, retention, and update rules before connecting anything.'
    ],
    example: 'An agency keeps contracts in one restricted folder and project status in its tracker. A shared customer ID connects them. A knowledge assistant searches approved policies, cites sources, and never exposes private contracts to everyone. When a contract updates, the tracker references the new version — it does not copy it. No conflicting duplicates, ever.',
    metric: 'Time to find an approved answer; duplicate records; outdated documents found per quarter.',
    exercise: 'Choose one information category. Define its source of truth, owner, access rules, and review date.',
    prompt: 'Design a simple information map for a [business type] using [systems]. Recommend a source of truth for each data category, responsible owner, permissions, and update schedule. No field should have two owners. Use invented sample records only. Flag privacy and integration questions for human review.',
    service: 'AI Chatbots & Knowledge Systems',
    serviceId: 'knowledge',
    deliverable: 'A permission-aware knowledge system grounded in approved sources with one home per record.'
  },
  {
    title: 'Measure what matters',
    outcome: 'Use a small set of reliable measures to guide decisions — not vanity metrics.',
    secret: 'Leading beats lagging: revenue and churn are lagging indicators — you cannot change them, you can only watch them. Find your leading indicator: the one metric that predicts revenue 2-4 weeks out. For most service businesses, it is qualified inquiries this week. For product businesses, it is activation rate in the first session. Move the leading indicator and the lagging one follows. Most dashboards track lagging metrics because they feel important. They are not actionable. The trick: find the metric you can influence today that predicts the result you care about next month. Then build your dashboard around that.',
    steps: [
      'Choose one growth measure, one delivery measure, and one customer-health measure.',
      'For each: write the definition, data source, owner, baseline, and review cadence.',
      'Identify your leading indicator — the metric that predicts the lagging one.',
      'Review changes with context. Do not confuse correlation with causation.'
    ],
    example: 'A service business tracks qualified-inquiry conversion (20%), median turnaround time, and repeat bookings. But the leading indicator is qualified inquiries per week — when that rises, revenue follows in 3 weeks. When it drops, they act before revenue does. That 3-week head start is the difference between managing a dip and explaining one.',
    metric: 'Conversion = customers per qualified inquiries x 100. But track the leading indicator weekly, not the lagging one monthly.',
    exercise: 'Define your three measures. Which one is leading? What is its current baseline and what decision will it inform?',
    prompt: 'Build a three-metric scorecard for [business goal] using [available anonymized data]. Define each formula, source, review interval, and decision it supports. Identify which metric is leading and which is lagging. Include a worked example marked as hypothetical. Do not promise a financial return.',
    service: 'Data Intelligence & Decision Systems',
    serviceId: 'data',
    deliverable: 'An operational dashboard built around your leading indicator, not your vanity metrics.'
  },
  {
    title: 'Build a responsible AI habit',
    outcome: 'Make AI useful through clear boundaries and human accountability.',
    secret: 'The three decision lanes: sort every decision in your workflow into clear-cut (automate fully), needs-judgment (AI drafts, human reviews), and needs-expert (human decides, AI assists with research). The biggest AI failures come from automating the middle lane — decisions that feel routine but have edge cases that matter. A wrong meeting time is clear-cut. A wrong refund amount needs judgment. A wrong medical or legal recommendation needs an expert. When in doubt, keep a human checkpoint. It costs seconds and prevents the public failures that erode trust in AI for years. The goal is not to remove humans — it is to put them where they matter most.',
    steps: [
      'Start with a low-risk task and define approved tools and data boundaries.',
      'Sort decisions into the three lanes: clear-cut, needs-judgment, needs-expert.',
      'Require a person to check facts, tone, bias, and appropriateness before use in the middle lane.',
      'Record the prompt, review outcome, and lessons in a shared team playbook.'
    ],
    example: 'A team uses AI to outline a public FAQ using approved product information — clear-cut. A subject-matter expert verifies every answer before publication — needs-judgment. Customer records, employee details, and confidential strategy are never pasted into an unapproved tool — needs-expert, no AI. The playbook records what worked, what failed, and what is off-limits.',
    metric: 'Reviewed outputs meeting the quality checklist per reviewed outputs; track incidents separately and openly.',
    exercise: 'Choose an approved use case. Sort its decisions into the three lanes. Define prohibited data, review owner, and escalation procedure.',
    prompt: 'Create a responsible-use checklist for [low-risk AI task] in a [business type]. Sort decisions into clear-cut, needs-judgment, and needs-expert lanes. Cover approved data, fact-checking, bias, human approval, recordkeeping, and escalation. Identify decisions that require qualified professional review. This is operational guidance, not legal advice.',
    service: 'AI Governance & Responsible AI',
    serviceId: 'governance',
    deliverable: 'A practical AI playbook with the three-lane decision framework, team training, and clear oversight.'
  }
];

export const workbookSecrets = workbookChapters.map((c, i) => ({
  number: i + 1,
  title: c.title,
  secret: c.secret
}));