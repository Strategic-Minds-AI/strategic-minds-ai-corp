import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Monitor, Smartphone, Globe, RefreshCw, Plus, Pause, Play, XCircle, Check, Loader2, ShieldCheck, Clock, Cpu } from 'lucide-react';

export default function OperatorConsole() {
  const [devices, setDevices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pairing, setPairing] = useState(null);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [action, setAction] = useState({ device_id: '', action: 'screen_info', arguments: '{}' });
  const [commandResult, setCommandResult] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [devRes, taskRes, cmdRes] = await Promise.all([
        base44.functions.invoke('operatorDevices', { operation: 'list' }),
        base44.entities.OperatorTask.filter({}, { sort: '-created_date', limit: 50 }),
        base44.entities.ComputerCommand.filter({}, { sort: '-created_date', limit: 50 }),
      ]);
      setDevices(devRes.data?.devices || []);
      setTasks(taskRes.items || []);
      setCommands(cmdRes.items || []);
    } catch (e) {
      console.error('Operator refresh failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); const id = setInterval(refresh, 8000); return () => clearInterval(id); }, [refresh]);

  const pairDevice = async () => {
    if (!newDeviceName.trim()) return;
    try {
      const res = await base44.functions.invoke('operatorDevices', { operation: 'create', name: newDeviceName.trim() });
      setPairing(res.data);
      setNewDeviceName('');
      refresh();
    } catch (e) { console.error('Pair failed', e); }
  };

  const controlDevice = async (device_id, op) => {
    try { await base44.functions.invoke('operatorDevices', { operation: op, device_id }); refresh(); }
    catch (e) { console.error('Control failed', e); }
  };

  const sendAction = async () => {
    if (!action.device_id) return;
    try {
      let args = {};
      try { args = JSON.parse(action.arguments); } catch {}
      const res = await base44.functions.invoke('computerControl', {
        operation: 'send', device_id: action.device_id, action: action.action, arguments: args,
      });
      setCommandResult(res.data);
      refresh();
    } catch (e) { setCommandResult({ error: e.message }); }
  };

  const checkStatus = async (command_id) => {
    try {
      const res = await base44.functions.invoke('computerControl', { operation: 'status', command_id });
      setCommandResult(res.data);
      refresh();
    } catch (e) { console.error('Status failed', e); }
  };

  const onlineDevices = devices.filter(d => d.online && d.enabled);
  const activeCommands = commands.filter(c => ['queued', 'running'].includes(c.status));

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Local Command</h1>
          <p className="text-sm text-muted-foreground mt-1">Full autonomous control of frontend, backend, and all connected systems.</p>
        </div>
        <button onClick={refresh} className="xa-btn-outline" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatusCard icon={Monitor} label="Paired Devices" value={devices.length} color="blue" />
        <StatusCard icon={Check} label="Online" value={onlineDevices.length} color="green" />
        <StatusCard icon={Clock} label="Active Commands" value={activeCommands.length} color="amber" />
        <StatusCard icon={Cpu} label="Total Tasks" value={tasks.length} color="slate" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Device pairing */}
        <div className="xa-card p-5">
          <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2"><Monitor className="h-5 w-5 text-primary" /> Paired Devices</h2>
          <div className="flex gap-2 mb-4">
            <input className="xa-input flex-1" placeholder="Device name (e.g. My Laptop)" value={newDeviceName} onChange={e => setNewDeviceName(e.target.value)} />
            <button onClick={pairDevice} className="xa-btn-primary"><Plus className="h-4 w-4" /> Pair</button>
          </div>
          {pairing && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs dark:border-blue-800 dark:bg-blue-950">
              <p className="font-bold text-blue-700 dark:text-blue-300 mb-2">New pairing — save these credentials:</p>
              <pre className="whitespace-pre-wrap break-all text-blue-900 dark:text-blue-100">{JSON.stringify(pairing, null, 2)}</pre>
              <button onClick={() => setPairing(null)} className="mt-2 text-blue-600 underline">Dismiss</button>
            </div>
          )}
          <div className="space-y-2 max-h-64 overflow-y-auto xa-scroll">
            {devices.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No devices paired yet.</p> :
              devices.map(d => (
                <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.platform || 'Unknown'} · {d.online ? '🟢 Online' : '🔴 Offline'}</p>
                  </div>
                  <div className="flex gap-1">
                    {d.enabled ? <button onClick={() => controlDevice(d.id, 'pause')} className="rounded p-1.5 hover:bg-muted" title="Pause"><Pause className="h-4 w-4" /></button>
                      : <button onClick={() => controlDevice(d.id, 'resume')} className="rounded p-1.5 hover:bg-muted" title="Resume"><Play className="h-4 w-4" /></button>}
                    <button onClick={() => controlDevice(d.id, 'revoke')} className="rounded p-1.5 hover:bg-destructive/10" title="Revoke"><XCircle className="h-4 w-4 text-destructive" /></button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Send action */}
        <div className="xa-card p-5">
          <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2"><Cpu className="h-5 w-5 text-primary" /> Send Command</h2>
          <div className="space-y-3">
            <select className="xa-input" value={action.device_id} onChange={e => setAction({ ...action, device_id: e.target.value })}>
              <option value="">Select device…</option>
              {onlineDevices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className="xa-input" value={action.action} onChange={e => setAction({ ...action, action: e.target.value })}>
              {['screen_info','open_url','click','type_text','press_key','scroll','browser_health','browser_start','browser_action','browser_close','phone_status','phone_tap','phone_swipe','phone_text','phone_key'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <textarea className="xa-input" rows={3} placeholder='{"url":"https://..."} or {"x":100,"y":200}' value={action.arguments} onChange={e => setAction({ ...action, arguments: e.target.value })} />
            <button onClick={sendAction} disabled={!action.device_id} className="xa-btn-primary w-full">Queue Action</button>
            {commandResult && (
              <div className="rounded-lg border p-3 text-xs">
                {commandResult.error ? <p className="text-destructive">{commandResult.error}</p> :
                  <div>
                    <p className="font-medium">Command ID: {commandResult.command_id}</p>
                    <p className="text-muted-foreground">Status: {commandResult.status}</p>
                    {commandResult.result && <p className="mt-1 text-muted-foreground">Result: {commandResult.result}</p>}
                    {commandResult.command_id && <button onClick={() => checkStatus(commandResult.command_id)} className="mt-2 text-primary underline text-xs">Check status</button>}
                  </div>}
              </div>
            )}
          </div>
        </div>

        {/* Recent commands */}
        <div className="xa-card p-5 lg:col-span-2">
          <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Recent Commands</h2>
          <div className="space-y-1 max-h-64 overflow-y-auto xa-scroll">
            {commands.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No commands yet.</p> :
              commands.slice(0, 20).map(c => (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border p-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-xs font-medium">{c.action}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{new Date(c.created_date).toLocaleTimeString()}</span>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${c.status === 'succeeded' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : c.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : c.status === 'running' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'}`}>{c.status}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-800 dark:bg-blue-950">
        <ShieldCheck className="h-5 w-5 shrink-0 text-blue-600" />
        <div className="text-blue-900 dark:text-blue-100">
          <p className="font-medium">Autonomous capability enabled.</p>
          <p className="mt-1 text-xs">The agent can read/write all entities, execute backend functions, control the vault on explicit command, dispatch tasks to all agents, and provision projects. The Recursive Evolution Loop operates persistently every 10 minutes. Desktop GUI control requires the native companion — Docker mode supports browser and queue actions only.</p>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ icon: Icon, label, value, color }) {
  const colors = { blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950', green: 'text-green-600 bg-green-50 dark:bg-green-950', amber: 'text-amber-600 bg-amber-50 dark:bg-amber-950', slate: 'text-slate-600 bg-slate-50 dark:bg-slate-900' };
  return (
    <div className="xa-card flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[color]}`}><Icon className="h-5 w-5" /></div>
      <div><p className="text-2xl font-bold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
    </div>
  );
}