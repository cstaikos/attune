import { ApplicationConfig, ErrorHandler } from "@angular/core";
import { createErrorHandler } from "@sentry/angular";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { routes } from "./app.routes";
import { provideSupabaseServices } from "./core/services/supabase/provide-supabase-services";

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useValue: createErrorHandler() },
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: "top" }),
    ),
    provideSupabaseServices(),
  ],
};
