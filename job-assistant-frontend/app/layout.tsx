import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job Application Assistant",
  description: "Générez vos lettres de motivation et préparez vos candidatures.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-100">
        <header className="bg-white border-b-2 border-gray-300">
          <nav className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
            <Link href="/" className="text-lg font-extrabold text-black">
              Job Application Assistant
            </Link>
            <div className="flex gap-5">
              <Link href="/" className="font-bold text-black hover:text-blue-700">
                Assistant
              </Link>
              <Link
                href="/history"
                className="font-bold text-black hover:text-blue-700"
              >
                Historique
              </Link>
            </div>
          </nav>
        </header>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
