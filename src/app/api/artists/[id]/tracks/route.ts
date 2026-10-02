import { NextResponse } from "next/server";

import {
  getSpotifyArtistTracks,
} from "@/lib/music/spotify";

import { createClient } from "@/lib/supabase/server";


export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Artist ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      await createClient();

    // Get artist from database
    const { data: artist, error: artistError } =
      await supabase
        .from("artists")
        .select("*")
        .eq("id", id)
        .single();

    if (artistError || !artist) {
      return NextResponse.json(
        {
          error: "Artist not found.",
        },
        {
          status: 404,
        }
      );
    }

    // Check cache
    const {
      data: cachedTracks,
      error: cacheError,
    } = await supabase
      .from("tracks")
      .select("*")
      .eq("artist_id", id);

    if (
      cacheError
    ) {
      throw cacheError;
    }

    // Use cache if we already have tracks
    if (
      cachedTracks &&
      cachedTracks.length >= 5
    ) {
      return NextResponse.json({
        tracks: cachedTracks,
      });
    }

    // Otherwise request Spotify
    const spotifyTracks =
      await getSpotifyArtistTracks(
        artist.spotify_artist_id
      );

    const rows =
      spotifyTracks.map(
        (track) => ({
          artist_id: id,

          spotify_track_id:
            track.spotifyTrackId,

          title: track.title,

          normalized_title:
            track.normalizedTitle,

          album_name:
            track.albumName,

          album_art:
            track.albumArt,

          preview_url:
            track.previewUrl,
        })
      );

    if (rows.length > 0) {
      await supabase
        .from("tracks")
        .upsert(rows, {
          onConflict:
            "spotify_track_id",
        });
    }

    const {
      data: tracks,
      error: tracksError,
    } = await supabase
      .from("tracks")
      .select("*")
      .eq("artist_id", id);

    if (tracksError) {
      throw tracksError;
    }

    return NextResponse.json({
      tracks,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to load tracks.",
      },
      {
        status: 500,
      }
    );
  }
}