import { Follow, Invitation, Playlist, Profile, SavedPlaylist, Session } from '../../models/library';
export interface MockAccount { userId: string; email: string; salt: string; hash: string; }
export interface MockState {
 version: 1; profiles: Profile[]; playlists: Playlist[]; accounts: MockAccount[];
 saved: SavedPlaylist[]; follows: Follow[]; invitations: Invitation[]; session: Session | null;
}
export interface MockStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; }
export const MOCK_STORAGE_KEY = 'resonance-angular-mock-v1';
