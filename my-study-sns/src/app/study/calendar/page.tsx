"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import StudyCalendar from "@/component/StudyCalendar";
import Link from "next/link";
import { FiArrowLeft, FiCalendar } from "react-icons/fi";

export default function StudyCalendarPage() {
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
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <FiCalendar className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                공부 캘린더
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                나의 공부 기록을 확인하세요
              </p>
            </div>
          </div>
        </div>

        {/* 캘린더 */}
        <StudyCalendar />

        {/* 안내 */}
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <h4 className="font-bold text-green-800 dark:text-green-300 mb-2">색상 의미</h4>
          <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
            <li>연한 초록: 30분 미만</li>
            <li>중간 초록: 1~2시간</li>
            <li>진한 초록: 4시간 이상</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
