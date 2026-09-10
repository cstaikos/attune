import { Profile, UserId } from '../../models/library';
export type ProfileUpdate = Pick<Profile, 'displayName' | 'practice' | 'location' | 'bio'>;
export interface ProfileService {
 list(): Promise<Profile[]>;
 get(id: UserId): Promise<Profile>;
 updateMine(update: ProfileUpdate): Promise<Profile>;
}
