/** In-memory UI preview only. Selected explicitly by the ui-preview build configuration. */
import { ApplicationConfig } from "@angular/core";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { routes } from "../../src/app/app.routes";
import { createSeedState } from "../../src/app/core/data/seed-state";
import {
  MOCK_STORAGE,
  provideMockServices,
} from "../../src/app/core/services/mock/provide-mock-services";
import { moderation } from "../../src/app/core/services/mock/mock-moderation";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: "top" }),
    ),
    provideMockServices(),
    {
      provide: MOCK_STORAGE,
      useFactory: () => {
        const state = createSeedState();
        state.session = { userId: "u-maya", membership: "active" };
        const member = moderation(state).members.find(
          (member) => member.user_id === "u-maya",
        );
        if (member) member.role = "admin";
        let data = JSON.stringify(state);
        return {
          getItem: () => data,
          setItem: (_key: string, value: string) => {
            data = value;
          },
        };
      },
    },
  ],
};
