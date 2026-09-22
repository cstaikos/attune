// Public browser configuration. Never put a database password or secret key here.
export const environment = {
  sentry: { dsn: "", environment: "development", release: "local" },
  supabase: {
    url: "https://mtlfdrkrrqxdfsjcuery.supabase.co",
    publishableKey: "sb_publishable_BDKjQuvPkQQQ-tQ7JAvzIg_UZfAAU5m",
  },
} as const;
