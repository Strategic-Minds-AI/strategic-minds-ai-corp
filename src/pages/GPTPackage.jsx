import React from 'react';
import { Download, FileText, Copy, Check, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

import instructions from '@/gpt-package/SwarmNexus_Instructions.md?raw';
import agents from '@/gpt-package/SwarmNexus_Agent_Library.md?raw';
import workflows from '@/gpt-package/SwarmNexus_Workflows.md?raw';
import skills from '@/gpt-package/SwarmNexus_Skills_Capabilities.md?raw';
import architecture from '@/gpt-package/SwarmNexus_Architecture.md?raw';
import openapiSchema from '@/gpt-package/SwarmNexus_OpenAPI_Schema.yaml?raw';
import computerUse from '@/gpt-package/SwarmNexus_Computer_Use.md?raw';
import dockerOrch from '@/gpt-package/SwarmNexus_Docker_Orchestration.md?raw';
import persistenceMemory from '@/gpt-package/SwarmNexus_Persistence_Memory.md?raw';

const FILES = [
  { name: 'SwarmNexus_Instructions.md', label: 'Master Instructions', description: 'Paste this into the Instructions field AND upload as a knowledge file. This is the core orchestrator prompt.', content: instructions, type: 'text/markdown', priority: true },
  { name: 'SwarmNexus_Agent_Library.md', label: 'Agent Library (50+ Specialists)', description: 'Full profiles for 50+ specialist agents including computer use, Docker, K8s, ML, and more.', content: agents, type: 'text/markdown', priority: true },
  { name: 'SwarmNexus_Workflows.md', label: 'Predefined Workflows (24+)', description: '24+ workflow templates from deep research to full-stack builds, Docker deploys, and K8s setups.', content: workflows, type: 'text/markdown', priority: true },
  { name: 'SwarmNexus_Skills_Capabilities.md', label: 'Skills, Capabilities & Plugins (MAX)', description: '20+ skill definitions, computer use & Docker capabilities, 20 API actions, plugin matrix, and setup guide.', content: skills, type: 'text/markdown', priority: true },
  { name: 'SwarmNexus_Architecture.md', label: 'Architecture Specification (MAX)', description: 'Full architecture with computer use, Docker, persistence layers, scaling model, and end-to-end lifecycle.', content: architecture, type: 'text/markdown', priority: true },
  { name: 'SwarmNexus_Computer_Use.md', label: 'Computer Use Protocol (MAX)', description: 'Full browser & desktop automation protocols — navigate, click, type, screenshot, extract, shell, file ops.', content: computerUse, type: 'text/markdown', priority: true },
  { name: 'SwarmNexus_Docker_Orchestration.md', label: 'Docker & K8s Orchestration (MAX)', description: 'Full Docker build, run, compose, Kubernetes, security, and cleanup protocols.', content: dockerOrch, type: 'text/markdown', priority: true },
  { name: 'SwarmNexus_Persistence_Memory.md', label: 'Persistence & Memory System (MAX)', description: 'Three-layer memory (working, session, long-term), checkpointing, resume, and learning extraction.', content: persistenceMemory, type: 'text/markdown', priority: true },
  { name: 'SwarmNexus_OpenAPI_Schema.yaml', label: 'OpenAPI Actions Schema (MAX)', description: '40+ API actions: browser automation, desktop, Docker, K8s, file system, shell, DB, email, GitHub, Slack, TTS, video, vector search, and more.', content: openapiSchema, type: 'application/x-yaml', priority: false },
];

export default function GPTPackage() {
  const { toast } = useToast();
  const [downloaded, setDownloaded] = React.useState(new Set());
  const [copied, setCopied] = React.useState(null);

  const downloadFile = (file) => {
    const blob = new Blob([file.content], { type: file.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = file.name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(prev => new Set(prev).add(file.name));
    toast({ title: `Downloaded ${file.name}` });
  };

  const downloadAll = () => { FILES.forEach((file, i) => setTimeout(() => downloadFile(file), i * 300)); };

  const copyToClipboard = (file) => {
    navigator.clipboard.writeText(file.content);
    setCopied(file.name);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading">SwarmNexus GPT Package</h1>
              <p className="text-sm text-muted-foreground">Complete swarm architecture for your Custom GPT</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={downloadAll} size="lg" className="gap-2">
              <Download className="h-4 w-4" />
              Download All Files
            </Button>
            <span className="text-sm text-muted-foreground self-center">
              {FILES.length} files · {FILES.reduce((sum, f) => sum + f.content.length, 0).toLocaleString()} chars
            </span>
          </div>
        </div>

        <div className="mb-10 rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4 font-heading">Quick Setup Guide</h2>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span><span>Go to <strong className="text-foreground">chatgpt.com</strong> → <strong className="text-foreground">Explore</strong> → <strong className="text-foreground">Create a GPT</strong></span></li>
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span><span>Paste <strong className="text-foreground">SwarmNexus_Instructions.md</strong> content into the <strong className="text-foreground">Instructions</strong> field</span></li>
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span><span>Upload all <strong className="text-foreground">9 files</strong> to the <strong className="text-foreground">Knowledge</strong> section (8 .md + 1 .yaml)</span></li>
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span><span>Enable <strong className="text-foreground">Web Browsing</strong>, <strong className="text-foreground">Code Interpreter</strong>, <strong className="text-foreground">DALL-E</strong>, <strong className="text-foreground">File Upload</strong>, and <strong className="text-foreground">Vision</strong> in Capabilities</span></li>
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">5</span><span>Import <strong className="text-foreground">SwarmNexus_OpenAPI_Schema.yaml</strong> in <strong className="text-foreground">Actions</strong> and configure endpoints for browser automation, Docker, K8s, DB, and more</span></li>
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">6</span><span>Add conversation starters (see the Skills file for 12 suggestions including Docker, K8s, and full-stack builds)</span></li>
          </ol>
        </div>

        <div className="space-y-4">
          {FILES.map((file) => (
            <div key={file.name} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-start gap-3 min-w-0">
                  <FileText className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm font-heading">{file.label}</h3>
                      {file.priority && <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wide">Essential</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{file.description}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1 font-mono">{file.name} · {file.content.length.toLocaleString()} chars</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant={downloaded.has(file.name) ? 'secondary' : 'default'} onClick={() => downloadFile(file)} className="gap-2">
                  {downloaded.has(file.name) ? <Check className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                  {downloaded.has(file.name) ? 'Downloaded' : 'Download'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(file)} className="gap-2">
                  {copied === file.name ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === file.name ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}