import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpEventType, HttpResponse, HttpProgressEvent } from '@angular/common/http';
import { TrackAudioService, UploadProgress, AudioUploadResponse, StreamUrlResponse } from './track-audio.service';
import { environment } from '@env/environment';

describe('TrackAudioService', () => {
  let service: TrackAudioService;
  let httpMock: HttpTestingController;
  const BASE_URL = `${environment.apiUrl}/v1/tracks`;

  const mockAudioUploadResponse: AudioUploadResponse = {
    audioKey: 'audio-key-123',
    streamUrl: 'http://minio.local/presigned-url',
    message: 'Audio uploaded successfully'
  };

  const mockStreamUrlResponse: StreamUrlResponse = {
    streamUrl: 'http://minio.local/presigned-stream-url',
    expiresIn: '1 hour'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TrackAudioService]
    });

    service = TestBed.inject(TrackAudioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('uploadAudio', () => {
    it('should upload audio file and track progress', (done) => {
      const trackId = 1;
      const file = new File(['audio content'], 'track.mp3', { type: 'audio/mpeg' });
      const progressEvents: UploadProgress[] = [];

      service.uploadAudio(trackId, file).subscribe({
        next: (progress) => {
          progressEvents.push(progress);
        },
        complete: () => {
          expect(progressEvents.length).toBeGreaterThan(0);
          const lastEvent = progressEvents[progressEvents.length - 1];
          expect(lastEvent.completed).toBe(true);
          expect(lastEvent.progress).toBe(100);
          expect(lastEvent.response).toEqual(mockAudioUploadResponse);
          done();
        }
      });

      const req = httpMock.expectOne(`${BASE_URL}/${trackId}/audio`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);

      // Simulate progress event
      req.event({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 } as HttpProgressEvent);

      // Simulate response event
      req.event(new HttpResponse({ body: mockAudioUploadResponse }));
    });

    it('should calculate progress correctly', (done) => {
      const trackId = 1;
      const file = new File(['audio content'], 'track.mp3', { type: 'audio/mpeg' });
      const progressValues: number[] = [];

      service.uploadAudio(trackId, file).subscribe({
        next: (progress) => {
          progressValues.push(progress.progress);
        },
        complete: () => {
          expect(progressValues).toContain(50);
          expect(progressValues).toContain(100);
          done();
        }
      });

      const req = httpMock.expectOne(`${BASE_URL}/${trackId}/audio`);

      // Simulate 50% progress
      req.event({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 } as HttpProgressEvent);

      // Simulate completion
      req.event(new HttpResponse({ body: mockAudioUploadResponse }));
    });

    it('should handle upload error', (done) => {
      const trackId = 1;
      const file = new File(['audio content'], 'track.mp3', { type: 'audio/mpeg' });

      service.uploadAudio(trackId, file).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${BASE_URL}/${trackId}/audio`);
      req.flush('Upload failed', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle unsupported file type error', (done) => {
      const trackId = 1;
      const file = new File(['invalid content'], 'document.pdf', { type: 'application/pdf' });

      service.uploadAudio(trackId, file).subscribe({
        error: (error) => {
          expect(error.status).toBe(415);
          done();
        }
      });

      const req = httpMock.expectOne(`${BASE_URL}/${trackId}/audio`);
      req.flush(
        { message: 'Unsupported audio format' },
        { status: 415, statusText: 'Unsupported Media Type' }
      );
    });

    it('should handle file size limit error', (done) => {
      const trackId = 1;
      const largeFile = new File(['x'.repeat(100000000)], 'large.mp3', { type: 'audio/mpeg' });

      service.uploadAudio(trackId, largeFile).subscribe({
        error: (error) => {
          expect(error.status).toBe(413);
          done();
        }
      });

      const req = httpMock.expectOne(`${BASE_URL}/${trackId}/audio`);
      req.flush(
        { message: 'File too large' },
        { status: 413, statusText: 'Payload Too Large' }
      );
    });

    it('should handle track not found error', (done) => {
      const trackId = 999;
      const file = new File(['audio content'], 'track.mp3', { type: 'audio/mpeg' });

      service.uploadAudio(trackId, file).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${BASE_URL}/${trackId}/audio`);
      req.flush('Track not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getStreamUrl', () => {
    it('should get stream URL successfully', () => {
      const trackId = 1;

      service.getStreamUrl(trackId).subscribe(response => {
        expect(response).toEqual(mockStreamUrlResponse);
        expect(response.streamUrl).toBe('http://minio.local/presigned-stream-url');
        expect(response.expiresIn).toBe('1 hour');
      });

      const req = httpMock.expectOne(`${BASE_URL}/${trackId}/stream`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStreamUrlResponse);
    });

    it('should handle 404 when track has no audio', () => {
      const trackId = 1;

      service.getStreamUrl(trackId).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${BASE_URL}/${trackId}/stream`);
      req.flush(
        { message: 'Track has no audio file' },
        { status: 404, statusText: 'Not Found' }
      );
    });

    it('should handle track not found error', () => {
      const trackId = 999;

      service.getStreamUrl(trackId).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${BASE_URL}/${trackId}/stream`);
      req.flush('Track not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle server error', () => {
      const trackId = 1;

      service.getStreamUrl(trackId).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${BASE_URL}/${trackId}/stream`);
      req.flush('MinIO error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('deleteAudio', () => {
    it('should delete audio successfully', () => {
      const trackId = 1;

      service.deleteAudio(trackId).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${BASE_URL}/${trackId}/audio`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle track not found error', () => {
      const trackId = 999;

      service.deleteAudio(trackId).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${BASE_URL}/${trackId}/audio`);
      req.flush('Track not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle track has no audio error', () => {
      const trackId = 1;

      service.deleteAudio(trackId).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${BASE_URL}/${trackId}/audio`);
      req.flush(
        { message: 'Track has no audio to delete' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle server error during delete', () => {
      const trackId = 1;

      service.deleteAudio(trackId).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${BASE_URL}/${trackId}/audio`);
      req.flush('MinIO delete error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
