import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter, Newsreader } from "next/font/google";
import "./globals.css";

/**
 * Inter, because it is what Gitwork's own site runs on. Used across the whole
 * range: tight and heavy for the display type, plain for reading.
 */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

/** Numbers, codes, labels and system vocabulary. */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

/** The quotes from the call, and nothing else. */
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Coachman Order Flow · Gitwork",
    template: "%s",
  },
  description:
    "How an order gets from a dealer to an invoice, and what we would build instead. Gitwork for Coachman, FY26/27.",
  /* Contains a client's operational detail and named staff. */
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  themeColor: "#0B0C0F",
  colorScheme: "dark",
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
      className={`${inter.variable} ${plexMono.variable} ${newsreader.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
