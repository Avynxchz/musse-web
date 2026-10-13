import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "musse — Latihan TKA",
  description: "Latihan TKA dengan AI. Santai latihan di sini, siap tempur.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
