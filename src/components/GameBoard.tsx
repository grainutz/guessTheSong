"use client";

import { useState } from "react";

import AudioPlayer from "./AudioPlayer";

import type {
  GameRound,
  AnswerResult,
} from "@/types/game";


interface GameBoardProps {
  initialRound: GameRound;
  artistName: string;
}


export default function GameBoard({
  initialRound,
  artistName,
}: GameBoardProps) {
  const [round, setRound] =
    useState(initialRound);

  const [score, setScore] =
    useState(0);

  const [streak, setStreak] =
    useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(
      null
    );

  const [result, setResult] =
    useState<AnswerResult | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);


  async function submitAnswer(
    answerId: string
  ) {
    if (
      loading ||
      selectedAnswer
    ) {
      return;
    }

    setSelectedAnswer(
      answerId
    );

    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/game/answer",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              sessionId:
                round.sessionId,

              roundId:
                round.roundId,

              answerId,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error
        );
      }

      setResult(data);

      setScore(
        data.score
      );

      setStreak(
        data.streak
      );

    } catch (error) {
      console.error(error);

      setSelectedAnswer(null);

    } finally {
      setLoading(false);
    }
  }


  function nextQuestion() {
    if (
      !result?.nextRound
    ) {
      return;
    }

    setRound(
      result.nextRound
    );

    setSelectedAnswer(
      null
    );

    setResult(null);
  }


  return (
    <div className="mx-auto w-full max-w-3xl">

      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Artist
          </p>

          <h1 className="text-2xl font-bold">
            {artistName}
          </h1>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-500">
            Score
          </p>

          <p className="text-2xl font-bold">
            {score}
          </p>

          <p className="text-sm">
            🔥 {streak}
          </p>
        </div>
      </div>


      <div className="mb-8 rounded-2xl border p-8">

        <div className="mb-6 text-center">
          <p className="text-sm text-gray-500">
            Question{" "}
            {round.questionNumber}
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            What song is this?
          </h2>
        </div>


        <AudioPlayer
          src={
            round.audioUrl
          }
        />

      </div>


      <div className="grid gap-3">

        {round.options.map(
          (option) => {

            const isSelected =
              selectedAnswer ===
              option.id;

            return (
              <button
                key={option.id}
                disabled={
                  loading ||
                  selectedAnswer !== null
                }
                onClick={() =>
                  submitAnswer(
                    option.id
                  )
                }
                className={`rounded-xl border p-4 text-left font-medium transition ${
                  isSelected
                    ? "bg-gray-200"
                    : "hover:bg-gray-50"
                }`}
              >
                {option.title}
              </button>
            );
          }
        )}

      </div>


      {result && (
        <div className="mt-6 rounded-xl border p-6">

          <h3 className="text-xl font-bold">
            {result.correct
              ? "Correct! 🎉"
              : "Not quite!"}
          </h3>

          <p className="mt-2">
            Correct answer:{" "}
            <strong>
              {result.correctAnswer}
            </strong>
          </p>

          <p className="mt-2">
            +{result.points} points
          </p>

          {result.nextRound && (
            <button
              onClick={
                nextQuestion
              }
              className="mt-5 rounded-lg bg-black px-5 py-3 text-white"
            >
              Next Song
            </button>
          )}

        </div>
      )}

    </div>
  );
}