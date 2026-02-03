import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ArtistsFacade } from '../../facades/artists.facade';
import { Artist, ArtistType } from '../../models/artist.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { getErrorMessage } from '../../../../core/utils/error-handler.util';

@Component({
  selector: 'app-artist-list',
  templateUrl: './artist-list.component.html',
  styleUrls: ['./artist-list.component.scss']
})
export class ArtistListComponent implements OnInit, OnDestroy {
  artists: Artist[] = [];
  loading = false;
  searchTerm = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  typeFilter: ArtistType | null = null;

  // Pagination
  totalElements = 0;
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50];

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private facade: ArtistsFacade,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.subscribeToState();
    this.setupSearch();
    this.facade.loadArtists();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToState(): void {
    this.facade.artists$
      .pipe(takeUntil(this.destroy$))
      .subscribe(artists => this.artists = artists);

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
        this.searchTerm = filters.name || '';
        this.sortDirection = filters.sortDirection;
        this.typeFilter = filters.type;
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
          this.facade.setNameFilter(term);
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

  onTypeFilterChange(type: ArtistType | null): void {
    this.typeFilter = type;
    this.facade.setTypeFilter(type);
  }

  onPageChange(event: PageEvent): void {
    if (event.pageSize !== this.pageSize) {
      this.facade.setPageSize(event.pageSize);
    } else {
      this.facade.setPage(event.pageIndex);
    }
  }

  viewArtist(artist: Artist): void {
    this.router.navigate(['/artists', artist.id]);
  }

  editArtist(artist: Artist): void {
    this.router.navigate(['/artists', artist.id, 'edit']);
  }

  createArtist(): void {
    this.router.navigate(['/artists', 'new']);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.facade.clearFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchSubject.next('');
  }

  getTypeLabel(type: ArtistType): string {
    return type === 'SOLO' ? 'Solo' : 'Banda';
  }

  deleteArtist(artist: Artist): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Excluir Artista',
        message: `Tem certeza que deseja excluir "${artist.name}"?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.facade.deactivateArtist(artist.id).subscribe({
          next: () => {
            this.snackBar.open(`"${artist.name}" foi excluído com sucesso`, 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (error) => {
            this.snackBar.open(getErrorMessage(error, 'Erro ao excluir artista'), 'Fechar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }
}
