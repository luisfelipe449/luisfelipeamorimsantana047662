import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { AlbumsFacade } from '../../facades/albums.facade';
import { Album } from '../../models/album.model';
import { ApiService } from '../../../../core/services/api.service';

interface ArtistOption {
  id: number;
  name: string;
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

  artists: ArtistOption[] = [];
  selectedFile: File | null = null;
  coverPreview: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private facade: AlbumsFacade,
    private api: ApiService,
    private snackBar: MatSnackBar
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
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.coverPreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.coverPreview = null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;

    if (this.isEditMode && this.albumId) {
      this.updateAlbum(formValue);
    } else {
      this.createAlbum(formValue);
    }
  }

  private createAlbum(formValue: any): void {
    this.facade.createAlbum(formValue).subscribe({
      next: (album) => {
        if (this.selectedFile) {
          this.uploadCover(album.id);
        } else {
          this.onSuccess('Album criado com sucesso!', album.id);
        }
      },
      error: () => this.onError('Erro ao criar album')
    });
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
