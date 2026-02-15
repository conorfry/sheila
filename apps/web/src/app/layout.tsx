import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
