// src/app/auth/callback/route.ts

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    // ★ Next.js 15 대응 수정: cookies()를 먼저 await 해야 합니다.
    const cookieStore = await cookies();
    
    const supabase = createRouteHandlerClient({ 
        cookies: () => cookieStore 
    });
    
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 로그인 후 메인으로 이동
  return NextResponse.redirect('https://mathilda-otiose-my.ngrok-free.dev');
}