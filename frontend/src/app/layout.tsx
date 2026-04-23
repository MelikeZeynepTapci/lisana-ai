import type { Metadata } from "next";
import { Space_Grotesk, Lora } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const canela = localFont({
  src: "../../public/fonts/Canela-Regular-Trial.otf",
  variable: "--font-lexend",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ["600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lisana.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Lisana — AI Language Tutor for Expats and International Students",
    template: "%s | Lisana",
  },
  description:
    "Practice real conversations with Maya, your personal AI language coach. Learn German, Spanish, French, Italian, or English. No credit card needed. All levels, all locations.",
  keywords: [
    "AI language tutor",
    "learn German online",
    "learn Spanish online",
    "language learning for expats",
    "AI speaking practice",
    "CEFR language app",
    "expat language app",
    "Maya AI tutor",
    "Lisana language app",
  ],
  openGraph: {
    type: "website",
    siteName: "Lisana",
    title: "Lisana — AI Language Tutor for Expats and International Students",
    description:
      "Maya is your personal AI language coach. Real conversations, long-term memory, pronunciation feedback — built for expats and international students.",
    url: siteUrl,
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Lisana — AI Language Tutor for Expats",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lisana — AI Language Tutor for Expats and International Students",
    description:
      "Practice real conversations with Maya, your personal AI language coach. Learn German, Spanish, French, Italian, or English.",
    images: ["/og-default.png"],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${canela.variable} ${spaceGrotesk.variable} ${lora.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className="bg-background text-on-surface font-manrope antialiased">
        {children}
      </body>
    </html>
  );
}
