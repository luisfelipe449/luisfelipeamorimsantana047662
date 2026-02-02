import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AlbumsFacade } from '../../facades/albums.facade';
import { Album } from '../../models/album.model';

@Component({
  selector: 'app-album-list',
  templateUrl: './album-list.component.html',
  styleUrls: ['./album-list.component.scss']
})
export class AlbumListComponent implements OnInit, OnDestroy {
  albums: Album[] = [];
  loading = false;
  searchTerm = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  viewMode: 'list' | 'grid' = 'grid';

  // Pagination
  totalElements = 0;
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50];

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private facade: AlbumsFacade,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscribeToState();
    this.setupSearch();
    this.facade.loadAlbums();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToState(): void {
    this.facade.albums$
      .pipe(takeUntil(this.destroy$))
      .subscribe(albums => this.albums = albums);

    this.facade.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);

    this.facade.pagination$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pagination => {
        this.totalElements = pagination.totalElements;
        this.pageSize = pagination.size;
        this.currentPage = pagination.page;
      });

    this.facade.filters$
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.sortDirection = filters.sortDirection;
      });
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(term => {
        if (term.length >= 2 || term.length === 0) {
          this.facade.setTitleFilter(term);
        }
      });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  onSortChange(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.facade.setSortDirection(this.sortDirection);
  }

  onPageChange(event: PageEvent): void {
    if (event.pageSize !== this.pageSize) {
      this.facade.setPageSize(event.pageSize);
    } else {
      this.facade.setPage(event.pageIndex);
    }
  }

  viewAlbum(album: Album): void {
    this.router.navigate(['/albums', album.id]);
  }

  editAlbum(album: Album): void {
    this.router.navigate(['/albums', album.id, 'edit']);
  }

  createAlbum(): void {
    this.router.navigate(['/albums', 'new']);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.facade.clearFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchSubject.next('');
  }

  getArtistNames(album: Album): string {
    return album.artists?.map(a => a.name).join(', ') || 'Sem artista';
  }

  formatDuration(seconds: number | undefined): string {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  setViewMode(mode: 'list' | 'grid'): void {
    this.viewMode = mode;
  }
}
