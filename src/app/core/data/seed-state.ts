import { MockState } from '../services/mock/mock-state';
import { seedProfiles } from './seed-profiles';
import { seedPlaylists } from './seed-playlists';
export function createSeedState(): MockState {
 return structuredClone({ version: 1, profiles: seedProfiles, playlists: seedPlaylists,
  accounts: [], saved: [], follows: [], session: null,
  invitations: ['BETA-2026', 'GUIDE-2026', 'BREATH-2026'].map(code => ({
   id: code, code, createdBy: 'u-maya', redeemedBy: null, expiresAt: null,
  })),
 });
}
