import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let query = supabase
      .from("study_records")
      .select("*")
      .eq("user_id", user.id)
      .order("study_date", { ascending: false });

    // 날짜 범위 필터
    if (startDate && endDate) {
      query = query.gte("study_date", startDate).lte("study_date", endDate);
    } else if (year && month) {
      const paddedMonth = month.padStart(2, "0");
      const monthStart = `${year}-${paddedMonth}-01`;
      const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
      const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
      const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
      query = query.gte("study_date", monthStart).lt("study_date", monthEnd);
    }

    const { data: records, error: recordsError } = await query;

    if (recordsError) {
      console.error("Records fetch error:", recordsError);
      return NextResponse.json({ error: "기록 조회에 실패했습니다." }, { status: 500 });
    }

    // 요약 통계 계산
    const totalSeconds = records?.reduce((sum, r) => sum + r.total_seconds, 0) || 0;
    const totalDays = records?.length || 0;
    const averageSeconds = totalDays > 0 ? Math.floor(totalSeconds / totalDays) : 0;

    // 연속 공부 일수 계산 (최장 스트릭)
    let longestStreak = 0;
    if (records && records.length > 0) {
      const sortedDates = records
        .map((r) => new Date(r.study_date))
        .sort((a, b) => a.getTime() - b.getTime());

      let currentStreak = 1;
      longestStreak = 1;

      for (let i = 1; i < sortedDates.length; i++) {
        const diff = (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
    }

    return NextResponse.json({
      records: records || [],
      summary: {
        total_days: totalDays,
        total_seconds: totalSeconds,
        average_seconds: averageSeconds,
        longest_streak: longestStreak,
      },
    });
  } catch (error) {
    console.error("Get records error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
