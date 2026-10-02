export interface Track {
  id: string;
  spotifyTrackId: string;
  artistId: string;

  title: string;
  normalizedTitle: string;

  albumName: string | null;
  albumArt: string | null;

  previewUrl: string | null;
}