import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AlbumsFacade } from './albums.facade';
import { AlbumsService } from '../services/albums.service';
import { Album } from '../models/album.model';
import { PageResponse } from '@shared/models/pagination.model';
import { ArtistType } from '@features/artists/models/artist.model';

describe('AlbumsFacade', () => {
  let facade: AlbumsFacade;
  let service: jasmine.SpyObj<AlbumsService>;

  const mockAlbum: Album = {
    id: 1,
    title: 'Test Album',
    releaseYear: 2024,
    genre: 'Rock',
    description: 'Test description',
    trackCount: 10,
    totalDuration: 2400,
    coverUrl: 'http://example.com/cover.jpg',
    coverUrls: ['http://example.com/cover.jpg'],
    artists: [
      {
        id: 1,
        name: 'Test Artist',
        type: ArtistType.SOLO,
        country: 'USA',
        biography: 'Test bio',
        albumCount: 5,
        active: true,
        albums: []
      }
    ],
    tracks: [
      {
        id: 1,
        title: 'Track 1',
        trackNumber: 1,
        duration: 240
      }
    ]
  };

  const mockPageResponse: PageResponse<Album> = {
    content: [mockAlbum],
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
    const spy = jasmine.createSpyObj('AlbumsService', [
      'getAll',
      'getById',
      'create',
      'update',
      'delete',
      'uploadCover',
      'uploadCovers',
      'getCoverUrls'
    ]);

    TestBed.configureTestingModule({
      providers: [
        AlbumsFacade,
        { provide: AlbumsService, useValue: spy }
      ]
    });

    facade = TestBed.inject(AlbumsFacade);
    service = TestBed.inject(AlbumsService) as jasmine.SpyObj<AlbumsService>;
  });

  it('should be created', () => {
    expect(facade).toBeTruthy();
  });

  describe('loadAlbums', () => {
    it('should load albums and update state', (done) => {
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.loadAlbums();

      facade.albums$.subscribe(albums => {
        expect(albums).toEqual(mockPageResponse.content);
        expect(service.getAll).toHaveBeenCalled();
        done();
      });
    });

    it('should set loading state while loading', (done) => {
      service.getAll.and.returnValue(of(mockPageResponse));

      let loadingStates: boolean[] = [];
      facade.loading$.subscribe(loading => loadingStates.push(loading));

      facade.loadAlbums();

      setTimeout(() => {
        expect(loadingStates).toContain(true);
        expect(loadingStates[loadingStates.length - 1]).toBe(false);
        done();
      }, 100);
    });

    it('should handle load error', (done) => {
      service.getAll.and.returnValue(throwError(() => new Error('API Error')));

      facade.loadAlbums();

      facade.error$.subscribe(error => {
        if (error) {
          expect(error).toBe('Failed to load albums');
          done();
        }
      });
    });

    it('should apply filters when loading', () => {
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.setFilters({ title: 'Test', year: 2024 });
      facade.loadAlbums();

      expect(service.getAll).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Test',
          year: 2024
        })
      );
    });

    it('should apply sorting when loading', () => {
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.setSort({ sortBy: 'releaseYear', sortDir: 'desc' });
      facade.loadAlbums();

      expect(service.getAll).toHaveBeenCalledWith(
        jasmine.objectContaining({
          sortBy: 'releaseYear',
          sortDir: 'desc'
        })
      );
    });
  });

  describe('loadAlbum', () => {
    it('should load single album by id', (done) => {
      service.getById.and.returnValue(of(mockAlbum));

      facade.loadAlbum(1);

      facade.selectedAlbum$.subscribe(album => {
        if (album) {
          expect(album).toEqual(mockAlbum);
          expect(service.getById).toHaveBeenCalledWith(1);
          done();
        }
      });
    });

    it('should handle load album error', (done) => {
      service.getById.and.returnValue(throwError(() => new Error('Not found')));

      facade.loadAlbum(999);

      facade.error$.subscribe(error => {
        if (error) {
          expect(error).toBe('Failed to load album');
          done();
        }
      });
    });
  });

  describe('loadAlbumsByArtist', () => {
    it('should load albums by artist id', (done) => {
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.loadAlbumsByArtist(1);

      facade.albums$.subscribe(albums => {
        expect(albums).toEqual(mockPageResponse.content);
        expect(service.getAll).toHaveBeenCalledWith(
          jasmine.objectContaining({
            artistId: 1
          })
        );
        done();
      });
    });
  });

  describe('createAlbum', () => {
    it('should create album and reload list', (done) => {
      const newAlbum = { ...mockAlbum, id: undefined };
      service.create.and.returnValue(of(mockAlbum));
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.createAlbum(newAlbum).subscribe(created => {
        expect(created).toEqual(mockAlbum);
        expect(service.create).toHaveBeenCalledWith(newAlbum);
        expect(service.getAll).toHaveBeenCalled();
        done();
      });
    });

    it('should handle creation error', (done) => {
      const newAlbum = { ...mockAlbum, id: undefined };
      service.create.and.returnValue(throwError(() => new Error('Creation failed')));

      facade.createAlbum(newAlbum).subscribe({
        error: (err) => {
          expect(facade.error$.value).toBe('Failed to create album');
          done();
        }
      });
    });
  });

  describe('updateAlbum', () => {
    it('should update album and reload list', (done) => {
      const updatedAlbum = { ...mockAlbum, title: 'Updated Title' };
      service.update.and.returnValue(of(updatedAlbum));
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.updateAlbum(1, updatedAlbum).subscribe(updated => {
        expect(updated).toEqual(updatedAlbum);
        expect(service.update).toHaveBeenCalledWith(1, updatedAlbum);
        expect(service.getAll).toHaveBeenCalled();
        done();
      });
    });

    it('should handle update error', (done) => {
      service.update.and.returnValue(throwError(() => new Error('Update failed')));

      facade.updateAlbum(1, mockAlbum).subscribe({
        error: (err) => {
          expect(facade.error$.value).toBe('Failed to update album');
          done();
        }
      });
    });
  });

  describe('deleteAlbum', () => {
    it('should delete album and reload list', (done) => {
      service.delete.and.returnValue(of(void 0));
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.deleteAlbum(1).subscribe(() => {
        expect(service.delete).toHaveBeenCalledWith(1);
        expect(service.getAll).toHaveBeenCalled();
        done();
      });
    });

    it('should handle delete error', (done) => {
      service.delete.and.returnValue(throwError(() => new Error('Delete failed')));

      facade.deleteAlbum(1).subscribe({
        error: (err) => {
          expect(facade.error$.value).toBe('Failed to delete album');
          done();
        }
      });
    });
  });

  describe('uploadCover', () => {
    it('should upload single cover successfully', (done) => {
      const file = new File([''], 'cover.jpg', { type: 'image/jpeg' });
      const response = {
        key: 'cover-key',
        url: 'http://example.com/cover.jpg'
      };
      service.uploadCover.and.returnValue(of(response));

      facade.uploadCover(1, file).subscribe(result => {
        expect(result).toEqual(response);
        expect(service.uploadCover).toHaveBeenCalledWith(1, file);
        done();
      });
    });

    it('should handle upload error', (done) => {
      const file = new File([''], 'cover.jpg', { type: 'image/jpeg' });
      service.uploadCover.and.returnValue(throwError(() => new Error('Upload failed')));

      facade.uploadCover(1, file).subscribe({
        error: (err) => {
          expect(facade.error$.value).toBe('Failed to upload cover');
          done();
        }
      });
    });
  });

  describe('uploadCovers', () => {
    it('should upload multiple covers successfully', (done) => {
      const files = [
        new File([''], 'cover1.jpg', { type: 'image/jpeg' }),
        new File([''], 'cover2.jpg', { type: 'image/jpeg' })
      ];
      const response = [
        { key: 'cover1-key', url: 'http://example.com/cover1.jpg' },
        { key: 'cover2-key', url: 'http://example.com/cover2.jpg' }
      ];
      service.uploadCovers.and.returnValue(of(response));

      facade.uploadCovers(1, files).subscribe(result => {
        expect(result).toEqual(response);
        expect(service.uploadCovers).toHaveBeenCalledWith(1, files);
        done();
      });
    });
  });

  describe('filters and pagination', () => {
    it('should update filters', (done) => {
      const filters = { title: 'Test', year: 2024 };

      facade.setFilters(filters);

      facade.filters$.subscribe(currentFilters => {
        expect(currentFilters).toEqual(filters);
        done();
      });
    });

    it('should reset filters', (done) => {
      facade.setFilters({ title: 'Test', year: 2024 });
      facade.resetFilters();

      facade.filters$.subscribe(filters => {
        expect(filters.title).toBe('');
        expect(filters.year).toBeNull();
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

    it('should update sort', (done) => {
      const sort = { sortBy: 'releaseYear', sortDir: 'desc' as 'asc' | 'desc' };

      facade.setSort(sort);

      facade.sort$.subscribe(currentSort => {
        expect(currentSort.sortBy).toBe('releaseYear');
        expect(currentSort.sortDir).toBe('desc');
        done();
      });
    });

    it('should reload albums when filters change', () => {
      service.getAll.and.returnValue(of(mockPageResponse));
      spyOn(facade, 'loadAlbums');

      facade.setFilters({ title: 'New Filter' });

      expect(facade.loadAlbums).toHaveBeenCalled();
    });
  });

  describe('clearSelectedAlbum', () => {
    it('should clear selected album', (done) => {
      // First set an album
      service.getById.and.returnValue(of(mockAlbum));
      facade.loadAlbum(1);

      // Then clear it
      facade.clearSelectedAlbum();

      facade.selectedAlbum$.subscribe(album => {
        if (album === null) {
          expect(album).toBeNull();
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