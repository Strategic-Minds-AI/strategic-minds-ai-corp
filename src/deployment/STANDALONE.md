# Strategic Minds AI: independent deployment

Run `npm run build:standalone` in the editor checkout. Deploy the resulting `.standalone` directory, not the editor checkout. Its package manifest contains no platform packages and its browser build uses only the standard React plugin. The root editor's mandatory tooling packages are not shipped or installed in this deployment.

## Deployment

1. Review and apply `schema.sql` to the owned Supabase database. It adds missing tables/columns, preserves entity access rules, enables RLS, installs profile creation, private/public storage buckets, server-side aggregation, and durable automation jobs. Existing records are not copied by the build: migrate data separately before switching production traffic. Existing profiles and admin grants are retained.
2. Configure the server-only variables from `.env.example` in the owned hosting dashboard. Existing editor secrets are not automatically transferred. Never publish gateway, service-role, encryption or provider keys in browser-prefixed variables.
3. Deploy this directory to Vercel as a full-stack static/API project, or run `npm start` on Railway and host `dist` on Vercel. For the split deployment set `VITE_RAILWAY_API_URL` before rebuilding and set CORS `ALLOWED_ORIGINS` to the frontend origin.
4. Set `APP_URL` to the frontend origin and `API_URL` to the full backend base. Add the frontend auth callback and reset-password URLs to Supabase's allowed redirect URLs. Set `JOB_OWNER_ID` to an existing approved admin profile; cron does not invent an admin identity. Set `CRON_SECRET` for the Vercel cron, or `ENABLE_SCHEDULER=true` on the always-on Railway backend (not both).
5. Google accounts must be reauthorized on this deployment. Tokens stored by another platform are not copied, exposed or reused. Register `API_URL/connections/callback` with the owner's Google OAuth client. GitHub/Supabase management and other provider connections need their own securely stored credentials; until connected they return `NOT_CONFIGURED`, not fake completion.
6. Update Stripe/Twilio and worker callback URLs to `API_URL/functions/<name>`. Transfer the existing app identifier to `APP_ID` to maintain checkout metadata and signatures. Keep the same Stripe endpoint/signing secret when updating an existing endpoint. Twilio signatures are checked before processing.

## Routing and gateway

All browser function and integration requests use one owned transport. No SDK, platform-hosted functions, agents, storage, workflow runner, connector tokens or integration-credit fallback is used by the standalone runtime. Existing function names are compiled to local handlers; nested calls dispatch in-process while retaining validated identity. Text, structured extraction, image generation, speech, transcription, video and agent tool loops use the owner's Vercel AI Gateway. Generated media is stored in Supabase. Independent Google OAuth credentials are encrypted at rest; unavailable integrations report explicit configuration errors.

For video generation use the always-on Railway backend or a Vercel plan that permits the configured long-running function duration; do not deploy a function-duration limit exceeding your hosting plan. The generated Vercel manifest can be adjusted to that plan before deployment.

`dependency-audit.json` records the compiled handler/schema inventory and external runtime packages. An emitted bundle containing a platform SDK dependency makes the build fail. This is a deployment build audit, not certification that production secrets, data migration or provider callbacks have been completed.