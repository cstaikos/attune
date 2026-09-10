import { Observable } from 'rxjs';
import { Profile, Session } from '../../models/library';
export interface Credentials { email: string; password: string; }
export interface Registration extends Credentials { username: string; practice: string; inviteCode: string; displayName?: string; }
export interface AuthService {
 readonly session$: Observable<Session | null>;
 signIn(credentials: Credentials): Promise<Session>;
 signUp(registration: Registration): Promise<Profile>;
 signOut(): Promise<void>;
}
