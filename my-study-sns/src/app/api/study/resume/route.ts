import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: "세션 ID가 필요합니다." }, { status: 400 });
    }

    // 세션 조회
    const { data: session, error: fetchError } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("id", session_id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !session) {
      return NextResponse.json({ error: "세션을 찾을 수 없습니다." }, { status: 404 });
    }

    if (session.status !== "paused") {
      return NextResponse.json({ error: "일시정지된 세션만 재개할 수 있습니다." }, { status: 400 });
    }

    // 세션 업데이트 - paused_at을 현재 시간으로 설정 (재개 시점 기록)
    const now = new Date();
    const { data: updatedSession, error: updateError } = await supabase
      .from("study_sessions")
      .update({
        status: "studying",
        paused_at: now.toISOString(), // 재개 시점을 기록하여 이후 시간 계산에 사용
      })
      .eq("id", session_id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json({ error: "세션 업데이트에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error("Resume study error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
