import type { Metadata } from "next";
import { Libre_Baskerville } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";

const baskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-baskerville',
});

export const metadata: Metadata = {
  title: "studytracker",
  description: " a studytracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${baskerville.variable} font-serif antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
