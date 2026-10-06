import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EMPTY = {
  company_name: '', contact_name: '', contact_email: '', contact_phone: '',
  service_type: '', contract_value: '', onboarding_status: 'New Lead',
  assigned_to: '', source: 'Inbound', website: '', industry: '', priority: 'medium'
};

export default function AddClientModal({ open, onClose, onAdd }) {
  const [form, setForm] = useState(EMPTY);
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.company_name) return;
    await onAdd({ ...form, contract_value: parseFloat(form.contract_value) || 0 });
    setForm(EMPTY);
  }
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} onClick={e => e.stopPropagation()} className="bg-card rounded-2xl max-w-lg w-full border border-border shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-foreground">New Client</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Add a client to the onboarding pipeline</p>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 px-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Company Name *</Label><Input className="mt-1.5 bg-muted border-border" placeholder="Oakwood Brewing Co." value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} required /></div>
                  <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Industry</Label><Input className="mt-1.5 bg-muted border-border" placeholder="Manufacturing" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Contact Name</Label><Input className="mt-1.5 bg-muted border-border" placeholder="Marcus Hale" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} /></div>
                  <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label><Input type="email" className="mt-1.5 bg-muted border-border" placeholder="marcus@company.com" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Phone</Label><Input className="mt-1.5 bg-muted border-border" placeholder="+1 555-0100" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} /></div>
                  <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Website</Label><Input className="mt-1.5 bg-muted border-border" placeholder="company.com" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Service Type</Label><Input className="mt-1.5 bg-muted border-border" placeholder="Brand Identity" value={form.service_type} onChange={e => setForm({ ...form, service_type: e.target.value })} /></div>
                  <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Contract Value ($)</Label><Input type="number" className="mt-1.5 bg-muted border-border" placeholder="8500" value={form.contract_value} onChange={e => setForm({ ...form, contract_value: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Assigned To</Label><Input className="mt-1.5 bg-muted border-border" placeholder="Team member" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} /></div>
                  <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Priority</Label>
                    <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                      <SelectTrigger className="mt-1.5 bg-muted border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>{['low', 'medium', 'high', 'urgent'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Source</Label>
                  <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                    <SelectTrigger className="mt-1.5 bg-muted border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>{['Referral', 'Inbound', 'Outbound', 'Repeat'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3 p-6 pt-4 flex-shrink-0 border-t border-border">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">Add Client</Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}