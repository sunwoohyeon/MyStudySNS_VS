import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// PATCH - 개별 시간표 항목 수정
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // 1. 사용자 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const scheduleId = parseInt(params.id);
    if (isNaN(scheduleId)) {
      return NextResponse.json({ error: "유효하지 않은 ID입니다." }, { status: 400 });
    }

    // 2. 해당 시간표가 본인 것인지 확인
    const { data: existingSchedule, error: fetchError } = await supabase
      .from("schedules")
      .select("*")
      .eq("id", scheduleId)
      .single();

    if (fetchError || !existingSchedule) {
      return NextResponse.json({ error: "시간표를 찾을 수 없습니다." }, { status: 404 });
    }

    if (existingSchedule.user_id !== user.id) {
      return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 });
    }

    // 3. 요청 본문에서 수정할 데이터 추출
    const body = await request.json();
    const { title, day_of_week, start_time, end_time, location } = body;

    // 4. 유효성 검사
    const validDays = ["월", "화", "수", "목", "금", "토", "일"];
    if (day_of_week && !validDays.includes(day_of_week)) {
      return NextResponse.json({ error: "유효하지 않은 요일입니다." }, { status: 400 });
    }

    // HH:MM 또는 HH:MM:SS 형식 모두 허용
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (start_time && !timeRegex.test(start_time)) {
      return NextResponse.json({ error: "시작 시간 형식이 올바르지 않습니다. (HH:MM)" }, { status: 400 });
    }
    if (end_time && !timeRegex.test(end_time)) {
      return NextResponse.json({ error: "종료 시간 형식이 올바르지 않습니다. (HH:MM)" }, { status: 400 });
    }

    // 5. 수정할 필드만 업데이트 객체에 포함
    const updates: Record<string, string> = {};
    if (title !== undefined) updates.title = title;
    if (day_of_week !== undefined) updates.day_of_week = day_of_week;
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;
    if (location !== undefined) updates.location = location;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "수정할 내용이 없습니다." }, { status: 400 });
    }

    // 6. Supabase UPDATE 실행
    const { data, error: updateError } = await supabase
      .from("schedules")
      .update(updates)
      .eq("id", scheduleId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, schedule: data });

  } catch (error: unknown) {
    console.error("Schedule PATCH Error:", error);
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
