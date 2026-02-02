import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ArtistsFacade } from './artists.facade';
import { ArtistsService } from '../services/artists.service';
import { Artist, ArtistType, PhotoUploadResponse } from '../models/artist.model';

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

describe('ArtistsFacade', () => {
  let facade: ArtistsFacade;
  let service: jasmine.SpyObj<ArtistsService>;

  const mockArtist: Artist = {
    id: 1,
    name: 'Test Artist',
    type: 'SOLO',
    country: 'USA',
    biography: 'Test biography',
    active: true,
    photoUrl: 'http://example.com/photo.jpg',
    albums: []
  };

  const mockPageResponse: PageResponse<Artist> = {
    content: [mockArtist],
    totalElements: 1,
    totalPages: 1,
    size: 10,
    page: 0,
    first: true,
    last: true
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ArtistsService', [
      'getAll',
      'getById',
      'create',
      'update',
      'deactivate',
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

      const loadingStates: boolean[] = [];
      facade.loading$.subscribe(loading => loadingStates.push(loading));

      facade.loadArtists();

      setTimeout(() => {
        expect(loadingStates).toContain(true);
        expect(loadingStates[loadingStates.length - 1]).toBe(false);
        done();
      }, 100);
    });

    it('should handle errors gracefully', (done) => {
      const error = { error: { message: 'API Error' } };
      service.getAll.and.returnValue(throwError(() => error));

      facade.loadArtists();

      facade.error$.subscribe(errorMsg => {
        if (errorMsg) {
          expect(errorMsg).toBe('API Error');
          done();
        }
      });
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
      service.getById.and.returnValue(throwError(() => ({ error: { message: 'Not found' } })));

      facade.loadArtist(999);

      facade.error$.subscribe(error => {
        if (error) {
          expect(error).toBe('Not found');
          done();
        }
      });
    });
  });

  describe('createArtist', () => {
    it('should create artist and reload list', (done) => {
      const newArtist = { name: 'New Artist', type: 'SOLO' as ArtistType };
      service.create.and.returnValue(of(mockArtist));
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.createArtist(newArtist).subscribe(created => {
        expect(created).toEqual(mockArtist);
        expect(service.create).toHaveBeenCalledWith(newArtist);
        done();
      });
    });
  });

  describe('updateArtist', () => {
    it('should update artist and reload list', (done) => {
      const updatedArtist = { name: 'Updated Name' };
      service.update.and.returnValue(of({ ...mockArtist, name: 'Updated Name' }));
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.updateArtist(1, updatedArtist).subscribe(updated => {
        expect(updated.name).toBe('Updated Name');
        expect(service.update).toHaveBeenCalledWith(1, updatedArtist);
        done();
      });
    });
  });

  describe('deactivateArtist', () => {
    it('should deactivate artist and reload list', (done) => {
      service.deactivate.and.returnValue(of(void 0));
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.deactivateArtist(1).subscribe(() => {
        expect(service.deactivate).toHaveBeenCalledWith(1);
        done();
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
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.uploadPhoto(1, file).subscribe(result => {
        expect(result).toEqual(response);
        expect(service.uploadPhoto).toHaveBeenCalledWith(1, file);
        done();
      });
    });
  });

  describe('deletePhoto', () => {
    it('should delete photo successfully', (done) => {
      service.deletePhoto.and.returnValue(of(void 0));
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.deletePhoto(1).subscribe(() => {
        expect(service.deletePhoto).toHaveBeenCalledWith(1);
        done();
      });
    });
  });

  describe('filters', () => {
    it('should update name filter and reload', () => {
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.setNameFilter('Test');

      expect(facade.filters$.value.name).toBe('Test');
      expect(service.getAll).toHaveBeenCalled();
    });

    it('should update type filter and reload', () => {
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.setTypeFilter('BAND');

      expect(facade.filters$.value.type).toBe('BAND');
      expect(service.getAll).toHaveBeenCalled();
    });

    it('should update sort direction and reload', () => {
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.setSortDirection('desc');

      expect(facade.filters$.value.sortDirection).toBe('desc');
      expect(service.getAll).toHaveBeenCalled();
    });

    it('should clear filters and reload', () => {
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.setNameFilter('Test');
      facade.clearFilters();

      expect(facade.filters$.value.name).toBe('');
      expect(facade.filters$.value.type).toBeNull();
    });
  });

  describe('pagination', () => {
    it('should set page and reload', () => {
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.setPage(2);

      expect(service.getAll).toHaveBeenCalledWith(
        jasmine.objectContaining({ page: 2 })
      );
    });

    it('should set page size and reload', () => {
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.setPageSize(20);

      expect(service.getAll).toHaveBeenCalledWith(
        jasmine.objectContaining({ page: 0, size: 20 })
      );
    });
  });

  describe('clearSelectedArtist', () => {
    it('should clear selected artist', () => {
      facade.selectedArtist$.next(mockArtist);

      facade.clearSelectedArtist();

      expect(facade.selectedArtist$.value).toBeNull();
    });
  });
});
