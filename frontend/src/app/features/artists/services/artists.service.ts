import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PageResponse } from '../../../core/services/api.service';
import {
  Artist,
  CreateArtistRequest,
  UpdateArtistRequest,
  ArtistSearchParams
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
}
