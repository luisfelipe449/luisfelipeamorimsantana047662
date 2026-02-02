import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { ArtistsFacade } from '../../facades/artists.facade';
import { Artist } from '../../models/artist.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-artist-detail',
  templateUrl: './artist-detail.component.html',
  styleUrls: ['./artist-detail.component.scss']
})
export class ArtistDetailComponent implements OnInit, OnDestroy {
  artist: Artist | null = null;
  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private facade: ArtistsFacade,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.subscribeToState();
    this.loadArtist();
  }

  ngOnDestroy(): void {
    this.facade.clearSelectedArtist();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToState(): void {
    this.facade.selectedArtist$
      .pipe(takeUntil(this.destroy$))
      .subscribe(artist => this.artist = artist);

    this.facade.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);

    this.facade.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => this.error = error);
  }

  private loadArtist(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.loadArtist(+id);
    }
  }

  editArtist(): void {
    if (this.artist) {
      this.router.navigate(['/artists', this.artist.id, 'edit']);
    }
  }

  viewAlbum(albumId: number): void {
    this.router.navigate(['/albums', albumId]);
  }

  goBack(): void {
    this.router.navigate(['/artists']);
  }

  createAlbum(): void {
    this.router.navigate(['/albums', 'new']);
  }

  getTypeLabel(type: string): string {
    return type === 'SOLO' ? 'Cantor Solo' : 'Banda';
  }

  deleteArtist(): void {
    if (!this.artist) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Excluir Artista',
        message: `Tem certeza que deseja excluir "${this.artist.name}"?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.artist) {
        this.facade.deactivateArtist(this.artist.id).subscribe({
          next: () => {
            this.snackBar.open('Artista excluído com sucesso!', 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/artists']);
          },
          error: () => {
            this.snackBar.open('Erro ao excluir artista', 'Fechar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }
}
