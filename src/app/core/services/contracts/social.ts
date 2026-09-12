import { PlaylistId, UserId } from "../../models/library";
export interface SocialService {
  savedIds(): Promise<PlaylistId[]>;
  followedIds(): Promise<UserId[]>;
  setSaved(id: PlaylistId, saved: boolean): Promise<void>;
  setFollowed(id: UserId, followed: boolean): Promise<void>;
}
