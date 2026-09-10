import { Invitation } from '../../models/library';
export interface InvitationService {
 listMine(): Promise<Invitation[]>;
 create(): Promise<Invitation>;
}
