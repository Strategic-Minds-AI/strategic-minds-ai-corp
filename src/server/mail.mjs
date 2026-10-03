import MailComposer from 'npm:nodemailer@6.9.16/lib/mail-composer/index.js';
import { requireUser } from './auth.mjs';
import { createConnections } from './connections.mjs';
export async function sendEmail(request, payload) {
  await requireUser(request, true);
  const {accessToken} = await createConnections(request).getConnection('gmail');
  if (!payload.to || !payload.subject) throw new Error('Recipient and subject are required');
  if (payload.attachments?.length > 5) throw new Error('Up to five attachments are supported');
  const attachments=[];
  for(const attachment of payload.attachments || []) {
    if(!/\.(pdf|png|jpg|jpeg|gif|webp|csv|txt|md|ics|xlsx|docx)$/i.test(attachment.filename || ''))throw new Error('Unsupported attachment type');
    let content;
    if(attachment.content)content=Buffer.from(attachment.content,'base64');
    else {
      const url=new URL(attachment.file_url);
      if(url.origin!==new URL(process.env.SUPABASE_URL).origin || !url.pathname.startsWith('/storage/v1/'))throw new Error('Only this deployment’s storage files may be attached');
      const file=await fetch(url);if(!file.ok)throw new Error('Could not load attachment');content=Buffer.from(await file.arrayBuffer());
    }
    if(content.length>5*1024*1024)throw new Error('Attachment exceeds 5 MB');
    attachments.push({filename:attachment.filename,content});
  }
  if(attachments.reduce((total,item)=>total+item.content.length,0)>10*1024*1024)throw new Error('Attachments exceed 10 MB');
  const message = await new MailComposer({to:payload.to,subject:payload.subject,text:payload.text,html:payload.html || payload.body,attachments}).compile().build();
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({raw:message.toString('base64url')})});
  const data = await response.json(); if (!response.ok) throw new Error(data.error?.message || 'Email delivery failed');
  return {success:true,id:data.id};
}