import type { Track } from "@/types/track";

export interface AudioProvider {
  getPreviewUrl(
    track: Track
  ): Promise<string | null>;
}


/**
 * Temporary provider.
 *
 * Spotify preview_url may be null/deprecated,
 * so we keep audio separate from Spotify metadata.
 */
export const spotifyAudioProvider: AudioProvider = {
  async getPreviewUrl(track) {
    return track.previewUrl;
  },
};