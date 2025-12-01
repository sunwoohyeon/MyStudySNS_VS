// src/component/LogoutButton.tsx
"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { FiLogOut } from "react-icons/fi"; // 아이콘 임포트

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    window.location.href = "/"; // 확실한 이동을 위해 window 사용
  };

  return (
    <button
      onClick={handleLogout}
      className="text-gray-600 hover:text-red-500 transition-colors p-1"
      title="로그아웃"
    >
      {/* 나가기 아이콘 (크기 24px) */}
      <FiLogOut size={24} />
    </button>
  );
}