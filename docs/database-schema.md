# Community database

The initial SQL migration is `supabase/migrations/20260914000100_initial_community.sql`.
The Angular app uses Supabase adapters. Hosted staging still needs both migrations
applied before the new frontend is deployed.

## Tables and access

| Table | Read access | Write access |
| --- | --- | --- |
| `profiles` | Active, email-verified members | Owner may edit display name, practice, location, and bio |
| `playlists` | Active, email-verified members | Owner creates, edits, and deletes |
| `playlist_comments` | Active, email-verified members | Member inserts as themselves; editing/deletion is deferred |
| `listening_reports` | Active, email-verified members | Member inserts, changes context, or deletes their own observations |
| `saved_playlists` | Only the member's own rows | Member adds/removes their own saves |
| `follows` | Only the follower's own rows | Member adds/removes their own follows |
| `private.memberships` | Own status/role/allowance through `my_membership()` | Trusted backend only; redemption creates ordinary membership |
| `private.invitations` | Creator gets metadata through `my_invitations()` | Invitation RPCs only for members |

Every application table enables RLS. Column grants prevent changing ownership,
timestamps, membership roles, or invitation allowances from the browser.
Membership checks consult the database and confirmed Auth email, so suspending a
member also blocks community access through an existing session. Reading one's
own membership status remains allowed so the app can explain a suspension.

## Invitation workflow

1. Register and verify email through Supabase Auth. An Auth account alone has no
   community access; invitation redemption is what creates membership.
2. Call `redeem_invitation(code, username, display_name, practice)` while signed in.
   It creates the profile and membership and consumes the invitation atomically.
3. Each member starts with three invitation credits. `create_invitation()` consumes
   a credit and returns a random 256-bit code, ID, and expiry (14 days).
4. Copy the code when created: only its SHA-256 hash is stored. `my_invitations()`
   lists metadata, never the original code or its hash.

Row locks serialize invitation redemption and credit consumption. Invalid,
expired, already-used, and suspended-issuer invitations are rejected. Profile
validation failures roll back redemption. User-editable Auth metadata is never
used to authorize membership or administrator access.

Local seed code: `DEV-ATTUNE-LOCAL-ONLY`, valid for 30 days after seeding. It is a
single-use bootstrap invitation without an issuer. The seed contains no accounts
or passwords. Never apply this seed to staging or production; provision a random
bootstrap invitation through a trusted backend there.

## Adapter mapping

- Map snake_case fields to the existing TypeScript models. Format
  `duration_minutes` as the current `"30m"` domain representation.
- Derive profile initials from display name. Avatars and legacy import fields are
  not persisted in this first schema.
- Aggregate listening-label counts from `listening_reports`. A report belongs to
  the creator when its `user_id` matches `playlists.creator_id`; this derives
  `creatorWarningLabels` without maintaining a second copy of that data.
- Use `playlist_save_count(id)` and `profile_follower_count(id)` for aggregate
  counts without exposing private saved/followed lists. Batch aggregates can be
  added when implementing list queries if needed.
- Use `my_membership()` for the current member's invite allowance. Do not expose
  invitation balances in other members' profiles.
- Invitation codes are optional in the domain model and returned only at creation;
  history entries contain metadata only.
- Registration asks for email verification before profile creation and redemption.
- `save_playlist(playlist_id, draft, warning_labels)` atomically saves playlist
  fields and creator labels. It runs as the caller with RLS, preserves other members’
  reports and existing label context, and rejects edits by non-owners. Its migration
  is `20260914000200_save_playlist.sql`.

Playlist deletion cascades to its comments, listening reports, and saves. Account
deletion is restricted until contribution ownership and retention are decided.
Administrator role storage grants no client admin capabilities yet. Private
moderation reports, removal/restoration, audit logs, and admin actions belong to
the later moderation step; listening reports here are shared musical observations.

## Verification

```sh
pnpm db:migrate # Apply pending migrations locally without erasing existing data
pnpm db:test    # Permission and invitation tests; fixtures roll back
pnpm db:lint    # Check SQL functions in public and private schemas
```

`pnpm db:reset` erases local data, replays migrations, and loads the local seed.
Use it only when deliberately rebuilding the development database.
