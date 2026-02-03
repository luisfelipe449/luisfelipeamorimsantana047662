import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, take } from 'rxjs';
import { ArtistsFacade } from '../../facades/artists.facade';
import { AlbumsFacade } from '../../../albums/facades/albums.facade';
import { Artist, ArtistType, AlbumSummary } from '../../models/artist.model';
import { AlbumSelectorDialogComponent, AlbumOption } from '../../../../shared/components/album-selector-dialog/album-selector-dialog.component';
import { getErrorMessage } from '../../../../core/utils/error-handler.util';

@Component({
  selector: 'app-artist-form',
  templateUrl: './artist-form.component.html',
  styleUrls: ['./artist-form.component.scss']
})
export class ArtistFormComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  isEditMode = false;
  artistId: number | null = null;
  loading = false;
  uploading = false;
  isDragOver = false;

  selectedFile: File | null = null;
  photoPreview: string | null = null;

  // Album selection
  selectedAlbums: AlbumSummary[] = [];

  artistTypes: { value: ArtistType; label: string }[] = [
    { value: 'SOLO', label: 'Cantor Solo' },
    { value: 'BAND', label: 'Banda' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private facade: ArtistsFacade,
    private albumsFacade: AlbumsFacade,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
    this.subscribeToState();
  }

  ngOnDestroy(): void {
    this.facade.clearSelectedArtist();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      type: ['SOLO', Validators.required],
      country: [''],
      biography: ['', Validators.maxLength(1000)]
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.artistId = +id;
      this.facade.loadArtist(this.artistId);
    }
  }

  private subscribeToState(): void {
    this.facade.selectedArtist$
      .pipe(takeUntil(this.destroy$))
      .subscribe(artist => {
        if (artist && this.isEditMode) {
          this.populateForm(artist);
        }
      });

    this.facade.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);
  }

  private populateForm(artist: Artist): void {
    this.form.patchValue({
      name: artist.name,
      type: artist.type,
      country: artist.country || '',
      biography: artist.biography || ''
    });
    this.photoPreview = artist.photoUrl || null;
    this.selectedAlbums = artist.albums ? [...artist.albums] : [];
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
      this.snackBar.open('Por favor, selecione uma imagem válida', 'Fechar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('A imagem deve ter no máximo 5MB', 'Fechar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeFile(): void {
    this.selectedFile = null;
    this.photoPreview = null;
  }

  openAlbumSelector(): void {
    // Load all albums
    this.albumsFacade.loadAlbums({ size: 100 });

    this.albumsFacade.albums$.pipe(take(2)).subscribe(albums => {
      if (albums.length === 0) return;

      const availableAlbums: AlbumOption[] = albums.map(album => ({
        id: album.id,
        title: album.title,
        releaseYear: album.releaseYear,
        coverUrl: album.coverUrl
      }));

      const selectedAlbumIds = this.selectedAlbums.map(a => a.id);

      const dialogRef = this.dialog.open(AlbumSelectorDialogComponent, {
        data: {
          selectedAlbumIds,
          availableAlbums,
          title: 'Selecionar Álbuns'
        },
        width: '500px'
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result !== null) {
          // Update selected albums from the result
          this.selectedAlbums = albums
            .filter(album => result.includes(album.id))
            .map(album => ({
              id: album.id,
              title: album.title,
              releaseYear: album.releaseYear,
              coverUrl: album.coverUrl
            }));
        }
      });
    });
  }

  removeAlbum(albumId: number): void {
    this.selectedAlbums = this.selectedAlbums.filter(a => a.id !== albumId);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;

    if (this.isEditMode && this.artistId) {
      this.updateArtist(formValue);
    } else {
      this.createArtist(formValue);
    }
  }

  private createArtist(formValue: any): void {
    const request = {
      ...formValue,
      albumIds: this.selectedAlbums.map(a => a.id)
    };

    this.facade.createArtist(request).subscribe({
      next: (artist) => {
        if (this.selectedFile) {
          this.uploadPhoto(artist.id);
        } else {
          this.onSuccess('Artista criado com sucesso!', artist.id);
        }
      },
      error: (error) => this.onError(getErrorMessage(error, 'Erro ao criar artista'))
    });
  }

  private updateArtist(formValue: any): void {
    const request = {
      ...formValue,
      albumIds: this.selectedAlbums.map(a => a.id)
    };

    this.facade.updateArtist(this.artistId!, request).subscribe({
      next: () => {
        if (this.selectedFile) {
          this.uploadPhoto(this.artistId!);
        } else {
          this.onSuccess('Artista atualizado com sucesso!', this.artistId!);
        }
      },
      error: (error) => this.onError(getErrorMessage(error, 'Erro ao atualizar artista'))
    });
  }

  private uploadPhoto(artistId: number): void {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.facade.uploadPhoto(artistId, this.selectedFile).subscribe({
      next: () => {
        this.uploading = false;
        this.onSuccess(
          this.isEditMode ? 'Artista atualizado com sucesso!' : 'Artista criado com sucesso!',
          artistId
        );
      },
      error: (error) => {
        this.uploading = false;
        this.snackBar.open(getErrorMessage(error, 'Artista salvo, mas erro ao enviar foto'), 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.router.navigate(['/artists', artistId]);
      }
    });
  }

  private onSuccess(message: string, artistId: number): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
    this.router.navigate(['/artists', artistId]);
  }

  private onError(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  cancel(): void {
    if (this.isEditMode && this.artistId) {
      this.router.navigate(['/artists', this.artistId]);
    } else {
      this.router.navigate(['/artists']);
    }
  }
}
