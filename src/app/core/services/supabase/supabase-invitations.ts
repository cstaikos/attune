import { SupabaseClient } from "@supabase/supabase-js";
import { Invitation } from "../../models/library";
import { InvitationService } from "../contracts/invitations";
import { result, userId } from "./database";
interface InvitationRow {
  id: string;
  created_by: string;
  redeemed_by: string | null;
  expires_at: string | null;
}
export class SupabaseInvitations implements InvitationService {
  constructor(private readonly client: SupabaseClient) {}
  async listMine(): Promise<Invitation[]> {
    const data: InvitationRow[] = await result(
      this.client.rpc("my_invitations"),
    );
    return data.map((row) => ({
      id: row.id,
      createdBy: row.created_by,
      redeemedBy: row.redeemed_by,
      expiresAt: row.expires_at,
    }));
  }
  async create(): Promise<Invitation> {
    const createdBy = await userId(this.client);
    const data = await result(this.client.rpc("create_invitation"));
    if (!data?.[0]?.code)
      throw new Error("The invitation could not be created.");
    return {
      id: data[0].id,
      code: data[0].code,
      createdBy,
      redeemedBy: null,
      expiresAt: data[0].expires_at,
    };
  }
}
