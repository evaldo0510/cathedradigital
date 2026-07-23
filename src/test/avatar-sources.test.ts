import { describe, it, expect } from 'vitest';
import { getAvatarSources } from '@/lib/avatar-sources';

describe('getAvatarSources', () => {
  it('retorna null quando url ausente', () => {
    expect(getAvatarSources(null)).toBeNull();
    expect(getAvatarSources(undefined)).toBeNull();
    expect(getAvatarSources('')).toBeNull();
  });

  it('devolve apenas src para URLs externas (ex.: Google)', () => {
    const src = 'https://lh3.googleusercontent.com/a/AbC=s96-c';
    const out = getAvatarSources(src);
    expect(out).toEqual({ src });
  });

  it('reescreve URL Supabase para endpoint de render e gera srcSet responsivo', () => {
    const url = 'https://xyz.supabase.co/storage/v1/object/public/avatars/user/avatar.png';
    const out = getAvatarSources(url)!;
    expect(out.src).toContain('/storage/v1/render/image/public/avatars/user/avatar.png');
    expect(out.src).toContain('width=384');
    expect(out.srcSet).toMatch(/96w/);
    expect(out.srcSet).toMatch(/192w/);
    expect(out.srcSet).toMatch(/384w/);
    expect(out.sizes).toBe('(max-width: 640px) 96px, 128px');
  });

  it('preserva cache-busters e descarta parâmetros de transformação prévios', () => {
    const url =
      'https://xyz.supabase.co/storage/v1/object/public/avatars/user/avatar.png?t=1700000000&width=999&quality=50';
    const out = getAvatarSources(url)!;
    expect(out.src).toContain('t=1700000000');
    // não deve haver duplicação nem width=999
    expect(out.src).not.toContain('width=999');
    expect((out.src.match(/width=/g) ?? []).length).toBe(1);
  });

  it('funciona quando URL já usa endpoint render', () => {
    const url = 'https://xyz.supabase.co/storage/v1/render/image/public/avatars/user/avatar.png';
    const out = getAvatarSources(url)!;
    expect(out.srcSet).toContain('render/image/public');
  });
});
