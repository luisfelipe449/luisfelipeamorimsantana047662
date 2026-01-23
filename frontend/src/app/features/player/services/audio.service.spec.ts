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
      play: jasmine.createSpy('play').and.returnValue(Promise.resolve()),
      pause: jasmine.createSpy('pause'),
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
      load: jasmine.createSpy('load')
    };

    spyOn(window as any, 'Audio').and.returnValue(mockAudio);

    TestBed.configureTestingModule({
      providers: [AudioService]
    });

    service = TestBed.inject(AudioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadTrack', () => {
    it('should load a new track', () => {
      const url = 'http://example.com/track.mp3';
      service.loadTrack(url);

      expect(mockAudio.src).toBe(url);
      expect(mockAudio.load).toHaveBeenCalled();
    });

    it('should pause current track before loading new one', () => {
      mockAudio.paused = false;
      const url = 'http://example.com/track.mp3';

      service.loadTrack(url);

      expect(mockAudio.pause).toHaveBeenCalled();
      expect(mockAudio.src).toBe(url);
    });

    it('should emit loading state', (done) => {
      service.getLoadingState().subscribe(loading => {
        if (loading) {
          expect(loading).toBe(true);
          done();
        }
      });

      service.loadTrack('http://example.com/track.mp3');
    });
  });

  describe('play', () => {
    it('should play the audio', async () => {
      await service.play();
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it('should emit playing state', (done) => {
      service.getPlayingState().subscribe(playing => {
        if (playing) {
          expect(playing).toBe(true);
          done();
        }
      });

      service.play();
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

    it('should emit paused state', (done) => {
      // First make it playing
      mockAudio.paused = false;
      service.play();

      service.getPlayingState().subscribe(playing => {
        if (!playing) {
          expect(playing).toBe(false);
          done();
        }
      });

      mockAudio.paused = true;
      service.pause();
    });
  });

  describe('seek', () => {
    it('should seek to specific time', () => {
      service.seek(50);
      expect(mockAudio.currentTime).toBe(50);
    });

    it('should emit current time', (done) => {
      service.getCurrentTime().subscribe(time => {
        if (time === 50) {
          expect(time).toBe(50);
          done();
        }
      });

      service.seek(50);
    });

    it('should not seek beyond duration', () => {
      mockAudio.duration = 100;
      service.seek(150);
      expect(mockAudio.currentTime).toBe(100);
    });

    it('should not seek to negative values', () => {
      service.seek(-10);
      expect(mockAudio.currentTime).toBe(0);
    });
  });

  describe('setVolume', () => {
    it('should set volume', () => {
      service.setVolume(0.5);
      expect(mockAudio.volume).toBe(0.5);
    });

    it('should emit volume change', (done) => {
      service.getVolume().subscribe(volume => {
        if (volume === 0.5) {
          expect(volume).toBe(0.5);
          done();
        }
      });

      service.setVolume(0.5);
    });

    it('should clamp volume to 0-1 range', () => {
      service.setVolume(1.5);
      expect(mockAudio.volume).toBe(1);

      service.setVolume(-0.5);
      expect(mockAudio.volume).toBe(0);
    });
  });

  describe('togglePlayPause', () => {
    it('should play when paused', async () => {
      mockAudio.paused = true;
      await service.togglePlayPause();
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it('should pause when playing', async () => {
      mockAudio.paused = false;
      await service.togglePlayPause();
      expect(mockAudio.pause).toHaveBeenCalled();
    });
  });

  describe('getters', () => {
    it('should get current time observable', (done) => {
      service.getCurrentTime().subscribe(time => {
        expect(time).toBe(0);
        done();
      });
    });

    it('should get duration observable', (done) => {
      service.getDuration().subscribe(duration => {
        expect(duration).toBe(0);
        done();
      });
    });

    it('should get playing state observable', (done) => {
      service.getPlayingState().subscribe(playing => {
        expect(playing).toBe(false);
        done();
      });
    });

    it('should get loading state observable', (done) => {
      service.getLoadingState().subscribe(loading => {
        expect(loading).toBe(false);
        done();
      });
    });

    it('should get volume observable', (done) => {
      service.getVolume().subscribe(volume => {
        expect(volume).toBe(1);
        done();
      });
    });

    it('should get error observable', (done) => {
      service.getError().subscribe(error => {
        expect(error).toBeNull();
        done();
      });
    });
  });

  describe('audio events', () => {
    it('should handle loadedmetadata event', () => {
      const callback = mockAudio.addEventListener.calls.argsFor(0)[1];
      mockAudio.duration = 200;

      callback();

      service.getDuration().subscribe(duration => {
        expect(duration).toBe(200);
      });
    });

    it('should handle timeupdate event', () => {
      const callback = mockAudio.addEventListener.calls.argsFor(1)[1];
      mockAudio.currentTime = 50;

      callback();

      service.getCurrentTime().subscribe(time => {
        expect(time).toBe(50);
      });
    });

    it('should handle ended event', () => {
      const callback = mockAudio.addEventListener.calls.argsFor(2)[1];
      mockAudio.paused = true;
      mockAudio.ended = true;

      callback();

      service.getPlayingState().subscribe(playing => {
        expect(playing).toBe(false);
      });
    });

    it('should handle error event', () => {
      const callback = mockAudio.addEventListener.calls.argsFor(3)[1];
      const errorEvent = {
        error: {
          code: 4,
          message: 'MEDIA_ERR_SRC_NOT_SUPPORTED'
        }
      };

      callback(errorEvent);

      service.getError().subscribe(error => {
        expect(error).toBeDefined();
      });
    });

    it('should handle canplay event', () => {
      const callback = mockAudio.addEventListener.calls.argsFor(4)[1];

      callback();

      service.getLoadingState().subscribe(loading => {
        expect(loading).toBe(false);
      });
    });

    it('should handle waiting event', () => {
      const callback = mockAudio.addEventListener.calls.argsFor(5)[1];

      callback();

      service.getLoadingState().subscribe(loading => {
        expect(loading).toBe(true);
      });
    });
  });

  describe('destroy', () => {
    it('should cleanup resources', () => {
      service.destroy();

      expect(mockAudio.pause).toHaveBeenCalled();
      expect(mockAudio.removeEventListener).toHaveBeenCalledTimes(6);
      expect(mockAudio.src).toBe('');
    });

    it('should complete all subjects', () => {
      const completeSpy = jasmine.createSpy('complete');

      service.getCurrentTime().subscribe({
        complete: completeSpy
      });

      service.destroy();

      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('formatTime', () => {
    it('should format seconds to mm:ss', () => {
      expect(service.formatTime(0)).toBe('0:00');
      expect(service.formatTime(59)).toBe('0:59');
      expect(service.formatTime(60)).toBe('1:00');
      expect(service.formatTime(125)).toBe('2:05');
      expect(service.formatTime(3661)).toBe('61:01');
    });

    it('should handle null/undefined', () => {
      expect(service.formatTime(null as any)).toBe('0:00');
      expect(service.formatTime(undefined as any)).toBe('0:00');
    });

    it('should handle negative values', () => {
      expect(service.formatTime(-10)).toBe('0:00');
    });
  });

  describe('error handling', () => {
    it('should emit error when audio fails to load', () => {
      const callback = mockAudio.addEventListener.calls.argsFor(3)[1];
      const error = new Error('Failed to load audio');

      callback({ error });

      service.getError().subscribe(err => {
        expect(err).toBe(error);
      });
    });

    it('should reset error on successful load', () => {
      // First set an error
      const errorCallback = mockAudio.addEventListener.calls.argsFor(3)[1];
      errorCallback({ error: new Error('Test error') });

      // Then load successfully
      service.loadTrack('http://example.com/track.mp3');

      service.getError().subscribe(error => {
        expect(error).toBeNull();
      });
    });
  });
});