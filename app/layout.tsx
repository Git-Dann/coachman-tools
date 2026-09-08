import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

/**
 * Fraunces at light weight, for everything that is said rather than labelled.
 *
 * This is the single biggest thing the page gets from Flaude: display type is a
 * light serif, not a heavy sans. A 300-weight serif at seventy points reads as
 * considered; the same words in an 800-weight sans read as a pitch deck.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  // Variable, so the whole light-to-regular range is available from one file.
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

/** Reading, and the interface. Inter, because Gitwork's own site runs on it. */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-v",
  display: "swap",
});

/** Numbers, codes, labels and system vocabulary. */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-v",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coachman Order Flow · Gitwork",
  description:
    "How an order gets from a dealer to an invoice, and what we would build instead. Gitwork for Coachman, FY26/27.",
  /* Contains a client's operational detail and named staff. */
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  themeColor: "#F6F4EE",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-GB"
      className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/*
          * The theme has to be on the element before first paint, or the page
          * flashes the wrong one. It is a preference read from storage, so it
          * cannot come from the server.
          */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
