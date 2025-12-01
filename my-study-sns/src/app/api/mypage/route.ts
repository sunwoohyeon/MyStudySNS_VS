import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// 1. 내 정보 조회 (프로필 + 게시글 목록 + 총 점수)
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    // 1. 로그인 체크
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    // 2. 프로필 가져오기
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    // 3. 내가 쓴 게시글 가져오기 (최신순)
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (postsError) throw postsError;

    // 4. 총 유용도 점수 계산 (내가 쓴 글들에 달린 모든 리뷰 점수 합산)
    // (1) 내 글의 ID 목록 추출
    const postIds = posts.map((p) => p.id);
    let totalScore = 0;

    if (postIds.length > 0) {
      // (2) 내 글에 달린 리뷰들 조회
      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("score")
        .in("post_id", postIds);

      if (reviewsError) throw reviewsError;

      // (3) 점수 합산
      totalScore = reviews.reduce((acc, curr) => acc + curr.score, 0);
    }

    return NextResponse.json({
      profile,
      posts,
      totalScore,
      postCount: posts.length
    });

  } catch (error: any) {
    console.error("MyPage GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. 프로필 수정 (PUT)
export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const body = await request.json();

    // 업데이트할 데이터 (DB 컬럼명과 일치해야 함)
    const updates = {
      username: body.username,
      school_name: body.schoolName,
      major: body.major,
      double_major: body.doubleMajor,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("MyPage PUT Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}