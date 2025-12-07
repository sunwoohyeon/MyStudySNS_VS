// src/app/layout.tsx
import "./globals.css";
import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SimpleHeader from "@/component/SimpleHeader";
import ThemeProvider from "@/component/ThemeProvider";
import AuthGuard from "@/component/AuthGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My Study SNS",
  description: "스터디 커뮤니티",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-100`}
      >
        {/* ThemeProvider는 props 없이 사용해야 TypeScript 오류 없음 */}
        <ThemeProvider>
          <AuthGuard />
          <SimpleHeader />

          <div className="pt-2 w-full">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
