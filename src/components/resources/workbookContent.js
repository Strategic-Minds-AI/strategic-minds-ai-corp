export const workbookChapters = [
  {
    title: 'Map your customer journey', outcome: 'Remove one point of friction between first contact and repeat business.',
    steps: ['Write down discovery, inquiry, decision, delivery, and repeat-purchase steps.', 'For each stage, record the customer question, owner, and typical wait.', 'Choose one bottleneck and test a simpler next step for two weeks.'],
    example: 'Illustrative example: A home-services company notices that new inquiries wait until the next morning for a reply. It adds an immediate acknowledgment with a booking link and assigns a person to handle unanswered questions. The test is response time and booked consultations, not the number of messages sent.',
    metric: 'Median time to first useful response; booked consultations / qualified inquiries.',
    exercise: 'Which stage creates the most friction? What small change will you test, and who owns it?',
    prompt: 'Act as a customer-experience planner. For a [business type] serving [audience], map five stages from discovery to repeat purchase. Use these anonymized observations: [observations]. Suggest one low-cost improvement per stage and a measurable two-week experiment. Identify assumptions; do not invent customer research.',
    service: 'CRM & Revenue Automation', serviceId: 'crm', deliverable: 'A connected lead-to-booking workflow with clear ownership and follow-up.'
  },
  {
    title: 'Make your value clear', outcome: 'Help the right prospect understand why your offer is relevant.',
    steps: ['Choose one audience and one costly problem you understand well.', 'Explain the outcome in plain language and add evidence you can substantiate.', 'Use the same promise on your homepage, inquiry form, and sales materials.'],
    example: 'Illustrative example: An operations consultant replaces "innovative solutions for everyone" with "We help independent clinics reduce appointment admin by connecting booking, reminders, and follow-up." A real demonstration supports the message; no unverified savings claim is added.',
    metric: 'Qualified inquiries / relevant page visits; track quality as well as volume.',
    exercise: 'We help [audience] solve [problem] through [approach], so they can [outcome].',
    prompt: 'Act as a positioning editor. Rewrite this offer for [audience]: [offer]. Produce three concise value propositions, one headline, and one call to action. Use only these verified facts: [facts]. Avoid superlatives, invented testimonials, and guaranteed results. Explain which audience each version fits.',
    service: 'Websites & Digital Experiences', serviceId: 'websites', deliverable: 'A focused landing page that connects clear messaging to a useful next action.'
  },
  {
    title: 'Follow up consistently', outcome: 'Give every qualified inquiry an owner and an appropriate next step.',
    steps: ['Track source, stage, owner, next action, and due date in one lead list.', 'Set a realistic first-response target and review overdue actions daily.', 'Use helpful follow-up messages and stop when someone declines or opts out.'],
    example: 'Illustrative example: A design studio tracks new inquiries in a shared CRM. Its owner sends a relevant project example after the first conversation, then asks whether a short scope call would help. The lead is paused after a decline instead of receiving an endless automated sequence.',
    metric: 'Inquiries with an assigned next action / open inquiries; replies / follow-ups.',
    exercise: 'Define the first-response target and draft one helpful follow-up with a clear next step.',
    prompt: 'Draft a three-message follow-up sequence for an interested [buyer type] who asked about [service]. Use [verified context], not personal or confidential details. Keep each message under 100 words, offer one useful idea, and make declining easy. Do not imply consent for unrelated marketing.',
    service: 'CRM & Revenue Automation', serviceId: 'crm', deliverable: 'A CRM pipeline with consent-aware follow-ups and visible sales activity.'
  },
  {
    title: 'Automate one repetitive task', outcome: 'Recover time without losing control of quality or exceptions.',
    steps: ['Choose a frequent task with predictable inputs and an accountable owner.', 'Map the trigger, steps, exceptions, approval, and rollback path.', 'Pilot with a small sample and compare errors and time before scaling.'],
    example: 'Illustrative example: A consultancy moves approved meeting action items into its project tracker. A person reviews the summary before tasks are created. If the source document is missing an owner or date, the workflow requests review rather than guessing.',
    metric: 'Illustration: 20 tasks x 10 minutes = 200 minutes/week before; subtract review and maintenance time from any estimated savings.',
    exercise: 'Name the trigger, required inputs, human approval point, failure path, and expected time saved.',
    prompt: 'Plan a safe automation for [repetitive task] using [current tools]. Describe trigger, inputs, transformations, approval, exceptions, monitoring, and rollback. Estimate effort using explicitly stated assumptions. Suggest a manual fallback and list what requires validation before deployment.',
    service: 'AI Automation & Agents', serviceId: 'automation', deliverable: 'A tested workflow with human oversight, error handling, and monitoring.'
  },
  {
    title: 'Connect your information', outcome: 'Make trusted information easier to find and safer to use.',
    steps: ['List the systems holding customer, project, financial, and policy information.', 'Choose a source of truth and an accountable owner for each category.', 'Define access, retention, and update rules before connecting systems.'],
    example: 'Illustrative example: An agency keeps contracts in one restricted folder and project status in its tracker. A shared customer identifier connects them. A knowledge assistant searches approved policies, cites sources, and does not expose private contracts to everyone.',
    metric: 'Time to find an approved answer; duplicate records; outdated documents found.',
    exercise: 'Choose one information category. Define its source of truth, owner, access rules, and review date.',
    prompt: 'Design a simple information map for a [business type] using [systems]. Recommend a source of truth for each data category, responsible owner, permissions, and update schedule. Use invented sample records only. Flag privacy and integration questions for human review.',
    service: 'AI Chatbots & Knowledge Systems', serviceId: 'knowledge', deliverable: 'A permission-aware knowledge system grounded in approved business sources.'
  },
  {
    title: 'Measure what matters', outcome: 'Use a small set of reliable measures to guide decisions.',
    steps: ['Choose one growth, one delivery, and one customer-health measure.', 'Write a definition, data source, owner, baseline, and review cadence.', 'Review changes with context; do not confuse correlation with causation.'],
    example: 'Illustrative example: A service business reviews qualified-inquiry conversion, median turnaround time, and repeat bookings. With 12 customers from 60 qualified inquiries, conversion is 20%. It checks lead quality and seasonality before concluding a new process caused the change.',
    metric: 'Conversion = customers / qualified inquiries x 100. Use the same period and definitions.',
    exercise: 'Define three measures, their current baselines, and the decision each will inform.',
    prompt: 'Build a three-metric scorecard for [business goal] using [available anonymized data]. Define each formula, source, review interval, and decision it supports. Include a worked example marked as hypothetical and flag data-quality limitations. Do not promise a financial return.',
    service: 'Data Intelligence & Decision Systems', serviceId: 'data', deliverable: 'An operational dashboard with consistent definitions and actionable reporting.'
  },
  {
    title: 'Build a responsible AI habit', outcome: 'Make AI useful through clear boundaries and human accountability.',
    steps: ['Start with a low-risk task and define approved tools and data boundaries.', 'Require a person to check facts, tone, bias, and appropriateness before use.', 'Record the prompt, review outcome, and lessons in a shared team playbook.'],
    example: 'Illustrative example: A team uses AI to outline a public FAQ using approved product information. A subject-matter expert verifies every answer before publication. Customer records, employee details, and confidential strategy are not pasted into an unapproved tool.',
    metric: 'Reviewed outputs meeting the quality checklist / reviewed outputs; track incidents separately.',
    exercise: 'Choose an approved use case, prohibited data, review owner, and escalation procedure.',
    prompt: 'Create a responsible-use checklist for [low-risk AI task] in a [business type]. Cover approved data, fact-checking, bias, human approval, recordkeeping, and escalation. Identify decisions that require qualified professional review. This is operational guidance, not legal advice.',
    service: 'AI Governance & Responsible AI', serviceId: 'governance', deliverable: 'A practical AI playbook, team training, and clear oversight responsibilities.'
  }
];