import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// 1. 내 정보 조회 (프로필 + 게시글 목록 + 총 점수)
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (postsError) throw postsError;

    const postIds = posts.map((p: { id: number }) => p.id);
    let totalScore = 0;

    if (postIds.length > 0) {
      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("score")
        .in("post_id", postIds);

      if (reviewsError) throw reviewsError;

      totalScore = reviews.reduce((acc: number, curr: { score: number }) => acc + curr.score, 0);
    }

    return NextResponse.json({
      profile,
      posts,
      totalScore,
      postCount: posts.length
    });

  } catch (error: unknown) {
    console.error("MyPage GET Error:", error);
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 2. 프로필 수정 (PUT)
export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const body = await request.json();

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

  } catch (error: unknown) {
    console.error("MyPage PUT Error:", error);
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
