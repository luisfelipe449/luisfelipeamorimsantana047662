export interface Track {
  id?: number;
  title: string;
  trackNumber: number;
  duration: number; // seconds
  audioKey?: string;
  audioFormat?: string;
  bitrate?: number;
  fileSize?: number;
}

export interface TrackDTO extends Track {
  streamUrl?: string;
  coverUrl?: string;
  artistName?: string;
  albumTitle?: string;
}

export interface TrackInput {
  title: string;
  trackNumber: number;
  duration: number; // seconds
}
