import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, finalize } from 'rxjs';
import { PageResponse } from '../../../core/services/api.service';
import {
  Artist,
  CreateArtistRequest,
  UpdateArtistRequest,
  ArtistSearchParams,
  ArtistType
} from '../models/artist.model';
import { ArtistsService } from '../services/artists.service';

interface ArtistsState {
  artists: Artist[];
  selectedArtist: Artist | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  filters: {
    name: string;
    type: ArtistType | null;
    sortDirection: 'asc' | 'desc';
  };
}

const initialState: ArtistsState = {
  artists: [],
  selectedArtist: null,
  loading: false,
  error: null,
  pagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  },
  filters: {
    name: '',
    type: null,
    sortDirection: 'asc'
  }
};

@Injectable()
export class ArtistsFacade {
  private state = new BehaviorSubject<ArtistsState>(initialState);

  // Selectors
  readonly artists$ = new BehaviorSubject<Artist[]>([]);
  readonly selectedArtist$ = new BehaviorSubject<Artist | null>(null);
  readonly loading$ = new BehaviorSubject<boolean>(false);
  readonly error$ = new BehaviorSubject<string | null>(null);
  readonly pagination$ = new BehaviorSubject(initialState.pagination);
  readonly filters$ = new BehaviorSubject(initialState.filters);

  constructor(private artistsService: ArtistsService) {}

  loadArtists(params?: ArtistSearchParams): void {
    this.loading$.next(true);
    this.error$.next(null);

    const filters = this.filters$.value;
    const searchParams: ArtistSearchParams = {
      name: filters.name || undefined,
      type: filters.type || undefined,
      sortDirection: filters.sortDirection,
      page: params?.page ?? this.pagination$.value.page,
      size: params?.size ?? this.pagination$.value.size,
      sortBy: 'name',
      ...params
    };

    this.artistsService.getAll(searchParams).pipe(
      tap((response: PageResponse<Artist>) => {
        this.artists$.next(response.content);
        this.pagination$.next({
          page: response.page,
          size: response.size,
          totalElements: response.totalElements,
          totalPages: response.totalPages
        });
      }),
      finalize(() => this.loading$.next(false))
    ).subscribe({
      error: (err) => this.error$.next(err.message || 'Erro ao carregar artistas')
    });
  }

  loadArtist(id: number): void {
    this.loading$.next(true);
    this.error$.next(null);

    this.artistsService.getById(id).pipe(
      tap((artist: Artist) => this.selectedArtist$.next(artist)),
      finalize(() => this.loading$.next(false))
    ).subscribe({
      error: (err) => this.error$.next(err.message || 'Erro ao carregar artista')
    });
  }

  createArtist(artist: CreateArtistRequest): Observable<Artist> {
    this.loading$.next(true);
    return this.artistsService.create(artist).pipe(
      tap(() => this.loadArtists()),
      finalize(() => this.loading$.next(false))
    );
  }

  updateArtist(id: number, artist: UpdateArtistRequest): Observable<Artist> {
    this.loading$.next(true);
    return this.artistsService.update(id, artist).pipe(
      tap((updated) => {
        this.selectedArtist$.next(updated);
        this.loadArtists();
      }),
      finalize(() => this.loading$.next(false))
    );
  }

  setNameFilter(name: string): void {
    const current = this.filters$.value;
    this.filters$.next({ ...current, name });
    this.loadArtists({ page: 0 });
  }

  setTypeFilter(type: ArtistType | null): void {
    const current = this.filters$.value;
    this.filters$.next({ ...current, type });
    this.loadArtists({ page: 0 });
  }

  setSortDirection(sortDirection: 'asc' | 'desc'): void {
    const current = this.filters$.value;
    this.filters$.next({ ...current, sortDirection });
    this.loadArtists();
  }

  setPage(page: number): void {
    this.loadArtists({ page });
  }

  setPageSize(size: number): void {
    this.loadArtists({ page: 0, size });
  }

  clearSelectedArtist(): void {
    this.selectedArtist$.next(null);
  }

  clearFilters(): void {
    this.filters$.next(initialState.filters);
    this.loadArtists({ page: 0 });
  }
}
