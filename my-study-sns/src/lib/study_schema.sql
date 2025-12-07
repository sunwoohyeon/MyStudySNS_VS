-- ============================================
-- Study Community Schema
-- 스터디 커뮤니티 (실시간 공부 타이머) 스키마
-- ============================================

-- 1. study_sessions 테이블 (진행 중인 공부 세션)
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 세션 상태: studying(공부중), paused(일시정지), ended(종료)
  status VARCHAR(20) DEFAULT 'studying' CHECK (status IN ('studying', 'paused', 'ended')),

  -- 시간 정보
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,  -- 세션 시작 시간
  paused_at TIMESTAMPTZ,                          -- 일시정지/재개 시점 (재개 시 이 시간부터 계산)
  ended_at TIMESTAMPTZ,                           -- 세션 종료 시간

  -- 누적 시간 (초 단위) - 일시정지 전까지의 누적 공부 시간
  accumulated_seconds INTEGER DEFAULT 0 NOT NULL,

  -- 공부 과목 (선택)
  study_subject VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_status ON study_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_active ON study_sessions(status) WHERE status IN ('studying', 'paused');

-- 2. study_records 테이블 (일별 공부 기록)
CREATE TABLE IF NOT EXISTS study_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 날짜 (YYYY-MM-DD)
  study_date DATE NOT NULL,

  -- 총 공부 시간 (초 단위)
  total_seconds INTEGER DEFAULT 0 NOT NULL,

  -- 세션 횟수
  session_count INTEGER DEFAULT 0 NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 유저별 날짜 중복 방지
  UNIQUE(user_id, study_date)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_study_records_user_date ON study_records(user_id, study_date);
CREATE INDEX IF NOT EXISTS idx_study_records_date ON study_records(study_date DESC);

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

-- study_sessions RLS 활성화
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- 자신의 세션 관리 (INSERT, UPDATE, DELETE)
CREATE POLICY "Users can insert own sessions" ON study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON study_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- 자신의 세션 조회
CREATE POLICY "Users can view own sessions" ON study_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- 공부 중인 세션은 모든 로그인 사용자가 조회 가능 (실시간 현황용)
CREATE POLICY "Anyone can view active studying sessions" ON study_sessions
  FOR SELECT USING (status = 'studying');

-- study_records RLS 활성화
ALTER TABLE study_records ENABLE ROW LEVEL SECURITY;

-- 자신의 기록 관리
CREATE POLICY "Users can insert own records" ON study_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" ON study_records
  FOR UPDATE USING (auth.uid() = user_id);

-- 모든 사용자의 기록 조회 가능 (프로필 페이지용)
CREATE POLICY "Anyone can view study records" ON study_records
  FOR SELECT USING (true);

-- ============================================
-- Realtime 활성화 (Supabase Dashboard에서 설정 필요)
-- ============================================
-- 1. Supabase Dashboard > Database > Replication
-- 2. study_sessions 테이블 선택
-- 3. Realtime 활성화

-- ============================================
-- 유용한 함수 (선택사항)
-- ============================================

-- 오늘 총 공부 시간 조회 함수
CREATE OR REPLACE FUNCTION get_today_study_seconds(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
BEGIN
  SELECT COALESCE(total_seconds, 0) INTO v_total
  FROM study_records
  WHERE user_id = p_user_id AND study_date = CURRENT_DATE;

  RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
