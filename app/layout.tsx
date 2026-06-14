import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Nova — 80+ AI Tools in One Place",
  description:
    "A modern AI toolkit: writing, code, social, design, video, e-commerce and business tools — powered by Groq's free tier.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="relative min-h-screen">
          {/* ambient animated glow */}
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-[-12rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px] animate-blob-spin" />
          </div>
          <Header />
          <main className="mx-auto w-full max-w-6xl px-5 pb-24">{children}</main>
          <footer className="border-t border-white/5 py-8 text-center text-sm text-zinc-500">
            Built with Next.js + Claude · {new Date().getFullYear()}
          </footer>
        </div>
      </body>
    </html>
  );
}
