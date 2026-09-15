import {
  DestroyRef,
  InjectionToken,
  inject,
  makeEnvironmentProviders,
} from "@angular/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { environment } from "../../../../environments/environment";
import {
  MODERATION_SERVICE,
  AUTH_SERVICE,
  PROFILE_SERVICE,
  INVITATION_SERVICE,
  PLAYLIST_SERVICE,
  SOCIAL_SERVICE,
} from "../service-tokens";
import { SupabaseAuth } from "./supabase-auth";
import { SupabaseProfiles } from "./supabase-profiles";
import { SupabaseInvitations } from "./supabase-invitations";
import { SupabaseSocial } from "./supabase-social";
import { SupabasePlaylists } from "./supabase-playlists";
export const SUPABASE = new InjectionToken<SupabaseClient>("Supabase");
import { SupabaseModeration } from "./supabase-moderation";
export function provideSupabaseServices() {
  return makeEnvironmentProviders([
    {
      provide: MODERATION_SERVICE,
      useFactory: () => new SupabaseModeration(inject(SUPABASE)),
    },
    {
      provide: SUPABASE,
      useFactory: () =>
        createClient(
          environment.supabase.url,
          environment.supabase.publishableKey,
          {
            auth: {
              flowType: "pkce",
              detectSessionInUrl: false,
              persistSession: true,
              autoRefreshToken: true,
            },
          },
        ),
    },
    {
      provide: AUTH_SERVICE,
      useFactory: () => {
        const auth = new SupabaseAuth(inject(SUPABASE), location.origin);
        inject(DestroyRef).onDestroy(() => auth.destroy());
        return auth;
      },
    },
    {
      provide: PROFILE_SERVICE,
      useFactory: () => new SupabaseProfiles(inject(SUPABASE)),
    },
    {
      provide: INVITATION_SERVICE,
      useFactory: () => new SupabaseInvitations(inject(SUPABASE)),
    },
    {
      provide: SOCIAL_SERVICE,
      useFactory: () => new SupabaseSocial(inject(SUPABASE)),
    },
    {
      provide: PLAYLIST_SERVICE,
      useFactory: () =>
        new SupabasePlaylists(
          inject(SUPABASE),
          inject(PROFILE_SERVICE) as SupabaseProfiles,
        ),
    },
  ]);
}
