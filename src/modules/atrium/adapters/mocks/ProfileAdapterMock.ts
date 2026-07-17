import type { ProfileAdapter, AtriumUser } from '../types';
import type { AtriumProfile } from '../../types';

/**
 * ProfileAdapterMock — permite trocar o perfil de teste via querystring:
 *   ?profile=visitor|recurrent|catechist|priest|seminarian
 * Default: 'recurrent'.
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

export const ProfileAdapterMock: ProfileAdapter = {
  async getCurrent(): Promise<AtriumUser> {
    const profile = readProfileFromUrl();
    return {
      profile,
      displayName: NAMES[profile],
      isAuthenticated: profile !== 'visitor',
    };
  },
};
