import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    // 현재 공부 중인 세션들 조회 (프로필 정보 포함)
    const { data: sessions, error: sessionsError } = await supabase
      .from("study_sessions")
      .select(`
        id,
        user_id,
        status,
        started_at,
        paused_at,
        accumulated_seconds,
        study_subject,
        created_at
      `)
      .eq("status", "studying")
      .order("started_at", { ascending: false });

    if (sessionsError) {
      console.error("Sessions fetch error:", sessionsError);
      return NextResponse.json({ error: "세션 조회에 실패했습니다." }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        studying_users: [],
        total_count: 0,
      });
    }

    // 사용자 프로필 정보 조회
    const userIds = sessions.map((s) => s.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, school_name, major")
      .in("id", userIds);

    if (profilesError) {
      console.error("Profiles fetch error:", profilesError);
    }

    // 프로필 맵 생성
    const profileMap = new Map();
    profiles?.forEach((p) => {
      profileMap.set(p.id, p);
    });

    // 결과 조합
    const studyingUsers = sessions.map((session) => {
      const profile = profileMap.get(session.user_id);
      return {
        user_id: session.user_id,
        username: profile?.username || "익명",
        school_name: profile?.school_name || null,
        major: profile?.major || null,
        session: {
          id: session.id,
          started_at: session.started_at,
          paused_at: session.paused_at,
          accumulated_seconds: session.accumulated_seconds,
          study_subject: session.study_subject,
        },
      };
    });

    return NextResponse.json({
      studying_users: studyingUsers,
      total_count: studyingUsers.length,
    });
  } catch (error) {
    console.error("Live study error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
