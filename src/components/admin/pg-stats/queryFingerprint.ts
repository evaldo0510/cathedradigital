/**
 * Normaliza uma query SQL para um "fingerprint" estável,
 * agrupando variantes literais na mesma classe.
 *
 * - Colapsa strings literais para ?
 * - Colapsa números para ?
 * - Colapsa listas IN (...) para IN (?)
 * - Colapsa placeholders $N para ?
 * - Normaliza espaços e case de palavras-chave
 */
export function fingerprintQuery(q: string): string {
  if (!q) return '';
  let s = q.replace(/\s+/g, ' ').trim();
  // strings 'literal' e "literal"
  s = s.replace(/'([^']|'')*'/g, '?');
  s = s.replace(/\$\d+/g, '?');
  // numbers
  s = s.replace(/\b\d+(\.\d+)?\b/g, '?');
  // IN (?, ?, ...) -> IN (?)
  s = s.replace(/\bIN\s*\(\s*\?(\s*,\s*\?)*\s*\)/gi, 'IN (?)');
  // VALUES (?,?,...) -> VALUES (?)
  s = s.replace(/VALUES\s*\((\s*\?\s*(,\s*\?\s*)*)\)/gi, 'VALUES (?)');
  return s.trim();
}

export function shortFingerprint(fp: string, max = 140): string {
  return fp.length > max ? fp.slice(0, max) + '…' : fp;
}
