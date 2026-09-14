# Database migrations

Create a migration from the repository root:

```sh
pnpm exec supabase migration new describe_the_change
```

Keep schema changes, explicit API grants, and row-level security in the generated
SQL files. Enable RLS explicitly for each application table before granting access.
Apply migrations to a clean local database with `pnpm db:reset` (this erases local
test data). Add disposable fixtures to `supabase/seed.sql`.

The initial community migration defines profiles, playlists, comments, listening
reports, saves, follows, private memberships, and hashed invitations. See
`docs/database-schema.md` for access rules, RPCs, and adapter integration notes.

Use `pnpm db:migrate` to apply pending migrations without resetting local data,
`pnpm db:test` for rollback-isolated permission tests, and `pnpm db:lint` to check
SQL functions. These scripts target local Supabase; nothing is deployed remotely.
