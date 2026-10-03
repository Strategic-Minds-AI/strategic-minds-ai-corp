// Shared tool definitions and execution for adminAssistant and runAgentChat.
// Both use the Vercel AI Gateway with native tool calling (base44/shared/aiGateway.ts).
// SYSTEM NOTATION: All LLM calls route through the Vercel AI Gateway — never the built-in InvokeLLM.

export const ASSISTANT_TOOLS = [
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
      description: 'Create a new SystemBuild spec for the Code Architect to build. Use this when the admin asks to build a website, web app, landing page, API, automation, dashboard, tool, or system.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'System name' },
          build_type: { type: 'string', enum: ['website', 'web_app', 'landing_page', 'api', 'automation', 'dashboard', 'tool', 'system'], description: 'What to build' },
          what_to_build: { type: 'string', description: 'What to build spec' },
          how_it_looks: { type: 'string', description: 'Visual design spec' },
          how_it_functions: { type: 'string', description: 'Functional spec' },
          what_it_connects_to: { type: 'string', description: 'Integration spec' },
          what_it_says: { type: 'string', description: 'Copy/messaging spec' },
          how_it_operates: { type: 'string', description: 'Operations spec' },
          deliver_to: { type: 'string', description: 'Delivery target spec' }
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
  },
  {
    type: 'function',
    function: {
      name: 'run_business_audit',
      description: 'Run a diagnostic business audit for a domain. Analyzes website presence, SEO, content, and revenue leaks. Returns findings and a health score.',
      parameters: {
        type: 'object',
        properties: {
          domain: { type: 'string', description: 'The domain to audit' },
          business_name: { type: 'string', description: 'Business name (optional)' }
        },
        required: ['domain']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_blog_post',
      description: 'Create a new blog post with title, excerpt, content, and slug. Use when the admin asks to write or publish a blog post.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Post title' },
          slug: { type: 'string', description: 'URL slug (auto-generated from title if omitted)' },
          excerpt: { type: 'string', description: 'Short summary' },
          content_markdown: { type: 'string', description: 'Post content in markdown' },
          categories: { type: 'string', description: 'Comma-separated categories' }
        },
        required: ['title', 'excerpt', 'content_markdown']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_project',
      description: 'Create a new project/case study with title, excerpt, content, and metrics. Use when the admin asks to add a project to the portfolio.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Project title' },
          slug: { type: 'string', description: 'URL slug (auto-generated from title if omitted)' },
          excerpt: { type: 'string', description: 'Short summary' },
          content_markdown: { type: 'string', description: 'Case study content in markdown' },
          categories: { type: 'string', description: 'Comma-separated categories' }
        },
        required: ['title', 'excerpt', 'content_markdown']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_operator_devices',
      description: 'List paired operator devices (desktop companions and cloud browsers) that can receive commands. Returns device name, platform, online status, and capabilities.',
      parameters: { type: 'object', properties: { limit: { type: 'number', description: 'Max devices to return (default 20)' } } }
    }
  },
  {
    type: 'function',
    function: {
      name: 'send_operator_command',
      description: 'Send a command to a paired operator device (open URL, click, type text, press key, scroll, browser action). The device executes it and returns a result.',
      parameters: {
        type: 'object',
        properties: {
          device_id: { type: 'string', description: 'Device ID from list_operator_devices' },
          action: { type: 'string', enum: ['open_url', 'click', 'type_text', 'press_key', 'scroll', 'browser_action', 'browser_health', 'screen_info'], description: 'Command action' },
          arguments: { type: 'object', description: 'Action arguments (url, x/y, text, key, etc.)', additionalProperties: true }
        },
        required: ['device_id', 'action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_operator_task',
      description: 'Create an autonomous operator task for a cloud browser or desktop companion to execute. The task is queued and picked up by the target device.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Task title' },
          instructions: { type: 'string', description: 'Detailed instructions for the operator' },
          target: { type: 'string', enum: ['computer', 'cloud_browser'], description: 'Where to run the task' }
        },
        required: ['title', 'instructions', 'target']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_operator_tasks',
      description: 'List operator tasks and their execution status.',
      parameters: { type: 'object', properties: { status: { type: 'string', enum: ['queued', 'running', 'completed', 'failed'] }, limit: { type: 'number' } } }
    }
  },
  {
    type: 'function',
    function: {
      name: 'gpt_sync',
      description: 'Send a message to the connected ChatGPT business account and receive GPT\'s response back. Enables bidirectional communication between this chat agent and GPT.',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Message to send to GPT' },
          thread_id: { type: 'string', description: 'Existing thread ID to continue a conversation (optional)' },
          instructions: { type: 'string', description: 'Optional system instructions for GPT' }
        },
        required: ['message']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_api_key',
      description: 'Generate a new API key that external apps can use to connect to this system. Returns the key value once.',
      parameters: {
        type: 'object',
        properties: {
          key_name: { type: 'string', description: 'Human-readable name for the key' },
          key_type: { type: 'string', enum: ['admin', 'user', 'vision_cortex'], description: 'admin=full access, user=read-only, vision_cortex=autonomous' },
          permissions: { type: 'array', items: { type: 'string' }, description: 'Permission scopes' }
        },
        required: ['key_name', 'key_type']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_agent_secrets',
      description: 'List all secrets stored in the Agent Key Store (names and metadata only — never exposes values). Use this to discover what credentials are available before retrieving one.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_secret',
      description: 'Retrieve the decrypted value of a secret from the Agent Key Store. Use this when a task requires an API key, token, or credential that the operator has securely stored. The value is returned in the result — use it for the API call and never echo it back to the user.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The secret name (e.g. OPENAI_API_KEY, STRIPE_SECRET_KEY). Case-insensitive.' }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_api_keys',
      description: 'List all API keys (without exposing full key values).',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_testimonial',
      description: 'Create a new customer testimonial with name, company, comment, and rating.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Customer name' },
          company: { type: 'string', description: 'Customer company or role' },
          comment: { type: 'string', description: 'Customer testimonial text' },
          rating: { type: 'number', description: 'Star rating 1-5 (default 5)' },
          image_url: { type: 'string', description: 'Customer portrait image URL (optional)' }
        },
        required: ['name', 'company', 'comment']
      }
    }
  }
];

