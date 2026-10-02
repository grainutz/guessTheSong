"use client";

import { useState } from "react";

import type { Artist } from "@/types/artist";

interface ArtistSearchProps {
  onSelect: (
    artist: Artist
  ) => void;
}

export default function ArtistSearch({
  onSelect,
}: ArtistSearchProps) {
  const [query, setQuery] =
    useState("");

  const [artists, setArtists] =
    useState<Artist[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  async function search() {
    if (
      query.trim().length < 2
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          `/api/artists/search?q=${encodeURIComponent(
            query
          )}`
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error
        );
      }

      setArtists(
        data.artists
      );

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Search failed."
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="w-full max-w-2xl">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter"
            ) {
              search();
            }
          }}
          placeholder="Search for an artist..."
          className="flex-1 rounded-lg border px-4 py-3"
        />

        <button
          onClick={search}
          disabled={loading}
          className="rounded-lg bg-black px-6 py-3 text-white disabled:opacity-50"
        >
          {loading
            ? "Searching..."
            : "Search"}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-red-500">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-3">
        {artists.map(
          (artist) => (
            <button
              key={artist.id}
              onClick={() =>
                onSelect(artist)
              }
              className="flex items-center gap-4 rounded-xl border p-4 text-left hover:bg-gray-50"
            >
              {artist.imageUrl ? (
                <img
                  src={
                    artist.imageUrl
                  }
                  alt={artist.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-200" />
              )}

              <div>
                <h3 className="font-semibold">
                  {artist.name}
                </h3>

                <p className="text-sm text-gray-500">
                  Spotify artist
                </p>
              </div>
            </button>
          )
        )}
      </div>
    </div>
  );
}