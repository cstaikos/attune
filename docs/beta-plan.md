# Attune shared beta plan

Updated: September 13, 2026

## Objective

Launch an invite-only beta where members on different devices can discover,
publish, save, and discuss playlists, with reporting and administrator moderation
available before the first testers join.

## Current state

The Angular application has browsing and filters, playlist creation and editing,
saves, comments, profiles, and local invitations. It uses mock services and
browser-local persistence. Accounts and community data are not yet shared between
devices, and local authorization is not a production security boundary.

## Implementation sequence

### 1. Shared backend and authentication

- Implement real auth, playlist, profile, social, and invitation services behind
  the existing service interfaces. Supabase is the anticipated provider, pending
  final backend selection.
- Store community data centrally and enforce member access and ownership on the
  backend.
- Add secure, single-use invitation redemption, email verification, and password
  recovery.
- Establish separate staging data and a repeatable schema/migration process.

First milestone: two members on different devices can sign in, publish a playlist,
and see the same shared content.

### 2. Admin permissions, moderation, and reporting

Build reporting and the admin workflow together so every report has a destination.

Member reporting:

- Add a Report action to comments and playlists.
- Collect a reason and optional explanation, and confirm submission.
- Keep reports private from other members and the reported author.
- Prevent duplicate active reports by the same member for the same content and
  enforce submission rate limits on the backend.

Admin panel:

- Provide a report queue with reported content, reason, author, and status.
- Allow an administrator to dismiss a report or remove the reported content.
- Support finding and removing comments and playlists without a prior report.
- Support searching accounts, suspending access, restoring access, and deleting
  accounts.
- Initially hide removed content with an administrator restore option.
- Record the administrator, action, target, timestamp, and reason in an audit log.

Authorization and account lifecycle:

- Enforce administrator permissions on the backend for every privileged action.
  A hidden route or client-side role check is insufficient.
- Ensure members cannot grant themselves administrator access or read reports.
- Define what account deletion does to playlists, comments, reports, and retained
  audit records before implementing deletion. Make the consequences explicit in
  the admin confirmation flow.
- Ensure suspension blocks access through existing sessions as well as new logins.

### 3. Starter library and staging deployment

- Replace placeholder service URLs with real playlist links.
- Review starter playlist tags, durations, and listening notes.
- Deploy the Angular app with direct-link routing and refresh support.
- Configure authentication redirects and environment settings.
- Add error reporting and an accessible feedback route.

Manual playlist links are sufficient for the first beta. Automated music imports
and image uploads can follow after the shared experience is working reliably.

### 4. End-to-end beta checks

- Test invitations, registration, verification, login, logout, and password recovery.
- Test publishing, editing, discovery, saves, comments, and persistence across devices.
- Verify members cannot edit other members' content or perform admin actions.
- Verify reports enter the admin queue and remain private.
- Verify dismissal, content removal/restoration, suspension/restoration, account
  deletion, and audit records follow the defined rules.
- Check mobile layouts, keyboard navigation, loading states, and recoverable errors.

### 5. First tester cohort

- Invite approximately 5–10 testers.
- Observe onboarding, discovery, contribution, and reporting friction.
- Review reports and feedback, fix blocking issues, and then expand access.

## Beta readiness criteria

- Independent users on different devices share the same persisted community data.
- Invitations and account recovery work through real authentication services.
- Backend permissions protect member content and administrator actions.
- Members can report comments and playlists, and an administrator can resolve reports.
- Administrators can moderate content and suspend or delete accounts with defined
  consequences and recorded actions.
- The deployed application passes the end-to-end checks above and has useful starter
  content, error visibility, and a feedback route.

## Decisions to resolve during implementation

- Confirm the backend and hosting provider.
- Choose the initial administrator and a controlled role-assignment process.
- Finalize report reasons and queue statuses.
- Define account-deletion behavior and retention for removed content and audit records.

This document records planned work; it does not indicate that production services
or moderation features are already implemented.
