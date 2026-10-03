// Function calls and public authentication setup share the same request routing.
import { getAccessToken } from '@/lib/supabaseClient';
import { runtimeRequest } from '@/lib/runtimeTransport';

export const functions = {
  async invoke(name, data = {}) {
    if (!/^[\w-]+$/.test(name)) throw new Error('Invalid function name');
    const token = name === 'getAuthConfig' ? null : await getAccessToken();
    return { data: await runtimeRequest(`/functions/${name}`, data, { token }) };
  },
};