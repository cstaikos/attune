# Staging and production

Use two Cloudflare Workers and two separate Supabase projects. Staging must not
contain production user data. The existing staging project is configured in
`deploy/staging.json`. Fill in the new production project's public URL and
publishable key in `deploy/production.json`. These values are public and can be
committed. Worker names must match their entries in `wrangler.jsonc`.

## Frontend commands

```sh
pnpm dlx wrangler@4 login       # Once per developer machine
pnpm build:staging             # Build and upload Sentry maps when configured; no site deployment
pnpm deploy:staging:preview    # Build, Sentry upload, and Wrangler dry run
pnpm deploy:staging            # Build and upload staging
pnpm deploy:production:preview
pnpm deploy:production
```

Each command builds from current source with that environment's public config.
Output is `dist/staging/browser` or `dist/production/browser`. A preview is a
packaging dry run, not a hosted preview or a check of account permissions.
Production refuses to build until configured; sharing a Supabase project or
Worker between environments is rejected. Use the deployment scripts instead of
bare `wrangler deploy` or uploading the default `pnpm build` output, which uses
the existing development/hosted configuration. Do not run other Angular builds
concurrently with deployment builds. An interrupted command may leave a
`.deploy-<environment>.lock`; remove it only after confirming the process stopped.

## Secrets

| Value | Where to keep it |
| --- | --- |
| Supabase URL and publishable key | `deploy/<environment>.json`; these are visible in the browser |
| Sentry DSN, organization, project | `deploy/<environment>.json`; the DSN is public |
| Sentry organization auth token | `SENTRY_AUTH_TOKEN` in the matching ignored environment file or CI secret storage; source-map upload permissions |
| Cloudflare API token and account ID | Password manager locally; ignored `.env.staging` / `.env.production`, or separate CI environment secrets |
| Supabase access token and database password | Password manager; inject into the migration process or use the CLI password prompt |
| SMTP credentials | Each Supabase project's Auth SMTP settings |
| Future backend API keys or service-role credentials | Backend secret storage, never Angular config or browser bundles |

Copy `.env.example` to `.env.staging` or `.env.production` if using token-based
frontend deployment. Delete unused blank entries when using interactive login.
The scripts load the matching file; already-set process environment variables
win, so clear stale exported credentials before switching environments. Only public
Supabase and Sentry settings are written into generated Angular configuration.
The migration commands below do not automatically load these files.

Use an account-scoped Cloudflare token with only required deployment permissions.
Keep CI staging and production secrets separate; require approval for production
jobs. Never paste credentials into source files, docs, chat, or command arguments.
Rotate any credential that was accidentally committed. Angular runs in the user's
browser: build-time environment variables cannot make a browser secret private.

## Database releases

Migrations are separate from frontend deployment so SQL changes can be reviewed
first. From the repository root, explicitly link the intended project on every
release (the project reference is the hostname prefix in its deployment config):

```sh
pnpm exec supabase login
pnpm exec supabase link --project-ref <target-project-ref>
pnpm exec supabase db push --dry-run
# Review the target project and pending migrations, then:
pnpm exec supabase db push
```

Do not run releases for different database environments concurrently in the same
checkout: the CLI stores one linked project. Use separate CI jobs/checkouts when
automating. Never use `--include-seed`, remote reset, or local fixture files on
hosted projects. Test migrations and RLS locally, release to staging first, and
apply compatible database changes before deploying the new frontend. Avoid
removing columns used by the previous frontend until the rollback window closes.

## Before the first production release

- Create a separate Supabase project, matching the repository's Postgres major
  version (17), and apply migrations. Review RLS policies and grants.
- Configure production Auth Site URL as `https://www.attunecommons.com`, with
  `/auth/callback` and `/auth/callback?recovery=1` allowed redirects. Keep staging
  redirects in the staging project. Enable email confirmation and refresh token
  rotation; configure password policy, rate limits, and production SMTP.
- Attach `www.attunecommons.com` as a Cloudflare Custom Domain to
  `attune-production`, verify HTTPS, and decide how the apex domain redirects.
  The scripts do not modify DNS or attach domains. Verify the Worker on its
  assigned workers.dev URL before moving existing traffic.
- Bootstrap the initial invitation and administrator through the trusted
  database workflow in [Supabase setup](supabase-setup.md). Never use local seed
  invitations or sample accounts in production.
- Enable a suitable backup/restore policy in Supabase and verify a restore
  procedure. Add uptime/error monitoring and billing alerts for both services.
- Record each deployed Git revision. Roll back frontend code by redeploying a
  known-good revision to the same environment; database migrations need a
  reviewed forward fix or restore plan, not automatic rollback.
- Verify direct-link refresh, signup/email confirmation, invitation redemption,
  login/logout, password recovery, and access restrictions on the deployed origin.

The repository's `pnpm check` currently calls a missing `test` script. Use the
explicit checks in the main README, plus `pnpm db:test` against the local database,
before release. Deployment scripts run typechecking and an optimized build; they
do not replace database tests or the browser smoke checks above.

References: [Cloudflare environments](https://developers.cloudflare.com/workers/wrangler/environments/),
[Supabase migrations](https://supabase.com/docs/guides/deployment/database-migrations).

## Error reporting

Release builds report Angular/browser exceptions and unexpected Supabase HTTP/network failures to the `attune-commons` Sentry project, tagged `staging` or `production` and with the Git commit as the release. Local development and UI preview builds do not initialize Sentry. Replay and performance tracing are disabled. The Supabase transport reports sanitized operation/status/error-code metadata even when the UI catches the failure; it does not change requests, responses, or database access policies. Known invalid-login and invitation errors are excluded. Browser breadcrumbs, user context, request metadata and extra payloads are omitted; email addresses, JWTs and URL query parameters are scrubbed from exception text.

Set `SENTRY_AUTH_TOKEN` separately in `.env.staging` and `.env.production` (or CI secrets). Clear any exported token when switching targets because shell environment values take precedence. Set `SENTRY_RELEASE` explicitly when building outside Git. Release builds generate hidden source maps, inject Debug IDs, upload maps before deployment, then remove maps from the public output. Actual deployments fail without an upload token; build/preview commands can run without one and warn that maps were not uploaded.

In Sentry, configure an email alert restricted to `production`, targeting your Sentry user, for new and regressed issues with a 60-minute repeat interval. Keep staging notifications disabled. Source-map upload tokens do not necessarily grant alert-management API permissions. Confirm email delivery separately after configuring the rule.
