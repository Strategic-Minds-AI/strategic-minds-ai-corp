import { ArrowUpRight, Link2, ShieldCheck } from 'lucide-react';

export default function ChatGPTConnection() {
  return <section aria-labelledby="chatgpt-connection-title" className="rounded-xl border border-border bg-card p-6 md:p-9">
    <div className="mb-7 flex items-start gap-4">
      <span className="rounded-lg bg-muted p-3 text-primary"><Link2 size={23} /></span>
      <div>
        <p className="agency-eyebrow mb-2">CONNECTED WORKSPACE</p>
        <h2 id="chatgpt-connection-title" className="mb-2 text-2xl font-bold">Use your agency in ChatGPT</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">Your app has a sign-in-protected MCP connection. Connect it in ChatGPT to discuss and work with agency data from a real ChatGPT conversation.</p>
      </div>
    </div>
    <ol className="space-y-5 border-t border-border pt-6 text-sm leading-relaxed">
      <li className="flex gap-4"><span className="font-bold text-primary">01</span><span>Publish or republish this app, then copy its exact server address from the app’s MCP page.</span></li>
      <li className="flex gap-4"><span className="font-bold text-primary">02</span><span>In ChatGPT, open Apps, enable Developer mode, choose “Create app,” and paste that server address.</span></li>
      <li className="flex gap-4"><span className="font-bold text-primary">03</span><span>Sign in with your agency account and approve the requested access. Enable your app from ChatGPT’s chat composer before asking about agency data.</span></li>
    </ol>
    <div className="mt-8 flex flex-wrap items-center gap-4">
      <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer" className="agency-button">Open ChatGPT <ArrowUpRight size={17} /></a>
      <a href="https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary underline underline-offset-4">ChatGPT setup guide</a>
    </div>
    <p className="mt-7 flex items-start gap-2 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground"><ShieldCheck size={16} className="mt-0.5 shrink-0" />ChatGPT chats, projects, scheduled tasks, plugins, and account settings stay in ChatGPT; MCP connects ChatGPT to this app’s permitted tools, not the other way around. If the app’s exposed tools change, republish and reconnect ChatGPT.</p>
  </section>;
}