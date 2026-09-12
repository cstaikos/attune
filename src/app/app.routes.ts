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
  { path: "login", title: "Sign in · Resonance", loadComponent: auth },
  {
    path: "join",
    title: "Join · Resonance",
    loadComponent: auth,
    data: { joining: true },
  },
  {
    path: "listening-guide",
    title: "Listening notes guide · Resonance",
    loadComponent: () =>
      import("./pages/guide/guide-page").then((m) => m.GuidePage),
  },
  {
    path: "",
    canActivateChild: [memberGuard],
    children: [
      {
        path: "library",
        title: "Library · Resonance",
        loadComponent: library,
        data: {
          view: "library",
          heading: "Music to hold the space.",
          description:
            "Explore playlists shared by therapists and facilitators.",
        },
      },
      {
        path: "saved",
        title: "Saved · Resonance",
        loadComponent: library,
        data: {
          view: "saved",
          heading: "Saved playlists",
          description: "Your shortlist, ready to revisit.",
        },
      },
      {
        path: "contributions",
        title: "My contributions · Resonance",
        loadComponent: library,
        data: {
          view: "contributions",
          heading: "My contributions",
          description: "Playlists you have added to the library.",
        },
      },
      {
        path: "create",
        title: "Add a playlist · Resonance",
        loadComponent: editor,
        canDeactivate: [editorLeaveGuard],
      },
      {
        path: "edit/:id",
        title: "Edit playlist · Resonance",
        loadComponent: editor,
        canDeactivate: [editorLeaveGuard],
      },
      {
        path: "playlist/:id",
        title: "Playlist · Resonance",
        loadComponent: () =>
          import("./pages/playlist/playlist-page").then((m) => m.PlaylistPage),
      },
      {
        path: "profiles",
        title: "Community · Resonance",
        loadComponent: () =>
          import("./pages/profiles/profiles-page").then((m) => m.ProfilesPage),
      },
      {
        path: "profile/:id",
        title: "Profile · Resonance",
        loadComponent: () =>
          import("./pages/profiles/profile-page").then((m) => m.ProfilePage),
      },
    ],
  },
  {
    path: "**",
    title: "Page not found · Resonance",
    loadComponent: () =>
      import("./pages/route-placeholder").then((m) => m.RoutePlaceholder),
    data: { heading: "Page not found", notFound: true },
  },
];
