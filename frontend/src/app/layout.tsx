import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const canela = localFont({
  src: "../../public/fonts/Canela-Regular-Trial.otf",
  variable: "--font-lexend",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LinguaTutor — AI Language Tutor for Expats and International Students",
  description: "Practice real conversations with Maya, your personal AI language coach. No credit card needed. 5 languages, all levels.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${canela.variable} ${inter.variable}`}>
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
