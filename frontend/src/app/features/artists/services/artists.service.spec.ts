import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ArtistsService } from './artists.service';
import { Artist, ArtistType } from '../models/artist.model';
import { PageResponse } from '@shared/models/pagination.model';
import { environment } from '@env/environment';

describe('ArtistsService', () => {
  let service: ArtistsService;
  let httpMock: HttpTestingController;
  const API_URL = `${environment.apiUrl}/v1/artists`;

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
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ArtistsService]
    });

    service = TestBed.inject(ArtistsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should fetch all artists with default parameters', () => {
      service.getAll().subscribe(response => {
        expect(response).toEqual(mockPageResponse);
      });

      const req = httpMock.expectOne(`${API_URL}?page=0&size=10&sortBy=name&sortDir=asc`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });

    it('should fetch artists with custom parameters', () => {
      const params = {
        page: 1,
        size: 20,
        sortBy: 'albumCount',
        sortDir: 'desc',
        name: 'Test',
        type: ArtistType.BAND
      };

      service.getAll(params).subscribe(response => {
        expect(response).toEqual(mockPageResponse);
      });

      const req = httpMock.expectOne(
        `${API_URL}?page=1&size=20&sortBy=albumCount&sortDir=desc&name=Test&type=BAND`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });

    it('should handle empty filters', () => {
      const params = {
        name: '',
        type: null
      };

      service.getAll(params).subscribe();

      const req = httpMock.expectOne(`${API_URL}?page=0&size=10&sortBy=name&sortDir=asc`);
      expect(req.request.url).not.toContain('name=');
      expect(req.request.url).not.toContain('type=');
      req.flush(mockPageResponse);
    });

    it('should handle server error', () => {
      service.getAll().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${API_URL}?page=0&size=10&sortBy=name&sortDir=asc`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getById', () => {
    it('should fetch artist by id', () => {
      service.getById(1).subscribe(artist => {
        expect(artist).toEqual(mockArtist);
      });

      const req = httpMock.expectOne(`${API_URL}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockArtist);
    });

    it('should handle 404 error', () => {
      service.getById(999).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${API_URL}/999`);
      req.flush('Artist not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('create', () => {
    it('should create new artist', () => {
      const newArtist = { ...mockArtist, id: undefined };

      service.create(newArtist).subscribe(artist => {
        expect(artist).toEqual(mockArtist);
      });

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newArtist);
      req.flush(mockArtist);
    });

    it('should handle validation error', () => {
      const invalidArtist = { ...mockArtist, id: undefined, name: '' };

      service.create(invalidArtist).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(API_URL);
      req.flush({ message: 'Validation failed' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('update', () => {
    it('should update artist', () => {
      const updatedArtist = { ...mockArtist, name: 'Updated Name' };

      service.update(1, updatedArtist).subscribe(artist => {
        expect(artist).toEqual(updatedArtist);
      });

      const req = httpMock.expectOne(`${API_URL}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedArtist);
      req.flush(updatedArtist);
    });

    it('should handle conflict error', () => {
      service.update(1, mockArtist).subscribe({
        error: (error) => {
          expect(error.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(`${API_URL}/1`);
      req.flush({ message: 'Artist name already exists' }, { status: 409, statusText: 'Conflict' });
    });
  });

  describe('delete', () => {
    it('should delete artist', () => {
      service.delete(1).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${API_URL}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle delete error when artist has albums', () => {
      service.delete(1).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${API_URL}/1`);
      req.flush(
        { message: 'Cannot delete artist with albums' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('uploadPhoto', () => {
    it('should upload photo successfully', () => {
      const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
      const mockResponse = {
        key: 'photo-key-123',
        url: 'http://example.com/photo-123.jpg'
      };

      service.uploadPhoto(1, file).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${API_URL}/1/photo`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockResponse);
    });

    it('should handle file size error', () => {
      const largeFile = new File(['x'.repeat(10000000)], 'large.jpg', { type: 'image/jpeg' });

      service.uploadPhoto(1, largeFile).subscribe({
        error: (error) => {
          expect(error.status).toBe(413);
        }
      });

      const req = httpMock.expectOne(`${API_URL}/1/photo`);
      req.flush(
        { message: 'File too large' },
        { status: 413, statusText: 'Payload Too Large' }
      );
    });

    it('should handle invalid file type error', () => {
      const invalidFile = new File([''], 'document.pdf', { type: 'application/pdf' });

      service.uploadPhoto(1, invalidFile).subscribe({
        error: (error) => {
          expect(error.status).toBe(415);
        }
      });

      const req = httpMock.expectOne(`${API_URL}/1/photo`);
      req.flush(
        { message: 'Unsupported media type' },
        { status: 415, statusText: 'Unsupported Media Type' }
      );
    });
  });

  describe('deletePhoto', () => {
    it('should delete photo successfully', () => {
      service.deletePhoto(1).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${API_URL}/1/photo`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle delete photo error', () => {
      service.deletePhoto(1).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${API_URL}/1/photo`);
      req.flush('Photo not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getPhotoUrl', () => {
    it('should get photo URL', () => {
      const mockUrl = 'http://example.com/presigned-url';

      service.getPhotoUrl(1).subscribe(url => {
        expect(url).toBe(mockUrl);
      });

      const req = httpMock.expectOne(`${API_URL}/1/photo/url`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUrl);
    });

    it('should handle missing photo', () => {
      service.getPhotoUrl(1).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${API_URL}/1/photo/url`);
      req.flush('No photo found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('search', () => {
    it('should search artists by name', () => {
      service.search('Test').subscribe(response => {
        expect(response).toEqual(mockPageResponse);
      });

      const req = httpMock.expectOne(`${API_URL}/search?name=Test&sortDir=asc`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });

    it('should search with custom sort direction', () => {
      service.search('Test', 'desc').subscribe(response => {
        expect(response).toEqual(mockPageResponse);
      });

      const req = httpMock.expectOne(`${API_URL}/search?name=Test&sortDir=desc`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });

    it('should handle empty search term', () => {
      service.search('').subscribe(response => {
        expect(response).toEqual(mockPageResponse);
      });

      const req = httpMock.expectOne(`${API_URL}/search?name=&sortDir=asc`);
      req.flush(mockPageResponse);
    });
  });
});