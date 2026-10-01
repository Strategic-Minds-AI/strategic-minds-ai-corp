import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { callAIGateway } from '../../shared/aiGateway.ts';
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
  }
];

async function executeTool(base44: any, name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case 'list_tasks': {
        const query: any = {};
        if (args.status) query.status = args.status;
        const res = await base44.entities.AgentTask.filter(query, { sort: '-created_date', limit: args.limit || 20, fields: ['agent_name', 'title', 'status', 'priority', 'task_type', 'domain'] });
        return JSON.stringify({ count: res.items.length, tasks: res.items });
      }
      case 'create_task': {
        const task = await base44.entities.AgentTask.create({
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
        const res = await base44.entities.Domain.filter({}, { sort: '-created_date', limit: 50, fields: ['domain', 'status', 'health_score', 'sitemap_url', 'next_action'] });
        return JSON.stringify({ count: res.items.length, domains: res.items });
      }
      case 'list_system_builds': {
        const res = await base44.entities.SystemBuild.filter({}, { sort: '-created_date', limit: args.limit || 20, fields: ['title', 'build_type', 'status'] });
        return JSON.stringify({ count: res.items.length, builds: res.items });
      }
      case 'create_system_build': {
        const build = await base44.entities.SystemBuild.create({
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
        const res = await base44.entities.CrmContact.filter({}, { sort: '-created_date', limit: args.limit || 20, fields: ['name', 'email', 'status', 'phone'] });
        return JSON.stringify({ count: res.items.length, contacts: res.items });
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
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const agentName = body.agent_name;
    const history: Array<{ role: string; content: string }> = body.messages || [];

    if (!AGENT_INSTRUCTIONS[agentName]) {
      return Response.json({ error: `Unknown agent: ${agentName}` }, { status: 400 });
    }

    // Fetch live system context for the system prompt
    const [pendingRes, completedRes, domainRes, buildRes, batchRes] = await Promise.all([
      base44.entities.AgentTask.count({ status: 'pending' }),
      base44.entities.AgentTask.count({ status: 'completed' }),
      base44.entities.Domain.count({}),
      base44.entities.SystemBuild.count({}),
      base44.entities.BatchOperation.count({})
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
          const toolResult = await executeTool(base44, toolName, toolParams);
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