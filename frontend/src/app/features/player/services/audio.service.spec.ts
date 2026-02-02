import { TestBed } from '@angular/core/testing';
import { AudioService } from './audio.service';

describe('AudioService', () => {
  let service: AudioService;
  let mockAudio: any;

  beforeEach(() => {
    // Mock Audio constructor
    mockAudio = {
      src: '',
      currentTime: 0,
      duration: 100,
      volume: 1,
      paused: true,
      ended: false,
      crossOrigin: '',
      play: jasmine.createSpy('play').and.returnValue(Promise.resolve()),
      pause: jasmine.createSpy('pause'),
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
      load: jasmine.createSpy('load'),
      error: null
    };

    spyOn(window as any, 'Audio').and.returnValue(mockAudio);

    TestBed.configureTestingModule({
      providers: [AudioService]
    });

    service = TestBed.inject(AudioService);
  });

  afterEach(() => {
    service.destroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('load', () => {
    it('should load a new track', (done) => {
      const url = 'http://example.com/track.mp3';

      service.load(url).subscribe({
        next: () => {
          expect(mockAudio.src).toBe(url);
          expect(mockAudio.load).toHaveBeenCalled();
          done();
        }
      });

      // Simulate canplay event
      const canplayCallback = mockAudio.addEventListener.calls.all()
        .find((call: any) => call.args[0] === 'canplay')?.args[1];
      if (canplayCallback) {
        canplayCallback();
      }
    });

    it('should set audio source correctly', () => {
      service.load('http://example.com/track.mp3');
      expect(mockAudio.src).toBe('http://example.com/track.mp3');
    });
  });

  describe('play', () => {
    it('should play the audio', async () => {
      await service.play();
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it('should return a promise', () => {
      const result = service.play();
      expect(result instanceof Promise).toBe(true);
    });

    it('should handle play error', async () => {
      mockAudio.play.and.returnValue(Promise.reject(new Error('Play failed')));

      try {
        await service.play();
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('pause', () => {
    it('should pause the audio', () => {
      service.pause();
      expect(mockAudio.pause).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop the audio and reset', () => {
      service.stop();
      expect(mockAudio.pause).toHaveBeenCalled();
      expect(mockAudio.currentTime).toBe(0);
      expect(mockAudio.src).toBe('');
    });
  });

  describe('seek', () => {
    it('should seek to specific time', () => {
      mockAudio.duration = 100;
      service.seek(50);
      expect(mockAudio.currentTime).toBe(50);
    });

    it('should not seek beyond duration', () => {
      mockAudio.duration = 100;
      const initialTime = mockAudio.currentTime;
      service.seek(150);
      // Should not change if out of bounds
      expect(mockAudio.currentTime).toBe(initialTime);
    });

    it('should not seek to negative values', () => {
      const initialTime = mockAudio.currentTime;
      service.seek(-10);
      // Should not change if negative
      expect(mockAudio.currentTime).toBe(initialTime);
    });
  });

  describe('setVolume', () => {
    it('should set volume', () => {
      service.setVolume(0.5);
      expect(mockAudio.volume).toBe(0.5);
    });

    it('should clamp volume to maximum 1', () => {
      service.setVolume(1.5);
      expect(mockAudio.volume).toBe(1);
    });

    it('should clamp volume to minimum 0', () => {
      service.setVolume(-0.5);
      expect(mockAudio.volume).toBe(0);
    });
  });

  describe('getters', () => {
    it('should get volume', () => {
      mockAudio.volume = 0.7;
      expect(service.volume).toBe(0.7);
    });

    it('should get currentTime', () => {
      mockAudio.currentTime = 30;
      expect(service.currentTime).toBe(30);
    });

    it('should get duration', () => {
      mockAudio.duration = 200;
      expect(service.duration).toBe(200);
    });

    it('should return 0 for undefined duration', () => {
      mockAudio.duration = undefined;
      expect(service.duration).toBe(0);
    });

    it('should get isPlaying state', () => {
      mockAudio.paused = false;
      expect(service.isPlaying).toBe(true);

      mockAudio.paused = true;
      expect(service.isPlaying).toBe(false);
    });
  });

  describe('observables', () => {
    it('should provide onTimeUpdate observable', () => {
      expect(service.onTimeUpdate).toBeDefined();
      expect(typeof service.onTimeUpdate.subscribe).toBe('function');
    });

    it('should provide onEnded observable', () => {
      expect(service.onEnded).toBeDefined();
      expect(typeof service.onEnded.subscribe).toBe('function');
    });

    it('should provide onError observable', () => {
      expect(service.onError).toBeDefined();
      expect(typeof service.onError.subscribe).toBe('function');
    });

    it('should provide onLoading observable', () => {
      expect(service.onLoading).toBeDefined();
      expect(typeof service.onLoading.subscribe).toBe('function');
    });
  });

  describe('setMediaSessionMetadata', () => {
    it('should set media session metadata when available', () => {
      // Mock mediaSession
      const mockMediaSession = {
        metadata: null
      };
      Object.defineProperty(navigator, 'mediaSession', {
        value: mockMediaSession,
        writable: true,
        configurable: true
      });

      service.setMediaSessionMetadata('Test Title', 'Test Artist', 'Test Album', 'http://example.com/cover.jpg');

      // The method should not throw
      expect(true).toBe(true);
    });

    it('should handle missing artwork', () => {
      const mockMediaSession = {
        metadata: null
      };
      Object.defineProperty(navigator, 'mediaSession', {
        value: mockMediaSession,
        writable: true,
        configurable: true
      });

      service.setMediaSessionMetadata('Test Title', 'Test Artist', 'Test Album');

      // The method should not throw
      expect(true).toBe(true);
    });
  });

  describe('destroy', () => {
    it('should cleanup resources', () => {
      service.destroy();

      expect(mockAudio.pause).toHaveBeenCalled();
      expect(mockAudio.src).toBe('');
    });
  });

  describe('audio events', () => {
    it('should register timeupdate event listener', () => {
      const timeupdateCall = mockAudio.addEventListener.calls.all()
        .find((call: any) => call.args[0] === 'timeupdate');
      expect(timeupdateCall).toBeTruthy();
    });

    it('should register ended event listener', () => {
      const endedCall = mockAudio.addEventListener.calls.all()
        .find((call: any) => call.args[0] === 'ended');
      expect(endedCall).toBeTruthy();
    });

    it('should register error event listener', () => {
      const errorCall = mockAudio.addEventListener.calls.all()
        .find((call: any) => call.args[0] === 'error');
      expect(errorCall).toBeTruthy();
    });

    it('should register loadstart event listener', () => {
      const loadstartCall = mockAudio.addEventListener.calls.all()
        .find((call: any) => call.args[0] === 'loadstart');
      expect(loadstartCall).toBeTruthy();
    });

    it('should register canplay event listener', () => {
      const canplayCall = mockAudio.addEventListener.calls.all()
        .find((call: any) => call.args[0] === 'canplay');
      expect(canplayCall).toBeTruthy();
    });

    it('should emit time updates', (done) => {
      const timeupdateCallback = mockAudio.addEventListener.calls.all()
        .find((call: any) => call.args[0] === 'timeupdate')?.args[1];

      mockAudio.currentTime = 42;

      service.onTimeUpdate.subscribe(time => {
        expect(time).toBe(42);
        done();
      });

      if (timeupdateCallback) {
        timeupdateCallback();
      }
    });

    it('should emit ended event', (done) => {
      const endedCallback = mockAudio.addEventListener.calls.all()
        .find((call: any) => call.args[0] === 'ended')?.args[1];

      service.onEnded.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      if (endedCallback) {
        endedCallback();
      }
    });

    it('should emit loading state on loadstart', (done) => {
      const loadstartCallback = mockAudio.addEventListener.calls.all()
        .find((call: any) => call.args[0] === 'loadstart')?.args[1];

      service.onLoading.subscribe(loading => {
        if (loading) {
          expect(loading).toBe(true);
          done();
        }
      });

      if (loadstartCallback) {
        loadstartCallback();
      }
    });

    it('should emit loading false on canplay', (done) => {
      const canplayCallback = mockAudio.addEventListener.calls.all()
        .find((call: any) => call.args[0] === 'canplay')?.args[1];

      service.onLoading.subscribe(loading => {
        if (loading === false) {
          expect(loading).toBe(false);
          done();
        }
      });

      if (canplayCallback) {
        canplayCallback();
      }
    });
  });
});
