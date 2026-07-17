import type { ProfileAdapter, AtriumUser } from '../types';
import type { AtriumProfile } from '../../types';

/**
 * ProfileAdapterMock — permite trocar o perfil de teste via querystring:
 *   ?profile=visitor|recurrent|catechist|priest|seminarian
 * Default: 'recurrent'.
 *
 * CAT-022 — cache single-flight vive DENTRO do adapter.
 * Consumidores (hook + componentes) permanecem síncronos, sem estado local.
 * Quando trocarmos por adapter real, basta plugar React Query / SWR aqui —
 * a interface `getCurrent()` não muda.
 */

const VALID: AtriumProfile[] = ['visitor', 'recurrent', 'catechist', 'priest', 'seminarian'];

const NAMES: Record<AtriumProfile, string | undefined> = {
  visitor: undefined,
  recurrent: 'João',
  catechist: 'Catequista Ana',
  priest: 'Pe. Miguel',
  seminarian: 'Seminarista Pedro',
};

function readProfileFromUrl(): AtriumProfile {
  if (typeof window === 'undefined') return 'recurrent';
  const p = new URLSearchParams(window.location.search).get('profile');
  return (VALID.includes(p as AtriumProfile) ? p : 'recurrent') as AtriumProfile;
}

/** Cache in-adapter: uma promise por perfil detectado na URL. */
const cache = new Map<AtriumProfile, Promise<AtriumUser>>();

function invalidateOnUrlChange() {
  if (typeof window === 'undefined') return;
  const clear = () => cache.clear();
  window.addEventListener('popstate', clear);
  window.addEventListener('hashchange', clear);
}
invalidateOnUrlChange();

export const ProfileAdapterMock: ProfileAdapter = {
  getCurrent(): Promise<AtriumUser> {
    const profile = readProfileFromUrl();
    const hit = cache.get(profile);
    if (hit) return hit;
    const p = Promise.resolve<AtriumUser>({
      profile,
      displayName: NAMES[profile],
      isAuthenticated: profile !== 'visitor',
    });
    cache.set(profile, p);
    return p;
  },
};
