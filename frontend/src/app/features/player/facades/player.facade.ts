import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { PlayerState, RepeatMode, PlayerEvents } from '../models/player.model';
import { AudioService } from '../services/audio.service';
import { TrackDTO } from '@features/albums/models/track.model';

@Injectable({
  providedIn: 'root'
})
export class PlayerFacade implements PlayerEvents {
  private initialState: PlayerState = {
    currentTrack: null,
    playlist: [],
    currentIndex: -1,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isMuted: false,
    repeatMode: RepeatMode.NONE,
    shuffleEnabled: false,
    isLoading: false,
    error: null
  };

  private state$ = new BehaviorSubject<PlayerState>(this.initialState);
  private subscriptions = new Subscription();
  private originalPlaylist: TrackDTO[] = [];

  constructor(private audioService: AudioService) {
    this.setupAudioListeners();
    this.loadVolumeFromStorage();
  }

  private setupAudioListeners(): void {
    this.subscriptions.add(
      this.audioService.onTimeUpdate.subscribe(time => {
        this.updateState({ currentTime: time });
      })
    );

    this.subscriptions.add(
      this.audioService.onEnded.subscribe(() => {
        this.handleTrackEnded();
      })
    );

    this.subscriptions.add(
      this.audioService.onError.subscribe(error => {
        this.updateState({ error, isLoading: false, isPlaying: false });
      })
    );

    this.subscriptions.add(
      this.audioService.onLoading.subscribe(isLoading => {
        this.updateState({ isLoading });
      })
    );
  }

  private loadVolumeFromStorage(): void {
    const savedVolume = localStorage.getItem('player-volume');
    if (savedVolume) {
      const volume = parseFloat(savedVolume);
      this.setVolume(volume);
    }
  }

  private saveVolumeToStorage(volume: number): void {
    localStorage.setItem('player-volume', volume.toString());
  }

  private updateState(partial: Partial<PlayerState>): void {
    this.state$.next({ ...this.state$.value, ...partial });
  }

  private handleTrackEnded(): void {
    const state = this.state$.value;

    if (state.repeatMode === RepeatMode.ONE) {
      this.replay();
    } else if (state.repeatMode === RepeatMode.ALL || state.currentIndex < state.playlist.length - 1) {
      this.next();
    } else {
      this.updateState({ isPlaying: false });
    }
  }

  private replay(): void {
    this.audioService.seek(0);
    this.audioService.play();
  }

