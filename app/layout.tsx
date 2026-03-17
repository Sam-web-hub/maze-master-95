import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maze Master 95",
  description: "A retro Windows 95-style maze game",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
