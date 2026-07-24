/**
 * Avatar resolver — o bucket `avatars` é PRIVADO. Toda leitura
 * usa Signed URLs geradas sob demanda e cacheadas em memória.
 *
 * Aceita 3 formatos no campo `profiles.avatar_url`:
 *  1. Path do bucket (ex.: "userId/avatar.png") → gera signed URL.
 *  2. URL pública legada do Supabase (`/storage/v1/object/public/avatars/...`)
 *     → extrai o path e gera signed URL.
 *  3. URL externa (Google OAuth, Gravatar) → devolve como está.
 */
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AvatarSource =
  | { kind: 'external'; url: string }
  | { kind: 'path'; path: string }
  | null;

const LEGACY_PUBLIC = /\/storage\/v1\/(?:object|render\/image)\/public\/avatars\//;

export function resolveAvatarSource(value: string | null | undefined): AvatarSource {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    const m = trimmed.match(LEGACY_PUBLIC);
    if (m) {
      const rest = trimmed.slice(m.index! + m[0].length);
      const path = rest.split('?')[0];
      return path ? { kind: 'path', path } : null;
    }
    return { kind: 'external', url: trimmed };
  }
  // Path relativo do bucket
  const path = trimmed.replace(/^\/+/, '').split('?')[0];
  return path ? { kind: 'path', path } : null;
}

const cache = new Map<string, { url: string; expires: number }>();
const SIGN_TTL_S = 3600;
const CACHE_SAFETY_MS = 60_000;

async function signAvatar(path: string, size: number): Promise<string | null> {
  const key = `${path}|${size}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires - CACHE_SAFETY_MS > now) return hit.url;

  const { data, error } = await supabase.storage
    .from('avatars')
    .createSignedUrl(path, SIGN_TTL_S, {
      transform: { width: size, height: size, resize: 'cover', quality: 80 },
    });
  if (error || !data?.signedUrl) {
    if (import.meta.env.DEV) console.warn('[avatar] sign failed', path, error);
    return null;
  }
  cache.set(key, { url: data.signedUrl, expires: now + SIGN_TTL_S * 1000 });
  return data.signedUrl;
}

/**
 * Hook que devolve a URL exibível de um avatar (ou null enquanto assina).
 * @param value valor bruto salvo em `profiles.avatar_url`
 * @param size dimensão do quadrado renderizado (default 192)
 */
export function useAvatarUrl(value: string | null | undefined, size = 192): string | null {
  const source = resolveAvatarSource(value);
  const initial = source?.kind === 'external' ? source.url : null;
  const [url, setUrl] = useState<string | null>(initial);
  const lastKey = useRef<string>('');

  useEffect(() => {
    if (!source) { setUrl(null); lastKey.current = ''; return; }
    if (source.kind === 'external') { setUrl(source.url); lastKey.current = `ext|${source.url}`; return; }
    const key = `${source.path}|${size}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    let alive = true;
    signAvatar(source.path, size).then((signed) => { if (alive) setUrl(signed); });
    return () => { alive = false; };
  }, [source?.kind, (source as any)?.path, (source as any)?.url, size]);

  return url;
}