  private shufflePlaylist(playlist: TrackDTO[]): TrackDTO[] {
    const shuffled = [...playlist];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async playTrack(track: TrackDTO, playlist?: TrackDTO[]): Promise<void> {
    try {
      if (!track.streamUrl) {
        this.updateState({ error: 'No stream URL available for this track' });
        return;
      }

      // If playlist is provided, update it
      if (playlist) {
        this.originalPlaylist = [...playlist];
        const newPlaylist = this.state$.value.shuffleEnabled
          ? this.shufflePlaylist(playlist)
          : playlist;

        const currentIndex = newPlaylist.findIndex(t => t.id === track.id);
        this.updateState({
          playlist: newPlaylist,
          currentIndex
        });
      }

      // Load and play the track
      this.updateState({
        currentTrack: track,
        error: null,
        isLoading: true
      });

      await this.audioService.load(track.streamUrl).toPromise();
      this.updateState({ duration: this.audioService.duration });

      await this.audioService.play();
      this.updateState({ isPlaying: true });

      // Update media session
      this.updateMediaSession(track);

    } catch (error) {
      this.updateState({
        error: 'Failed to play track',
        isPlaying: false,
        isLoading: false
      });
    }
  }

  async playAlbum(tracks: TrackDTO[], startIndex: number = 0): Promise<void> {
    if (tracks.length === 0) return;

    this.originalPlaylist = [...tracks];
    const playlist = this.state$.value.shuffleEnabled
      ? this.shufflePlaylist(tracks)
      : tracks;

    const track = playlist[startIndex];
    if (track) {
      await this.playTrack(track, playlist);
    }
  }

  async play(): Promise<void> {
    const state = this.state$.value;

    if (state.currentTrack) {
      try {
        await this.audioService.play();
        this.updateState({ isPlaying: true });
      } catch (error) {
        this.updateState({ error: 'Failed to resume playback' });
      }
    } else if (state.playlist.length > 0) {
      // Start playing the first track in the playlist
      await this.playTrack(state.playlist[0], state.playlist);
    }
  }

  pause(): void {
    this.audioService.pause();
    this.updateState({ isPlaying: false });
  }

  async next(): Promise<void> {
    const state = this.state$.value;
    let nextIndex = state.currentIndex + 1;

    if (nextIndex >= state.playlist.length) {
      if (state.repeatMode === RepeatMode.ALL) {
        nextIndex = 0;
      } else {
        return;
      }
    }

    const nextTrack = state.playlist[nextIndex];
    if (nextTrack) {
      this.updateState({ currentIndex: nextIndex });
      await this.playTrack(nextTrack);
    }
  }

  async previous(): Promise<void> {
    const state = this.state$.value;

    // If more than 3 seconds into the song, restart it
    if (state.currentTime > 3) {
      this.seek(0);
      return;
    }

    let prevIndex = state.currentIndex - 1;

    if (prevIndex < 0) {
      if (state.repeatMode === RepeatMode.ALL) {
        prevIndex = state.playlist.length - 1;
      } else {
        this.seek(0);
        return;
      }
    }

    const prevTrack = state.playlist[prevIndex];
    if (prevTrack) {
      this.updateState({ currentIndex: prevIndex });
      await this.playTrack(prevTrack);
    }
  }

  seek(time: number): void {
    this.audioService.seek(time);
    this.updateState({ currentTime: time });
  }

  setVolume(volume: number): void {
    const normalizedVolume = Math.max(0, Math.min(1, volume));
    this.audioService.setVolume(normalizedVolume);
    this.updateState({ volume: normalizedVolume, isMuted: normalizedVolume === 0 });
    this.saveVolumeToStorage(normalizedVolume);
  }

  toggleMute(): void {
    const state = this.state$.value;
    if (state.isMuted) {
      this.setVolume(state.volume || 0.7);
    } else {
      this.audioService.setVolume(0);
      this.updateState({ isMuted: true });
    }
  }

  toggleRepeat(): void {
    const state = this.state$.value;
    let nextMode: RepeatMode;

    switch (state.repeatMode) {
      case RepeatMode.NONE:
        nextMode = RepeatMode.ALL;
        break;
      case RepeatMode.ALL:
        nextMode = RepeatMode.ONE;
        break;
      case RepeatMode.ONE:
        nextMode = RepeatMode.NONE;
        break;
    }

    this.updateState({ repeatMode: nextMode });
  }

  toggleShuffle(): void {
    const state = this.state$.value;
    const shuffleEnabled = !state.shuffleEnabled;

    if (shuffleEnabled) {
      // Shuffle the playlist keeping the current track
      const currentTrack = state.currentTrack;
      const shuffled = this.shufflePlaylist(this.originalPlaylist);
      const newIndex = currentTrack ? shuffled.findIndex(t => t.id === currentTrack.id) : 0;

      this.updateState({
        playlist: shuffled,
        currentIndex: newIndex,
        shuffleEnabled: true
      });
    } else {
      // Restore original playlist order
      const currentTrack = state.currentTrack;
      const newIndex = currentTrack ? this.originalPlaylist.findIndex(t => t.id === currentTrack.id) : 0;

      this.updateState({
        playlist: this.originalPlaylist,
        currentIndex: newIndex,
        shuffleEnabled: false
      });
    }
  }

  clearPlaylist(): void {
    this.audioService.pause();
    this.updateState({
      ...this.initialState,
      volume: this.state$.value.volume
    });
  }

  private updateMediaSession(track: TrackDTO): void {
    this.audioService.setMediaSessionMetadata(
      track.title,
      track.artistName || 'Unknown Artist',
      track.albumTitle || 'Unknown Album',
      track.coverUrl
    );
  }

  // State selectors
  get state(): Observable<PlayerState> {
    return this.state$.asObservable();
  }

  get currentTrack$(): Observable<TrackDTO | null> {
    return this.state$.pipe(
      map(state => state.currentTrack),
      distinctUntilChanged()
    );
  }

  get isPlaying$(): Observable<boolean> {
    return this.state$.pipe(
      map(state => state.isPlaying),
      distinctUntilChanged()
    );
  }

  get currentTime$(): Observable<number> {
    return this.state$.pipe(
      map(state => state.currentTime),
      distinctUntilChanged()
    );
  }

  get duration$(): Observable<number> {
    return this.state$.pipe(
      map(state => state.duration),
      distinctUntilChanged()
    );
  }

  get volume$(): Observable<number> {
    return this.state$.pipe(
      map(state => state.volume),
      distinctUntilChanged()
    );
  }

  get repeatMode$(): Observable<RepeatMode> {
    return this.state$.pipe(
      map(state => state.repeatMode),
      distinctUntilChanged()
    );
  }

  get shuffleEnabled$(): Observable<boolean> {
    return this.state$.pipe(
      map(state => state.shuffleEnabled),
      distinctUntilChanged()
    );
  }

  get isLoading$(): Observable<boolean> {
    return this.state$.pipe(
      map(state => state.isLoading),
      distinctUntilChanged()
    );
  }

  get error$(): Observable<string | null> {
    return this.state$.pipe(
      map(state => state.error),
      distinctUntilChanged()
    );
  }

  destroy(): void {
    this.subscriptions.unsubscribe();
    this.audioService.destroy();
  }
}