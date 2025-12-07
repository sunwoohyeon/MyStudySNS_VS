// src/app/layout.tsx
import "./globals.css";
import "katex/dist/katex.min.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import SimpleHeader from "@/component/SimpleHeader";
import ThemeProvider from "@/component/ThemeProvider";
import AuthGuard from "@/component/AuthGuard";

const inter = Inter({ subsets: ["latin"] });

// PWA Viewport 설정
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3B82F6" },
    { media: "(prefers-color-scheme: dark)", color: "#1F2937" },
  ],
};

// PWA Metadata 설정
export const metadata: Metadata = {
  title: "My Study SNS",
  description: "스터디 커뮤니티 - 함께 공부하고 성장하세요",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "My Study SNS",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  applicationName: "My Study SNS",
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* iOS Safari PWA 추가 메타태그 */}
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
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