export async function executeAssistantTool(db: any, name: string, args: any): Promise<string> {
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
          what_it_connects_to: args.what_it_connects_to || '',
          what_it_says: args.what_it_says || '',
          how_it_operates: args.how_it_operates || '',
          deliver_to: args.deliver_to || '',
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
          message: args.body,
          persona_id: args.persona_id || undefined
        });
        const d = fnRes?.data || {};
        if (d.error || d.ok === false) return JSON.stringify({ error: d.error || 'SMS delivery request failed.' });
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
      case 'run_business_audit': {
        const fnRes = await db.functions.invoke('runBusinessAudit', { domain: args.domain, business_name: args.business_name || '' });
        const d = fnRes?.data || {};
        if (d.error) return JSON.stringify({ error: d.error });
        return JSON.stringify({ success: true, audit_id: d.audit_id || d.id || '', health_score: d.health_score, message: `Business audit started for ${args.domain}` });
      }
      case 'create_blog_post': {
        const slug = args.slug || args.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const post = await db.entities.Post.create({
          title: args.title,
          slug,
          excerpt: args.excerpt,
          content_markdown: args.content_markdown,
          categories: args.categories || '',
          publish_date: new Date().toISOString(),
          display_order: 0
        });
        return JSON.stringify({ success: true, post_id: post.id, slug, message: `Blog post created: ${args.title}` });
      }
      case 'create_project': {
        const slug = args.slug || args.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const project = await db.entities.Project.create({
          title: args.title,
          slug,
          excerpt: args.excerpt,
          content_markdown: args.content_markdown,
          categories: args.categories || '',
          publish_date: new Date().toISOString(),
          display_order: 0
        });
        return JSON.stringify({ success: true, project_id: project.id, slug, message: `Project created: ${args.title}` });
      }
      case 'list_operator_devices': {
        const res = await db.entities.OperatorDevice.filter({ enabled: true }, { sort: '-last_seen', limit: args.limit || 20, fields: ['name', 'platform', 'last_seen', 'enabled', 'input_allowed', 'browser_configured'] });
        return JSON.stringify({ count: res.items.length, devices: res.items.map((d: any) => ({ id: d.id, name: d.name, platform: d.platform, last_seen: d.last_seen, online: d.last_seen ? (Date.now() - new Date(d.last_seen).getTime()) < 120000 : false, input_allowed: d.input_allowed, browser_configured: d.browser_configured })) });
      }
      case 'send_operator_command': {
        const fnRes = await db.functions.invoke('computerControl', { device_id: args.device_id, action: args.action, arguments: args.arguments || {} });
        const d = fnRes?.data || {};
        if (d.error) return JSON.stringify({ error: d.error });
        return JSON.stringify({ success: true, command_id: d.command_id, status: d.status, result: d.result || '', message: `Command ${args.action} sent to device ${args.device_id}` });
      }
      case 'create_operator_task': {
        const task = await db.entities.OperatorTask.create({
          title: args.title,
          instructions: args.instructions,
          target: args.target,
          status: 'queued',
          source: 'manual',
        });
        return JSON.stringify({ success: true, task_id: task.id, message: `Operator task queued: ${args.title}` });
      }
      case 'list_operator_tasks': {
        const query: any = {};
        if (args.status) query.status = args.status;
        const res = await db.entities.OperatorTask.filter(query, { sort: '-created_date', limit: args.limit || 20, fields: ['title', 'target', 'status', 'result', 'source'] });
        return JSON.stringify({ count: res.items.length, tasks: res.items });
      }
      case 'gpt_sync': {
        const fnRes = await db.functions.invoke('gptSync', { action: 'sync', message: args.message, thread_id: args.thread_id || null, instructions: args.instructions || '' });
        const d = fnRes?.data || {};
        if (d.error) return JSON.stringify({ error: d.error });
        return JSON.stringify({ success: true, gpt_response: d.gpt_response, thread_id: d.thread_id, bridge: d.bridge, message: 'GPT responded.' });
      }
      case 'generate_api_key': {
        const fnRes = await db.functions.invoke('manageApiKeys', { action: 'create', key_name: args.key_name, key_type: args.key_type, permissions: args.permissions || [] });
        const d = fnRes?.data || {};
        if (d.error) return JSON.stringify({ error: d.error });
        return JSON.stringify({ success: true, key_value: d.key?.key_value, key_prefix: d.key?.key_prefix, key_id: d.key?.id, message: `API key generated: ${args.key_name}. Store the key value securely — it won't be shown again.` });
      }
      case 'list_agent_secrets': {
        const fnRes = await db.functions.invoke('agentSecrets', { action: 'list' });
        const d = fnRes?.data || {};
        if (d.error) return JSON.stringify({ error: d.error });
        return JSON.stringify({ count: d.secrets.length, secrets: d.secrets });
      }
      case 'get_secret': {
        const fnRes = await db.functions.invoke('agentSecrets', { action: 'retrieve', name: args.name });
        const d = fnRes?.data || {};
        if (d.error) return JSON.stringify({ error: d.error });
        return JSON.stringify({ success: true, name: d.name, value: d.value, message: `Secret "${d.name}" retrieved. Use it for the API call and do not echo the value back.` });
      }
      case 'list_api_keys': {
        const fnRes = await db.functions.invoke('manageApiKeys', { action: 'list' });
        const d = fnRes?.data || {};
        if (d.error) return JSON.stringify({ error: d.error });
        return JSON.stringify({ count: d.keys.length, keys: d.keys });
      }
      case 'create_testimonial': {
        const testimonial = await db.entities.Testimonial.create({
          name: args.name,
          company: args.company,
          comment: args.comment,
          rating: args.rating || 5,
          image_url: args.image_url || '',
          display_order: 0,
          variant: 'default'
        });
        return JSON.stringify({ success: true, testimonial_id: testimonial.id, message: `Testimonial created for ${args.name}` });
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (e) {
    return JSON.stringify({ error: e.message });
  }
}