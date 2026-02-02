import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AlbumsFacade } from './albums.facade';
import { AlbumsService } from '../services/albums.service';
import { Album } from '../models/album.model';
import { PageResponse } from '../../../core/services/api.service';

describe('AlbumsFacade', () => {
  let facade: AlbumsFacade;
  let service: jasmine.SpyObj<AlbumsService>;

  const mockAlbum: Album = {
    id: 1,
    title: 'Test Album',
    releaseYear: 2024,
    genre: 'Rock',
    trackCount: 10,
    totalDuration: 2400,
    coverUrl: 'http://example.com/cover.jpg',
    coverUrls: ['http://example.com/cover.jpg'],
    active: true,
    artists: [
      {
        id: 1,
        name: 'Test Artist',
        type: 'SOLO'
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
    page: 0,
    first: true,
    last: true
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AlbumsService', [
      'getAll',
      'getById',
      'create',
      'update',
      'delete',
      'uploadCover',
      'getCoverUrl'
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
        if (albums.length > 0) {
          expect(albums[0].title).toBe('Test Album');
          expect(service.getAll).toHaveBeenCalled();
          done();
        }
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
      service.getAll.and.returnValue(throwError(() => ({ error: { message: 'API Error' } })));

      facade.loadAlbums();

      facade.error$.subscribe(error => {
        if (error) {
          expect(error).toBeTruthy();
          done();
        }
      });
    });
  });

  describe('loadAlbum', () => {
    it('should load single album by id', (done) => {
      service.getById.and.returnValue(of(mockAlbum));

      facade.loadAlbum(1);

      facade.selectedAlbum$.subscribe(album => {
        if (album) {
          expect(album.title).toBe('Test Album');
          expect(service.getById).toHaveBeenCalledWith(1);
          done();
        }
      });
    });

    it('should handle load album error', (done) => {
      service.getById.and.returnValue(throwError(() => ({ error: { message: 'Not found' } })));

      facade.loadAlbum(999);

      facade.error$.subscribe(error => {
        if (error) {
          expect(error).toBeTruthy();
          done();
        }
      });
    });
  });

  describe('createAlbum', () => {
    it('should create album and reload list', (done) => {
      const newAlbum = { title: 'New Album', releaseYear: 2024, artistIds: [1] };
      service.create.and.returnValue(of(mockAlbum));
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.createAlbum(newAlbum).subscribe(created => {
        expect(created.title).toBe('Test Album');
        expect(service.create).toHaveBeenCalledWith(newAlbum);
        done();
      });
    });
  });

  describe('updateAlbum', () => {
    it('should update album and reload list', (done) => {
      const updatedAlbum = { title: 'Updated Title' };
      service.update.and.returnValue(of({ ...mockAlbum, ...updatedAlbum }));
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.updateAlbum(1, updatedAlbum).subscribe(updated => {
        expect(updated.title).toBe('Updated Title');
        expect(service.update).toHaveBeenCalledWith(1, updatedAlbum);
        done();
      });
    });
  });

  describe('deleteAlbum', () => {
    it('should delete album and reload list', (done) => {
      service.delete.and.returnValue(of(undefined));
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.deleteAlbum(1).subscribe(() => {
        expect(service.delete).toHaveBeenCalledWith(1);
        done();
      });
    });
  });

  describe('uploadCover', () => {
    it('should upload cover successfully', (done) => {
      const file = new File([''], 'cover.jpg', { type: 'image/jpeg' });
      const response = { coverUrl: 'http://example.com/cover.jpg' };
      service.uploadCover.and.returnValue(of(response));
      service.getById.and.returnValue(of(mockAlbum));

      facade.uploadCover(1, file).subscribe(result => {
        expect(result).toEqual(response);
        expect(service.uploadCover).toHaveBeenCalledWith(1, file);
        done();
      });
    });
  });

  describe('filters', () => {
    it('should set title filter and reload', () => {
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.setTitleFilter('Test');

      expect(facade.filters$.value.title).toBe('Test');
      expect(service.getAll).toHaveBeenCalled();
    });

    it('should set sort direction and reload', () => {
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.setSortDirection('desc');

      expect(facade.filters$.value.sortDirection).toBe('desc');
      expect(service.getAll).toHaveBeenCalled();
    });

    it('should clear filters and reload', () => {
      service.getAll.and.returnValue(of(mockPageResponse));

      facade.setTitleFilter('Test');
      facade.clearFilters();

      expect(facade.filters$.value.title).toBe('');
      expect(facade.filters$.value.sortDirection).toBe('asc');
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

      facade.setPageSize(25);

      expect(service.getAll).toHaveBeenCalledWith(
        jasmine.objectContaining({ size: 25, page: 0 })
      );
    });
  });

  describe('clearSelectedAlbum', () => {
    it('should clear selected album', (done) => {
      service.getById.and.returnValue(of(mockAlbum));
      facade.loadAlbum(1);

      setTimeout(() => {
        facade.clearSelectedAlbum();

        facade.selectedAlbum$.subscribe(album => {
          if (album === null) {
            expect(album).toBeNull();
            done();
          }
        });
      }, 50);
    });
  });
});
