import type { Metadata } from "next";
import { Roboto_Slab } from "next/font/google";
import { type ReactElement, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import "./globals.css";

const robotoSlabFont = Roboto_Slab({
  weight: ["300", "400", "600"],
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
          robotoSlabFont.className,
          "min-h-full bg-primary-light bg-fixed text-text",
        )}
      >
        {children}
      </body>
    </html>
  );
}
