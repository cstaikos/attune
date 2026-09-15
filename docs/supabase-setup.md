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

The test also signs in a second account through a separate Supabase client, redeems
the first account's invitation, and verifies shared playlist discovery, direct
reads, edits visible after signing in again, comments, save counts, private saves,
and rejection of edits/deletes by another member. The second account's email is
confirmed through the local admin fixture; the first account exercises real local
confirmation and recovery email delivery.

### Two-device acceptance check

After completing hosted staging setup, open the same deployed app on two devices
and sign in with different active member accounts. On device A, publish a playlist
with a distinctive title. On device B, open the library or click **Refresh
playlists**, find that title, and open it. Both devices must show the same playlist
URL, creator, and content. Save and comment on device B; reload the detail page on
device A to see those changes. Edit on device A and reload on device B to verify
the update persists. The library refresh preserves its current filters and sort;
clear filters if the new playlist does not match them. Updates are fetched on
navigation or refresh, rather than pushed live.

The local integration test proves sharing across isolated account sessions; it
does not replace this check on physical devices against the hosted deployment.

The pinned CLI currently starts PostgREST 16.2. If fresh local JWTs fail with
`PGRST303: JWT issued at future`, restarting `supabase_rest_attune-local` can clear
the stale clock; upgrade the local stack to PostgREST 16.3 or later when supported
by the CLI for the upstream fix. Do not weaken JWT checks or membership policies.
See [PostgREST 16.3 release notes](https://github.com/PostgREST/postgrest/releases/tag/v16.3).

### Reporting and administration

Apply the moderation migrations with `npm run db:migrate` locally and your usual
migration process for hosted environments. Members can report playlists, comments,
and profiles privately. Only the reporter and active administrators can read a
report; reported members have no access to another person's report.

The first administrator must be provisioned by a trusted database operator after
that person has joined and verified their email. In the SQL editor, replace the
UUID below with that member's Auth user ID:

```sql
update private.memberships
set role = 'admin'
where user_id = '<verified-member-uuid>' and status = 'active';
```

After signing in again, **Administration** appears in the navigation at `/admin`.
Administrators can review reports, hide or restore playlists and comments, close
reports, suspend or restore accounts, and grant or revoke administrator access.
Every action requires a reason and records the actor, target, timestamp, and
before/after state in an audit table that application users cannot modify.
Administrators cannot change their own access, preserving an active administrator.
Use the application for subsequent access changes so they enter the audit trail;
the initial database bootstrap is an operator action outside that trail.

Suspension and administrator revocation are checked by the database on subsequent
requests, including requests with previously issued tokens. Existing content
already rendered in a browser is not remotely erased. Profile reports are handled
through account suspension; playlist and comment hiding is reversible.

Browser mock storage is for development only and is editable by anyone using that
browser. No mock account receives administrator access automatically. The tests
provision administrator fixtures explicitly; production permissions come solely
from the private database membership table.

### Local moderation demo data

Resets load `supabase/seed-moderation.sql` alongside the bootstrap invitation.
It adds three fictional accounts, four playlists, three comments, six reports
(open, resolved, dismissed), and two hidden-content audit entries.
Existing fixture rows and moderation decisions are preserved when rerun.

Local sign-ins (all use password `Attune-local-2026!`):

- `admin@attune.local`: administrator; includes an admin-submitted open report.
- `maya@attune.local`: member with open and resolved reports on her profile.
- `leo@attune.local`: member with a dismissed report on his profile.

Playlist links are example placeholders. To add fixtures to an existing local
database without resetting it:

```sh
docker exec -i supabase_db_attune-local psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/seed-moderation.sql
```

### Large local test dataset

`supabase/seed-volume.sql` is included in local resets and can also be loaded with:

```sh
docker exec -i supabase_db_attune-local psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/seed-volume.sql
```

It adds 48 fictional members, 120 playlists across all six modalities, 396 comments
(including a long thread on **Morning light · 1**), 120 private reports, audit history,
120 listening notes, 360 saves, 88 follows, and 60 invitations in available, expired,
and used states. It includes hidden playlists/comments, active/suspended accounts,
and every moderation action. Existing records and decisions are preserved on reruns.

The three primary demo logins above remain the easiest entry points. Additional
accounts are `member1@attune.local` through `member48@attune.local`, using the same
local-only password. Members 1–2 are administrators; 45–48 are suspended.
Maya and the demo administrator have enough private reports and invitations to
exercise pagination on their own profiles.

List controls currently paginate loaded results in the browser. The service layer
still retrieves the full accessible collection; large production datasets will
need server-side filtering and pagination to reduce network transfer.
