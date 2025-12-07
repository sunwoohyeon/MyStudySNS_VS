import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const body = await request.json();
    const { is_notify_comment, is_marketing_agreed } = body;

    const { error } = await supabase
      .from("profiles")
      .update({
        is_notify_comment,
        is_marketing_agreed,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (error) throw error;

    return NextResponse.json({ message: "설정이 저장되었습니다." });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 회원 탈퇴 API
export async function DELETE() {
  const supabase = createRouteHandlerClient({ cookies });

  // Admin 클라이언트 생성 (auth.users 삭제용)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const userId = user.id;

    // 1. 관련 데이터 삭제 (외래키 제약조건 해결)
    // 댓글 삭제
    await supabase.from("comments").delete().eq("user_id", userId);

    // 리뷰(좋아요) 삭제
    await supabase.from("reviews").delete().eq("user_id", userId);

    // 신고 내역 삭제
    await supabase.from("reports").delete().eq("user_id", userId);

    // 알림 삭제
    await supabase.from("notifications").delete().eq("user_id", userId);

    // 지식 카드 삭제
    await supabase.from("knowledge_cards").delete().eq("user_id", userId);

    // 스케줄 삭제
    await supabase.from("schedules").delete().eq("user_id", userId);

    // 게시글의 해시태그 연결 삭제 (post_hashtags)
    const { data: userPosts } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", userId);

    if (userPosts && userPosts.length > 0) {
      const postIds = userPosts.map(p => p.id);
      await supabase.from("post_hashtags").delete().in("post_id", postIds);
      // 게시글에 달린 다른 사람의 댓글도 삭제
      await supabase.from("comments").delete().in("post_id", postIds);
      // 게시글에 달린 리뷰(좋아요)도 삭제
      await supabase.from("reviews").delete().in("post_id", postIds);
      // 게시글 신고 내역도 삭제
      await supabase.from("reports").delete().in("post_id", postIds);
    }

    // 게시글 삭제
    await supabase.from("posts").delete().eq("user_id", userId);

    // 2. profiles 테이블 삭제
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) throw profileError;

    // 3. auth.users에서 완전 삭제 (Admin API)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteUserError) throw deleteUserError;

    return NextResponse.json({ message: "탈퇴 처리되었습니다." });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    console.error("회원탈퇴 에러:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
