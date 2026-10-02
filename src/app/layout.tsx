import type { Metadata } from "next";

import "./globals.css";


export const metadata: Metadata = {
  title: "Guess the Song",
  description:
    "Guess songs from your favorite artists.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}