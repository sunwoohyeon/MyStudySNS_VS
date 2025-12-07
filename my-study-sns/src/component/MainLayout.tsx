// src/component/MainLayout.tsx
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">

      {/* 헤더 아래 여백 늘어나는 문제 → flex 정렬 제거 */}
      <main className="w-full flex-1 text-gray-900 dark:text-gray-100">
        {children}
      </main>

    </div>
  );
}
