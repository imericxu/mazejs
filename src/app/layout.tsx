import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { type ReactElement, type ReactNode } from "react";
import "./globals.css";
import { twMerge } from "tailwind-merge";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactElement {
  return (
    <html lang="en">
      <body className={twMerge(inter.className, "min-h-full bg-zinc-200")}>
        {children}
      </body>
    </html>
  );
}
