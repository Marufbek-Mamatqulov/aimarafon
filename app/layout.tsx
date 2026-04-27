import type { Metadata } from "next";
import { Exo_2, Space_Grotesk } from "next/font/google";
import "./globals.css";

const headingFont = Exo_2({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700"],
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "aimarafon.uz | Bir haftada AI",
  description:
    "LMS platform for the 7-day AI skill marathon with participant tracking, grading, and analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className="dark">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} font-[var(--font-body)]`}
      >
        {children}
      </body>
    </html>
  );
}
