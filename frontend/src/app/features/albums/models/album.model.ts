import { Track, TrackInput } from './track.model';

export interface Album {
  id: number;
  title: string;
  releaseYear: number;
  genre?: string;
  trackCount?: number;
  totalDuration?: number;
  coverUrl?: string;
  active: boolean;
  artists: ArtistSummary[];
  tracks?: Track[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ArtistSummary {
  id: number;
  name: string;
  type: 'SOLO' | 'BAND';
}

export interface CreateAlbumRequest {
  title: string;
  releaseYear: number;
  genre?: string;
  trackCount?: number;
  totalDuration?: number;
  artistIds: number[];
  tracks?: TrackInput[];
}

export interface UpdateAlbumRequest {
  title?: string;
  releaseYear?: number;
  genre?: string;
  trackCount?: number;
  totalDuration?: number;
  artistIds?: number[];
  tracks?: TrackInput[];
  active?: boolean;
}

export interface AlbumSearchParams {
  title?: string;
  artistId?: number;
  genre?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  size?: number;
}
