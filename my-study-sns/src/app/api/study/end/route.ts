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

    if (session.status === "ended") {
      return NextResponse.json({ error: "이미 종료된 세션입니다." }, { status: 400 });
    }

    // 최종 공부 시간 계산
    const now = new Date();
    let totalDurationSeconds = session.accumulated_seconds;

    // 공부 중이었다면 마지막 구간 시간도 추가
    if (session.status === "studying") {
      const lastStartTime = session.paused_at
        ? new Date(session.paused_at)
        : new Date(session.started_at);
      const additionalSeconds = Math.floor((now.getTime() - lastStartTime.getTime()) / 1000);
      totalDurationSeconds += additionalSeconds;
    }

    // 세션 종료 처리
    const { data: endedSession, error: updateError } = await supabase
      .from("study_sessions")
      .update({
        status: "ended",
        ended_at: now.toISOString(),
        accumulated_seconds: totalDurationSeconds,
      })
      .eq("id", session_id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json({ error: "세션 종료에 실패했습니다." }, { status: 500 });
    }

    // 오늘 날짜 (로컬 타임존 기준)
    const today = new Date().toISOString().split("T")[0];

    // study_records에 기록 저장 (upsert)
    const { data: existingRecord, error: recordFetchError } = await supabase
      .from("study_records")
      .select("*")
      .eq("user_id", user.id)
      .eq("study_date", today)
      .single();

    let dailyRecord;

    if (existingRecord) {
      // 기존 기록 업데이트
      const { data: updatedRecord, error: recordUpdateError } = await supabase
        .from("study_records")
        .update({
          total_seconds: existingRecord.total_seconds + totalDurationSeconds,
          session_count: existingRecord.session_count + 1,
          updated_at: now.toISOString(),
        })
        .eq("id", existingRecord.id)
        .select()
        .single();

      if (recordUpdateError) {
        console.error("Record update error:", recordUpdateError);
      }
      dailyRecord = updatedRecord;
    } else {
      // 새 기록 생성
      const { data: newRecord, error: recordInsertError } = await supabase
        .from("study_records")
        .insert({
          user_id: user.id,
          study_date: today,
          total_seconds: totalDurationSeconds,
          session_count: 1,
        })
        .select()
        .single();

      if (recordInsertError) {
        console.error("Record insert error:", recordInsertError);
      }
      dailyRecord = newRecord;
    }

    return NextResponse.json({
      session: endedSession,
      totalDurationSeconds,
      dailyRecord,
    });
  } catch (error) {
    console.error("End study error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
