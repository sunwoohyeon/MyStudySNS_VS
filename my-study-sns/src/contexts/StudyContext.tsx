"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// 세션 타입 정의
export interface StudySession {
  id: string;
  user_id: string;
  status: 'studying' | 'paused' | 'ended';
  started_at: string;
  paused_at: string | null;
  ended_at: string | null;
  accumulated_seconds: number;
  study_subject: string | null;
  created_at: string;
}

// Context 타입 정의
interface StudyContextType {
  currentSession: StudySession | null;
  todayTotalSeconds: number;
  isStudying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  elapsedSeconds: number;
  startStudy: (subject?: string) => Promise<void>;
  pauseStudy: () => Promise<void>;
  resumeStudy: () => Promise<void>;
  endStudy: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// 기본값 정의
const defaultStudyContext: StudyContextType = {
  currentSession: null,
  todayTotalSeconds: 0,
  isStudying: false,
  isPaused: false,
  isLoading: true,
  elapsedSeconds: 0,
  startStudy: async () => {},
  pauseStudy: async () => {},
  resumeStudy: async () => {},
  endStudy: async () => {},
  refreshSession: async () => {},
};

const StudyContext = createContext<StudyContextType>(defaultStudyContext);

export function useStudy() {
  return useContext(StudyContext);
}

export function StudyProvider({ children }: { children: ReactNode }) {
  const supabase = createClientComponentClient();

  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [todayTotalSeconds, setTodayTotalSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // 경과 시간 계산
  const calculateElapsedSeconds = useCallback((session: StudySession | null): number => {
    if (!session) return 0;

    if (session.status === 'ended') {
      return session.accumulated_seconds;
    }

    if (session.status === 'paused') {
      return session.accumulated_seconds;
    }

    // 공부 중인 경우: 누적 시간 + (현재 - 마지막 시작/재개 시점)
    const now = Date.now();
    const lastStartTime = session.paused_at
      ? new Date(session.paused_at).getTime()
      : new Date(session.started_at).getTime();

    const additionalSeconds = Math.floor((now - lastStartTime) / 1000);
    return session.accumulated_seconds + additionalSeconds;
  }, []);

  // 세션 새로고침
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/study/current');
      if (res.ok) {
        const data = await res.json();
        setCurrentSession(data.session);
        setTodayTotalSeconds(data.todayTotalSeconds || 0);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await refreshSession();
      setIsLoading(false);
    };
    init();
  }, [refreshSession]);

  // 1초마다 경과 시간 업데이트 (공부 중일 때만)
  useEffect(() => {
    if (currentSession?.status === 'studying') {
      const interval = setInterval(() => {
        setElapsedSeconds(calculateElapsedSeconds(currentSession));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedSeconds(calculateElapsedSeconds(currentSession));
    }
  }, [currentSession, calculateElapsedSeconds]);

  // 탭 활성화 시 동기화
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshSession]);

  // 공부 시작
  const startStudy = async (subject?: string) => {
    try {
      const res = await fetch('/api/study/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ study_subject: subject }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentSession(data.session);
        setElapsedSeconds(0);
      } else {
        const error = await res.json();
        console.error('Failed to start study:', error);
        throw new Error(error.error || '공부 시작에 실패했습니다.');
      }
    } catch (error) {
      console.error('Start study error:', error);
      throw error;
    }
  };

  // 일시정지
  const pauseStudy = async () => {
    if (!currentSession) return;

    try {
      const res = await fetch('/api/study/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: currentSession.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentSession(data.session);
      } else {
        const error = await res.json();
        throw new Error(error.error || '일시정지에 실패했습니다.');
      }
    } catch (error) {
      console.error('Pause study error:', error);
      throw error;
    }
  };

  // 재개
  const resumeStudy = async () => {
    if (!currentSession) return;

    try {
      const res = await fetch('/api/study/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: currentSession.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentSession(data.session);
      } else {
        const error = await res.json();
        throw new Error(error.error || '재개에 실패했습니다.');
      }
    } catch (error) {
      console.error('Resume study error:', error);
      throw error;
    }
  };

  // 종료
  const endStudy = async () => {
    if (!currentSession) return;

    try {
      const res = await fetch('/api/study/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: currentSession.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentSession(null);
        setElapsedSeconds(0);
        setTodayTotalSeconds(data.dailyRecord?.total_seconds || todayTotalSeconds);
      } else {
        const error = await res.json();
        throw new Error(error.error || '종료에 실패했습니다.');
      }
    } catch (error) {
      console.error('End study error:', error);
      throw error;
    }
  };

  const value: StudyContextType = {
    currentSession,
    todayTotalSeconds,
    isStudying: currentSession?.status === 'studying',
    isPaused: currentSession?.status === 'paused',
    isLoading,
    elapsedSeconds,
    startStudy,
    pauseStudy,
    resumeStudy,
    endStudy,
    refreshSession,
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}
