"use client";

import { useState, useEffect, useCallback } from "react";
import { FiChevronLeft, FiChevronRight, FiClock, FiCalendar, FiTrendingUp, FiAward } from "react-icons/fi";

interface StudyRecord {
  id: string;
  user_id: string;
  study_date: string;
  total_seconds: number;
  session_count: number;
}

interface Summary {
  total_days: number;
  total_seconds: number;
  average_seconds: number;
  longest_streak: number;
}

interface StudyCalendarProps {
  userId?: string; // 없으면 현재 로그인 사용자
  compact?: boolean;
}

// 초를 시:분 형식으로 변환
function formatHoursMinutes(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
}

// 공부 시간에 따른 색상 강도
function getIntensityColor(seconds: number): string {
  if (seconds === 0) return "bg-gray-100 dark:bg-gray-800";
  if (seconds < 1800) return "bg-green-200 dark:bg-green-900/40"; // 30분 미만
  if (seconds < 3600) return "bg-green-300 dark:bg-green-800/60"; // 1시간 미만
  if (seconds < 7200) return "bg-green-400 dark:bg-green-700/80"; // 2시간 미만
  if (seconds < 14400) return "bg-green-500 dark:bg-green-600"; // 4시간 미만
  return "bg-green-600 dark:bg-green-500"; // 4시간 이상
}

export default function StudyCalendar({ userId, compact = false }: StudyCalendarProps) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [records, setRecords] = useState<Map<string, StudyRecord>>(new Map());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = userId
        ? `/api/study/records/${userId}?year=${currentYear}&month=${currentMonth}`
        : `/api/study/records?year=${currentYear}&month=${currentMonth}`;

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        const recordMap = new Map<string, StudyRecord>();
        data.records?.forEach((r: StudyRecord) => {
          recordMap.set(r.study_date, r);
        });
        setRecords(recordMap);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Failed to fetch records:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentYear, currentMonth]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // 이전 달
  const goToPrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // 다음 달
  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 달력 날짜 계산
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  // 날짜 배열 생성
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  // 선택된 날짜의 기록
  const selectedRecord = selectedDate ? records.get(selectedDate) : null;

  if (isLoading && records.size === 0) {
    return (
      <div className={`${compact ? "p-4" : "p-6"} flex justify-center items-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl ${compact ? "p-4" : "p-6"} shadow-sm border border-gray-200 dark:border-gray-700`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <FiChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
        <h3 className="font-bold text-gray-800 dark:text-white">
          {currentYear}년 {currentMonth}월
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <FiChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`text-center text-xs font-semibold py-1 ${
              index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const record = records.get(dateStr);
          const isToday =
            day === new Date().getDate() &&
            currentMonth === new Date().getMonth() + 1 &&
            currentYear === new Date().getFullYear();
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition
                ${record ? getIntensityColor(record.total_seconds) : "bg-gray-50 dark:bg-gray-800/50"}
                ${isToday ? "ring-2 ring-blue-500" : ""}
                ${isSelected ? "ring-2 ring-indigo-500" : ""}
                hover:opacity-80
              `}
            >
              <span className={`${record ? "text-white dark:text-gray-100 font-semibold" : "text-gray-600 dark:text-gray-400"}`}>
                {day}
              </span>
            </button>
          );
        })}
      </div>

      {/* 선택된 날짜 상세 */}
      {selectedDate && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {selectedDate}
            </span>
            {selectedRecord ? (
              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                {formatHoursMinutes(selectedRecord.total_seconds)}
              </span>
            ) : (
              <span className="text-sm text-gray-400">기록 없음</span>
            )}
          </div>
          {selectedRecord && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {selectedRecord.session_count}회 세션
            </p>
          )}
        </div>
      )}

      {/* 범례 */}
      {!compact && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">공부 시간</p>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-400">적음</span>
            <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-900/40" />
            <div className="w-4 h-4 rounded bg-green-300 dark:bg-green-800/60" />
            <div className="w-4 h-4 rounded bg-green-400 dark:bg-green-700/80" />
            <div className="w-4 h-4 rounded bg-green-500 dark:bg-green-600" />
            <div className="w-4 h-4 rounded bg-green-600 dark:bg-green-500" />
            <span className="text-gray-400">많음</span>
          </div>
        </div>
      )}

      {/* 통계 요약 */}
      {!compact && summary && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-blue-500" size={16} />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">공부한 날</p>
                <p className="font-bold text-gray-800 dark:text-white">{summary.total_days}일</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FiClock className="text-green-500" size={16} />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">총 공부 시간</p>
                <p className="font-bold text-gray-800 dark:text-white">{formatHoursMinutes(summary.total_seconds)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FiTrendingUp className="text-orange-500" size={16} />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">일평균</p>
                <p className="font-bold text-gray-800 dark:text-white">{formatHoursMinutes(summary.average_seconds)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FiAward className="text-purple-500" size={16} />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">최장 연속</p>
                <p className="font-bold text-gray-800 dark:text-white">{summary.longest_streak}일</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
