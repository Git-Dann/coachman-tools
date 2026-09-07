import type { Metadata, Viewport } from "next";
import { Chivo, IBM_Plex_Mono, Newsreader } from "next/font/google";
import "./globals.css";

/** Headings and UI. */
const chivo = Chivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-chivo",
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
    default: "Coachman Order Flow",
    template: "%s",
  },
  description:
    "How an order gets from a dealer to an invoice, and what we would build instead. Gitwork Group, Coachman FY26/27.",
  /* Contains a client's operational detail and named staff. */
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  themeColor: "#0C1116",
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
      className={`${chivo.variable} ${plexMono.variable} ${newsreader.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
