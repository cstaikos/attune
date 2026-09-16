# UI regression preview

Start with `pnpm exec ng serve --configuration ui-preview --port 4202`.
The fixture uses the existing mock services with in-memory storage and a seeded
administrator. Reloading resets every change. It is excluded from production.

Browser checks completed for the shared-control rollout:

- Create playlist: required title errors, numeric duration, URL field, tag buttons,
  keyboard slider adjustment, and saving retain their values.
- Playlist: comment submission, save/unsave pressed state, and private report flow.
- Admin: report resolution with a required reason and audit confirmation.
- Profile: editing and saving a bio.
- Library: modality/service filters and global search update results.
- Mobile at 390 px: library, filters, and editor fit without horizontal overflow;
  the leave dialog retains unsaved edits when cancelled.

The production build and existing service regression tests remain separate checks.
