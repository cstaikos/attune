import { ProfileService, ProfileUpdate } from '../contracts/profiles';
import { findProfile, MockStore, requireUser } from './mock-store';
import { ServiceError } from '../service-error';
export class MockProfiles implements ProfileService {
 constructor(private readonly store: MockStore) {}
 list() { return this.store.read('profiles.list', s => { requireUser(s); return s.profiles; }); }
 get(id: string) { return this.store.read('profiles.get', s => { requireUser(s); return findProfile(s, id); }); }
 updateMine(input: ProfileUpdate) {
  return this.store.write('profiles.updateMine', s => {
   const profile = findProfile(s, requireUser(s));
   if (!input.practice.trim()) throw new ServiceError('invalid-input', 'Practice is required.');
   profile.displayName = input.displayName.trim(); profile.practice = input.practice.trim();
   profile.location = input.location.trim(); profile.bio = input.bio.trim();
   profile.initials = (profile.displayName || profile.username).slice(0,2).toUpperCase();
   return profile;
  });
 }
}
