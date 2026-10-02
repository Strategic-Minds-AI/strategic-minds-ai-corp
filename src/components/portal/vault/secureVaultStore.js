import { getSupabaseAuth } from '@/lib/supabaseAuthClient';
export async function vaultRequest(table, operation) {
  const client = await getSupabaseAuth();
  const { data, error } = await operation(client.from(table));
  if (error) throw new Error(error.message);
  return data;
}
export function readVaultSettings(owner) { return vaultRequest('admin_vault_settings', query => query.select('owner_id,salt,verifier').eq('owner_id', owner).maybeSingle()); }
export function createVaultSettings(values) { return vaultRequest('admin_vault_settings', query => query.insert(values).select('owner_id,salt,verifier').single()); }
export function readVaultPage(owner, search, category, offset) {
  return vaultRequest('admin_vault_entries', query => {
    let request = query.select('id,title,provider,category,updated_at').eq('owner_id', owner);
    if (search.trim()) request = request.ilike('title', `%${search.trim().replace(/[\\%_]/g, '\\$&')}%`);
    if (category) request = request.eq('category', category);
    return request.order('updated_at', { ascending: false }).order('id').range(offset, offset + 50);
  });
}
export function readVaultEntry(owner, id) { return vaultRequest('admin_vault_entries', query => query.select('*').eq('owner_id', owner).eq('id', id).single()); }
export function saveVaultEntry(owner, entry, existing) {
  const values = { ...entry, owner_id: owner, updated_at: new Date().toISOString() };
  return vaultRequest('admin_vault_entries', query => (existing ? query.update(values).eq('owner_id', owner).eq('id', entry.id) : query.insert(values)).select('id').single());
}
export function deleteVaultEntry(owner, id) { return vaultRequest('admin_vault_entries', query => query.delete().eq('owner_id', owner).eq('id', id).select('id').single()); }
export async function exportVaultEntries(owner) {
  const entries = []; let offset = 0;
  while (true) {
    const page = await vaultRequest('admin_vault_entries', query => query.select('*').eq('owner_id', owner).order('id').range(offset, offset + 499));
    entries.push(...page); if (page.length < 500) return entries; offset += 500;
  }
}
export function restoreVaultEntries(entries) { return vaultRequest('admin_vault_entries', query => query.upsert(entries, { onConflict: 'id' })); }