"use client";

import { useState } from "react";
import { useStudy } from "@/contexts/StudyContext";
import { FiPlay, FiPause, FiSquare, FiClock, FiBook } from "react-icons/fi";

interface StudyTimerProps {
  compact?: boolean;
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

export default function StudyTimer({ compact = false }: StudyTimerProps) {
  const {
    currentSession,
    todayTotalSeconds,
    isStudying,
    isPaused,
    isLoading,
    elapsedSeconds,
    startStudy,
    pauseStudy,
    resumeStudy,
    endStudy,
  } = useStudy();

  const [subject, setSubject] = useState("");
  const [showSubjectInput, setShowSubjectInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    try {
      setError(null);
      await startStudy(subject || undefined);
      setSubject("");
      setShowSubjectInput(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePause = async () => {
    try {
      setError(null);
      await pauseStudy();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResume = async () => {
    try {
      setError(null);
      await resumeStudy();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEnd = async () => {
    try {
      setError(null);
      await endStudy();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className={`${compact ? "p-4" : "p-8"} flex justify-center items-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 컴팩트 모드 (위젯용)
  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FiClock className="text-blue-500" />
            공부 타이머
          </h3>
          {currentSession?.study_subject && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
              {currentSession.study_subject}
            </span>
          )}
        </div>

        {/* 타이머 시간 */}
        <div className="text-center mb-3">
          <p className={`font-mono font-bold ${isStudying ? "text-green-500" : isPaused ? "text-yellow-500" : "text-gray-500"}`}
             style={{ fontSize: "2rem" }}>
            {formatTime(elapsedSeconds)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isStudying ? "공부 중..." : isPaused ? "일시정지" : "대기 중"}
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-2">
          {!currentSession ? (
            <button
              onClick={() => startStudy()}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-semibold"
            >
              <FiPlay size={16} />
              시작
            </button>
          ) : isStudying ? (
            <>
              <button
                onClick={handlePause}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition font-semibold"
              >
                <FiPause size={16} />
                일시정지
              </button>
              <button
                onClick={handleEnd}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-semibold"
              >
                <FiSquare size={16} />
                종료
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleResume}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-semibold"
              >
                <FiPlay size={16} />
                재개
              </button>
              <button
                onClick={handleEnd}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-semibold"
              >
                <FiSquare size={16} />
                종료
              </button>
            </>
          )}
        </div>

        {/* 오늘 총 공부 시간 */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">오늘 총 공부 시간</p>
          <p className="font-mono font-semibold text-gray-700 dark:text-gray-300">
            {formatTime(todayTotalSeconds + (isStudying || isPaused ? elapsedSeconds : 0))}
          </p>
        </div>
      </div>
    );
  }

  // 풀 모드 (메인 페이지용)
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
      {/* 헤더 */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          공부 타이머
        </h2>
        {currentSession?.study_subject && (
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full">
            <FiBook size={16} />
            {currentSession.study_subject}
          </div>
        )}
      </div>

      {/* 메인 타이머 */}
      <div className="text-center mb-8">
        <div
          className={`inline-block px-8 py-6 rounded-2xl ${
            isStudying
              ? "bg-green-50 dark:bg-green-900/20 ring-4 ring-green-200 dark:ring-green-800"
              : isPaused
              ? "bg-yellow-50 dark:bg-yellow-900/20 ring-4 ring-yellow-200 dark:ring-yellow-800"
              : "bg-gray-50 dark:bg-gray-700"
          }`}
        >
          <p
            className={`font-mono font-bold ${
              isStudying
                ? "text-green-500"
                : isPaused
                ? "text-yellow-500"
                : "text-gray-500"
            }`}
            style={{ fontSize: "4rem", letterSpacing: "0.1em" }}
          >
            {formatTime(elapsedSeconds)}
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
            {isStudying ? "공부 중..." : isPaused ? "일시정지됨" : "대기 중"}
          </p>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* 과목 입력 (시작 전) */}
      {!currentSession && showSubjectInput && (
        <div className="mb-6">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="공부 과목을 입력하세요 (선택)"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* 버튼 */}
      <div className="flex flex-col gap-3">
        {!currentSession ? (
          <>
            {!showSubjectInput ? (
              <div className="flex gap-3">
                <button
                  onClick={handleStart}
                  className="flex-1 flex items-center justify-center gap-3 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl transition font-bold text-lg"
                >
                  <FiPlay size={24} />
                  공부 시작
                </button>
                <button
                  onClick={() => setShowSubjectInput(true)}
                  className="px-4 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition"
                  title="과목 입력 후 시작"
                >
                  <FiBook size={24} />
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleStart}
                  className="flex-1 flex items-center justify-center gap-3 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl transition font-bold text-lg"
                >
                  <FiPlay size={24} />
                  공부 시작
                </button>
                <button
                  onClick={() => {
                    setShowSubjectInput(false);
                    setSubject("");
                  }}
                  className="px-4 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition"
                >
                  취소
                </button>
              </div>
            )}
          </>
        ) : isStudying ? (
          <div className="flex gap-3">
            <button
              onClick={handlePause}
              className="flex-1 flex items-center justify-center gap-3 py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition font-bold text-lg"
            >
              <FiPause size={24} />
              일시정지
            </button>
            <button
              onClick={handleEnd}
              className="flex-1 flex items-center justify-center gap-3 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl transition font-bold text-lg"
            >
              <FiSquare size={24} />
              공부 종료
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleResume}
              className="flex-1 flex items-center justify-center gap-3 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl transition font-bold text-lg"
            >
              <FiPlay size={24} />
              이어서 공부
            </button>
            <button
              onClick={handleEnd}
              className="flex-1 flex items-center justify-center gap-3 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl transition font-bold text-lg"
            >
              <FiSquare size={24} />
              공부 종료
            </button>
          </div>
        )}
      </div>

      {/* 오늘 총 공부 시간 */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400">오늘 총 공부 시간</span>
          <span className="font-mono font-bold text-xl text-gray-700 dark:text-gray-300">
            {formatTime(todayTotalSeconds + (isStudying || isPaused ? elapsedSeconds : 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
