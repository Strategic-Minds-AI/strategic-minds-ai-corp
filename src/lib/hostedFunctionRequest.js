// Hosted functions use the SDK's application and deployment-version routing.
// Imported only in hosted builds; the independent release excludes this module.
let modules;
export default async function hostedFunctionRequest(name, payload, token) {
  modules ||= Promise.all([import('@base44/sdk'), import('@/lib/app-params')]);
  const [{ createClient }, { appParams }] = await modules;
  if (!appParams.appId) throw Object.assign(new Error('The hosted application connection is not configured.'), { code: 'NOT_CONFIGURED' });
  const client = createClient({
    appId: appParams.appId,
    serverUrl: '',
    appBaseUrl: appParams.appBaseUrl || '',
    functionsVersion: appParams.functionsVersion,
    token: token || appParams.token || undefined,
    requiresAuth: false,
    analytics: { enabled: false },
  });
  const { data } = await client.functions.invoke(name, payload || {});
  return data;
}