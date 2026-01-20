export interface Artist {
  id: number;
  name: string;
  type: ArtistType;
  country?: string;
  biography?: string;
  active: boolean;
  photoKey?: string;
  photoUrl?: string;
  albums?: AlbumSummary[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PhotoUploadResponse {
  key: string;
  url: string;
}

export interface AlbumSummary {
  id: number;
  title: string;
  releaseYear: number;
  coverUrl?: string;
}

export type ArtistType = 'SOLO' | 'BAND';

export interface CreateArtistRequest {
  name: string;
  type: ArtistType;
  country?: string;
  biography?: string;
}

export interface UpdateArtistRequest {
  name?: string;
  type?: ArtistType;
  country?: string;
  biography?: string;
  active?: boolean;
}

export interface ArtistSearchParams {
  name?: string;
  type?: ArtistType;
  active?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  size?: number;
}
