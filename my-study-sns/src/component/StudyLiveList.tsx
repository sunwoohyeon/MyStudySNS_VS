"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { FiUser, FiBook, FiRefreshCw } from "react-icons/fi";

interface StudyingUser {
  user_id: string;
  username: string;
  school_name: string | null;
  major: string | null;
  session: {
    id: string;
    started_at: string;
    paused_at: string | null;
    accumulated_seconds: number;
    study_subject: string | null;
  };
}

// 초를 HH:MM:SS 형식으로 변환
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    secs.toString().padStart(2, "0"),
  ].join(":");
}

// 경과 시간 계산
function calculateElapsedSeconds(session: StudyingUser["session"]): number {
  const now = Date.now();
  const lastStartTime = session.paused_at
    ? new Date(session.paused_at).getTime()
    : new Date(session.started_at).getTime();
  const additionalSeconds = Math.floor((now - lastStartTime) / 1000);
  return session.accumulated_seconds + additionalSeconds;
}

interface StudyLiveItemProps {
  user: StudyingUser;
}

function StudyLiveItem({ user }: StudyLiveItemProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(
    calculateElapsedSeconds(user.session)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsedSeconds(user.session));
    }, 1000);
    return () => clearInterval(interval);
  }, [user.session]);

  return (
    <Link
      href={`/profile/${user.user_id}`}
      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
    >
      {/* 상태 표시 */}
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
      </div>

      {/* 사용자 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-800 dark:text-white truncate">
            {user.username}
          </h3>
          {user.school_name && (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.school_name}
            </span>
          )}
        </div>
        {user.session.study_subject && (
          <div className="flex items-center gap-1 mt-1 text-sm text-blue-600 dark:text-blue-400">
            <FiBook size={14} />
            <span className="truncate">{user.session.study_subject}</span>
          </div>
        )}
        {user.major && !user.session.study_subject && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {user.major}
          </p>
        )}
      </div>

      {/* 공부 시간 */}
      <div className="text-right flex-shrink-0">
        <p className="font-mono font-bold text-green-500 text-lg">
          {formatTime(elapsedSeconds)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">공부 중</p>
      </div>
    </Link>
  );
}

interface StudyLiveListProps {
  refreshInterval?: number; // ms
}

export default function StudyLiveList({ refreshInterval = 30000 }: StudyLiveListProps) {
  const supabase = createClientComponentClient();
  const [studyingUsers, setStudyingUsers] = useState<StudyingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStudyingUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/study/live");
      if (res.ok) {
        const data = await res.json();
        setStudyingUsers(data.studying_users || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch studying users:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    fetchStudyingUsers();
  }, [fetchStudyingUsers]);

  // 주기적 갱신
  useEffect(() => {
    const interval = setInterval(fetchStudyingUsers, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchStudyingUsers, refreshInterval]);

  // Supabase Realtime 구독 (선택적)
  useEffect(() => {
    const channel = supabase
      .channel("study-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "study_sessions",
        },
        () => {
          // 변경 감지 시 새로고침
          fetchStudyingUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchStudyingUsers]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-semibold">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {studyingUsers.length}명 공부 중
          </span>
        </div>
        <button
          onClick={fetchStudyingUsers}
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <FiRefreshCw size={14} />
          새로고침
        </button>
      </div>

      {/* 마지막 업데이트 시간 */}
      {lastUpdated && (
        <p className="text-xs text-gray-400 mb-4">
          마지막 업데이트: {lastUpdated.toLocaleTimeString("ko-KR")}
        </p>
      )}

      {/* 사용자 목록 */}
      {studyingUsers.length > 0 ? (
        <div className="space-y-3">
          {studyingUsers.map((user) => (
            <StudyLiveItem key={user.session.id} user={user} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FiUser size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            현재 공부 중인 사용자가 없습니다.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            첫 번째로 공부를 시작해보세요!
          </p>
        </div>
      )}
    </div>
  );
}
