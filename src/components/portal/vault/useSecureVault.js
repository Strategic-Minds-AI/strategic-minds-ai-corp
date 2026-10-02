import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { deriveVaultKey, newSalt, encryptVaultValue, decryptVaultValue } from '@/components/portal/vault/vaultCrypto';
import { readVaultSettings, createVaultSettings, readVaultEntry, saveVaultEntry } from '@/components/portal/vault/secureVaultStore';
export default function useSecureVault() {
  const { user } = useAuth(), owner = user?.id;
  const key = useRef(null);
  const [settings, setSettings] = useState(undefined), [unlocked, setUnlocked] = useState(false), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  const lock = useCallback(() => { key.current = null; setUnlocked(false); }, []);
  useEffect(() => {
    let active = true; lock(); setSettings(undefined); setError('');
    readVaultSettings(owner).then(value => { if (active) setSettings(value); }).catch(failure => { if (active) setError(failure.message); });
    return () => { active = false; key.current = null; };
  }, [owner, attempt, lock]);
  useEffect(() => {
    if (!unlocked) return;
    let timer; const reset = () => { clearTimeout(timer); timer = setTimeout(lock, 5 * 60 * 1000); }; reset();
    window.addEventListener('pointerdown', reset); window.addEventListener('keydown', reset);
    window.addEventListener('pagehide', lock);
    return () => { clearTimeout(timer); window.removeEventListener('pointerdown', reset); window.removeEventListener('keydown', reset); window.removeEventListener('pagehide', lock); };
  }, [unlocked, lock]);
  async function unlock(password) {
    if (settings === undefined) throw new Error('Wait for vault access to finish loading.');
    if (!settings && password.length < 12) throw new Error('Use a vault password with at least 12 characters.');
    const salt = settings?.salt || newSalt(), candidate = await deriveVaultKey(password, salt);
    if (settings) {
      let proof; try { proof = await decryptVaultValue(candidate, settings.verifier, `${owner}:unlock`); } catch { throw new Error('Incorrect vault password, or the saved vault cannot be decrypted.'); }
      if (proof !== 'strategic-minds-vault-v1') throw new Error('Incorrect vault password.');
    } else {
      const verifier = await encryptVaultValue(candidate, 'strategic-minds-vault-v1', `${owner}:unlock`);
      setSettings(await createVaultSettings({ owner_id: owner, salt, verifier }));
    }
    key.current = candidate; setUnlocked(true);
  }
  function activeKey() { if (!key.current) throw new Error('Your vault is locked. Unlock it to continue.'); return key.current; }
  async function read(id) {
    const entry = await readVaultEntry(owner, id);
    return { ...entry, ...await decryptVaultValue(activeKey(), entry.payload, `${owner}:${entry.id}`) };
  }
  async function save(values) {
    const id = values.id || crypto.randomUUID();
    if (values.url && new URL(values.url).protocol !== 'https:') throw new Error('Use an HTTPS account address.');
    const payload = await encryptVaultValue(activeKey(), { username: values.username || '', secret: values.secret || '', url: values.url || '', notes: values.notes || '' }, `${owner}:${id}`);
    return saveVaultEntry(owner, { id, title: values.title.trim(), provider: values.provider.trim(), category: values.category, payload }, Boolean(values.id));
  }
  return { owner, settings, unlocked, error, unlock, lock, read, save, verify: (payload, context) => decryptVaultValue(activeKey(), payload, context), retry: () => setAttempt(value => value + 1) };
}