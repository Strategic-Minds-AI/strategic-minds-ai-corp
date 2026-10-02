import express from 'express';
import cors from 'cors';
import { provisionSiteRouter } from './functions/provisionSite.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => res.json({ ok: true, service: 'strategic-minds-backend' }));

// Mount function routers — one per migrated Base44 function.
app.use('/functions/provisionSite', provisionSiteRouter);

// Future migrations mount here:
// app.use('/functions/runBusinessAudit', runBusinessAuditRouter);
// app.use('/functions/runSiteClone', runSiteCloneRouter);
// etc.

app.listen(PORT, () => {
  console.log(`Strategic Minds backend listening on :${PORT}`);
});