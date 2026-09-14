import { SupabaseClient } from "@supabase/supabase-js";
import { SocialService } from "../contracts/social";
import { result, rows } from "./database";
export class SupabaseSocial implements SocialService {
  constructor(private readonly client: SupabaseClient) {}
  async savedIds() {
    return (
      await rows<{ playlist_id: string }>(
        this.client,
        "saved_playlists",
        "playlist_id",
        "playlist_id",
      )
    ).map((row) => row.playlist_id);
  }
  async followedIds() {
    return (
      await rows<{ followed_id: string }>(
        this.client,
        "follows",
        "followed_id",
        "followed_id",
      )
    ).map((row) => row.followed_id);
  }
  private async set(
    table: string,
    column: string,
    id: string,
    enabled: boolean,
  ) {
    const response = await (enabled
      ? this.client
          .from(table)
          .insert(
            column === "playlist_id"
              ? { playlist_id: id }
              : { followed_id: id },
          )
      : this.client.from(table).delete().eq(column, id));
    if (enabled && response.error?.code === "23505") return;
    await result(Promise.resolve(response));
  }
  setSaved(id: string, saved: boolean) {
    return this.set("saved_playlists", "playlist_id", id, saved);
  }
  setFollowed(id: string, followed: boolean) {
    return this.set("follows", "followed_id", id, followed);
  }
}
