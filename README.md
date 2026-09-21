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

### 1. Hosted Supabase

For the currently configured staging project:

```sh
pnpm exec supabase login
pnpm exec supabase link --project-ref mtlfdrkrrqxdfsjcuery
pnpm exec supabase db push --dry-run
pnpm exec supabase db push
```

Review the dry run before pushing. For another environment, change the project reference and frontend configuration together. Push migrations before deploying the frontend; do not pass `--include-seed`. See [Supabase migration commands](https://supabase.com/docs/guides/local-development/cli-workflows).

For a new hosted project:

- Match the local Postgres major version (17).
- Set Auth **Site URL** to the deployed HTTPS origin. Allow `<origin>/auth/callback` and `<origin>/auth/callback?recovery=1`; add localhost equivalents only for development.
- Enable email confirmation and refresh-token rotation; disable anonymous login; require passwords of at least eight characters.
- Configure SMTP, verify the sending domain, and set suitable email/auth rate limits. Keep `{{ .ConfirmationURL }}` in email templates and disable email link tracking.
- Create the first invitation through a trusted database connection: use a random code, store only its SHA-256 hash in `private.invitations`, set an expiry, and share the code privately. See [hosted setup](docs/supabase-setup.md#hosted-staging-required-before-testers-join).

For production, connect `www.attunecommons.com` to the frontend host, set the hosted Supabase Site URL to `https://www.attunecommons.com`, and allow `https://www.attunecommons.com/auth/callback` and `https://www.attunecommons.com/auth/callback?recovery=1` as redirect URLs.

### 2. Cloudflare frontend

```sh
pnpm typecheck
pnpm build
pnpm dlx wrangler@4 login               # First deployment from this machine
pnpm dlx wrangler@4 deploy
```

Deploys `dist/resonance/browser` to the `attune-staging` Worker configured in `wrangler.jsonc`. Confirm the Cloudflare account and Worker name before deploying. Wrangler is not a project dependency, so these commands use `pnpm dlx`. See [Cloudflare deployment commands](https://developers.cloudflare.com/workers/wrangler/commands/workers/).

For another static host, publish `dist/resonance/browser` and rewrite application routes to `/index.html`. Deploy the output of `pnpm build`; `build:local` targets localhost and `build:ui` uses mocks. After deployment, check direct-link refresh, signup/confirmation, password recovery, and login on the deployed origin. Open auth email links in the browser/origin that requested them.

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
