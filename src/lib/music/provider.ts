export type Artist = {
  id: string;
  name: string;
  imageUrl?: string;
};

export type Track = {
  id: string;
  spotifyTrackId?: string;
  title: string;
  artistId: string;
  artistName: string;
  albumName?: string;
  albumArt?: string;
  previewUrl?: string;
};

export interface MusicMetadataProvider {
  searchArtists(query: string): Promise<Artist[]>;
  getArtistTracks(artistId: string): Promise<Track[]>;
}