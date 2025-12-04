export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요한 서비스입니다." }, { status: 401 });

  const body = await request.json();
  const { type, postId, score, reason, description } = body;

  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (!post) return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });

  if (post.user_id === user.id) {
    return NextResponse.json({ error: "본인의 게시글에는 점수나 신고를 할 수 없습니다." }, { status: 403 });
  }

  // A. 리뷰(점수) 등록
  if (type === "review") {
    const { error: upsertError } = await supabase
      .from("reviews")
      .upsert({
        user_id: user.id,
        post_id: postId,
        score: score
      }, { onConflict: 'user_id, post_id' });

    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

    const { data: reviews } = await supabase
      .from("reviews")
      .select("score")
      .eq("post_id", postId);

    let newAverage = 0;
    let newCount = 0;

    if (reviews && reviews.length > 0) {
      const total = reviews.reduce((acc: number, cur: { score: number }) => acc + cur.score, 0);
      newAverage = Number((total / reviews.length).toFixed(1));
      newCount = reviews.length;
    }

    return NextResponse.json({
      message: "점수가 반영되었습니다.",
      average: newAverage,
      count: newCount
    });
  }

  // B. 신고하기
  if (type === "report") {
    const { error } = await supabase
      .from("reports")
      .insert({
        reporter_id: user.id,
        post_id: postId,
        reason: reason,
        description: description
      });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "신고가 접수되었습니다." });
  }

  return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  if (!postId) return NextResponse.json({ error: "게시글 ID가 필요합니다." }, { status: 400 });

  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("score")
    .eq("post_id", postId);

  let myScore = 0;
  if (user) {
    const { data: myReview } = await supabase
      .from("reviews")
      .select("score")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single();
    if (myReview) myScore = myReview.score;
  }

  if (error || !reviews) return NextResponse.json({ average: 0, count: 0, myScore });

  const total = reviews.reduce((acc: number, cur: { score: number }) => acc + cur.score, 0);
  const average = reviews.length > 0 ? (total / reviews.length).toFixed(1) : 0;

  return NextResponse.json({ average, count: reviews.length, myScore });
}
