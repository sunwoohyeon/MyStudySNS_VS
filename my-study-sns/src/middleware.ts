import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Supabase 클라이언트 생성 (쿠키 관리용)
  const supabase = createMiddlewareClient({ req, res });

  // 현재 세션을 갱신 (쿠키가 만료되지 않게 하고, 서버에 유저 정보를 전달)
  await supabase.auth.getSession();

  return res;
}

// 미들웨어가 적용될 경로 설정 (이미지, 정적 파일 등은 제외)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};