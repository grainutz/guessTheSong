import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import type { GameOption } from "@/types/game";


function shuffle<T>(
  array: T[]
): T[] {
  return [...array].sort(
    () => Math.random() - 0.5
  );
}


export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const artistId =
      body.artistId;

    if (!artistId) {
      return NextResponse.json(
        {
          error:
            "artistId is required.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      await createClient();

    // Get artist
    const {
      data: artist,
      error: artistError,
    } = await supabase
      .from("artists")
      .select("*")
      .eq("id", artistId)
      .single();

    if (
      artistError ||
      !artist
    ) {
      return NextResponse.json(
        {
          error:
            "Artist not found.",
        },
        {
          status: 404,
        }
      );
    }

    // Get tracks
    const {
      data: tracks,
      error: tracksError,
    } = await supabase
      .from("tracks")
      .select("*")
      .eq("artist_id", artistId);

    if (
      tracksError
    ) {
      throw tracksError;
    }

    if (
      !tracks ||
      tracks.length < 4
    ) {
      return NextResponse.json(
        {
          error:
            "Not enough songs for this artist.",
        },
        {
          status: 400,
        }
      );
    }

    // Shuffle songs
    const shuffledTracks =
      shuffle(tracks);

    // Correct answer
    const correctTrack =
      shuffledTracks[0];

    // Three wrong answers
    const distractors =
      shuffledTracks
        .slice(1, 4);

    const options: GameOption[] =
      shuffle([
        {
          id: correctTrack.id,
          title: correctTrack.title,
        },

        ...distractors.map(
          (track) => ({
            id: track.id,
            title: track.title,
          })
        ),
      ]);

    // Create session
    const {
      data: session,
      error: sessionError,
    } = await supabase
      .from("game_sessions")
      .insert({
        artist_id: artistId,

        mode:
          "multiple-choice",

        score: 0,

        best_streak: 0,
      })
      .select()
      .single();

    if (
      sessionError ||
      !session
    ) {
      throw sessionError;
    }

    // Create round
    const {
      data: round,
      error: roundError,
    } = await supabase
      .from("rounds")
      .insert({
        session_id:
          session.id,

        track_id:
          correctTrack.id,

        question_number: 1,

        clip_length_ms: 5000,
      })
      .select()
      .single();

    if (
      roundError ||
      !round
    ) {
      throw roundError;
    }

    return NextResponse.json({
      sessionId:
        session.id,

      roundId:
        round.id,

      questionNumber: 1,

      artist: {
        id: artist.id,

        name: artist.name,

        imageUrl:
          artist.image_url,
      },

      audioUrl:
        correctTrack.preview_url,

      options,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to start game.",
      },
      {
        status: 500,
      }
    );
  }
}