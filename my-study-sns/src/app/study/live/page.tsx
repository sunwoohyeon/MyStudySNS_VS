"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import StudyLiveList from "@/component/StudyLiveList";
import Link from "next/link";
import { FiArrowLeft, FiUsers } from "react-icons/fi";

export default function StudyLivePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setIsLoggedIn(true);
    };
    checkAuth();
  }, [supabase, router]);

  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-6">
          <Link
            href="/study"
            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
          >
            <FiArrowLeft size={20} />
            돌아가기
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <FiUsers className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                실시간 공부 현황
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                지금 공부하고 있는 사람들을 확인하세요
              </p>
            </div>
          </div>
        </div>

        {/* 실시간 목록 */}
        <StudyLiveList refreshInterval={15000} />

        {/* 안내 */}
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            사용자 이름을 클릭하면 프로필을 확인할 수 있습니다.
            <br />
            15초마다 자동으로 새로고침됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
