import { TrackDTO } from '@features/albums/models/track.model';

export interface PlayerState {
  currentTrack: TrackDTO | null;
  playlist: TrackDTO[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  shuffleEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}

export enum RepeatMode {
  NONE = 'none',
  ONE = 'one',
  ALL = 'all'
}

export interface PlayerEvents {
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  playTrack: (track: TrackDTO, playlist?: TrackDTO[]) => void;
  playAlbum: (tracks: TrackDTO[], startIndex?: number) => void;
  clearPlaylist: () => void;
}