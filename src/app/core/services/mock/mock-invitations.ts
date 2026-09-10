import { InvitationService } from '../contracts/invitations';
import { findProfile, MockStore, requireUser } from './mock-store';
import { ServiceError } from '../service-error';
export class MockInvitations implements InvitationService {
 constructor(private readonly store: MockStore) {}
 listMine() { return this.store.read('invitations.listMine', s => { const id = requireUser(s); return s.invitations.filter(i => i.createdBy === id); }); }
 create() {
  return this.store.write('invitations.create', s => {
   const profile = findProfile(s, requireUser(s));
   if (profile.inviteCount < 1) throw new ServiceError('forbidden', 'No invitations remaining.');
   const invite = { id: crypto.randomUUID(), code: crypto.randomUUID().toUpperCase(), createdBy: profile.id, redeemedBy: null, expiresAt: null };
   profile.inviteCount--; s.invitations.push(invite); return invite;
  });
 }
}
