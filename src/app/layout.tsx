import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MusicSite - News, Events & Reviews",
  description: "Music news, events and concert reviews from Ireland and beyond.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
