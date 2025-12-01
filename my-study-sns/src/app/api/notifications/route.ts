// src/app/api/notifications/route.ts
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// 알림 읽음 처리 (PATCH)
export async function PATCH(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  // 로그인 확인
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  try {
    // 사용자의 모든 알림을 '읽음(true)'으로 변경
    // (개별 읽음이 필요하면 body에서 id를 받아 where 조건을 추가하면 됩니다. 여기선 '모두 읽음' 처리)
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false); // 안 읽은 것만 업데이트

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "알림 설정 업데이트에 실패했습니다." }, { status: 500 });
  }
}