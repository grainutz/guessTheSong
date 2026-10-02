
"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import { useSearchParams } from "next/navigation";

import GameBoard from "@/components/GameBoard";

import type { GameRound } from "@/types/game";

interface StartGameResponse extends GameRound {
  artist: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
}

function PlayContent() {
  const searchParams = useSearchParams();

  const artistId = searchParams.get("artist");

  const [game, setGame] =
    useState<StartGameResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!artistId) {
      setError("No artist selected.");
      setLoading(false);
      return;
    }

    async function startGame() {
      try {
        // First ensure tracks exist
        const tracksResponse = await fetch(
          `/api/artists/${artistId}/tracks`
        );

        const tracksData = await tracksResponse.json();

        if (!tracksResponse.ok) {
          throw new Error(
            tracksData.error || "Failed to load tracks."
          );
        }

        // Start game
        const response = await fetch(
          "/api/game/start",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              artistId,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to start game."
          );
        }

        setGame(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to start game."
        );
      } finally {
        setLoading(false);
      }
    }

    startGame();
  }, [artistId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading game...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Something went wrong
          </h1>

          <p className="mt-2 text-red-500">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!game) {
    return null;
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <GameBoard
        initialRound={{
          roundId: game.roundId,
          sessionId: game.sessionId,
          questionNumber: game.questionNumber,
          audioUrl: game.audioUrl,
          options: game.options,
        }}
        artistName={game.artist.name}
      />
    </main>
  );
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p>Loading game...</p>
        </main>
      }
    >
      <PlayContent />
    </Suspense>
  );
}

