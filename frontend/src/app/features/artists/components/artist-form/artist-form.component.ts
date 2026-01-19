import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { ArtistsFacade } from '../../facades/artists.facade';
import { Artist, ArtistType } from '../../models/artist.model';

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
    private snackBar: MatSnackBar
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
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;

    if (this.isEditMode && this.artistId) {
      this.facade.updateArtist(this.artistId, formValue).subscribe({
        next: () => {
          this.snackBar.open('Artista atualizado com sucesso!', 'Fechar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/artists', this.artistId]);
        },
        error: () => {
          this.snackBar.open('Erro ao atualizar artista', 'Fechar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.facade.createArtist(formValue).subscribe({
        next: (artist) => {
          this.snackBar.open('Artista criado com sucesso!', 'Fechar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/artists', artist.id]);
        },
        error: () => {
          this.snackBar.open('Erro ao criar artista', 'Fechar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  cancel(): void {
    if (this.isEditMode && this.artistId) {
      this.router.navigate(['/artists', this.artistId]);
    } else {
      this.router.navigate(['/artists']);
    }
  }
}
