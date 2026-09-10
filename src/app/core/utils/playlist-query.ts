import { PlaylistQuery } from '../services/contracts/playlists';
import { Playlist, Profile, SavedPlaylist } from '../models/library';
import { ServiceError } from '../services/service-error';
import { durationMinutes } from './playlist-draft';
import { parsePlaylistLink } from './playlist-link';
interface QueryData { playlists: Playlist[]; profiles: Profile[]; saved: SavedPlaylist[]; }
export function queryPlaylists(state: QueryData, userId: string, query: PlaylistQuery) {
 const { minDuration: min, maxDuration: max } = query;
 if ([min,max].some(n => n !== undefined && (!Number.isSafeInteger(n) || n < 0)) || (min !== undefined && max !== undefined && min > max))
  throw new ServiceError('invalid-input', 'Duration bounds must be ordered whole minutes.');
 const search = (query.search || '').trim().toLowerCase();
 const rows = state.playlists.filter(p => {
  const creator = state.profiles.find(u => u.id === p.creatorId);
  const searchable = [p.title,p.notes,p.modality,p.listeningContext,creator?.username,creator?.displayName,creator?.practice,
   ...p.qualities,...(p.legacyQualities || []),...Object.keys(p.warnings),...p.listeningReports.map(r => r.context),...p.tracks.map(t => `${t.title} ${t.artist}`)].join(' ').toLowerCase();
  const duration = durationMinutes(p.duration);
  return (!search || searchable.includes(search)) &&
   (!query.creatorId || p.creatorId === query.creatorId) &&
   (query.view !== 'saved' || state.saved.some(s => s.userId === userId && s.playlistId === p.id)) &&
   (query.view !== 'contributions' || p.creatorId === userId) &&
   (!query.modality || p.modality === query.modality) &&
   (!query.qualities?.length || query.qualities.every(t => p.qualities.includes(t))) &&
   !query.excludedQualities?.some(t => p.qualities.includes(t)) &&
   !query.excludedWarnings?.some(t => (p.warnings[t] || 0) > 0) &&
   (!query.services?.length || Object.values(p.links).some(url => { const link = parsePlaylistLink(url); return link !== null && query.services!.includes(link.key); })) &&
   (min === undefined || (duration !== null && duration >= min)) && (max === undefined || (duration !== null && duration <= max));
 });
 return rows.sort((a,b) => {
  switch (query.sort) {
   case 'newest': return Date.parse(b.createdAt) - Date.parse(a.createdAt);
   case 'favorites': return b.savedCount - a.savedCount;
   case 'comments': return b.comments.length - a.comments.length;
   default: return b.savedCount + b.comments.length * 4 - a.savedCount - a.comments.length * 4;
  }
 });
}
