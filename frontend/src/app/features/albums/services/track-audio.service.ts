import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, map, filter } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface UploadProgress {
  progress: number;
  completed: boolean;
  response?: AudioUploadResponse;
}

export interface AudioUploadResponse {
  audioKey: string;
  streamUrl: string;
  message: string;
}

export interface StreamUrlResponse {
  streamUrl: string;
  expiresIn: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrackAudioService {
  private readonly BASE_URL = `${environment.apiUrl}/v1/tracks`;

  constructor(private http: HttpClient) {}

  uploadAudio(trackId: number, file: File): Observable<UploadProgress> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<AudioUploadResponse>(
      `${this.BASE_URL}/${trackId}/audio`,
      formData,
      {
        reportProgress: true,
        observe: 'events'
      }
    ).pipe(
      filter((event: HttpEvent<AudioUploadResponse>) =>
        event.type === HttpEventType.UploadProgress ||
        event.type === HttpEventType.Response
      ),
      map((event: HttpEvent<AudioUploadResponse>) => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = event.total
            ? Math.round((100 * event.loaded) / event.total)
            : 0;
          return { progress, completed: false };
        }

        // Response event
        return {
          progress: 100,
          completed: true,
          response: (event as any).body as AudioUploadResponse
        };
      })
    );
  }

  getStreamUrl(trackId: number): Observable<StreamUrlResponse> {
    return this.http.get<StreamUrlResponse>(`${this.BASE_URL}/${trackId}/stream`);
  }

  deleteAudio(trackId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${trackId}/audio`);
  }
}
