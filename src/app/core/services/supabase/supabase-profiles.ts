import { SupabaseClient } from "@supabase/supabase-js";
import { Profile } from "../../models/library";
import { ProfileService, ProfileUpdate } from "../contracts/profiles";
import { result, rows, userId } from "./database";

interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  practice: string;
  location: string;
  bio: string;
}
export class SupabaseProfiles implements ProfileService {
  constructor(private readonly client: SupabaseClient) {}
  private async map(row: ProfileRow): Promise<Profile> {
    const count = await result(
      this.client.rpc("profile_follower_count", { profile_id: row.id }),
    );
    return {
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      practice: row.practice,
      location: row.location,
      bio: row.bio,
      initials: (row.display_name || row.username).slice(0, 2).toUpperCase(),
      inviteCount: 0,
      followerCount: Number(count),
    };
  }
  async list() {
    return Promise.all(
      (await rows<ProfileRow>(this.client, "profiles")).map((row) =>
        this.map(row),
      ),
    );
  }
  async get(id: string) {
    const row = await result(
      this.client.from("profiles").select("*").eq("id", id).single(),
    );
    const profile = await this.map(row as ProfileRow);
    if (id === (await userId(this.client))) {
      const membership = await result(this.client.rpc("my_membership"));
      profile.inviteCount = membership?.[0]?.invites_remaining ?? 0;
    }
    return profile;
  }
  async updateMine(input: ProfileUpdate) {
    const id = await userId(this.client);
    await result(
      this.client
        .from("profiles")
        .update({
          display_name: input.displayName.trim(),
          practice: input.practice.trim(),
          location: input.location.trim(),
          bio: input.bio.trim(),
        })
        .eq("id", id)
        .select("id")
        .single(),
    );
    return this.get(id);
  }
}
