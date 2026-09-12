import { MockState } from "./mock-state";
import {
  modalities,
  qualityGroups,
  listeningGroups,
} from "../../models/taxonomy";
type Check = (value: unknown) => boolean;
const text: Check = (v) => typeof v === "string";
const number: Check = (v) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;
const bool: Check = (v) => typeof v === "boolean";
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const array =
  (check: Check): Check =>
  (v) =>
    Array.isArray(v) && v.every(check);
const nullable =
  (check: Check): Check =>
  (v) =>
    v === null || check(v);
const optional =
  (check: Check): Check =>
  (v) =>
    v === undefined || check(v);
const shape =
  (fields: Record<string, Check>): Check =>
  (v) =>
    object(v) && Object.entries(fields).every(([key, check]) => check(v[key]));
const member =
  (values: readonly unknown[]): Check =>
  (v) =>
    values.includes(v);
const labels = Object.values(listeningGroups).flatMap((group) =>
  Object.keys(group),
);
const tag = member(Object.values(qualityGroups).flat());
const label = member(labels);
const profile = shape({
  id: text,
  username: text,
  displayName: text,
  practice: text,
  location: text,
  bio: text,
  initials: text,
  avatarUrl: optional(text),
  inviteCount: number,
  followerCount: number,
});
const playlist = shape({
  id: text,
  creatorId: text,
  title: text,
  modality: member(modalities),
  energyCurve: array(member([1, 2, 3, 4, 5])),
  duration: text,
  qualities: array(tag),
  taxonomyVersion: (v) => v === 1,
  legacyQualities: optional(array(text)),
  legacyWarnings: optional((v) => object(v) && Object.values(v).every(number)),
  warnings: (v) =>
    object(v) &&
    Object.entries(v).every(([key, value]) => label(key) && number(value)),
  listeningReviewed: bool,
  listeningContext: text,
  listeningReports: array(shape({ label, userId: text, context: text })),
  creatorWarningLabels: array(label),
  savedCount: number,
  createdAt: text,
  updatedAt: optional(text),
  coverA: text,
  coverB: text,
  notes: text,
  links: (v) =>
    object(v) &&
    Object.entries(v).every(
      ([key, value]) =>
        ["spotify", "youtube", "apple", "other"].includes(key) && text(value),
    ),
  tracks: array(shape({ title: text, artist: text })),
  comments: array(
    shape({ id: text, userId: text, body: text, createdAt: optional(text) }),
  ),
});
const stateCheck = shape({
  version: (v) => v === 1,
  profiles: array(profile),
  playlists: array(playlist),
  accounts: array(shape({ userId: text, email: text, salt: text, hash: text })),
  saved: array(shape({ userId: text, playlistId: text })),
  follows: array(shape({ followerId: text, followedId: text })),
  invitations: array(
    shape({
      id: text,
      code: text,
      createdBy: text,
      redeemedBy: nullable(text),
      expiresAt: nullable(text),
    }),
  ),
  session: nullable(shape({ userId: text })),
});
export function validateState(value: unknown): MockState {
  if (!stateCheck(value)) throw new Error("Unsupported or malformed mock data");
  const state = value as MockState;
  const users = new Set(state.profiles.map((p) => p.id));
  const playlists = new Set(state.playlists.map((p) => p.id));
  if (
    users.size !== state.profiles.length ||
    playlists.size !== state.playlists.length ||
    (state.session && !users.has(state.session.userId)) ||
    state.accounts.some((a) => !users.has(a.userId)) ||
    state.playlists.some(
      (p) =>
        !users.has(p.creatorId) ||
        p.comments.some((c) => !users.has(c.userId)) ||
        p.listeningReports.some((r) => !users.has(r.userId)),
    ) ||
    state.saved.some(
      (s) => !users.has(s.userId) || !playlists.has(s.playlistId),
    ) ||
    state.follows.some(
      (f) => !users.has(f.followerId) || !users.has(f.followedId),
    ) ||
    state.invitations.some(
      (i) =>
        !users.has(i.createdBy) ||
        (i.redeemedBy !== null && !users.has(i.redeemedBy)),
    )
  )
    throw new Error("Broken mock data references");
  return state;
}
