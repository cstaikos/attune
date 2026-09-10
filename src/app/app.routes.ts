import { Routes } from '@angular/router';

const placeholder = () => import('./pages/route-placeholder').then(module => module.RoutePlaceholder);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'library' },
  { path: 'library', title: 'Library · Resonance', loadComponent: placeholder, data: { heading: 'Session music library' } },
  { path: 'saved', title: 'Saved · Resonance', loadComponent: placeholder, data: { heading: 'Saved playlists' } },
  { path: 'contributions', title: 'My contributions · Resonance', loadComponent: placeholder, data: { heading: 'My contributions' } },
  { path: 'create', title: 'Add a playlist · Resonance', loadComponent: placeholder, data: { heading: 'Add a playlist' } },
  { path: 'edit/:id', title: 'Edit playlist · Resonance', loadComponent: placeholder, data: { heading: 'Edit playlist' } },
  { path: 'playlist/:id', title: 'Playlist · Resonance', loadComponent: placeholder, data: { heading: 'Playlist details' } },
  { path: 'profiles', title: 'Community · Resonance', loadComponent: placeholder, data: { heading: 'Community' } },
  { path: 'profile/:id', title: 'Profile · Resonance', loadComponent: placeholder, data: { heading: 'Member profile' } },
  { path: 'login', title: 'Sign in · Resonance', loadComponent: placeholder, data: { heading: 'Sign in' } },
  { path: 'join', title: 'Join · Resonance', loadComponent: placeholder, data: { heading: 'Join the private beta' } },
  { path: 'listening-guide', title: 'Listening notes guide · Resonance', loadComponent: placeholder, data: { heading: 'About tags & listening notes' } },
  { path: '**', title: 'Page not found · Resonance', loadComponent: placeholder, data: { heading: 'Page not found', notFound: true } },
];
