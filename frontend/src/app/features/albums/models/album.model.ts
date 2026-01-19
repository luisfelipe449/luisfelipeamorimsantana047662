export interface Album {
  id: number;
  title: string;
  releaseYear: number;
  genre?: string;
  coverUrl?: string;
  active: boolean;
  artists: ArtistSummary[];
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
  artistIds: number[];
}

export interface UpdateAlbumRequest {
  title?: string;
  releaseYear?: number;
  genre?: string;
  artistIds?: number[];
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
