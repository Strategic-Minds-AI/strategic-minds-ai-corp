import ReactMarkdown from 'react-markdown';
import ToolCall from '@/components/swarm/ToolCall';
export default function AgentMessages({ messages, output }) {
  return <div className="space-y-4">{output && <ReactMarkdown className="swarm-markdown">{output}</ReactMarkdown>}{messages.filter(m => m.role === 'assistant').map((m,i) => <div key={m.id || i}>{m.content && <ReactMarkdown className="swarm-markdown">{typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}</ReactMarkdown>}{m.tool_calls?.map((t,j) => <ToolCall key={t.id || j} tool={t}/>)}</div>)}</div>;
}