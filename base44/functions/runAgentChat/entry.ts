import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { callAIGateway } from '../../shared/aiGateway.ts';
import { getSupabaseUser } from '../../shared/supabaseAuth.ts';
import { buildSystemPrompt, AGENT_INSTRUCTIONS } from '../../shared/agentInstructions.ts';

// Tool definitions (OpenAI format) — all agents get these tools
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_tasks',
      description: 'List AgentTask records from the action queue. Returns pending and recent tasks.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'failed'], description: 'Filter by status. Omit for all.' },
          limit: { type: 'number', description: 'Max tasks to return (default 20)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new AgentTask in the action queue. Use this to dispatch work to specialist agents.',
      parameters: {
        type: 'object',
        properties: {
          agent_name: { type: 'string', enum: ['orchestrator', 'growth_operator', 'code_architect', 'social_strategist', 'sales_engine', 'brand_guardian', 'replicator', 'swarm'], description: 'Which agent owns this task' },
          title: { type: 'string', description: 'Task title' },
          task_type: { type: 'string', description: 'Task category (e.g. google_connect, build_system, social_connect, growth_audit)' },
          priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low'] },
          domain: { type: 'string', description: 'Associated domain if applicable' },
          description: { type: 'string', description: 'Task details' }
        },
        required: ['agent_name', 'title', 'task_type']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_domains',
      description: 'List all registered domains in the Domain Registry.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_system_builds',
      description: 'List SystemBuild records — active and completed system build specs.',
      parameters: { type: 'object', properties: { limit: { type: 'number' } } }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_system_build',
      description: 'Create a new SystemBuild spec for the Code Architect to build.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'System name' },
          build_type: { type: 'string', enum: ['website', 'web_app', 'landing_page', 'api', 'automation', 'dashboard', 'tool', 'system'] },
          what_to_build: { type: 'string', description: 'What to build spec' },
          how_it_looks: { type: 'string', description: 'Visual design spec' },
          how_it_functions: { type: 'string', description: 'Functional spec' }
        },
        required: ['title', 'build_type']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_crm_contacts',
      description: 'List CRM contacts for pipeline management.',
      parameters: { type: 'object', properties: { limit: { type: 'number' } } }
    }
  },
  {
    type: 'function',
    function: {
      name: 'send_sms',
      description: 'Send an SMS message to a phone number via Twilio. The message is logged to CommsEvent and Conversation.',
      parameters: {
        type: 'object',
        properties: {
          to_number: { type: 'string', description: 'Recipient phone number in E.164 format (e.g. +17721234567)' },
          body: { type: 'string', description: 'Message body (max 1600 chars, no emojis)' },
          persona_id: { type: 'string', description: 'Optional AgentPersona ID to send as' }
        },
        required: ['to_number', 'body']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_conversations',
      description: 'List active SMS/text conversations from the Comms Inbox, with last message preview.',
      parameters: { type: 'object', properties: { limit: { type: 'number' } } }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_campaigns',
      description: 'List SMS/MMS/Voice outreach campaigns and their status.',
      parameters: { type: 'object', properties: { limit: { type: 'number' } } }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_campaign',
      description: 'Create a new SMS outreach campaign with a message template. Recipients are added separately.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Campaign name' },
          channel: { type: 'string', enum: ['sms', 'mms', 'voice', 'whatsapp'] },
          message_template: { type: 'string', description: 'Message body template (no emojis)' },
          persona_id: { type: 'string', description: 'Optional AgentPersona to send as' }
        },
        required: ['name', 'channel', 'message_template']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_vault_accounts',
      description: 'List the admin vault account directory — connected accounts and references (name, provider, management URL). Never returns credentials or secret values.',
      parameters: { type: 'object', properties: { limit: { type: 'number', description: 'Max accounts to return (default 50)' } } }
    }
  },
  {
    type: 'function',
    function: {
      name: 'provision_site',
      description: 'Provision a website deployment to Vercel using configured hosting secrets. Use when implementing a site into production hosting.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Site or project name' },
          repo_url: { type: 'string', description: 'GitHub repository URL to deploy from' },
          domain: { type: 'string', description: 'Custom domain to configure (optional)' },
          client_id: { type: 'string', description: 'Associated client ID if applicable' }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'provision_client_infrastructure',
      description: 'Provision full client infrastructure — GitHub repo, Vercel hosting, Railway backend, Supabase database, and domain — for a new client project. Use when onboarding a new client system end-to-end.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Infrastructure project name' },
          client_id: { type: 'string', description: 'Client ID to associate' },
          stack_type: { type: 'string', enum: ['static_site', 'vite_app', 'fullstack', 'backend_api', 'mobile_app'], description: 'Stack type to provision' },
          description: { type: 'string', description: 'What this system is for' }
        },
        required: ['name', 'client_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'bootstrap_supabase',
      description: 'Configure Supabase Google OAuth client, redirect URLs, and automatic user-profile creation triggers. Use when implementing authentication into a Supabase-backed system.',
      parameters: {
        type: 'object',
        properties: {
          dry_run: { type: 'boolean', description: 'Validate credentials without making changes (default true)' },
          google_client_id: { type: 'string', description: 'Google OAuth client ID (optional — uses app secret if omitted)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'domain_operations',
      description: 'Manage domain DNS, registration, and configuration via the GoDaddy API. Use when implementing a domain into a system.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['check_availability', 'register', 'configure_dns', 'list_domains'], description: 'Domain operation to perform' },
          domain: { type: 'string', description: 'Domain name (e.g. example.com)' }
        },
        required: ['action']
      }
    }
  }
];

