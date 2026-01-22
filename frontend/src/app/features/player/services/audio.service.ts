import { Injectable } from '@angular/core';
import { Observable, Subject, fromEvent, merge } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audio: HTMLAudioElement;
  private timeUpdateSubject = new Subject<number>();
  private endedSubject = new Subject<void>();
  private errorSubject = new Subject<string>();
  private loadingSubject = new Subject<boolean>();
  private canPlaySubject = new Subject<void>();

  constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Time update event
    this.audio.addEventListener('timeupdate', () => {
      this.timeUpdateSubject.next(this.audio.currentTime);
    });

    // Ended event
    this.audio.addEventListener('ended', () => {
      this.endedSubject.next();
    });

    // Error event
    this.audio.addEventListener('error', (e) => {
      const error = this.getErrorMessage(this.audio.error);
      this.errorSubject.next(error);
    });

    // Loading events
    this.audio.addEventListener('loadstart', () => {
      this.loadingSubject.next(true);
    });

    this.audio.addEventListener('canplay', () => {
      this.loadingSubject.next(false);
      this.canPlaySubject.next();
    });

    // Prevent browser default media keys
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
    }
  }

  private getErrorMessage(error: MediaError | null): string {
    if (!error) return 'Unknown playback error';

    switch (error.code) {
      case error.MEDIA_ERR_ABORTED:
        return 'Playback aborted';
      case error.MEDIA_ERR_NETWORK:
        return 'Network error while loading audio';
      case error.MEDIA_ERR_DECODE:
        return 'Audio decoding error';
      case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return 'Audio format not supported';
      default:
        return 'Unknown playback error';
    }
  }

  load(url: string): Observable<void> {
    return new Observable(observer => {
      this.audio.src = url;
      this.audio.load();

      const subscription = this.canPlaySubject.subscribe(() => {
        observer.next();
        observer.complete();
        subscription.unsubscribe();
      });

      const errorSubscription = this.errorSubject.subscribe(error => {
        observer.error(error);
        subscription.unsubscribe();
        errorSubscription.unsubscribe();
      });
    });
  }

  play(): Promise<void> {
    return this.audio.play();
  }

  pause(): void {
    this.audio.pause();
  }

  seek(time: number): void {
    if (isFinite(time) && time >= 0 && time <= this.audio.duration) {
      this.audio.currentTime = time;
    }
  }

  setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  get volume(): number {
    return this.audio.volume;
  }

  get currentTime(): number {
    return this.audio.currentTime;
  }

  get duration(): number {
    return this.audio.duration || 0;
  }

  get isPlaying(): boolean {
    return !this.audio.paused;
  }

  get onTimeUpdate(): Observable<number> {
    return this.timeUpdateSubject.asObservable();
  }

  get onEnded(): Observable<void> {
    return this.endedSubject.asObservable();
  }

  get onError(): Observable<string> {
    return this.errorSubject.asObservable();
  }

  get onLoading(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  setMediaSessionMetadata(title: string, artist: string, album: string, artwork?: string): void {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album,
        artwork: artwork ? [
          { src: artwork, sizes: '96x96', type: 'image/png' },
          { src: artwork, sizes: '128x128', type: 'image/png' },
          { src: artwork, sizes: '192x192', type: 'image/png' },
          { src: artwork, sizes: '256x256', type: 'image/png' },
          { src: artwork, sizes: '384x384', type: 'image/png' },
          { src: artwork, sizes: '512x512', type: 'image/png' }
        ] : []
      });
    }
  }

  destroy(): void {
    this.audio.pause();
    this.audio.src = '';
    this.timeUpdateSubject.complete();
    this.endedSubject.complete();
    this.errorSubject.complete();
    this.loadingSubject.complete();
    this.canPlaySubject.complete();
  }
}