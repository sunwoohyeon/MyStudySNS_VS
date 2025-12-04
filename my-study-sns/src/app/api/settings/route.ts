import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
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

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (error) throw error;

    return NextResponse.json({ message: "탈퇴 처리되었습니다." });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
