import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Press_Start_2P, Londrina_Outline } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Press Start 2P: cuma buat teks gede yang penting, jangan dipakai sembarangan
const pressStart = Press_Start_2P({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: ["400"],
});

// Londrina Outline: buat headline hero baris 1-2
const londrinaOutline = Londrina_Outline({
  variable: "--font-londrina",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "musse — Latihan TKA",
  description: "Latihan TKA dengan AI. Santai latihan di sini, siap tempur.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${jakartaSans.variable} ${spaceGrotesk.variable} ${pressStart.variable} ${londrinaOutline.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
