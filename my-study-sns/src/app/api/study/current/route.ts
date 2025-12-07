import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // 현재 진행 중인 세션 조회
    const { data: session, error: sessionError } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["studying", "paused"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // 오늘 날짜
    const today = new Date().toISOString().split("T")[0];

    // 오늘 총 공부 시간 조회
    const { data: todayRecord, error: recordError } = await supabase
      .from("study_records")
      .select("total_seconds")
      .eq("user_id", user.id)
      .eq("study_date", today)
      .single();

    return NextResponse.json({
      session: session || null,
      todayTotalSeconds: todayRecord?.total_seconds || 0,
    });
  } catch (error) {
    console.error("Get current session error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
