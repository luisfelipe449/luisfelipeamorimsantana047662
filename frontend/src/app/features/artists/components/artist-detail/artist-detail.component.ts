import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ArtistsFacade } from '../../facades/artists.facade';
import { Artist } from '../../models/artist.model';

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
    private facade: ArtistsFacade
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
}
