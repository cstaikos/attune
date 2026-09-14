import { ApplicationConfig } from "@angular/core";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { routes } from "./app.routes";
import { provideSupabaseServices } from "./core/services/supabase/provide-supabase-services";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: "top" }),
    ),
    provideSupabaseServices(),
  ],
};
