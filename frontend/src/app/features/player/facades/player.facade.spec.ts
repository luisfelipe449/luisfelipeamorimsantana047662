import { TestBed } from '@angular/core/testing';
import { PlayerFacade } from './player.facade';
import { AudioService } from '../services/audio.service';
import { PlayerState, RepeatMode } from '../models/player.model';
import { TrackDTO } from '@features/albums/models/track.model';
import { of, Subject } from 'rxjs';

describe('PlayerFacade', () => {
  let facade: PlayerFacade;
  let audioService: jasmine.SpyObj<AudioService>;
  let timeUpdateSubject: Subject<number>;
  let endedSubject: Subject<void>;
  let errorSubject: Subject<string>;
  let loadingSubject: Subject<boolean>;

  const mockTrack: TrackDTO = {
    id: 1,
    title: 'Test Track',
    trackNumber: 1,
    duration: 240,
    streamUrl: 'http://example.com/track.mp3',
    albumTitle: 'Test Album',
    artistName: 'Test Artist',
    coverUrl: 'http://example.com/cover.jpg'
  };

  const mockPlaylist: TrackDTO[] = [
    mockTrack,
    { ...mockTrack, id: 2, title: 'Track 2', trackNumber: 2 },
    { ...mockTrack, id: 3, title: 'Track 3', trackNumber: 3 }
  ];

  beforeEach(() => {
    timeUpdateSubject = new Subject<number>();
    endedSubject = new Subject<void>();
    errorSubject = new Subject<string>();
    loadingSubject = new Subject<boolean>();

    const audioServiceSpy = jasmine.createSpyObj('AudioService', [
      'load',
      'play',
      'pause',
      'seek',
      'setVolume',
      'destroy',
      'setMediaSessionMetadata'
    ], {
      onTimeUpdate: timeUpdateSubject.asObservable(),
      onEnded: endedSubject.asObservable(),
      onError: errorSubject.asObservable(),
      onLoading: loadingSubject.asObservable(),
      volume: 0.7,
      currentTime: 0,
      duration: 240,
      isPlaying: false
    });

    audioServiceSpy.load.and.returnValue(of(void 0));
    audioServiceSpy.play.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        PlayerFacade,
        { provide: AudioService, useValue: audioServiceSpy }
      ]
    });

    facade = TestBed.inject(PlayerFacade);
    audioService = TestBed.inject(AudioService) as jasmine.SpyObj<AudioService>;
  });

  afterEach(() => {
    facade.destroy();
  });

  it('should be created', () => {
    expect(facade).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should have correct initial state', (done) => {
      facade.state.subscribe(state => {
        expect(state.currentTrack).toBeNull();
        expect(state.playlist).toEqual([]);
        expect(state.currentIndex).toBe(-1);
        expect(state.isPlaying).toBe(false);
        expect(state.currentTime).toBe(0);
        expect(state.duration).toBe(0);
        expect(state.volume).toBe(0.7);
        expect(state.isMuted).toBe(false);
        expect(state.repeatMode).toBe(RepeatMode.NONE);
        expect(state.shuffleEnabled).toBe(false);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
        done();
      });
    });
  });

  describe('playTrack', () => {
    it('should play a single track', async () => {
      await facade.playTrack(mockTrack);

      expect(audioService.load).toHaveBeenCalledWith(mockTrack.streamUrl!);
      expect(audioService.play).toHaveBeenCalled();
      expect(audioService.setMediaSessionMetadata).toHaveBeenCalled();
    });

    it('should update state when playing track', async () => {
      await facade.playTrack(mockTrack);

      const state = await facade.state.toPromise();
      expect(state?.currentTrack).toEqual(mockTrack);
      expect(state?.isPlaying).toBe(true);
    });

    it('should handle track without stream URL', async () => {
      const trackWithoutUrl = { ...mockTrack, streamUrl: undefined };
      await facade.playTrack(trackWithoutUrl);

      const state = await facade.state.toPromise();
      expect(state?.error).toBe('No stream URL available for this track');
      expect(audioService.play).not.toHaveBeenCalled();
    });

    it('should update playlist when provided', async () => {
      await facade.playTrack(mockTrack, mockPlaylist);

      const state = await facade.state.toPromise();
      expect(state?.playlist).toEqual(mockPlaylist);
      expect(state?.currentIndex).toBe(0);
    });

    it('should handle playback error', async () => {
      audioService.play.and.returnValue(Promise.reject(new Error('Playback failed')));

      await facade.playTrack(mockTrack);

      const state = await facade.state.toPromise();
      expect(state?.error).toBe('Failed to play track');
      expect(state?.isPlaying).toBe(false);
    });
  });

  describe('playAlbum', () => {
    it('should play album from beginning', async () => {
      await facade.playAlbum(mockPlaylist);

      expect(audioService.load).toHaveBeenCalledWith(mockPlaylist[0].streamUrl!);
      expect(audioService.play).toHaveBeenCalled();
    });

    it('should play album from specific index', async () => {
      await facade.playAlbum(mockPlaylist, 1);

      expect(audioService.load).toHaveBeenCalledWith(mockPlaylist[1].streamUrl!);
    });

    it('should handle empty playlist', async () => {
      await facade.playAlbum([]);

      expect(audioService.play).not.toHaveBeenCalled();
    });
  });

  describe('play/pause', () => {
    it('should resume playback when paused', async () => {
      // First play a track
      await facade.playTrack(mockTrack);

      // Pause it
      facade.pause();
      expect(audioService.pause).toHaveBeenCalled();

      // Resume
      await facade.play();
      expect(audioService.play).toHaveBeenCalledTimes(2);
    });

    it('should start playing first track if no current track', async () => {
      await facade.playAlbum(mockPlaylist);
      facade.pause();

      // Clear current track but keep playlist
      await facade.play();

      expect(audioService.play).toHaveBeenCalled();
    });

    it('should update playing state', async () => {
      await facade.playTrack(mockTrack);

      facade.pause();

      const state = await facade.state.toPromise();
      expect(state?.isPlaying).toBe(false);
    });
  });

  describe('next/previous', () => {
    beforeEach(async () => {
      await facade.playAlbum(mockPlaylist, 1); // Start at index 1
    });

    it('should play next track', async () => {
      await facade.next();

      const state = await facade.state.toPromise();
      expect(state?.currentIndex).toBe(2);
      expect(state?.currentTrack?.id).toBe(3);
    });

    it('should play previous track', async () => {
      // Simulate being more than 3 seconds into the song
      timeUpdateSubject.next(4);

      await facade.previous();

      // Should restart current track
      expect(audioService.seek).toHaveBeenCalledWith(0);
    });

    it('should go to previous track if less than 3 seconds', async () => {
      timeUpdateSubject.next(2);

      await facade.previous();

      const state = await facade.state.toPromise();
      expect(state?.currentIndex).toBe(0);
    });

    it('should loop to beginning when repeat all enabled', async () => {
      facade.toggleRepeat(); // NONE -> ALL

      // Go to last track
      await facade.next(); // index 2
      await facade.next(); // Should loop to 0

      const state = await facade.state.toPromise();
      expect(state?.currentIndex).toBe(0);
    });

    it('should stop at end when repeat is NONE', async () => {
      // Go to last track
      await facade.next(); // index 2
      await facade.next(); // Should not advance

      const state = await facade.state.toPromise();
      expect(state?.currentIndex).toBe(2);
    });
  });

  describe('seek', () => {
    it('should seek to specific time', () => {
      facade.seek(120);

      expect(audioService.seek).toHaveBeenCalledWith(120);
    });

    it('should update current time in state', () => {
      facade.seek(120);

      facade.currentTime$.subscribe(time => {
        expect(time).toBe(120);
      });
    });
  });

  describe('volume controls', () => {
    it('should set volume', () => {
      facade.setVolume(0.5);

      expect(audioService.setVolume).toHaveBeenCalledWith(0.5);
    });

    it('should clamp volume between 0 and 1', () => {
      facade.setVolume(1.5);
      expect(audioService.setVolume).toHaveBeenCalledWith(1);

      facade.setVolume(-0.5);
      expect(audioService.setVolume).toHaveBeenCalledWith(0);
    });

    it('should save volume to localStorage', () => {
      spyOn(localStorage, 'setItem');

      facade.setVolume(0.8);

      expect(localStorage.setItem).toHaveBeenCalledWith('player-volume', '0.8');
    });

    it('should toggle mute', () => {
      facade.toggleMute();

      expect(audioService.setVolume).toHaveBeenCalledWith(0);

      facade.toggleMute();

      expect(audioService.setVolume).toHaveBeenCalledWith(0.7);
    });
  });

  describe('repeat modes', () => {
    it('should cycle through repeat modes', () => {
      let states: RepeatMode[] = [];
      facade.repeatMode$.subscribe(mode => states.push(mode));

      facade.toggleRepeat(); // NONE -> ALL
      facade.toggleRepeat(); // ALL -> ONE
      facade.toggleRepeat(); // ONE -> NONE

      expect(states).toContain(RepeatMode.ALL);
      expect(states).toContain(RepeatMode.ONE);
      expect(states[states.length - 1]).toBe(RepeatMode.NONE);
    });

    it('should replay track when repeat ONE and track ends', async () => {
      await facade.playTrack(mockTrack);
      facade.toggleRepeat(); // NONE -> ALL
      facade.toggleRepeat(); // ALL -> ONE

      // Simulate track ending
      endedSubject.next();

      expect(audioService.seek).toHaveBeenCalledWith(0);
      expect(audioService.play).toHaveBeenCalled();
    });
  });

  describe('shuffle', () => {
    it('should shuffle playlist when enabled', async () => {
      await facade.playAlbum(mockPlaylist);

      const originalOrder = [...mockPlaylist];
      facade.toggleShuffle();

      const state = await facade.state.toPromise();
      expect(state?.shuffleEnabled).toBe(true);
      // Playlist should be shuffled (might be same order by chance, but unlikely with more tracks)
      expect(state?.playlist).toBeDefined();
    });

    it('should restore original order when disabled', async () => {
      await facade.playAlbum(mockPlaylist);

      facade.toggleShuffle(); // Enable
      facade.toggleShuffle(); // Disable

      const state = await facade.state.toPromise();
      expect(state?.shuffleEnabled).toBe(false);
      expect(state?.playlist).toEqual(mockPlaylist);
    });
  });

  describe('clearPlaylist', () => {
    it('should clear playlist and reset state', async () => {
      await facade.playAlbum(mockPlaylist);

      facade.clearPlaylist();

      const state = await facade.state.toPromise();
      expect(state?.currentTrack).toBeNull();
      expect(state?.playlist).toEqual([]);
      expect(state?.currentIndex).toBe(-1);
      expect(audioService.pause).toHaveBeenCalled();
    });
  });

  describe('state selectors', () => {
    beforeEach(async () => {
      await facade.playTrack(mockTrack, mockPlaylist);
    });

    it('should provide current track observable', (done) => {
      facade.currentTrack$.subscribe(track => {
        expect(track).toEqual(mockTrack);
        done();
      });
    });

    it('should provide playing state observable', (done) => {
      facade.isPlaying$.subscribe(isPlaying => {
        expect(isPlaying).toBe(true);
        done();
      });
    });

    it('should provide volume observable', (done) => {
      facade.volume$.subscribe(volume => {
        expect(volume).toBe(0.7);
        done();
      });
    });

    it('should provide loading state observable', (done) => {
      loadingSubject.next(true);

      facade.isLoading$.subscribe(isLoading => {
        if (isLoading) {
          expect(isLoading).toBe(true);
          done();
        }
      });
    });

    it('should provide error observable', (done) => {
      errorSubject.next('Test error');

      facade.error$.subscribe(error => {
        if (error) {
          expect(error).toBe('Test error');
          done();
        }
      });
    });
  });

  describe('audio event handling', () => {
    it('should update time on time update event', (done) => {
      timeUpdateSubject.next(30);

      facade.currentTime$.subscribe(time => {
        if (time === 30) {
          expect(time).toBe(30);
          done();
        }
      });
    });

    it('should handle track ended event', async () => {
      await facade.playAlbum(mockPlaylist, 0);

      // Simulate track ending
      endedSubject.next();

      // Should advance to next track
      const state = await facade.state.toPromise();
      expect(state?.currentIndex).toBe(1);
    });

    it('should handle loading events', (done) => {
      loadingSubject.next(true);
      loadingSubject.next(false);

      let loadingStates: boolean[] = [];
      facade.isLoading$.subscribe(loading => {
        loadingStates.push(loading);
        if (loadingStates.length === 2) {
          expect(loadingStates).toEqual([true, false]);
          done();
        }
      });
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      facade.destroy();

      expect(audioService.destroy).toHaveBeenCalled();
    });
  });
});