async function executeTool(db: any, name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case 'list_tasks': {
        const query: any = {};
        if (args.status) query.status = args.status;
        const res = await db.entities.AgentTask.filter(query, { sort: '-created_date', limit: args.limit || 20, fields: ['agent_name', 'title', 'status', 'priority', 'task_type', 'domain'] });
        return JSON.stringify({ count: res.items.length, tasks: res.items });
      }
      case 'create_task': {
        const task = await db.entities.AgentTask.create({
          agent_name: args.agent_name,
          title: args.title,
          task_type: args.task_type,
          priority: args.priority || 'medium',
          domain: args.domain || '',
          description: args.description || '',
          autonomous: true,
          status: 'pending'
        });
        return JSON.stringify({ success: true, task_id: task.id, message: `Task created: ${args.title}` });
      }
      case 'list_domains': {
        const res = await db.entities.Domain.filter({}, { sort: '-created_date', limit: 50, fields: ['domain', 'status', 'health_score', 'sitemap_url', 'next_action'] });
        return JSON.stringify({ count: res.items.length, domains: res.items });
      }
      case 'list_system_builds': {
        const res = await db.entities.SystemBuild.filter({}, { sort: '-created_date', limit: args.limit || 20, fields: ['title', 'build_type', 'status'] });
        return JSON.stringify({ count: res.items.length, builds: res.items });
      }
      case 'create_system_build': {
        const build = await db.entities.SystemBuild.create({
          title: args.title,
          build_type: args.build_type,
          what_to_build: args.what_to_build || '',
          how_it_looks: args.how_it_looks || '',
          how_it_functions: args.how_it_functions || '',
          status: 'spec_submitted'
        });
        return JSON.stringify({ success: true, build_id: build.id, message: `System build created: ${args.title}` });
      }
      case 'list_crm_contacts': {
        const res = await db.entities.CrmContact.filter({}, { sort: '-created_date', limit: args.limit || 20, fields: ['name', 'email', 'status', 'phone'] });
        return JSON.stringify({ count: res.items.length, contacts: res.items });
      }
      case 'send_sms': {
        const fnRes = await db.functions.invoke('executeAutonomousAction', {
          action: 'send_sms',
          to_number: args.to_number,
          body: args.body,
          persona_id: args.persona_id || undefined
        });
        const d = fnRes?.data || {};
        if (d.error) return JSON.stringify({ error: d.error });
        return JSON.stringify({ success: true, message_sid: d.message_sid, conversation_id: d.conversation_id, message: `SMS sent to ${args.to_number}` });
      }
      case 'list_conversations': {
        const res = await db.entities.Conversation.filter({ status: { $in: ['active', 'idle'] } }, { sort: '-last_message_at', limit: args.limit || 20, fields: ['participant_identity', 'contact_name', 'last_message_preview', 'last_message_at', 'status', 'unread_count'] });
        return JSON.stringify({ count: res.items.length, conversations: res.items });
      }
      case 'list_campaigns': {
        const res = await db.entities.Campaign.filter({}, { sort: '-created_date', limit: args.limit || 20, fields: ['name', 'channel', 'status', 'sent_count', 'delivered_count', 'failed_count'] });
        return JSON.stringify({ count: res.items.length, campaigns: res.items });
      }
      case 'create_campaign': {
        const camp = await db.entities.Campaign.create({
          name: args.name,
          channel: args.channel,
          message_template: args.message_template,
          persona_id: args.persona_id || '',
          status: 'draft'
        });
        return JSON.stringify({ success: true, campaign_id: camp.id, message: `Campaign created: ${args.name}` });
      }
      case 'list_vault_accounts': {
        const res = await db.entities.VaultAccount.filter({}, { sort: '-created_date', limit: args.limit || 50, fields: ['name', 'provider', 'management_url', 'connector_id'] });
        return JSON.stringify({ count: res.items.length, accounts: res.items.map((a: any) => ({ name: a.name, provider: a.provider, management_url: a.management_url || '', connected: Boolean(a.connector_id) })) });
      }
      case 'provision_site': {
        const fnRes = await db.functions.invoke('provisionSite', { name: args.name, repo_url: args.repo_url || '', domain: args.domain || '', client_id: args.client_id || '' });
        const d = fnRes?.data || {};
        if (d.error) return JSON.stringify({ error: d.error });
        return JSON.stringify({ success: true, deployment_url: d.deployment_url || d.vercel_url || '', message: `Site provisioned: ${args.name}` });
      }
      case 'provision_client_infrastructure': {
        const fnRes = await db.functions.invoke('provisionClientInfrastructure', { name: args.name, client_id: args.client_id, stack_type: args.stack_type || 'vite_app', description: args.description || '' });
        const d = fnRes?.data || {};
        if (d.error) return JSON.stringify({ error: d.error });
        return JSON.stringify({ success: true, infrastructure_id: d.id || '', provision_status: d.provision_status || 'pending', message: `Client infrastructure provisioned: ${args.name}` });
      }
      case 'bootstrap_supabase': {
        const fnRes = await db.functions.invoke('bootstrapSupabase', { dry_run: args.dry_run !== false, google_client_id: args.google_client_id || '' });
        const d = fnRes?.data || {};
        if (d.error) return JSON.stringify({ error: d.error });
        return JSON.stringify({ success: true, dry_run: d.dry_run, steps: d.steps || [], message: d.dry_run ? 'Supabase credentials validated (dry run).' : 'Supabase OAuth and profiles configured.' });
      }
      case 'domain_operations': {
        const fnRes = await db.functions.invoke('domainOperations', { action: args.action, domain: args.domain || '' });
        const d = fnRes?.data || {};
        if (d.error) return JSON.stringify({ error: d.error });
        return JSON.stringify({ success: true, action: args.action, domain: args.domain || '', result: d });
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (e) {
    return JSON.stringify({ error: e.message });
  }
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getSupabaseUser(req);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    // Use service role for all entity/function calls — the Supabase JWT is not
    // recognized by Base44 RLS, so asServiceRole bypasses it (we already verified
    // admin role via getSupabaseUser above).
    const db = base44.asServiceRole;

    const body = await req.json();
    const agentName = body.agent_name;
    const history: Array<{ role: string; content: string }> = body.messages || [];

    if (!AGENT_INSTRUCTIONS[agentName]) {
      return Response.json({ error: `Unknown agent: ${agentName}` }, { status: 400 });
    }

    // Fetch live system context for the system prompt
    const [pendingRes, completedRes, domainRes, buildRes, batchRes] = await Promise.all([
      db.entities.AgentTask.count({ status: 'pending' }),
      db.entities.AgentTask.count({ status: 'completed' }),
      db.entities.Domain.count({}),
      db.entities.SystemBuild.count({}),
      db.entities.BatchOperation.count({})
    ]);

    const systemPrompt = buildSystemPrompt(agentName, {
      pendingTasks: pendingRes,
      completedTasks: completedRes,
      domains: domainRes,
      systemBuilds: buildRes,
      batchOps: batchRes
    });

    // Build messages for the API call
    const messages: any[] = [{ role: 'system', content: systemPrompt }];
    for (const m of history) {
      messages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
    }

    // Tool loop — up to 5 rounds
    let toolResults: any[] = [];
    for (let round = 0; round < 5; round++) {
      const result = await callAIGateway({
        model: 'anthropic/claude-sonnet-4-5',
        messages,
        temperature: 0.7,
        maxTokens: 2000
      });

      // The Vercel AI Gateway returns content as text (no native tool calling in this simple mode)
      // Check if the response contains JSON tool-call instructions
      const content = result.content;

      // Try to parse tool calls from the response (agents may output JSON tool calls in their content)
      const toolCallMatch = content.match(/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/);
      if (toolCallMatch) {
        try {
          const toolArgs = JSON.parse(toolCallMatch[1]);
          const toolName = toolArgs.name;
          const toolParams = toolArgs.arguments || toolArgs.params || {};
          const toolResult = await executeTool(db, toolName, toolParams);
          toolResults.push({ tool: toolName, result: JSON.parse(toolResult) });

          // Add the tool result to the conversation and continue the loop
          messages.push({ role: 'assistant', content });
          messages.push({ role: 'user', content: `Tool result for ${toolName}: ${toolResult}\n\nContinue your response based on this result. If you need to call another tool, use the same <tool_call> format. Otherwise, provide your final response to the user.` });
        } catch (e) {
          break;
        }
      } else {
        // No tool calls — return the final response
        return Response.json({
          agent_name: agentName,
          content,
          tool_results: toolResults,
          model: result.model,
          usage: result.usage
        });
      }
    }

    // If we exhausted the tool loop, return the last content
    return Response.json({
      agent_name: agentName,
      content: 'I completed the requested actions. See the task queue for updates.',
      tool_results: toolResults,
      model: 'anthropic/claude-sonnet-4-5'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}