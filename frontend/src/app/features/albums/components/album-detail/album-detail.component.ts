import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AlbumsFacade } from '../../facades/albums.facade';
import { Album } from '../../models/album.model';

@Component({
  selector: 'app-album-detail',
  templateUrl: './album-detail.component.html',
  styleUrls: ['./album-detail.component.scss']
})
export class AlbumDetailComponent implements OnInit, OnDestroy {
  album: Album | null = null;
  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private facade: AlbumsFacade
  ) {}

  ngOnInit(): void {
    this.subscribeToState();
    this.loadAlbum();
  }

  ngOnDestroy(): void {
    this.facade.clearSelectedAlbum();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToState(): void {
    this.facade.selectedAlbum$
      .pipe(takeUntil(this.destroy$))
      .subscribe(album => this.album = album);

    this.facade.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);

    this.facade.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => this.error = error);
  }

  private loadAlbum(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.loadAlbum(+id);
    }
  }

  editAlbum(): void {
    if (this.album) {
      this.router.navigate(['/albums', this.album.id, 'edit']);
    }
  }

  viewArtist(artistId: number): void {
    this.router.navigate(['/artists', artistId]);
  }

  goBack(): void {
    this.router.navigate(['/albums']);
  }

  getArtistNames(): string {
    return this.album?.artists?.map(a => a.name).join(', ') || 'Sem artista';
  }
}
