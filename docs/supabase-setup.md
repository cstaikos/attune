# Supabase development setup

## Local development

The project pins the Supabase CLI in `devDependencies`. Install dependencies with
`pnpm install`, then install and open Docker Desktop and finish its first-run setup.
Docker must be running before starting Supabase. No Supabase cloud login is needed.

From the repository root:

```sh
pnpm db:start   # First run downloads container images; allow several minutes
pnpm db:status  # Local service URLs and development keys
pnpm db:stop    # Stop services while keeping local data
```

Once started:

- Studio (database and Auth dashboard): http://127.0.0.1:54323
- Local API: http://127.0.0.1:54321
- Test email inbox: http://127.0.0.1:54324
- Postgres: port 54322

`supabase/config.toml` identifies this stack as `attune-local`, uses Postgres 17,
requires explicit Data API grants, and points Auth redirects at Angular on port
4200. Email confirmation is enabled; messages go to the local test inbox rather
than real recipients. Verify staging's Postgres major version before deploying
the first schema migration.

`pnpm db:reset` explicitly targets the local database. It erases local test data,
replays SQL migrations, and loads `supabase/seed.sql`. The seed file is currently
empty because the application schema is the next step. See `supabase/migrations/README.md`.

Starting this stack does not switch the Angular app away from its mock services.
The local API URL and keys will be wired into a separate development configuration
when the real adapters are implemented. Do not replace staging's settings with
localhost values for a Cloudflare build.

## Hosted staging

Project reference: `mtlfdrkrrqxdfsjcuery`

Public connection settings are recorded in `src/environments/environment.ts`.
These values are intended for the browser; database passwords, secret keys, and
service-role keys must never be added to that file.

The application still uses `provideMockServices()`. Recording these settings does
not activate shared authentication or database persistence.

## Next implementation steps

1. Start the initialized local stack once Docker is running.
2. Define the schema, explicit API grants, and row-level security policies in SQL
   migrations, with separate development seed data.
3. Implement the Supabase service adapters behind the existing service contracts,
   including secure invitation redemption and verified membership.
4. Test locally, authenticate the CLI with the project owner's account, link the
   staging project, and apply the migrations.
5. Switch the application providers once shared authentication and data access are
   ready together; verify the cross-device and authorization checks in the beta plan.

The publishable key allows client API requests subject to database permissions.
It does not authorize schema deployment or project administration. CLI deployment
will need the owner's Supabase login and any database credentials requested by the
CLI, entered locally rather than committed to the repository.
