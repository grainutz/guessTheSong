"use client";

import {
  useEffect,
  useRef,
} from "react";

interface AudioPlayerProps {
  src: string | null;
  autoPlay?: boolean;
}

export default function AudioPlayer({
  src,
  autoPlay = false,
}: AudioPlayerProps) {
  const audioRef =
    useRef<HTMLAudioElement | null>(
      null
    );


  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.pause();

    audioRef.current.currentTime = 0;

    if (
      src &&
      autoPlay
    ) {
      audioRef.current
        .play()
        .catch(() => {
          // Browser may block autoplay.
        });
    }
  }, [src, autoPlay]);


  if (!src) {
    return (
      <div className="rounded-xl border p-6 text-center">
        <p className="font-medium">
          No playable preview is available
          for this track.
        </p>

        <p className="mt-2 text-sm text-gray-500">
          The audio provider needs to supply
          a preview for this song.
        </p>
      </div>
    );
  }


  return (
    <audio
      ref={audioRef}
      src={src}
      controls
      className="w-full"
    />
  );
}