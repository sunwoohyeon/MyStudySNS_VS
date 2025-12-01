import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 회원 탈퇴 API
export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    // Supabase Admin API를 쓰지 않고, 클라이언트 레벨에서는
    // DB 데이터를 지우거나, Supabase 기능을 이용해 탈퇴 처리 (여기서는 DB Profiles 삭제로 처리)
    // 참고: auth.users 삭제는 Service Role Key가 필요하므로, 
    // 여기서는 profiles 테이블 데이터만 삭제하여 '탈퇴 상태'로 만듭니다.

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (error) throw error;

    // 로그아웃 처리까지는 클라이언트에서 진행
    return NextResponse.json({ message: "탈퇴 처리되었습니다." });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}