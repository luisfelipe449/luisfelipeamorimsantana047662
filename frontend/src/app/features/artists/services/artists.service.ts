import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PageResponse } from '../../../core/services/api.service';
import {
  Artist,
  CreateArtistRequest,
  UpdateArtistRequest,
  ArtistSearchParams,
  PhotoUploadResponse
} from '../models/artist.model';

@Injectable()
export class ArtistsService {
  private readonly PATH = '/artists';

  constructor(private api: ApiService) {}

  getAll(params?: ArtistSearchParams): Observable<PageResponse<Artist>> {
    return this.api.get<PageResponse<Artist>>(this.PATH, params);
  }

  getById(id: number): Observable<Artist> {
    return this.api.get<Artist>(`${this.PATH}/${id}`);
  }

  create(artist: CreateArtistRequest): Observable<Artist> {
    return this.api.post<Artist>(this.PATH, artist);
  }

  update(id: number, artist: UpdateArtistRequest): Observable<Artist> {
    return this.api.put<Artist>(`${this.PATH}/${id}`, artist);
  }

  search(name: string, sortDirection: 'asc' | 'desc' = 'asc'): Observable<PageResponse<Artist>> {
    return this.api.get<PageResponse<Artist>>(this.PATH, {
      name,
      sortBy: 'name',
      sortDirection
    });
  }

  getByType(type: 'SOLO' | 'BAND'): Observable<PageResponse<Artist>> {
    return this.api.get<PageResponse<Artist>>(this.PATH, { type });
  }

  uploadPhoto(id: number, file: File): Observable<PhotoUploadResponse> {
    return this.api.uploadFile(`${this.PATH}/${id}/photo`, file);
  }

  deletePhoto(id: number): Observable<void> {
    return this.api.delete<void>(`${this.PATH}/${id}/photo`);
  }

  getPhotoUrl(id: number): Observable<{ url: string }> {
    return this.api.get<{ url: string }>(`${this.PATH}/${id}/photo/url`);
  }

  deactivate(id: number): Observable<void> {
    return this.api.delete<void>(`${this.PATH}/${id}`);
  }
}
