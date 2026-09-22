// Public settings for the local Supabase stack only.
export const environment = {
  sentry: { dsn: "", environment: "development", release: "local" },
  supabase: {
    url: "http://127.0.0.1:54321",
    publishableKey: "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH",
  },
} as const;
