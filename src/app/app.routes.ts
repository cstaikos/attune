import { adminGuard } from "./core/auth/admin.guard";
import { Routes } from "@angular/router";
import { memberGuard } from "./core/auth/member.guard";
import { editorLeaveGuard } from "./core/auth/editor-leave.guard";
const library = () =>
  import("./pages/library/library-page").then((m) => m.LibraryPage);
const auth = () => import("./pages/auth/auth-page").then((m) => m.AuthPage);
const editor = () =>
  import("./pages/editor/editor-page").then((m) => m.EditorPage);
export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "library" },
  {
    path: "ui-showcase",
    title: "UI components · Attune Commons",
    loadComponent: () =>
      import("./pages/ui-showcase/ui-showcase-page").then(
        (m) => m.UiShowcasePage,
      ),
  },
  { path: "login", title: "Sign in · Attune Commons", loadComponent: auth },
  ...[
    { path: "auth/callback", mode: "callback", title: "Verify email" },
    { path: "verify-email", mode: "verify", title: "Verify email" },
    { path: "forgot-password", mode: "forgot", title: "Recover password" },
    { path: "reset-password", mode: "reset", title: "Reset password" },
    { path: "redeem", mode: "redeem", title: "Redeem invitation" },
  ].map(({ path, mode, title }) => ({
    path,
    title: `${title} · Attune Commons`,
    data: { mode },
    loadComponent: () =>
      import("./pages/auth/account-page").then((m) => m.AccountPage),
  })),
  {
    path: "join",
    title: "Join · Attune Commons",
    loadComponent: auth,
    data: { joining: true },
  },
  {
    path: "",
    canActivateChild: [memberGuard],
    children: [
      {
        path: "reports",
        title: "My private reports · Attune Commons",
        loadComponent: () =>
          import("./pages/admin/reports-page").then((m) => m.ReportsPage),
      },
      {
        path: "admin",
        title: "Administration · Attune Commons",
        canActivate: [adminGuard],
        loadComponent: () =>
          import("./pages/admin/admin-page").then((m) => m.AdminPage),
      },
      {
        path: "library",
        title: "Library · Attune Commons",
        loadComponent: library,
        data: {
          view: "library",
          heading: "Library",
          description:
            "Explore playlists shared by therapists and facilitators.",
        },
      },
      {
        path: "saved",
        title: "Saved · Attune Commons",
        loadComponent: library,
        data: {
          view: "saved",
          heading: "Saved playlists",
          description: "Your shortlist, ready to revisit.",
        },
      },
      {
        path: "contributions",
        title: "My contributions · Attune Commons",
        loadComponent: library,
        data: {
          view: "contributions",
          heading: "My contributions",
          description: "Playlists you have added to the library.",
        },
      },
      {
        path: "create",
        title: "Add a playlist · Attune Commons",
        loadComponent: editor,
        canDeactivate: [editorLeaveGuard],
      },
      {
        path: "edit/:id",
        title: "Edit playlist · Attune Commons",
        loadComponent: editor,
        canDeactivate: [editorLeaveGuard],
      },
      {
        path: "playlist/:id",
        title: "Playlist · Attune Commons",
        loadComponent: () =>
          import("./pages/playlist/playlist-page").then((m) => m.PlaylistPage),
      },
      {
        path: "profiles",
        title: "Community · Attune Commons",
        loadComponent: () =>
          import("./pages/profiles/profiles-page").then((m) => m.ProfilesPage),
      },
      {
        path: "profile/:id",
        title: "Profile · Attune Commons",
        loadComponent: () =>
          import("./pages/profiles/profile-page").then((m) => m.ProfilePage),
      },
    ],
  },
  {
    path: "**",
    title: "Page not found · Attune Commons",
    loadComponent: () =>
      import("./pages/route-placeholder").then((m) => m.RoutePlaceholder),
    data: { heading: "Page not found", notFound: true },
  },
];
