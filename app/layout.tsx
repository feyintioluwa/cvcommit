import type { Metadata } from "next";

import { Manrope } from "next/font/google";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CVCommit",
    template: "%s | CVCommit",
  },
  description:
    "Check your CV, improve it with AI, and get it ready for your next opportunity.",
  applicationName: "CVCommit",
  keywords: [
    "CV analysis",
    "CV checker",
    "CV improvement",
    "resume analysis",
    "ATS CV",
    "AI CV",
    "career tools",
  ],
  authors: [
    {
      name: "Tioluwa Designs",
    },
  ],
  creator: "Tioluwa Designs",
  publisher: "Tioluwa Designs",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}