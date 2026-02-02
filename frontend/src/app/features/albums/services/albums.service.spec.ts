import { TestBed } from '@angular/core/testing';
import { AlbumsService } from './albums.service';
import { ApiService, PageResponse } from '../../../core/services/api.service';
import { Album } from '../models/album.model';
import { of, throwError } from 'rxjs';

describe('AlbumsService', () => {
  let service: AlbumsService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockAlbum: Album = {
    id: 1,
    title: 'Test Album',
    releaseYear: 2024,
    genre: 'Rock',
    coverUrl: 'http://example.com/cover.jpg',
    active: true,
    artists: [{ id: 1, name: 'Test Artist', type: 'SOLO' }]
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
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'get',
      'post',
      'put',
      'delete',
      'uploadFile'
    ]);

    TestBed.configureTestingModule({
      providers: [
        AlbumsService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(AlbumsService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should fetch all albums', () => {
      apiService.get.and.returnValue(of(mockPageResponse));

      service.getAll().subscribe(response => {
        expect(response).toEqual(mockPageResponse);
      });

      expect(apiService.get).toHaveBeenCalledWith('/albums', undefined);
    });

    it('should fetch albums with parameters', () => {
      const params = { page: 1, size: 20 };
      apiService.get.and.returnValue(of(mockPageResponse));

      service.getAll(params).subscribe(response => {
        expect(response).toEqual(mockPageResponse);
      });

      expect(apiService.get).toHaveBeenCalledWith('/albums', params);
    });
  });

  describe('getById', () => {
    it('should fetch album by id', () => {
      apiService.get.and.returnValue(of(mockAlbum));

      service.getById(1).subscribe(album => {
        expect(album).toEqual(mockAlbum);
      });

      expect(apiService.get).toHaveBeenCalledWith('/albums/1');
    });
  });

  describe('create', () => {
    it('should create new album', () => {
      const newAlbum = { title: 'New Album', releaseYear: 2024, artistIds: [1] };
      apiService.post.and.returnValue(of(mockAlbum));

      service.create(newAlbum).subscribe(album => {
        expect(album).toEqual(mockAlbum);
      });

      expect(apiService.post).toHaveBeenCalledWith('/albums', newAlbum);
    });
  });

  describe('update', () => {
    it('should update album', () => {
      const updateData = { title: 'Updated Title' };
      apiService.put.and.returnValue(of({ ...mockAlbum, ...updateData }));

      service.update(1, updateData).subscribe(album => {
        expect(album.title).toBe('Updated Title');
      });

      expect(apiService.put).toHaveBeenCalledWith('/albums/1', updateData);
    });
  });

  describe('delete', () => {
    it('should delete album', () => {
      apiService.delete.and.returnValue(of(undefined));

      service.delete(1).subscribe(response => {
        expect(response).toBeUndefined();
      });

      expect(apiService.delete).toHaveBeenCalledWith('/albums/1');
    });
  });

  describe('uploadCover', () => {
    it('should upload cover', () => {
      const file = new File([''], 'cover.jpg', { type: 'image/jpeg' });
      const mockResponse = { coverUrl: 'http://example.com/new-cover.jpg' };
      apiService.uploadFile.and.returnValue(of(mockResponse));

      service.uploadCover(1, file).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      expect(apiService.uploadFile).toHaveBeenCalledWith('/albums/1/covers', file);
    });
  });

  describe('getCoverUrl', () => {
    it('should get cover URL', () => {
      const mockResponse = { url: 'http://example.com/presigned-url', expiresAt: '2024-01-01T00:00:00Z' };
      apiService.get.and.returnValue(of(mockResponse));

      service.getCoverUrl(1).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      expect(apiService.get).toHaveBeenCalledWith('/albums/1/covers/url');
    });
  });
});
