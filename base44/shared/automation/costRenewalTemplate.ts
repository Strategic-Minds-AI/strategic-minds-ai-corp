export const costRenewalStep = `      - name: Verify fresh zero-cost protection with signed workload identity
        id: cost
        run: |
          node --input-type=module <<'JS'
          import { appendFileSync } from 'node:fs';
          if (!process.env.STRATEGIC_API_URL) throw new Error('NOT_CONFIGURED: STRATEGIC_API_URL');
          const endpoint = process.env.STRATEGIC_API_URL.replace(/\\/$/, '') + '/functions/benchmarkCostRenewal';
          for (const body of [{}, { token: 'forged' }, { token: 'forged', approved: true }]) {
            const rejected = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
            if (rejected.status !== 403) throw new Error('Cost endpoint did not reject an unsigned grant.');
          }
          const identityUrl = new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);
          if (identityUrl.protocol !== 'https:' || !identityUrl.hostname.endsWith('.actions.githubusercontent.com')) throw new Error('Untrusted identity issuer URL.');
          identityUrl.searchParams.set('audience', endpoint);
          const identity = await fetch(identityUrl, { headers: { Authorization: 'Bearer ' + process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN }, signal: AbortSignal.timeout(30000) });
          if (!identity.ok) throw new Error('Signed workload identity unavailable.');
          const { value: token } = await identity.json();
          if (typeof token !== 'string' || !token) throw new Error('Empty workload identity.');
          console.log('::add-mask::' + token);
          const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }), signal: AbortSignal.timeout(60000) });
          if (!response.ok) throw new Error('Fresh cost verification rejected: ' + response.status);
          const result = await response.json();
          if (result.verified !== true || result.paid_execution_allowed !== false || result.run_id !== process.env.GITHUB_RUN_ID || !/^\\d{4}-\\d{2}-\\d{2}T[0-9:.]+Z$/.test(result.expires_at) || Date.parse(result.expires_at) <= Date.now()) throw new Error('Invalid cost-verification receipt.');
          appendFileSync(process.env.GITHUB_OUTPUT, 'expires_at=' + result.expires_at + '\\n');
          JS
`;