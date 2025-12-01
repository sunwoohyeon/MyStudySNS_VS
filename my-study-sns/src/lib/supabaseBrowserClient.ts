'use client'; // 이 파일은 클라이언트 전용임을 명시

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// .env.local 파일이 필요합니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 브라우저에서 사용할 Supabase 클라이언트
export const supabase = createClientComponentClient({
  supabaseUrl,
  supabaseKey,
});