import type { Artist } from "@/types/artist";
import type { Track } from "@/types/track";

import { normalizeTitle } from "@/lib/game/normalization";

let cachedToken: {
  accessToken: string;
  expiresAt: number;
} | null = null;

async function getSpotifyAccessToken(): Promise<string> {
  if (
    cachedToken &&
    cachedToken.expiresAt > Date.now()
  ) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  console.log(
    "Spotify Client ID exists:",
    Boolean(clientId)
  );

  console.log(
    "Spotify Client Secret exists:",
    Boolean(clientSecret)
  );

  if (!clientId || !clientSecret) {
    throw new Error(
      "Spotify environment variables are missing."
    );
  }

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",

      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type":
          "application/x-www-form-urlencoded",
      },

      body: "grant_type=client_credentials",

      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Spotify authentication failed: ${errorText}`
    );
  }

  const data = await response.json();

  cachedToken = {
    accessToken: data.access_token,
    expiresAt:
      Date.now() +
      (data.expires_in - 60) * 1000,
  };

  return cachedToken.accessToken;
}

async function spotifyRequest<T>(
  endpoint: string
): Promise<T> {
  const token = await getSpotifyAccessToken();

  const response = await fetch(
    `https://api.spotify.com/v1${endpoint}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },

      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Spotify API error: ${response.status} ${errorText}`
    );
  }

  return response.json();
}


export async function searchSpotifyArtists(
  query: string
): Promise<Artist[]> {
  const encodedQuery =
    encodeURIComponent(query);

  const data = await spotifyRequest<any>(
    `/search?q=${encodedQuery}&type=artist&limit=10`
  );

  return data.artists.items.map(
    (artist: any): Artist => ({
      id: artist.id,

      spotifyArtistId: artist.id,

      name: artist.name,

      imageUrl:
        artist.images?.[0]?.url ?? null,
    })
  );
}


export async function getSpotifyArtistTracks(
  spotifyArtistId: string
): Promise<Track[]> {
  const encodedId =
    encodeURIComponent(spotifyArtistId);

  const data = await spotifyRequest<any>(
    `/artists/${encodedId}/top-tracks?market=US`
  );

  const tracks: Track[] =
    data.tracks.map(
      (track: any): Track => ({
        id: track.id,

        spotifyTrackId: track.id,

        artistId: spotifyArtistId,

        title: track.name,

        normalizedTitle:
          normalizeTitle(track.name),

        albumName:
          track.album?.name ?? null,

        albumArt:
          track.album?.images?.[0]?.url ?? null,

        previewUrl:
          track.preview_url ?? null,
      })
    );

  return tracks;
}