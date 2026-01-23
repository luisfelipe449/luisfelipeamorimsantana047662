import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ArtistsFacade } from './artists.facade';
import { ArtistsService } from '../services/artists.service';
import { Artist, ArtistType, ArtistPhoto, PhotoUploadResponse } from '../models/artist.model';
import { PageResponse } from '@shared/models/pagination.model';

describe('ArtistsFacade', () => {
  let facade: ArtistsFacade;
  let service: jasmine.SpyObj<ArtistsService>;

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

  const mockPageResponse: PageResponse<Artist> = {
    content: [mockArtist],
    totalElements: 1,
    totalPages: 1,
    size: 10,
    number: 0,
    first: true,
    last: true,
    numberOfElements: 1,
    empty: false
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ArtistsService', [
      'getAll',
      'getById',
      'create',
      'update',
      'delete',
      'uploadPhoto',
      'deletePhoto',
      'getPhotoUrl'
    ]);

    TestBed.configureTestingModule({
      providers: [
        ArtistsFacade,
        { provide: ArtistsService, useValue: spy }
      ]
    });

    facade = TestBed.inject(ArtistsFacade);
    service = TestBed.inject(ArtistsService) as jasmine.SpyObj<ArtistsService>;
  });

  it('should be created', () => {
    expect(facade).toBeTruthy();
  });

  describe('loadArtists', () => {
    it('should load artists and update state', (done) => {
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.loadArtists();

      facade.artists$.subscribe(artists => {
        expect(artists).toEqual(mockPageResponse.content);
        expect(service.getAll).toHaveBeenCalled();
        done();
      });
    });

    it('should set loading state while loading', (done) => {
      service.getAll.and.returnValue(of(mockPageResponse));

      let loadingStates: boolean[] = [];
      facade.loading$.subscribe(loading => loadingStates.push(loading));

      facade.loadArtists();

      setTimeout(() => {
        expect(loadingStates).toContain(true);
        expect(loadingStates[loadingStates.length - 1]).toBe(false);
        done();
      }, 100);
    });

    it('should handle errors gracefully', (done) => {
      const error = new Error('API Error');
      service.getAll.and.returnValue(throwError(() => error));

      facade.loadArtists();

      facade.error$.subscribe(errorMsg => {
        if (errorMsg) {
          expect(errorMsg).toBe('Failed to load artists');
          done();
        }
      });
    });

    it('should apply filters when loading', () => {
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.setFilters({ name: 'Test', type: ArtistType.BAND });
      facade.loadArtists();

      expect(service.getAll).toHaveBeenCalledWith(
        jasmine.objectContaining({
          name: 'Test',
          type: ArtistType.BAND
        })
      );
    });

    it('should apply pagination when loading', () => {
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.setPagination({ page: 2, size: 20 });
      facade.loadArtists();

      expect(service.getAll).toHaveBeenCalledWith(
        jasmine.objectContaining({
          page: 2,
          size: 20
        })
      );
    });
  });

  describe('loadArtist', () => {
    it('should load single artist by id', (done) => {
      service.getById.and.returnValue(of(mockArtist));

      facade.loadArtist(1);

      facade.selectedArtist$.subscribe(artist => {
        if (artist) {
          expect(artist).toEqual(mockArtist);
          expect(service.getById).toHaveBeenCalledWith(1);
          done();
        }
      });
    });

    it('should handle load artist error', (done) => {
      service.getById.and.returnValue(throwError(() => new Error('Not found')));

      facade.loadArtist(999);

      facade.error$.subscribe(error => {
        if (error) {
          expect(error).toBe('Failed to load artist');
          done();
        }
      });
    });
  });

  describe('createArtist', () => {
    it('should create artist and reload list', (done) => {
      const newArtist = { ...mockArtist, id: undefined };
      service.create.and.returnValue(of(mockArtist));
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.createArtist(newArtist).subscribe(created => {
        expect(created).toEqual(mockArtist);
        expect(service.create).toHaveBeenCalledWith(newArtist);
        expect(service.getAll).toHaveBeenCalled(); // Should reload list
        done();
      });
    });

    it('should handle creation error', (done) => {
      const newArtist = { ...mockArtist, id: undefined };
      service.create.and.returnValue(throwError(() => new Error('Creation failed')));

      facade.createArtist(newArtist).subscribe({
        error: (err) => {
          expect(facade.error$.value).toBe('Failed to create artist');
          done();
        }
      });
    });
  });

  describe('updateArtist', () => {
    it('should update artist and reload list', (done) => {
      const updatedArtist = { ...mockArtist, name: 'Updated Name' };
      service.update.and.returnValue(of(updatedArtist));
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.updateArtist(1, updatedArtist).subscribe(updated => {
        expect(updated).toEqual(updatedArtist);
        expect(service.update).toHaveBeenCalledWith(1, updatedArtist);
        expect(service.getAll).toHaveBeenCalled();
        done();
      });
    });

    it('should handle update error', (done) => {
      service.update.and.returnValue(throwError(() => new Error('Update failed')));

      facade.updateArtist(1, mockArtist).subscribe({
        error: (err) => {
          expect(facade.error$.value).toBe('Failed to update artist');
          done();
        }
      });
    });
  });

  describe('deleteArtist', () => {
    it('should delete artist and reload list', (done) => {
      service.delete.and.returnValue(of(void 0));
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.deleteArtist(1).subscribe(() => {
        expect(service.delete).toHaveBeenCalledWith(1);
        expect(service.getAll).toHaveBeenCalled();
        done();
      });
    });

    it('should handle delete error', (done) => {
      service.delete.and.returnValue(throwError(() => new Error('Delete failed')));

      facade.deleteArtist(1).subscribe({
        error: (err) => {
          expect(facade.error$.value).toBe('Failed to delete artist');
          done();
        }
      });
    });
  });

  describe('uploadPhoto', () => {
    it('should upload photo successfully', (done) => {
      const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
      const response: PhotoUploadResponse = {
        key: 'photo-key',
        url: 'http://example.com/photo.jpg'
      };
      service.uploadPhoto.and.returnValue(of(response));

      facade.uploadPhoto(1, file).subscribe(result => {
        expect(result).toEqual(response);
        expect(service.uploadPhoto).toHaveBeenCalledWith(1, file);
        done();
      });
    });

    it('should handle upload error', (done) => {
      const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
      service.uploadPhoto.and.returnValue(throwError(() => new Error('Upload failed')));

      facade.uploadPhoto(1, file).subscribe({
        error: (err) => {
          expect(facade.error$.value).toBe('Failed to upload photo');
          done();
        }
      });
    });
  });

  describe('filters and pagination', () => {
    it('should update filters', (done) => {
      const filters = { name: 'Test', type: ArtistType.BAND };

      facade.setFilters(filters);

      facade.filters$.subscribe(currentFilters => {
        expect(currentFilters).toEqual(filters);
        done();
      });
    });

    it('should reset filters', (done) => {
      facade.setFilters({ name: 'Test', type: ArtistType.BAND });
      facade.resetFilters();

      facade.filters$.subscribe(filters => {
        expect(filters.name).toBe('');
        expect(filters.type).toBeNull();
        done();
      });
    });

    it('should update pagination', (done) => {
      const pagination = { page: 2, size: 20 };

      facade.setPagination(pagination);

      facade.pagination$.subscribe(currentPagination => {
        expect(currentPagination.page).toBe(2);
        expect(currentPagination.size).toBe(20);
        done();
      });
    });

    it('should reload artists when filters change', () => {
      service.getAll.and.returnValue(of(mockPageResponse));
      spyOn(facade, 'loadArtists');

      facade.setFilters({ name: 'New Filter' });

      expect(facade.loadArtists).toHaveBeenCalled();
    });
  });

  describe('clearSelectedArtist', () => {
    it('should clear selected artist', (done) => {
      // First set an artist
      service.getById.and.returnValue(of(mockArtist));
      facade.loadArtist(1);

      // Then clear it
      facade.clearSelectedArtist();

      facade.selectedArtist$.subscribe(artist => {
        if (artist === null) {
          expect(artist).toBeNull();
          done();
        }
      });
    });
  });

  describe('clearError', () => {
    it('should clear error message', (done) => {
      // First set an error
      facade.error$.next('Test error');

      // Then clear it
      facade.clearError();

      facade.error$.subscribe(error => {
        if (!error) {
          expect(error).toBeNull();
          done();
        }
      });
    });
  });
});