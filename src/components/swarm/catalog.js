import { Network, Code2, Globe, Layers, ShieldCheck, BarChart3, PenLine, Briefcase, Compass, Sparkles } from 'lucide-react';
export const presets = {
  general: { name: 'General purpose', icon: Sparkles, instructions: 'Give practical, concise results. State assumptions and next steps.' },
  research: { name: 'Deep research', icon: Globe, instructions: 'Prioritize primary sources, cite evidence, compare alternatives and flag uncertainty.' },
  engineering: { name: 'Build & review', icon: Code2, instructions: 'Prioritize correctness, maintainability and security. Include a verification plan; never claim unrun tests passed.' }
};
const rows = [
  ['orchestrator','OpenFang Swarm Lead','Break down objectives and map the path forward.','Frontier',Network,'swarm_lead'],
  ['coder','Code Interpreter','Write, review and reason about code.','Smart',Code2,'code_analyst'],
  ['researcher','Web Search','Find current information and cite the evidence.','Smart',Globe,'web_researcher'],
  ['architect','Architect','Design systems and evaluate technical trade-offs.','Frontier',Layers],
  ['security-auditor','Security Auditor','Review supplied code and map security risks.','Frontier',ShieldCheck],
  ['code-reviewer','Code Reviewer','Review correctness, performance and maintainability.','Smart',Code2],
  ['data-scientist','Data Scientist','Design analyses and explain statistical methods.','Smart',BarChart3],
  ['debugger','Debugger','Trace problems in supplied code and propose fixes.','Smart',Code2],
  ['analyst','Analyst','Turn evidence into actionable insights.','Smart',BarChart3],
  ['test-engineer','Test Engineer','Design test cases and write test code.','Smart',Code2],
  ['legal-assistant','Legal Assistant','Explain legal concepts; not professional legal advice.','Smart',Briefcase],
  ['planner','Planner','Turn a goal into milestones and priorities.','Balanced',Layers],
  ['writer','Writer','Draft and refine clear, purposeful writing.','Balanced',PenLine],
  ['doc-writer','Documentation Writer','Create guides, references and technical documentation.','Balanced',PenLine],
  ['devops-lead','DevOps Lead','Plan deployment, reliability and infrastructure.','Balanced',Layers],
  ['assistant','Assistant','Organize information and help with everyday tasks.','Balanced',Sparkles],
  ['email-assistant','Email Assistant','Draft replies and summarize supplied emails.','Balanced',PenLine],
  ['social-media','Social Media','Plan content and draft social posts.','Balanced',PenLine],
  ['customer-support','Customer Support','Draft helpful responses to customer questions.','Balanced',Briefcase],
  ['sales-assistant','Sales Assistant','Prepare pitches, outreach and sales plans.','Balanced',Briefcase],
  ['recruiter','Recruiter','Draft role descriptions and interview questions.','Balanced',Briefcase],
  ['meeting-assistant','Meeting Assistant','Summarize supplied notes and extract action items.','Balanced',PenLine],
  ['ops','Operations','Analyze supplied operational information.','Fast',BarChart3],
  ['hello-world','Hello World','A lightweight general-purpose starting point.','Fast',Sparkles],
  ['translator','Translator','Translate text while preserving tone and intent.','Fast',Globe],
  ['tutor','Tutor','Explain concepts and build guided practice.','Fast',Sparkles],
  ['health-tracker','Health Guide','Explain wellness information; not medical advice.','Fast',Compass],
  ['personal-finance','Personal Finance','Explain budgeting concepts; not financial advice.','Fast',BarChart3],
  ['travel-planner','Travel Planner','Research destinations and prepare itineraries.','Fast',Compass],
  ['home-automation','Home Automation','Plan automations without controlling devices.','Fast',Layers]
];
export const catalog = rows.map(([id,name,description,tier,icon,agent]) => ({id,name,description,tier,icon,agent:agent || 'swarm_specialist'}));
export const defaultAgents = ['orchestrator','coder','researcher'];
export const agentById = id => catalog.find(a => a.id === id);