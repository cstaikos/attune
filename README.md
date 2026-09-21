# Attune Commons

Public site: [www.attunecommons.com](https://www.attunecommons.com/).

## Install

Use Node **24.15.0** (`.node-version`) and **pnpm 11**. Run commands from the repository root.

```sh
pnpm install
```

## Run

### Local Supabase

Install and start Docker Desktop, then:

```sh
pnpm db:start
pnpm start:local
```

Open [localhost:4200](http://localhost:4200). First startup downloads the database containers and loads local fixtures.

- Log in as `admin@attune.local`, `maya@attune.local`, or `leo@attune.local`; password: `Attune-local-2026!`.
- For signup testing, confirm email in the [local inbox](http://127.0.0.1:54324), then redeem `DEV-ATTUNE-LOCAL-ONLY` (single use; expires 30 days after seeding).
- [Supabase Studio](http://127.0.0.1:54323); API: `http://127.0.0.1:54321`; Postgres: port `54322`.
- `pnpm db:status` shows local URLs/keys. `pnpm db:stop` stops containers and retains data. Ctrl+C stops Angular.

### Local frontend + hosted Supabase

```sh
pnpm start
```

Open [localhost:4200](http://localhost:4200). Uses the hosted project in `src/environments/environment.ts`; changes affect that database. No Docker required. Allow the localhost auth callback URLs in hosted Supabase when testing signup/recovery.

### UI preview without Supabase

```sh
pnpm exec ng serve --configuration ui-preview --port 4202
```

Open [localhost:4202](http://localhost:4202). Starts signed in as a mock administrator; reloading resets changes. No Docker or Supabase required.

## Configuration

| File | Purpose |
| --- | --- |
| `src/environments/environment.ts` | Hosted Supabase URL and publishable key; used by `pnpm start` and `pnpm build`. |
| `src/environments/environment.local.ts` | Local Supabase URL and publishable key; used by `start:local` and `build:local`. Update the key from `pnpm db:status` if needed. |
| `supabase/config.toml` | Local ports, Auth redirects, Postgres version (17), and seed files. Restart the local stack after changing settings. |
| `wrangler.jsonc` | Cloudflare Worker name (`attune-staging`), built assets directory, and SPA routing. |

Browser settings are compiled into the build; `.env` files are not wired into Angular configuration. Rebuild/redeploy after changing them. Only publishable keys belong here; keep service-role keys, database passwords, and SMTP credentials out of frontend code. Hosted Auth settings are managed separately in the Supabase dashboard.

## Database maintenance

```sh
pnpm exec supabase migration new describe_the_change
# Edit the generated SQL in supabase/migrations/, then:
pnpm db:migrate                         # Apply pending local migrations; retain data
pnpm db:test                            # Local database/RLS tests
pnpm exec supabase db lint --local      # Check SQL functions
```

`pnpm db:reset` **erases local data**, reapplies migrations, and loads all three configured seed files (bootstrap invitation, moderation fixtures, volume fixtures). Never apply these seed files to a hosted database. Keep schema changes in migrations.

## Deploy

See [staging and production deployment](docs/deployment.md) for setup, secrets,
database releases, and the production checklist.

```sh
pnpm deploy:staging:preview    # Build and validate without uploading
pnpm deploy:staging
pnpm deploy:production:preview
pnpm deploy:production
```

Production requires a separate Supabase project configured in
`deploy/production.json`. Secrets belong in ignored environment files or CI
secret storage.

## Administration

After the first administrator has verified their email and redeemed an invitation, run this in the hosted Supabase SQL editor using their Auth user ID:

```sql
update private.memberships
set role = 'admin'
where user_id = '<verified-member-uuid>' and status = 'active';
```

Sign in again and open `/admin`. Make subsequent access changes there so they are audited.

## Checks

```sh
pnpm typecheck
pnpm build
pnpm exec tsc -p tsconfig.mock-tests.json
node --test tests/*.test.cjs
pnpm db:test                            # Requires running local Supabase
```

`package.json` currently has no `test`, `format`, or `db:lint` scripts; `pnpm check` also fails because it calls the missing test script. Use the commands above. The live Supabase integration test is opt-in; see [verification setup](docs/supabase-setup.md#verification), using the explicit TypeScript compilation above instead of its stale `pnpm test` instruction.
