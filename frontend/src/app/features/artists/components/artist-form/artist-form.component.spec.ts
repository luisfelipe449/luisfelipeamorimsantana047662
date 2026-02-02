import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { ArtistFormComponent } from './artist-form.component';
import { ArtistsFacade } from '../../facades/artists.facade';
import { AlbumsFacade } from '../../../albums/facades/albums.facade';
import { Artist, ArtistType } from '../../models/artist.model';

describe('ArtistFormComponent', () => {
  let component: ArtistFormComponent;
  let fixture: ComponentFixture<ArtistFormComponent>;
  let facade: jasmine.SpyObj<ArtistsFacade>;
  let albumsFacade: jasmine.SpyObj<AlbumsFacade>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let activatedRoute: any;

  const mockArtist: Artist = {
    id: 1,
    name: 'Test Artist',
    type: 'SOLO' as ArtistType,
    country: 'USA',
    biography: 'Test biography',
    active: true,
    photoUrl: 'http://example.com/photo.jpg',
    albums: []
  };

  const selectedArtistSubject = new BehaviorSubject<Artist | null>(null);
  const loadingSubject = new BehaviorSubject<boolean>(false);
  const albumsSubject = new BehaviorSubject<any[]>([]);

  beforeEach(async () => {
    const facadeSpy = jasmine.createSpyObj('ArtistsFacade', [
      'loadArtist',
      'createArtist',
      'updateArtist',
      'uploadPhoto',
      'clearSelectedArtist'
    ], {
      'selectedArtist$': selectedArtistSubject.asObservable(),
      'loading$': loadingSubject.asObservable()
    });

    const albumsFacadeSpy = jasmine.createSpyObj('AlbumsFacade', [
      'loadAlbums'
    ], {
      'albums$': albumsSubject.asObservable()
    });

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    activatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get')
        }
      }
    };

    await TestBed.configureTestingModule({
      declarations: [ArtistFormComponent],
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatChipsModule
      ],
      providers: [
        { provide: ArtistsFacade, useValue: facadeSpy },
        { provide: AlbumsFacade, useValue: albumsFacadeSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ArtistFormComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(ArtistsFacade) as jasmine.SpyObj<ArtistsFacade>;
    albumsFacade = TestBed.inject(AlbumsFacade) as jasmine.SpyObj<AlbumsFacade>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    // Reset subjects between tests
    selectedArtistSubject.next(null);
    loadingSubject.next(false);
    albumsSubject.next([]);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Create mode', () => {
    beforeEach(() => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('new');
      fixture.detectChanges();
    });

    it('should initialize empty form in create mode', () => {
      expect(component.isEditMode).toBe(false);
      expect(component.form.get('name')?.value).toBe('');
      expect(component.form.get('type')?.value).toBe('SOLO');
      expect(component.form.get('country')?.value).toBe('');
      expect(component.form.get('biography')?.value).toBe('');
    });

    it('should create artist on valid form submission', () => {
      const newArtist = {
        name: 'New Artist',
        type: 'BAND' as ArtistType,
        country: 'UK',
        biography: 'New biography'
      };

      facade.createArtist.and.returnValue(of({ ...newArtist, id: 2, active: true } as Artist));

      component.form.patchValue(newArtist);
      component.onSubmit();

      expect(facade.createArtist).toHaveBeenCalledWith(
        jasmine.objectContaining(newArtist)
      );
      expect(snackBar.open).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/artists', 2]);
    });

    it('should not submit invalid form', () => {
      component.form.patchValue({ name: '' });
      component.onSubmit();

      expect(facade.createArtist).not.toHaveBeenCalled();
    });
  });

  describe('Edit mode', () => {
    beforeEach(() => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('1');
      fixture.detectChanges();
      selectedArtistSubject.next(mockArtist);
    });

    it('should load artist in edit mode', () => {
      expect(component.isEditMode).toBe(true);
      expect(component.artistId).toBe(1);
      expect(facade.loadArtist).toHaveBeenCalledWith(1);
    });

    it('should populate form with artist data', () => {
      expect(component.form.get('name')?.value).toBe(mockArtist.name);
      expect(component.form.get('type')?.value).toBe(mockArtist.type);
      expect(component.form.get('country')?.value).toBe(mockArtist.country);
      expect(component.form.get('biography')?.value).toBe(mockArtist.biography);
    });

    it('should update artist on valid form submission', () => {
      facade.updateArtist.and.returnValue(of(mockArtist));

      component.form.patchValue({ name: 'Updated Artist' });
      component.onSubmit();

      expect(facade.updateArtist).toHaveBeenCalledWith(
        1,
        jasmine.objectContaining({ name: 'Updated Artist' })
      );
    });
  });

  describe('Form validation', () => {
    beforeEach(() => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('new');
      fixture.detectChanges();
    });

    it('should require name', () => {
      component.form.get('name')?.setValue('');
      expect(component.form.get('name')?.hasError('required')).toBe(true);
    });

    it('should validate name minimum length', () => {
      component.form.get('name')?.setValue('A');
      expect(component.form.get('name')?.hasError('minlength')).toBe(true);
    });

    it('should validate name maximum length', () => {
      component.form.get('name')?.setValue('A'.repeat(101));
      expect(component.form.get('name')?.hasError('maxlength')).toBe(true);
    });

    it('should require type', () => {
      component.form.get('type')?.setValue('');
      expect(component.form.get('type')?.hasError('required')).toBe(true);
    });
  });

  describe('File handling', () => {
    beforeEach(() => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('new');
      fixture.detectChanges();
    });

    it('should reject non-image files', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const event = { target: { files: [file] } } as unknown as Event;

      component.onFileSelected(event);

      expect(snackBar.open).toHaveBeenCalledWith(
        'Por favor, selecione uma imagem válida',
        'Fechar',
        jasmine.any(Object)
      );
      expect(component.selectedFile).toBeNull();
    });

    it('should reject large files', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [largeFile] } } as unknown as Event;

      component.onFileSelected(event);

      expect(snackBar.open).toHaveBeenCalledWith(
        'A imagem deve ter no máximo 5MB',
        'Fechar',
        jasmine.any(Object)
      );
    });

    it('should remove file', () => {
      component.selectedFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      component.photoPreview = 'data:image/jpeg;base64,...';

      component.removeFile();

      expect(component.selectedFile).toBeNull();
      expect(component.photoPreview).toBeNull();
    });
  });

  describe('Navigation', () => {
    it('should navigate to artist detail on cancel in edit mode', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('1');
      fixture.detectChanges();

      component.cancel();

      expect(router.navigate).toHaveBeenCalledWith(['/artists', 1]);
    });

    it('should navigate to artists list on cancel in create mode', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('new');
      fixture.detectChanges();

      component.cancel();

      expect(router.navigate).toHaveBeenCalledWith(['/artists']);
    });
  });

  describe('Album selection', () => {
    beforeEach(() => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('new');
      fixture.detectChanges();
    });

    it('should remove album from selection', () => {
      component.selectedAlbums = [
        { id: 1, title: 'Album 1', releaseYear: 2020 },
        { id: 2, title: 'Album 2', releaseYear: 2021 }
      ];

      component.removeAlbum(1);

      expect(component.selectedAlbums.length).toBe(1);
      expect(component.selectedAlbums[0].id).toBe(2);
    });
  });

  describe('Loading state', () => {
    beforeEach(() => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('new');
      fixture.detectChanges();
    });

    it('should update loading state', () => {
      loadingSubject.next(true);
      expect(component.loading).toBe(true);

      loadingSubject.next(false);
      expect(component.loading).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should clear selected artist on destroy', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('new');
      fixture.detectChanges();

      component.ngOnDestroy();

      expect(facade.clearSelectedArtist).toHaveBeenCalled();
    });
  });
});
