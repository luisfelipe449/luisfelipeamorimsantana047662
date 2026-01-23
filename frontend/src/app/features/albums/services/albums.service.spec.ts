import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AlbumsService } from './albums.service';
import { Album, Track } from '../models/album.model';
import { PageResponse } from '@shared/models/pagination.model';
import { environment } from '@env/environment';

describe('AlbumsService', () => {
  let service: AlbumsService;
  let httpMock: HttpTestingController;
  const API_URL = `${environment.apiUrl}/v1/albums`;

  const mockTrack: Track = {
    id: 1,
    title: 'Test Track',
    durationSeconds: 180,
    trackNumber: 1,
    audioUrl: null,
    audioKey: null,
    hasAudio: false
  };

  const mockAlbum: Album = {
    id: 1,
    title: 'Test Album',
    releaseYear: 2024,
    genre: 'Rock',
    coverUrl: 'http://example.com/cover.jpg',
    artistId: 1,
    artistName: 'Test Artist',
    artistIds: [1],
    artistNames: ['Test Artist'],
    tracks: [mockTrack],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AlbumsService]
    });

    service = TestBed.inject(AlbumsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should fetch all albums with default parameters', () => {
      service.getAll().subscribe(response => {
        expect(response).toEqual(mockPageResponse);
      });

      const req = httpMock.expectOne(`${API_URL}?page=0&size=10&sortBy=title&sortDir=asc`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });

    it('should fetch albums with custom parameters', () => {
      const params = {
        page: 1,
        size: 20,
        sortBy: 'releaseYear',
        sortDir: 'desc',
        artistId: 1,
        genre: 'Rock'
      };

      service.getAll(params).subscribe(response => {
        expect(response).toEqual(mockPageResponse);
      });

      const req = httpMock.expectOne(
        `${API_URL}?page=1&size=20&sortBy=releaseYear&sortDir=desc&artistId=1&genre=Rock`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });

    it('should handle empty filters', () => {
      const params = {
        artistId: null,
        genre: ''
      };

      service.getAll(params).subscribe();

      const req = httpMock.expectOne(`${API_URL}?page=0&size=10&sortBy=title&sortDir=asc`);
      expect(req.request.url).not.toContain('artistId=');
      expect(req.request.url).not.toContain('genre=');
      req.flush(mockPageResponse);
    });

    it('should handle server error', () => {
      service.getAll().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${API_URL}?page=0&size=10&sortBy=title&sortDir=asc`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getById', () => {
    it('should fetch album by id', () => {
      service.getById(1).subscribe(album => {
        expect(album).toEqual(mockAlbum);
      });

      const req = httpMock.expectOne(`${API_URL}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAlbum);
    });

    it('should handle 404 error', () => {
      service.getById(999).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${API_URL}/999`);
      req.flush('Album not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('create', () => {
    it('should create new album', () => {
      const newAlbum = { ...mockAlbum, id: undefined };

      service.create(newAlbum).subscribe(album => {
        expect(album).toEqual(mockAlbum);
      });

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newAlbum);
      req.flush(mockAlbum);
    });

    it('should handle validation error', () => {
      const invalidAlbum = { ...mockAlbum, id: undefined, title: '' };

      service.create(invalidAlbum).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(API_URL);
      req.flush({ message: 'Validation failed' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('update', () => {
    it('should update album', () => {
      const updatedAlbum = { ...mockAlbum, title: 'Updated Title' };

      service.update(1, updatedAlbum).subscribe(album => {
        expect(album).toEqual(updatedAlbum);
      });

      const req = httpMock.expectOne(`${API_URL}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedAlbum);
      req.flush(updatedAlbum);
    });

    it('should handle conflict error', () => {
      service.update(1, mockAlbum).subscribe({
        error: (error) => {
          expect(error.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(`${API_URL}/1`);
      req.flush({ message: 'Album already exists' }, { status: 409, statusText: 'Conflict' });
    });
  });

  describe('delete', () => {
    it('should delete album', () => {
      service.delete(1).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${API_URL}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle delete error', () => {
      service.delete(1).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${API_URL}/1`);
      req.flush(
        { message: 'Cannot delete album' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('uploadCover', () => {
    it('should upload cover successfully', () => {
      const file = new File([''], 'cover.jpg', { type: 'image/jpeg' });
      const mockResponse = {
        key: 'cover-key-123',
        url: 'http://example.com/cover-123.jpg'
      };

      service.uploadCover(1, file).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${API_URL}/1/covers`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockResponse);
    });

    it('should handle file size error', () => {
      const largeFile = new File(['x'.repeat(10000000)], 'large.jpg', { type: 'image/jpeg' });

      service.uploadCover(1, largeFile).subscribe({
        error: (error) => {
          expect(error.status).toBe(413);
        }
      });

      const req = httpMock.expectOne(`${API_URL}/1/covers`);
      req.flush(
        { message: 'File too large' },
        { status: 413, statusText: 'Payload Too Large' }
      );
    });

    it('should handle invalid file type error', () => {
      const invalidFile = new File([''], 'document.pdf', { type: 'application/pdf' });

      service.uploadCover(1, invalidFile).subscribe({
        error: (error) => {
          expect(error.status).toBe(415);
        }
      });

      const req = httpMock.expectOne(`${API_URL}/1/covers`);
      req.flush(
        { message: 'Unsupported media type' },
        { status: 415, statusText: 'Unsupported Media Type' }
      );
    });
  });

  describe('uploadBatchCovers', () => {
    it('should upload multiple covers', () => {
      const files = [
        new File([''], 'cover1.jpg', { type: 'image/jpeg' }),
        new File([''], 'cover2.jpg', { type: 'image/jpeg' })
      ];
      const mockResponse = {
        uploaded: 2,
        urls: [
          'http://example.com/cover1.jpg',
          'http://example.com/cover2.jpg'
        ]
      };

      service.uploadBatchCovers(1, files).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${API_URL}/1/covers/batch`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockResponse);
    });

    it('should handle partial upload failure', () => {
      const files = [
        new File([''], 'cover1.jpg', { type: 'image/jpeg' }),
        new File([''], 'invalid.txt', { type: 'text/plain' })
      ];

      service.uploadBatchCovers(1, files).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${API_URL}/1/covers/batch`);
      req.flush(
        { message: 'Some files failed to upload' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('getCoverUrl', () => {
    it('should get cover URL', () => {
      const mockUrl = 'http://example.com/presigned-url';

      service.getCoverUrl(1).subscribe(url => {
        expect(url).toBe(mockUrl);
      });

      const req = httpMock.expectOne(`${API_URL}/1/covers/url`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUrl);
    });

    it('should handle missing cover', () => {
      service.getCoverUrl(1).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${API_URL}/1/covers/url`);
      req.flush('No cover found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getByArtist', () => {
    it('should fetch albums by artist', () => {
      service.getByArtist(1).subscribe(albums => {
        expect(albums).toEqual([mockAlbum]);
      });

      const req = httpMock.expectOne(`${API_URL}/artist/1`);
      expect(req.request.method).toBe('GET');
      req.flush([mockAlbum]);
    });

    it('should return empty array for artist with no albums', () => {
      service.getByArtist(999).subscribe(albums => {
        expect(albums).toEqual([]);
      });

      const req = httpMock.expectOne(`${API_URL}/artist/999`);
      req.flush([]);
    });
  });

  describe('search', () => {
    it('should search albums by title', () => {
      service.search('Test').subscribe(response => {
        expect(response).toEqual(mockPageResponse);
      });

      const req = httpMock.expectOne(`${API_URL}/search?title=Test`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });

    it('should search with pagination', () => {
      service.search('Test', 1, 20).subscribe(response => {
        expect(response).toEqual(mockPageResponse);
      });

      const req = httpMock.expectOne(`${API_URL}/search?title=Test&page=1&size=20`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });

    it('should handle empty search term', () => {
      service.search('').subscribe(response => {
        expect(response).toEqual(mockPageResponse);
      });

      const req = httpMock.expectOne(`${API_URL}/search?title=`);
      req.flush(mockPageResponse);
    });
  });

  describe('addTrack', () => {
    it('should add track to album', () => {
      const newTrack = { title: 'New Track', durationSeconds: 200, trackNumber: 2 };

      service.addTrack(1, newTrack).subscribe(track => {
        expect(track).toBeTruthy();
        expect(track.title).toBe(newTrack.title);
      });

      const req = httpMock.expectOne(`${API_URL}/1/tracks`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newTrack);
      req.flush({ ...newTrack, id: 2 });
    });

    it('should handle track validation error', () => {
      const invalidTrack = { title: '', durationSeconds: -1, trackNumber: 0 };

      service.addTrack(1, invalidTrack).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${API_URL}/1/tracks`);
      req.flush(
        { message: 'Invalid track data' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('removeTrack', () => {
    it('should remove track from album', () => {
      service.removeTrack(1, 1).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${API_URL}/1/tracks/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle track not found error', () => {
      service.removeTrack(1, 999).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${API_URL}/1/tracks/999`);
      req.flush('Track not found', { status: 404, statusText: 'Not Found' });
    });
  });
});