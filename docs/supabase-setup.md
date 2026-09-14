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
replays SQL migrations, and loads `supabase/seed.sql`. The seed creates one local
bootstrap invitation, `DEV-ATTUNE-LOCAL-ONLY`; it contains no user accounts.
See [Database schema](database-schema.md) for the tables, permissions, and RPCs.

Run `pnpm start:local` to use the local stack with the public settings in
`src/environments/environment.local.ts`. If a newly created stack has a different
publishable key, update that file from `pnpm db:status`. `pnpm start` and production
builds use the hosted public configuration instead. Never copy a secret or
service-role key into either environment file.

## Authentication behavior

The app now registers Supabase adapters for authentication, profiles, invitations,
playlists, saves, and follows. Browser-only mock accounts and demo invitation codes
are no longer used by the Angular app. Prototype/mock data is not imported.

1. Register an email/password at `/join`. The response asks the user to check email
   without claiming whether an account already exists.
2. Supabase emails its standard `{{ .ConfirmationURL }}` link. Keep that variable
   in signup and recovery email templates. The SDK uses PKCE: open the email in
   the same browser and origin where the request began. Switching devices requires
   signing in after email confirmation; recovery needs a new request on that device.
3. `/auth/callback` exchanges the one-use code and removes it from browser history.
   Invalid, expired, reused, or wrong-browser links offer verification/recovery retry.
4. A verified account enters a username, practice, and invitation at `/redeem`.
   `redeem_invitation()` alone creates membership and consumes the code atomically.
   Invalid codes can be corrected without re-registering. Codes are case-sensitive.
5. Login restores server-verified identity and membership. Pending accounts go to
   redemption; suspended accounts cannot enter the library. Database RLS remains
   authoritative for every community request.
6. `/forgot-password` sends a recovery link. `/reset-password` checks matching new
   passwords, updates through Auth, and signs out globally so the user signs in
   again. Global logout revokes refresh tokens; existing access JWTs can remain
   valid until their configured expiry. Use membership suspension for immediate
   community-access revocation.

Sessions and PKCE verifiers are managed by the Supabase SDK in browser storage;
passwords and invitation codes are never persisted there by the app. This SPA
requires normal XSS protections; it does not use HttpOnly session cookies.
Invitation creation shows a code once in memory. History contains only status and
metadata. Copy the code before leaving the profile page.

## Hosted staging: required before testers join

Project reference: `mtlfdrkrrqxdfsjcuery`. This change does not deploy the schema or
configure hosted Auth/email settings. Complete these steps before deploying the
new frontend to testers:

1. Authenticate the Supabase CLI locally as the project owner, link the project,
   review `supabase db push --dry-run`, then apply both migrations. Do not apply
   `supabase/seed.sql` remotely. Confirm Postgres 17 compatibility first.
2. Set Auth's Site URL to the deployed HTTPS origin. Allow the exact redirect URLs
   `<origin>/auth/callback` and `<origin>/auth/callback?recovery=1`. Add each approved
   staging origin explicitly; avoid wildcard production redirects. Configure the
   static host to serve Angular's `index.html` for application routes.
3. Keep email confirmation enabled, anonymous login disabled, refresh-token rotation
   enabled, and minimum password length at least eight. Match these settings to
   the checked-in local Auth configuration.
4. Configure an email delivery provider in Supabase Auth SMTP settings. Store SMTP
   credentials in Supabase, never in browser configuration or source control.
   Verify the sending domain and sender address, configure the provider's SPF/DKIM
   records, retain `{{ .ConfirmationURL }}` in email templates, and disable link
   tracking that rewrites authentication links. Configure appropriate email and
   authentication rate limits; the checked-in local email limit is deliberately low.
5. Issue a random bootstrap invitation through a trusted database connection. Store
   only its SHA-256 hash in `private.invitations`, set an expiry, and share the raw
   code privately once. Do not use local seed or former mock codes with testers.
6. Verify signup, confirmation, resend, recovery, logout, invitation reuse rejection,
   suspension, refresh, and cross-device login on the hosted origin before inviting
   testers. Local inbox delivery does not validate the production email provider.

## Verification

`pnpm test` runs the service/prototype regressions and authentication adapter tests.
`pnpm db:test` runs rollback-isolated RLS, invitation, and atomic playlist tests;
`pnpm db:lint` checks SQL functions. `pnpm build` checks Angular templates as well.

For the opt-in live Auth/email/database test, after compiling with `pnpm test`:

```sh
pnpm exec supabase status -o json > /tmp/attune-local-status.json
ATTUNE_LOCAL_STATUS=/tmp/attune-local-status.json node --test tests/supabase-local.test.cjs
```

The status file contains local secrets: keep it outside the repository. The test
asserts localhost endpoints, creates a synthetic account and a separate random
invitation, reads captured Mailpit email, exercises PKCE verification and recovery,
checks authenticated adapters, and removes its database/account fixtures. It needs
Docker access for provisioning its local invitation. Never point it at staging.

The pinned CLI currently starts PostgREST 16.2. If fresh local JWTs fail with
`PGRST303: JWT issued at future`, restarting `supabase_rest_attune-local` can clear
the stale clock; upgrade the local stack to PostgREST 16.3 or later when supported
by the CLI for the upstream fix. Do not weaken JWT checks or membership policies.
See [PostgREST 16.3 release notes](https://github.com/PostgREST/postgrest/releases/tag/v16.3).
