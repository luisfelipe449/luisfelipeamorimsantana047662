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
import { of, throwError } from 'rxjs';

import { ArtistFormComponent } from './artist-form.component';
import { ArtistsFacade } from '../../facades/artists.facade';
import { Artist, ArtistType } from '../../models/artist.model';

describe('ArtistFormComponent', () => {
  let component: ArtistFormComponent;
  let fixture: ComponentFixture<ArtistFormComponent>;
  let facade: jasmine.SpyObj<ArtistsFacade>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let activatedRoute: any;

  const mockArtist: Artist = {
    id: 1,
    name: 'Test Artist',
    type: ArtistType.SOLO,
    country: 'USA',
    biography: 'Test biography',
    albumCount: 5,
    active: true,
    photoUrl: 'http://example.com/photo.jpg',
    albums: []
  };

  beforeEach(async () => {
    const facadeSpy = jasmine.createSpyObj('ArtistsFacade', [
      'getArtistById',
      'createArtist',
      'updateArtist',
      'uploadPhoto'
    ]);

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

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
        MatProgressSpinnerModule
      ],
      providers: [
        { provide: ArtistsFacade, useValue: facadeSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ArtistFormComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(ArtistsFacade) as jasmine.SpyObj<ArtistsFacade>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Create mode', () => {
    beforeEach(() => {
      activatedRoute.snapshot.paramMap.get.and.returnValue(null);
      fixture.detectChanges();
    });

    it('should initialize empty form in create mode', () => {
      expect(component.isEditMode).toBe(false);
      expect(component.artistForm.get('name')?.value).toBe('');
      expect(component.artistForm.get('type')?.value).toBe('');
      expect(component.artistForm.get('country')?.value).toBe('');
      expect(component.artistForm.get('biography')?.value).toBe('');
    });

    it('should have correct title', () => {
      const compiled = fixture.nativeElement;
      const title = compiled.querySelector('h2');
      expect(title.textContent).toContain('Create New Artist');
    });

    it('should create artist on valid form submission', () => {
      const newArtist = {
        name: 'New Artist',
        type: ArtistType.BAND,
        country: 'UK',
        biography: 'New biography'
      };

      facade.createArtist.and.returnValue(of({ ...newArtist, id: 2 } as Artist));

      component.artistForm.patchValue(newArtist);
      component.onSubmit();

      expect(facade.createArtist).toHaveBeenCalledWith(
        jasmine.objectContaining(newArtist)
      );
      expect(snackBar.open).toHaveBeenCalledWith(
        'Artist created successfully!',
        'OK',
        jasmine.any(Object)
      );
      expect(router.navigate).toHaveBeenCalledWith(['/artists']);
    });
  });

  describe('Edit mode', () => {
    beforeEach(() => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('1');
      facade.getArtistById.and.returnValue(of(mockArtist));
      fixture.detectChanges();
    });

    it('should load artist in edit mode', () => {
      expect(component.isEditMode).toBe(true);
      expect(component.artistId).toBe(1);
      expect(facade.getArtistById).toHaveBeenCalledWith(1);
    });

    it('should populate form with artist data', () => {
      expect(component.artistForm.get('name')?.value).toBe(mockArtist.name);
      expect(component.artistForm.get('type')?.value).toBe(mockArtist.type);
      expect(component.artistForm.get('country')?.value).toBe(mockArtist.country);
      expect(component.artistForm.get('biography')?.value).toBe(mockArtist.biography);
    });

    it('should have correct title', () => {
      const compiled = fixture.nativeElement;
      const title = compiled.querySelector('h2');
      expect(title.textContent).toContain('Edit Artist');
    });

    it('should update artist on valid form submission', () => {
      const updatedArtist = {
        ...mockArtist,
        name: 'Updated Artist'
      };

      facade.updateArtist.and.returnValue(of(updatedArtist));

      component.artistForm.patchValue({ name: 'Updated Artist' });
      component.onSubmit();

      expect(facade.updateArtist).toHaveBeenCalledWith(
        1,
        jasmine.objectContaining({ name: 'Updated Artist' })
      );
      expect(snackBar.open).toHaveBeenCalledWith(
        'Artist updated successfully!',
        'OK',
        jasmine.any(Object)
      );
      expect(router.navigate).toHaveBeenCalledWith(['/artists']);
    });

    it('should handle artist not found', () => {
      facade.getArtistById.and.returnValue(
        throwError(() => ({ status: 404 }))
      );

      activatedRoute.snapshot.paramMap.get.and.returnValue('999');
      component.ngOnInit();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Artist not found',
        'OK',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(router.navigate).toHaveBeenCalledWith(['/artists']);
    });
  });

  describe('Form validation', () => {
    beforeEach(() => {
      activatedRoute.snapshot.paramMap.get.and.returnValue(null);
      fixture.detectChanges();
    });

    it('should require name field', () => {
      const nameControl = component.artistForm.get('name');
      expect(nameControl?.hasError('required')).toBe(true);

      nameControl?.setValue('Test');
      expect(nameControl?.hasError('required')).toBe(false);
    });

    it('should validate name min length', () => {
      const nameControl = component.artistForm.get('name');
      nameControl?.setValue('A');
      expect(nameControl?.hasError('minlength')).toBe(true);

      nameControl?.setValue('ABC');
      expect(nameControl?.hasError('minlength')).toBe(false);
    });

    it('should validate name max length', () => {
      const nameControl = component.artistForm.get('name');
      nameControl?.setValue('A'.repeat(101));
      expect(nameControl?.hasError('maxlength')).toBe(true);

      nameControl?.setValue('A'.repeat(100));
      expect(nameControl?.hasError('maxlength')).toBe(false);
    });

    it('should require type field', () => {
      const typeControl = component.artistForm.get('type');
      expect(typeControl?.hasError('required')).toBe(true);

      typeControl?.setValue(ArtistType.SOLO);
      expect(typeControl?.hasError('required')).toBe(false);
    });

    it('should require country field', () => {
      const countryControl = component.artistForm.get('country');
      expect(countryControl?.hasError('required')).toBe(true);

      countryControl?.setValue('USA');
      expect(countryControl?.hasError('required')).toBe(false);
    });

    it('should validate biography max length', () => {
      const bioControl = component.artistForm.get('biography');
      bioControl?.setValue('A'.repeat(1001));
      expect(bioControl?.hasError('maxlength')).toBe(true);

      bioControl?.setValue('A'.repeat(1000));
      expect(bioControl?.hasError('maxlength')).toBe(false);
    });

    it('should not submit invalid form', () => {
      component.onSubmit();
      expect(facade.createArtist).not.toHaveBeenCalled();
      expect(facade.updateArtist).not.toHaveBeenCalled();
    });
  });

  describe('Photo upload', () => {
    beforeEach(() => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('1');
      facade.getArtistById.and.returnValue(of(mockArtist));
      fixture.detectChanges();
    });

    it('should handle photo selection', () => {
      const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
      const event = {
        target: {
          files: [file]
        }
      };

      component.onPhotoSelected(event as any);

      expect(component.selectedPhoto).toBe(file);
      expect(component.photoPreview).toBeTruthy();
    });

    it('should validate photo file type', () => {
      const file = new File([''], 'document.pdf', { type: 'application/pdf' });
      const event = {
        target: {
          files: [file]
        }
      };

      component.onPhotoSelected(event as any);

      expect(component.selectedPhoto).toBeNull();
      expect(snackBar.open).toHaveBeenCalledWith(
        'Please select a valid image file (JPG, PNG, GIF)',
        'OK',
        jasmine.any(Object)
      );
    });

    it('should validate photo file size', () => {
      const largeFile = new File(['x'.repeat(6000000)], 'large.jpg', { type: 'image/jpeg' });
      const event = {
        target: {
          files: [largeFile]
        }
      };

      component.onPhotoSelected(event as any);

      expect(component.selectedPhoto).toBeNull();
      expect(snackBar.open).toHaveBeenCalledWith(
        'File size must be less than 5MB',
        'OK',
        jasmine.any(Object)
      );
    });

    it('should upload photo with artist', () => {
      const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
      const photoResponse = { url: 'http://example.com/new-photo.jpg' };

      component.selectedPhoto = file;
      facade.uploadPhoto.and.returnValue(of(photoResponse));
      facade.updateArtist.and.returnValue(of(mockArtist));

      component.onSubmit();

      expect(facade.uploadPhoto).toHaveBeenCalledWith(1, file);
    });

    it('should handle photo upload error', () => {
      const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
      component.selectedPhoto = file;

      facade.uploadPhoto.and.returnValue(
        throwError(() => new Error('Upload failed'))
      );
      facade.updateArtist.and.returnValue(of(mockArtist));

      component.onSubmit();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Failed to upload photo',
        'OK',
        jasmine.any(Object)
      );
    });

    it('should clear photo selection', () => {
      const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
      component.selectedPhoto = file;
      component.photoPreview = 'data:image/jpeg;base64,...';

      component.clearPhotoSelection();

      expect(component.selectedPhoto).toBeNull();
      expect(component.photoPreview).toBeNull();
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      activatedRoute.snapshot.paramMap.get.and.returnValue(null);
      fixture.detectChanges();
    });

    it('should handle create error', () => {
      facade.createArtist.and.returnValue(
        throwError(() => ({ error: { message: 'Name already exists' } }))
      );

      component.artistForm.patchValue({
        name: 'Test',
        type: ArtistType.SOLO,
        country: 'USA'
      });

      component.onSubmit();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Name already exists',
        'OK',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(component.loading).toBe(false);
    });

    it('should handle update error', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('1');
      facade.getArtistById.and.returnValue(of(mockArtist));
      fixture.detectChanges();

      facade.updateArtist.and.returnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );

      component.onSubmit();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Update failed',
        'OK',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(component.loading).toBe(false);
    });
  });

  describe('Navigation', () => {
    it('should navigate to artists list on cancel', () => {
      component.onCancel();
      expect(router.navigate).toHaveBeenCalledWith(['/artists']);
    });

    it('should navigate after successful create', () => {
      facade.createArtist.and.returnValue(of(mockArtist));

      component.artistForm.patchValue({
        name: 'Test',
        type: ArtistType.SOLO,
        country: 'USA'
      });

      component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/artists']);
    });
  });

  describe('Loading state', () => {
    it('should set loading state during submission', () => {
      facade.createArtist.and.returnValue(of(mockArtist));

      component.artistForm.patchValue({
        name: 'Test',
        type: ArtistType.SOLO,
        country: 'USA'
      });

      expect(component.loading).toBe(false);

      component.onSubmit();

      // Loading is set to false after successful submission
      expect(component.loading).toBe(false);
    });

    it('should disable form during loading', () => {
      component.loading = true;
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton.disabled).toBe(true);
    });
  });
});