"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import StudyTimer from "@/component/StudyTimer";
import Link from "next/link";
import { FiUsers, FiCalendar, FiTrendingUp } from "react-icons/fi";

export default function StudyPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [studyingCount, setStudyingCount] = useState(0);

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

  // 현재 공부 중인 사용자 수 조회
  useEffect(() => {
    const fetchStudyingCount = async () => {
      try {
        const res = await fetch("/api/study/live");
        if (res.ok) {
          const data = await res.json();
          setStudyingCount(data.total_count || 0);
        }
      } catch (error) {
        console.error("Failed to fetch studying count:", error);
      }
    };

    fetchStudyingCount();
    const interval = setInterval(fetchStudyingCount, 30000); // 30초마다 갱신
    return () => clearInterval(interval);
  }, []);

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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            공부하기
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            타이머를 시작하고 집중해서 공부하세요
          </p>
        </div>

        {/* 타이머 */}
        <StudyTimer />

        {/* 네비게이션 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          {/* 실시간 현황 */}
          <Link
            href="/study/live"
            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
          >
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <FiUsers className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 dark:text-white">실시간 현황</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {studyingCount > 0 ? (
                  <span className="text-green-500 font-semibold">{studyingCount}명</span>
                ) : (
                  <span>0명</span>
                )}
                {" "}공부 중
              </p>
            </div>
            <div className="text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* 공부 캘린더 */}
          <Link
            href="/study/calendar"
            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <FiCalendar className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 dark:text-white">공부 캘린더</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                나의 공부 기록 확인
              </p>
            </div>
            <div className="text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* 팁 */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <FiTrendingUp className="text-blue-500 mt-1" size={20} />
            <div>
              <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-1">공부 팁</h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                50분 공부 후 10분 휴식하는 포모도로 기법을 활용해보세요.
                중간에 쉬었다 이어서 공부해도 시간이 누적됩니다!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
