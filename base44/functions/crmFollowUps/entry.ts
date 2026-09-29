import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import MailComposer from 'npm:nodemailer@6.9.16/lib/mail-composer/index.js';
import { Buffer } from 'node:buffer';

export default async function(req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const due = await base44.asServiceRole.entities.CrmContact.filter({ follow_up_status: 'scheduled', follow_up_at: { $lte: new Date().toISOString() } }, 'follow_up_at', 25);
    if (!due.length) return Response.json({ sent: 0, failed: 0 });
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!profileRes.ok) throw new Error('Could not read Gmail sender');
    const { emailAddress } = await profileRes.json();
    let sent = 0, failed = 0;
    for (const contact of due) {
      if (!contact.email || !contact.follow_up_body || !contact.follow_up_subject) {
        await base44.asServiceRole.entities.CrmContact.update(contact.id, { follow_up_status: 'failed' });
        failed++; continue;
      }
      await base44.asServiceRole.entities.CrmContact.update(contact.id, { follow_up_status: 'sending' });
      try {
        const composer = new MailComposer({ from: { name: 'Strategic Minds AI', address: emailAddress }, to: contact.email, subject: contact.follow_up_subject, text: contact.follow_up_body });
        const message = await new Promise((resolve, reject) => composer.compile().build((error, bytes) => error ? reject(error) : resolve(bytes)));
        const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ raw: Buffer.from(message).toString('base64url') }) });
        if (!res.ok) { const detail = await res.json(); throw new Error(detail.error?.message || 'Gmail send failed'); }
        await base44.asServiceRole.entities.CrmContact.update(contact.id, { follow_up_status: 'sent', last_sent_at: new Date().toISOString(), status: 'contacted' });
        sent++;
      } catch (error) {
        console.error('Follow-up failed for contact', contact.id, error.message);
        await base44.asServiceRole.entities.CrmContact.update(contact.id, { follow_up_status: 'failed' });
        failed++;
      }
    }
    return Response.json({ sent, failed });
  } catch (error) {
    console.error('Scheduled follow-ups failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}