import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import {
  calculatePoints,
} from "@/lib/game/scoring";


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

    const sessionId =
      body.sessionId;

    const roundId =
      body.roundId;

    const answerId =
      body.answerId;

    if (
      !sessionId ||
      !roundId ||
      !answerId
    ) {
      return NextResponse.json(
        {
          error:
            "sessionId, roundId and answerId are required.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      await createClient();

    // Get round
    const {
      data: round,
      error: roundError,
    } = await supabase
      .from("rounds")
      .select(`
        *,
        tracks (
          id,
          title,
          preview_url
        )
      `)
      .eq("id", roundId)
      .eq("session_id", sessionId)
      .single();

    if (
      roundError ||
      !round
    ) {
      return NextResponse.json(
        {
          error:
            "Round not found.",
        },
        {
          status: 404,
        }
      );
    }

    // Prevent answering twice
    if (
      round.answered_at
    ) {
      return NextResponse.json(
        {
          error:
            "This round has already been answered.",
        },
        {
          status: 400,
        }
      );
    }

    const correct =
      answerId === round.track_id;

    // Get session
    const {
      data: session,
      error: sessionError,
    } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (
      sessionError ||
      !session
    ) {
      throw sessionError;
    }

    const previousStreak =
      session.best_streak ?? 0;

    const newStreak =
      correct
        ? previousStreak + 1
        : 0;

    const points =
      correct
        ? calculatePoints(
            previousStreak
          )
        : 0;

    const newScore =
      session.score + points;

    // Update round
    const {
      error: updateRoundError,
    } = await supabase
      .from("rounds")
      .update({
        answered_at:
          new Date().toISOString(),

        guess:
          answerId,

        is_correct:
          correct,

        points,
      })
      .eq("id", roundId);

    if (
      updateRoundError
    ) {
      throw updateRoundError;
    }

    // Update session
    const {
      error: updateSessionError,
    } = await supabase
      .from("game_sessions")
      .update({
        score:
          newScore,

        best_streak:
          newStreak,
      })
      .eq("id", sessionId);

    if (
      updateSessionError
    ) {
      throw updateSessionError;
    }

    // Get all tracks from same artist
    const {
      data: allTracks,
      error: allTracksError,
    } = await supabase
      .from("tracks")
      .select("*")
      .eq(
        "artist_id",
        session.artist_id
      );

    if (
      allTracksError
    ) {
      throw allTracksError;
    }

    if (
      !allTracks ||
      allTracks.length < 4
    ) {
      return NextResponse.json({
        correct,

        correctAnswer:
          round.tracks.title,

        points,

        score:
          newScore,

        streak:
          newStreak,

        nextRound:
          null,
      });
    }

    // Pick next song
    const shuffled =
      shuffle(
        allTracks.filter(
          (track) =>
            track.id !==
            round.track_id
        )
      );

    const nextTrack =
      shuffled[0];

    const distractors =
      shuffled.slice(1, 4);

    const options =
      shuffle([
        {
          id:
            nextTrack.id,

          title:
            nextTrack.title,
        },

        ...distractors.map(
          (track) => ({
            id:
              track.id,

            title:
              track.title,
          })
        ),
      ]);

    // Create next round
    const nextQuestionNumber =
      round.question_number + 1;

    const {
      data: nextRound,
      error: nextRoundError,
    } = await supabase
      .from("rounds")
      .insert({
        session_id:
          sessionId,

        track_id:
          nextTrack.id,

        question_number:
          nextQuestionNumber,

        clip_length_ms:
          5000,
      })
      .select()
      .single();

    if (
      nextRoundError ||
      !nextRound
    ) {
      throw nextRoundError;
    }

    return NextResponse.json({
      correct,

      correctAnswer:
        round.tracks.title,

      points,

      score:
        newScore,

      streak:
        newStreak,

      nextRound: {
        roundId:
          nextRound.id,

        sessionId,

        questionNumber:
          nextQuestionNumber,

        audioUrl:
          nextTrack.preview_url,

        options,
      },
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to submit answer.",
      },
      {
        status: 500,
      }
    );
  }
}