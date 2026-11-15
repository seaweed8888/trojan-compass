import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trojan Compass",
  description: "Find your way to classrooms, clubs, and events at USC.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <header>
          <Link href="/" className="brand">Trojan Compass</Link>
          <nav aria-label="Main navigation">
            <Link href="/map">Building map</Link>
            <Link href="/events">Events</Link>
          </nav>
        </header>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
