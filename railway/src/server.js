import express from 'express';
import cors from 'cors';
import { provisionSiteRouter } from './functions/provisionSite.js';
import { requireAdmin, requireUser, resolveUser } from './lib/auth.js';
import { supabase } from './lib/supabase.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => res.json({ ok: true, service: 'strategic-minds-backend' }));

// ── Auth config endpoint (replaces Base44 getAuthConfig function) ──
app.get('/functions/getAuthConfig', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  });
});

// ── User invite (replaces base44.users.inviteUser) ──
app.post('/users/invite', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);
    if (error) return res.status(400).json({ error: error.message });
    // Set role on profile
    if (role) {
      await supabase.from('profiles').update({ role }).eq('id', data.user.id);
    }
    res.json({ user: data.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Integration: SendEmail (replaces base44.integrations.Core.SendEmail) ──
app.post('/integrations/sendEmail', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const { to, subject, body, html, text, from_name, attachments } = req.body;
  // TODO: Implement with Resend, SendGrid, or SMTP
  // For now, return a structured response
  res.json({ status: 'not_configured', message: 'Email sending not yet configured on Railway' });
});

// ── Integration: UploadPrivateFile ──
app.post('/integrations/uploadPrivateFile', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  // TODO: Implement with S3, Supabase Storage, or similar
  res.json({ error: 'File upload not yet configured on Railway' });
});

// ── Integration: UploadPublicFile ──
app.post('/integrations/uploadPublicFile', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  res.json({ error: 'File upload not yet configured on Railway' });
});

// ── Integration: CreateFileSignedUrl ──
app.post('/integrations/createSignedUrl', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const { file_uri } = req.body;
  // TODO: Generate signed URL from storage backend
  res.json({ signed_url: null, error: 'Signed URLs not yet configured on Railway' });
});

// ── Mount function routers — one per migrated Base44 function ──
app.use('/functions/provisionSite', provisionSiteRouter);

// Future migrations mount here:
// app.use('/functions/runBusinessAudit', runBusinessAuditRouter);
// app.use('/functions/runSiteClone', runSiteCloneRouter);
// etc.

app.listen(PORT, () => {
  console.log(`Strategic Minds backend listening on :${PORT}`);
});