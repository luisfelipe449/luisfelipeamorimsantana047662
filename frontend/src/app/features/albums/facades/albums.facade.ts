import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, finalize } from 'rxjs';
import { PageResponse } from '../../../core/services/api.service';
import {
  Album,
  CreateAlbumRequest,
  UpdateAlbumRequest,
  AlbumSearchParams
} from '../models/album.model';
import { AlbumsService } from '../services/albums.service';

interface AlbumsState {
  albums: Album[];
  selectedAlbum: Album | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  filters: {
    title: string;
    sortDirection: 'asc' | 'desc';
  };
}

const initialState: AlbumsState = {
  albums: [],
  selectedAlbum: null,
  loading: false,
  error: null,
  pagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  },
  filters: {
    title: '',
    sortDirection: 'asc'
  }
};

@Injectable()
export class AlbumsFacade {
  // Selectors using BehaviorSubject
  readonly albums$ = new BehaviorSubject<Album[]>([]);
  readonly selectedAlbum$ = new BehaviorSubject<Album | null>(null);
  readonly loading$ = new BehaviorSubject<boolean>(false);
  readonly error$ = new BehaviorSubject<string | null>(null);
  readonly pagination$ = new BehaviorSubject(initialState.pagination);
  readonly filters$ = new BehaviorSubject(initialState.filters);

  constructor(private albumsService: AlbumsService) {}

  loadAlbums(params?: AlbumSearchParams): void {
    this.loading$.next(true);
    this.error$.next(null);

    const searchParams: AlbumSearchParams = {
      title: this.filters$.value.title || undefined,
      page: params?.page ?? this.pagination$.value.page,
      size: params?.size ?? this.pagination$.value.size,
      sortBy: 'title',
      sortDirection: this.filters$.value.sortDirection,
      ...params
    };

    this.albumsService.getAll(searchParams).pipe(
      tap((response: PageResponse<Album>) => {
        this.albums$.next(response.content);
        this.pagination$.next({
          page: response.page,
          size: response.size,
          totalElements: response.totalElements,
          totalPages: response.totalPages
        });
      }),
      finalize(() => this.loading$.next(false))
    ).subscribe({
      error: (err) => this.error$.next(err.message || 'Erro ao carregar albums')
    });
  }

  loadAlbum(id: number): void {
    this.loading$.next(true);
    this.error$.next(null);

    this.albumsService.getById(id).pipe(
      tap((album: Album) => this.selectedAlbum$.next(album)),
      finalize(() => this.loading$.next(false))
    ).subscribe({
      error: (err) => this.error$.next(err.message || 'Erro ao carregar album')
    });
  }

  createAlbum(album: CreateAlbumRequest): Observable<Album> {
    this.loading$.next(true);
    return this.albumsService.create(album).pipe(
      tap(() => this.loadAlbums()),
      finalize(() => this.loading$.next(false))
    );
  }

  updateAlbum(id: number, album: UpdateAlbumRequest): Observable<Album> {
    this.loading$.next(true);
    return this.albumsService.update(id, album).pipe(
      tap((updated) => {
        this.selectedAlbum$.next(updated);
        this.loadAlbums();
      }),
      finalize(() => this.loading$.next(false))
    );
  }

  uploadCover(id: number, file: File): Observable<{ coverUrl: string }> {
    this.loading$.next(true);
    return this.albumsService.uploadCover(id, file).pipe(
      tap(() => this.loadAlbum(id)),
      finalize(() => this.loading$.next(false))
    );
  }

  setTitleFilter(title: string): void {
    const current = this.filters$.value;
    this.filters$.next({ ...current, title });
    this.loadAlbums({ page: 0 });
  }

  setSortDirection(sortDirection: 'asc' | 'desc'): void {
    const current = this.filters$.value;
    this.filters$.next({ ...current, sortDirection });
    this.loadAlbums();
  }

  setPage(page: number): void {
    this.loadAlbums({ page });
  }

  setPageSize(size: number): void {
    this.loadAlbums({ page: 0, size });
  }

  clearSelectedAlbum(): void {
    this.selectedAlbum$.next(null);
  }

  clearFilters(): void {
    this.filters$.next(initialState.filters);
    this.loadAlbums({ page: 0 });
  }
}
