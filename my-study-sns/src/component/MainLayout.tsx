// src/component/MainLayout.tsx
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    // 배경색 흰색으로 변경 (사진 기준)
    <div className="bg-white min-h-screen flex flex-col">
      {/* 헤더는 layout.tsx에서 전역으로 불러오므로 여기서는 내용물 정렬만 담당 */}
      <main className="w-full flex-1 flex items-start justify-center">
        {children}
      </main>
    </div>
  );
}