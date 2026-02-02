import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { AlbumsFacade } from '../../facades/albums.facade';
import { Album } from '../../models/album.model';
import { ApiService } from '../../../../core/services/api.service';
import { TrackAudioService } from '../../services/track-audio.service';

interface ArtistOption {
  id: number;
  name: string;
}

interface TrackFormItem {
  id?: number;
  title: string;
  durationFormatted: string;
  duration: number;
  audioKey?: string;
  audioFormat?: string;
  bitrate?: number;
  fileSize?: number;
  streamUrl?: string;
  isUploading?: boolean;
  uploadProgress?: number;
  isPlaying?: boolean;
  pendingAudioFile?: File;
  durationFromAudio?: boolean;
}

@Component({
  selector: 'app-album-form',
  templateUrl: './album-form.component.html',
  styleUrls: ['./album-form.component.scss']
})
export class AlbumFormComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  isEditMode = false;
  albumId: number | null = null;
  loading = false;
  uploading = false;
  isDragOver = false;

  artists: ArtistOption[] = [];
  tracks: TrackFormItem[] = [];
  selectedFile: File | null = null;
  coverPreview: string | null = null;

  private destroy$ = new Subject<void>();
  private audioElements: Map<number, HTMLAudioElement> = new Map();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private facade: AlbumsFacade,
    private api: ApiService,
    private snackBar: MatSnackBar,
    private trackAudioService: TrackAudioService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadArtists();
    this.checkEditMode();
    this.subscribeToState();
  }

  ngOnDestroy(): void {
    this.facade.clearSelectedAlbum();
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupAudioElements();
  }

  private cleanupAudioElements(): void {
    this.audioElements.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.audioElements.clear();
  }

  private initForm(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
      releaseYear: [new Date().getFullYear(), [Validators.required, Validators.min(1900), Validators.max(2100)]],
      genre: [''],
      artistIds: [[], Validators.required]
    });
  }

  private loadArtists(): void {
    this.api.get<any>('/artists', { size: 100 }).subscribe({
      next: (response) => {
        this.artists = response.content.map((a: any) => ({ id: a.id, name: a.name }));
      },
      error: () => {
        this.snackBar.open('Erro ao carregar artistas', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.albumId = +id;
      this.facade.loadAlbum(this.albumId);
    }
  }

  private subscribeToState(): void {
    this.facade.selectedAlbum$
      .pipe(takeUntil(this.destroy$))
      .subscribe(album => {
        if (album && this.isEditMode) {
          this.populateForm(album);
        }
      });

    this.facade.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);
  }

  private populateForm(album: Album): void {
    this.form.patchValue({
      title: album.title,
      releaseYear: album.releaseYear,
      genre: album.genre || '',
      artistIds: album.artists?.map(a => a.id) || []
    });
    this.coverPreview = album.coverUrl || null;

    // Populate tracks with audio info
    if (album.tracks?.length) {
      this.tracks = album.tracks.map(track => ({
        id: track.id,
        title: track.title,
        duration: track.duration,
        durationFormatted: this.formatDuration(track.duration),
        audioKey: track.audioKey,
        audioFormat: track.audioFormat,
        bitrate: track.bitrate,
        fileSize: track.fileSize,
        isUploading: false,
        uploadProgress: 0,
        isPlaying: false
      }));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  private handleFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Por favor, selecione uma imagem valida', 'Fechar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('A imagem deve ter no maximo 5MB', 'Fechar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.coverPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeFile(): void {
    this.selectedFile = null;
    this.coverPreview = null;
  }

  getArtistName(artistId: number): string {
    const artist = this.artists.find(a => a.id === artistId);
    return artist?.name || '';
  }

  removeArtist(artistId: number): void {
    const currentIds = this.form.get('artistIds')?.value || [];
    const newIds = currentIds.filter((id: number) => id !== artistId);
    this.form.get('artistIds')?.setValue(newIds);
  }

  // Track management methods
  addTrack(): void {
    this.tracks.push({
      title: '',
      duration: 0,
      durationFormatted: '',
      isUploading: false,
      uploadProgress: 0,
      isPlaying: false
    });
  }

  removeTrack(index: number): void {
    const track = this.tracks[index];
    if (track.isPlaying) {
      this.stopAudio(index);
    }
    this.tracks.splice(index, 1);
  }

  onDurationBlur(index: number): void {
    const track = this.tracks[index];
    track.duration = this.parseDuration(track.durationFormatted);
    track.durationFormatted = this.formatDuration(track.duration);
  }

  private formatDuration(seconds: number): string {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private parseDuration(formatted: string): number {
    if (!formatted) return 0;
    const parts = formatted.split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10) || 0;
      const secs = parseInt(parts[1], 10) || 0;
      return mins * 60 + secs;
    }
    return parseInt(formatted, 10) || 0;
  }

  // Audio upload methods
  onAudioFileSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleAudioFile(input.files[0], index);
    }
  }

  onAudioDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onAudioDrop(event: DragEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleAudioFile(event.dataTransfer.files[0], index);
    }
  }

  private async handleAudioFile(file: File, index: number): Promise<void> {
    const track = this.tracks[index];
    const allowedTypes = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp3'];
    const allowedExtensions = ['.mp3', '.ogg', '.wav'];

    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);

    if (!isValidType) {
      this.snackBar.open('Formato invalido. Use MP3, OGG ou WAV', 'Fechar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      this.snackBar.open('O arquivo deve ter no maximo 50MB', 'Fechar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    try {
      const durationSeconds = await this.getAudioDuration(file);
      track.duration = durationSeconds;
      track.durationFormatted = this.formatDuration(durationSeconds);
      track.durationFromAudio = true;
      track.audioFormat = this.getAudioFormat(file.name);
      track.fileSize = file.size;

      if (track.id) {
        this.uploadTrackAudio(track, file, index);
      } else {
        track.pendingAudioFile = file;
        this.snackBar.open('Audio sera enviado ao salvar o album', 'OK', { duration: 3000 });
      }
    } catch {
      this.snackBar.open('Erro ao processar arquivo de audio', 'Fechar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  private getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = 'metadata';

      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(audio.src);
        resolve(Math.round(audio.duration));
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audio.src);
        reject(new Error('Nao foi possivel ler o arquivo de audio'));
      };

      audio.src = URL.createObjectURL(file);
    });
  }

  removePendingAudio(index: number): void {
    const track = this.tracks[index];
    track.pendingAudioFile = undefined;
    track.audioFormat = undefined;
    track.fileSize = undefined;
    track.durationFromAudio = false;
  }

  private uploadTrackAudio(track: TrackFormItem, file: File, index: number): void {
    track.isUploading = true;
    track.uploadProgress = 0;

    this.trackAudioService.uploadAudio(track.id!, file).subscribe({
      next: (progress) => {
        track.uploadProgress = progress.progress;
        if (progress.completed && progress.response) {
          track.isUploading = false;
          track.audioKey = progress.response.audioKey;
          track.streamUrl = progress.response.streamUrl;
          track.audioFormat = this.getAudioFormat(file.name);
          track.fileSize = file.size;

          this.snackBar.open('Audio enviado com sucesso', 'Fechar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }
      },
      error: () => {
        track.isUploading = false;
        track.uploadProgress = 0;
        this.snackBar.open('Erro ao enviar audio', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private getAudioFormat(filename: string): string {
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    const formats: { [key: string]: string } = {
      '.mp3': 'MP3',
      '.ogg': 'OGG',
      '.wav': 'WAV'
    };
    return formats[ext] || 'AUDIO';
  }

  deleteTrackAudio(index: number): void {
    const track = this.tracks[index];
    if (!track.id || !track.audioKey) return;

    if (track.isPlaying) {
      this.stopAudio(index);
    }

    this.trackAudioService.deleteAudio(track.id).subscribe({
      next: () => {
        track.audioKey = undefined;
        track.audioFormat = undefined;
        track.bitrate = undefined;
        track.fileSize = undefined;
        track.streamUrl = undefined;

        this.snackBar.open('Audio removido com sucesso', 'Fechar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: () => {
        this.snackBar.open('Erro ao remover audio', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // Audio playback methods
  toggleAudioPlayback(index: number): void {
    const track = this.tracks[index];

    if (track.isPlaying) {
      this.stopAudio(index);
    } else {
      this.playAudio(index);
    }
  }

  private playAudio(index: number): void {
    const track = this.tracks[index];
    if (!track.id) return;

    // Stop any other playing track
    this.tracks.forEach((t, i) => {
      if (t.isPlaying && i !== index) {
        this.stopAudio(i);
      }
    });

    // Get or create audio element
    let audio = this.audioElements.get(index);
    if (!audio) {
      audio = new Audio();
      audio.addEventListener('ended', () => {
        track.isPlaying = false;
      });
      audio.addEventListener('error', () => {
        track.isPlaying = false;
        this.snackBar.open('Erro ao reproduzir audio', 'Fechar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      });
      this.audioElements.set(index, audio);
    }

    // Fetch fresh stream URL and play
    if (track.streamUrl) {
      audio.src = track.streamUrl;
      audio.play();
      track.isPlaying = true;
    } else {
      this.trackAudioService.getStreamUrl(track.id).subscribe({
        next: (response) => {
          track.streamUrl = response.streamUrl;
          audio!.src = response.streamUrl;
          audio!.play();
          track.isPlaying = true;
        },
        error: () => {
          this.snackBar.open('Erro ao obter URL de streaming', 'Fechar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  private stopAudio(index: number): void {
    const track = this.tracks[index];
    const audio = this.audioElements.get(index);

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    track.isPlaying = false;
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  }

  private getTracksForSubmit(): any[] {
    return this.tracks
      .filter(t => t.title.trim())
      .map((t, index) => ({
        id: t.id,  // Incluir ID para preservar metadados de áudio
        title: t.title.trim(),
        trackNumber: index + 1,
        duration: t.duration
      }));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = {
      ...this.form.value,
      tracks: this.getTracksForSubmit()
    };

    if (this.isEditMode && this.albumId) {
      this.updateAlbum(formValue);
    } else {
      this.createAlbum(formValue);
    }
  }

  private createAlbum(formValue: any): void {
    this.facade.createAlbum(formValue).subscribe({
      next: (album) => {
        const hasPendingAudios = this.tracks.some(t => t.pendingAudioFile);
        const hasCover = !!this.selectedFile;

        if (hasPendingAudios && album.tracks?.length) {
          this.uploadPendingAudioFiles(album.tracks).then(() => {
            if (hasCover) {
              this.uploadCover(album.id);
            } else {
              this.onSuccess('Album criado com sucesso!', album.id);
            }
          });
        } else if (hasCover) {
          this.uploadCover(album.id);
        } else {
          this.onSuccess('Album criado com sucesso!', album.id);
        }
      },
      error: () => this.onError('Erro ao criar album')
    });
  }

  private async uploadPendingAudioFiles(savedTracks: any[]): Promise<void> {
    const pendingUploads: Promise<void>[] = [];

    for (let i = 0; i < this.tracks.length; i++) {
      const formTrack = this.tracks[i];
      if (formTrack.pendingAudioFile && formTrack.title.trim()) {
        const savedTrack = savedTracks.find(t => t.trackNumber === i + 1);
        if (savedTrack?.id) {
          formTrack.id = savedTrack.id;
          const file = formTrack.pendingAudioFile;
          pendingUploads.push(
            new Promise<void>((resolve) => {
              this.trackAudioService.uploadAudio(savedTrack.id, file).subscribe({
                next: (progress) => {
                  formTrack.uploadProgress = progress.progress;
                  if (progress.completed) {
                    formTrack.pendingAudioFile = undefined;
                    resolve();
                  }
                },
                error: () => {
                  this.snackBar.open(`Erro ao enviar audio da faixa ${i + 1}`, 'Fechar', {
                    duration: 3000,
                    panelClass: ['error-snackbar']
                  });
                  resolve();
                }
              });
            })
          );
        }
      }
    }

    await Promise.all(pendingUploads);
  }

  private updateAlbum(formValue: any): void {
    this.facade.updateAlbum(this.albumId!, formValue).subscribe({
      next: () => {
        if (this.selectedFile) {
          this.uploadCover(this.albumId!);
        } else {
          this.onSuccess('Album atualizado com sucesso!', this.albumId!);
        }
      },
      error: () => this.onError('Erro ao atualizar album')
    });
  }

  private uploadCover(albumId: number): void {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.facade.uploadCover(albumId, this.selectedFile).subscribe({
      next: () => {
        this.uploading = false;
        this.onSuccess(
          this.isEditMode ? 'Album atualizado com sucesso!' : 'Album criado com sucesso!',
          albumId
        );
      },
      error: () => {
        this.uploading = false;
        this.snackBar.open('Album salvo, mas erro ao enviar capa', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.router.navigate(['/albums', albumId]);
      }
    });
  }

  private onSuccess(message: string, albumId: number): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
    this.router.navigate(['/albums', albumId]);
  }

  private onError(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  cancel(): void {
    if (this.isEditMode && this.albumId) {
      this.router.navigate(['/albums', this.albumId]);
    } else {
      this.router.navigate(['/albums']);
    }
  }
}
