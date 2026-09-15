import {
  EnvironmentProviders,
  InjectionToken,
  makeEnvironmentProviders,
} from "@angular/core";
import {
  MODERATION_SERVICE,
  AUTH_SERVICE,
  PLAYLIST_SERVICE,
  PROFILE_SERVICE,
  SOCIAL_SERVICE,
  INVITATION_SERVICE,
} from "../service-tokens";
import { MockStorage } from "./mock-state";
import { MockStore } from "./mock-store";
import { MockControls } from "./mock-controls";
import { MockAuth } from "./mock-auth";
import { MockPlaylists } from "./mock-playlists";
import { MockProfiles } from "./mock-profiles";
import { MockSocial } from "./mock-social";
import { MockInvitations } from "./mock-invitations";
export const MOCK_STORAGE = new InjectionToken<MockStorage>("MockStorage");
import { MockModeration } from "./mock-moderation";
export function provideMockServices(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: MODERATION_SERVICE,
      useFactory: (store: MockStore) => new MockModeration(store),
      deps: [MockStore],
    },
    {
      provide: MOCK_STORAGE,
      useFactory: (): MockStorage => ({
        getItem: (key) => localStorage.getItem(key),
        setItem: (key, value) => localStorage.setItem(key, value),
      }),
    },
    { provide: MockControls, useFactory: () => new MockControls() },
    {
      provide: MockStore,
      useFactory: (storage: MockStorage, controls: MockControls) =>
        new MockStore(storage, controls),
      deps: [MOCK_STORAGE, MockControls],
    },
    {
      provide: AUTH_SERVICE,
      useFactory: (store: MockStore) => new MockAuth(store),
      deps: [MockStore],
    },
    {
      provide: PLAYLIST_SERVICE,
      useFactory: (store: MockStore) => new MockPlaylists(store),
      deps: [MockStore],
    },
    {
      provide: PROFILE_SERVICE,
      useFactory: (store: MockStore) => new MockProfiles(store),
      deps: [MockStore],
    },
    {
      provide: SOCIAL_SERVICE,
      useFactory: (store: MockStore) => new MockSocial(store),
      deps: [MockStore],
    },
    {
      provide: INVITATION_SERVICE,
      useFactory: (store: MockStore) => new MockInvitations(store),
      deps: [MockStore],
    },
  ]);
}
