export interface Track {
  id?: number;
  title: string;
  trackNumber: number;
  duration: number; // seconds
}

export interface TrackInput {
  title: string;
  trackNumber: number;
  duration: number; // seconds
}
