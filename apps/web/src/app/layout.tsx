import type { Metadata } from "next";
import { Rethink_Sans, Hedvig_Letters_Serif } from "next/font/google";
import "./globals.css";

const rethinkSans = Rethink_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const hedvigLetters = Hedvig_Letters_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Sheila",
  description: "Australian visa application case manager",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${rethinkSans.variable} ${hedvigLetters.variable} min-h-screen font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
