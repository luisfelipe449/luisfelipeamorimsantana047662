import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PageResponse } from '../../../core/services/api.service';
import {
  Album,
  CreateAlbumRequest,
  UpdateAlbumRequest,
  AlbumSearchParams
} from '../models/album.model';

@Injectable()
export class AlbumsService {
  private readonly PATH = '/albums';

  constructor(private api: ApiService) {}

  getAll(params?: AlbumSearchParams): Observable<PageResponse<Album>> {
    return this.api.get<PageResponse<Album>>(this.PATH, params);
  }

  getById(id: number): Observable<Album> {
    return this.api.get<Album>(`${this.PATH}/${id}`);
  }

  create(album: CreateAlbumRequest): Observable<Album> {
    return this.api.post<Album>(this.PATH, album);
  }

  update(id: number, album: UpdateAlbumRequest): Observable<Album> {
    return this.api.put<Album>(`${this.PATH}/${id}`, album);
  }

  uploadCover(id: number, file: File): Observable<{ coverUrl: string }> {
    return this.api.uploadFile(`${this.PATH}/${id}/covers`, file);
  }

  getCoverUrl(id: number): Observable<{ url: string; expiresAt: string }> {
    return this.api.get<{ url: string; expiresAt: string }>(`${this.PATH}/${id}/covers/url`);
  }
}
