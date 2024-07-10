import type { Metadata } from "next";
import { Lato } from "next/font/google";
import { type ReactElement, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import "./globals.scss";

const latoFont = Lato({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MazeJS",
  description: "Animated maze generator and solver with stunning UI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactElement {
  return (
    <html lang="en">
      <body
        className={twMerge(
          latoFont.className,
          "min-h-full bg-blue-200 bg-gradient-to-b from-blue-100 to-blue-300 bg-fixed text-slate-900",
        )}
      >
        {children}
      </body>
    </html>
  );
}
