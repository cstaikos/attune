import { SocialService } from "../contracts/social";
import {
  findPlaylist,
  findProfile,
  MockStore,
  requireUser,
} from "./mock-store";
import { ServiceError } from "../service-error";
export class MockSocial implements SocialService {
  constructor(private readonly store: MockStore) {}
  savedIds() {
    return this.store.read("social.savedIds", (s) => {
      const userId = requireUser(s);
      return s.saved
        .filter((x) => x.userId === userId)
        .map((x) => x.playlistId);
    });
  }
  followedIds() {
    return this.store.read("social.followedIds", (s) => {
      const userId = requireUser(s);
      return s.follows
        .filter((x) => x.followerId === userId)
        .map((x) => x.followedId);
    });
  }
  setSaved(id: string, saved: boolean) {
    return this.store.write("social.setSaved", (s) => {
      const userId = requireUser(s),
        playlist = findPlaylist(s, id);
      s.saved = s.saved.filter(
        (x) => x.userId !== userId || x.playlistId !== id,
      );
      if (saved) s.saved.push({ userId, playlistId: id });
      playlist.savedCount = s.saved.filter((x) => x.playlistId === id).length;
    });
  }
  setFollowed(id: string, followed: boolean) {
    return this.store.write("social.setFollowed", (s) => {
      const userId = requireUser(s),
        profile = findProfile(s, id);
      if (userId === id)
        throw new ServiceError("invalid-input", "You cannot follow yourself.");
      s.follows = s.follows.filter(
        (x) => x.followerId !== userId || x.followedId !== id,
      );
      if (followed) s.follows.push({ followerId: userId, followedId: id });
      profile.followerCount = s.follows.filter(
        (x) => x.followedId === id,
      ).length;
    });
  }
}
