import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AlbumsFacade } from '../../facades/albums.facade';
import { Album } from '../../models/album.model';
import { PlayerFacade } from '@features/player/facades/player.facade';
import { TrackDTO } from '../../models/track.model';

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
    private facade: AlbumsFacade,
    private playerFacade: PlayerFacade
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

  formatDuration(seconds: number | undefined): string {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatTotalDuration(seconds: number | undefined): string {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  deleteAlbum(): void {
    if (!this.album) return;
    if (confirm(`Deseja excluir o álbum "${this.album.title}"?`)) {
      this.facade.deleteAlbum(this.album.id);
      this.router.navigate(['/albums']);
    }
  }

  async playAlbum(): Promise<void> {
    if (!this.album || !this.album.tracks || this.album.tracks.length === 0) {
      return;
    }

    const tracks: TrackDTO[] = this.album.tracks.map(track => ({
      ...track,
      albumTitle: this.album!.title,
      artistName: this.getArtistNames(),
      coverUrl: this.album!.coverUrls?.[0],
      streamUrl: undefined
    }));

    await this.playerFacade.playAlbum(tracks, 0);
  }

  async playTrack(track: any, index: number): Promise<void> {
    if (!this.album || !this.album.tracks) {
      return;
    }

    const tracks: TrackDTO[] = this.album.tracks.map(t => ({
      ...t,
      albumTitle: this.album!.title,
      artistName: this.getArtistNames(),
      coverUrl: this.album!.coverUrls?.[0],
      streamUrl: undefined
    }));

    await this.playerFacade.playAlbum(tracks, index);
  }

  isTrackPlaying(track: any): boolean {
    return this.playerFacade.isTrackPlaying(track.id);
  }
}
