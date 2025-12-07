import { createClient } from "@supabase/supabase-js";
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
    const { study_subject } = body;

    // 이미 진행 중인 세션이 있는지 확인
    const { data: existingSession, error: checkError } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["studying", "paused"])
      .single();

    if (existingSession) {
      return NextResponse.json(
        {
          error: "이미 진행 중인 공부 세션이 있습니다.",
          existing_session: existingSession
        },
        { status: 400 }
      );
    }

    // 새 세션 생성
    const { data: session, error: insertError } = await supabase
      .from("study_sessions")
      .insert({
        user_id: user.id,
        status: "studying",
        started_at: new Date().toISOString(),
        accumulated_seconds: 0,
        study_subject: study_subject || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json({ error: "세션 생성에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Start study error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
