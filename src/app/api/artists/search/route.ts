import { NextRequest, NextResponse } from "next/server";

import {
  searchSpotifyArtists,
} from "@/lib/music/spotify";

import { createClient } from "@/lib/supabase/server";


export async function GET(
  request: NextRequest
) {
  try {
    const searchParams =
      request.nextUrl.searchParams;

    const query =
      searchParams.get("q")?.trim();

    if (!query) {
      return NextResponse.json(
        {
          error: "Search query is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (query.length < 2) {
      return NextResponse.json(
        {
          error:
            "Search must be at least 2 characters.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "Searching Spotify for:",
      query
    );

    const artists =
      await searchSpotifyArtists(query);

    console.log(
      "Spotify returned:",
      artists.length,
      "artists"
    );

    const supabase =
      await createClient();

    const rows = artists.map(
      (artist) => ({
        spotify_artist_id:
          artist.spotifyArtistId,

        name: artist.name,

        image_url:
          artist.imageUrl,
      })
    );

    if (rows.length > 0) {
      const { error } =
        await supabase
          .from("artists")
          .upsert(rows, {
            onConflict:
              "spotify_artist_id",
          });

      if (error) {
        console.error(
          "Supabase upsert error:",
          error
        );

        throw error;
      }
    }

    const { data, error } =
      await supabase
        .from("artists")
        .select("*")
        .in(
          "spotify_artist_id",
          artists.map(
            (artist) =>
              artist.spotifyArtistId
          )
        );

    if (error) {
      console.error(
        "Supabase select error:",
        error
      );

      throw error;
    }

    return NextResponse.json({
      artists: data,
    });

  } catch (error) {
    console.error(
      "ARTIST SEARCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}