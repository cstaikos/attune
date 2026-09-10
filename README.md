# Resonance Library

An incremental Angular port of the session music library prototype.

## Run the Angular foundation

Use Node 24.15 or newer in the Node 24 release line and pnpm 11.

```sh
pnpm install
pnpm start
```

Open http://localhost:4200. No environment variables, accounts, or API keys are required.

```sh
pnpm build      # Production files in dist/resonance/browser
pnpm typecheck # Strict TypeScript checks, including domain models
pnpm test      # Compile mock services and run service + prototype regression tests
```

The production build also checks Angular templates. A static host will need to
rewrite application routes to index.html so direct links and refreshes work.

## Step 1 scope

- Standalone Angular application, strict TypeScript, and zoneless change detection.
- Shared header, navigation, footer, and the existing design stylesheet.
- Routes for library, saved playlists, contributions, playlist details and editing,
  profiles, sign-in, joining, and the listening guide, plus a not-found page.
- Provider-independent domain models and the prototype's current tag taxonomy.

Screens are explicitly placeholders at this stage. Mock services and local persistence
are implemented; connecting screens and adding route guards are subsequent steps.
This foundation is not yet an access-controlled beta.

## Layout

- `src/app/app.config.ts`: application-wide DI providers; mock providers will go here.
- `src/app/app.routes.ts`: routes and page titles.
- `src/app/core/models/`: domain types and taxonomy, without provider dependencies.
- `src/app/pages/`: routed screens.
- `styles.css`: shared prototype design tokens and styles.
- `src/styles.css`: Angular shell adjustments.

The root `index.html`, `app.js`, and existing tests remain the runnable prototype.
Serve the repository root with a static server to use it. Angular uses `src/index.html`
and never executes the prototype script or modifies its local-storage data.

Next: port the screens incrementally using the service tokens. The prototype's browser
data is not automatically imported; an explicit migration can be added when needed.

## Step 2: services and local mocks

`src/app/core/services/contracts/` defines provider-independent interfaces for auth,
playlists, profiles, social actions, and invitations. Components should inject tokens
from `service-tokens.ts`, for example `inject(PLAYLIST_SERVICE)`, rather than mock
classes. Methods return Promises; `AuthService.session$` emits session changes.
There is no Supabase dependency in these contracts.

`provideMockServices()` registers all implementations and one shared store in the
application configuration. A future Supabase provider function replaces this registration.
The mock implementations are plain TypeScript classes, independently testable without
Angular or a browser. Querying, URL parsing, draft validation, password hashing, and
seed data live in their own files.

### Persistence and accounts

- The versioned storage key is `resonance-angular-mock-v1`. Prototype storage is untouched.
- First use loads sample profiles/playlists. Sample profiles are attribution data, not
  login accounts. Register through `AUTH_SERVICE.signUp` with a test email/password and
  one of `BETA-2026`, `GUIDE-2026`, or `BREATH-2026`. Each invite is single-use.
- A registered member receives three invitations to issue. Email verification and
  password-reset delivery are not simulated yet; no email is sent.
- Test credentials use salted PBKDF2 hashes; never use real passwords here. Local auth
  is a UI simulation, not a security boundary. Production authorization requires RLS.
- Reads require a session; mutations check ownership. Saves and follows are scoped
  to the signed-in member, and explicit set operations are idempotent.
- Writes clone the current state and persist before committing. Storage failures do
  not apply in-memory changes. Returned objects are detached copies.
- Stored data is checked before use. Malformed/unsupported data raises a `storage`
  error and is retained. To reset deliberately, export that key if needed and remove
  only the Angular mock key in browser developer tools.
- Synchronization between simultaneous browser tabs is not implemented. Use one tab
  for mock editing; persistence supports refresh/reopening on the same origin.
- Seed popularity counts start at zero and follow actual mock relations. Historical
  labels outside the current taxonomy are retained in legacy fields.

### Loading and failure scenarios

Inject `MockControls` in a development harness or pass it to `MockStore` in tests.
Its default `latencyMs` is 120; set it to zero for tests. To reject one operation:

```ts
controls.failNext('playlists.list'); // defaults to an unavailable ServiceError
controls.failNext('social.setSaved', new ServiceError('unavailable', 'Try again.'));
```

Operation names are the service namespace plus method name (for example
`auth.signUp`, `profiles.updateMine`, `invitations.create`). The mock login also
uses `auth.credentials` for its credential lookup. Failures are consumed once.
Use sign-out to simulate loss of session; use a newly registered user's saved list
or a nonmatching query to exercise empty results. UI loading/error presentation will
be connected during the screen port.

Regression tests cover persistence, invite reuse races, member isolation, ownership,
edit preservation, filtering, write failures, invalid data, and returned-object isolation.
