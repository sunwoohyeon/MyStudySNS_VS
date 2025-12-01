// src/app/layout.tsx (최종 수정)
import "./globals.css";
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
    // HTML 태그에서 배경/텍스트 클래스를 제거하거나 최소화합니다.
    <html lang="ko" suppressHydrationWarning> 
      {/* ★ 최종 수정: body에 min-h-screen과 다크 모드 배경색을 직접 지정합니다. */}
      <body className={`${inter.className} min-h-screen bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-100`}> 
        <ThemeProvider>
          <AuthGuard />
          <SimpleHeader />
          <div className="pt-16">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}