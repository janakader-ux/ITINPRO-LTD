// Supabase currently issues 56-character SHA-224 hashes; accept SHA-256 hashes
// too for compatibility. Never put the hash into logs or browser storage.
export const portalTokenHashPattern = /^(?:[a-f0-9]{56}|[a-f0-9]{64})$/;
export function parsePortalLinkFragment(fragment: string) {
  const values = new URLSearchParams(fragment.replace(/^#/, ''));
  const tokenHash = values.get('token_hash') || '';
  const tokenType = values.get('type') || '';
  if (!portalTokenHashPattern.test(tokenHash) || !['magiclink','signup','invite'].includes(tokenType)) return null;
  return { tokenHash, tokenType };
}
