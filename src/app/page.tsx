"use client";

import { useRouter } from "next/navigation";

import ArtistSearch from "@/components/ArtistSearch";

import type { Artist } from "@/types/artist";


export default function Home() {
  const router =
    useRouter();


  function handleArtistSelect(
    artist: Artist
  ) {
    router.push(
      `/play?artist=${artist.id}`
    );
  }


  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6">

        <div className="mb-10 text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            Guess the Song
          </h1>

          <p className="mt-4 text-lg text-gray-500">
            Choose an artist and test
            how well you know their songs.
          </p>
        </div>

        <ArtistSearch
          onSelect={
            handleArtistSelect
          }
        />

      </div>
    </main>
  );
}