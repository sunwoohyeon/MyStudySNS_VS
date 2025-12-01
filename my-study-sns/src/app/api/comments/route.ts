import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// 1. 댓글 목록 조회 (GET)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('post_id');

    if (!postId) return NextResponse.json([], { status: 400 });

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(username, school_name, major)')
      .eq('post_id', postId)
      .order('is_accepted', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error("GET Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("GET Server Error:", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// 2. 댓글 작성 (POST) - ★ 여기가 문제였을 확률 높음
export async function POST(request: Request) {
  try {
    // 1. Body 파싱
    const body = await request.json();
    const { post_id, content } = body;

    // 2. 쿠키 & Supabase 설정 (Next.js 15 필수: await)
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 3. 유저 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth Error:", authError);
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 4. DB Insert
    const { data, error } = await supabase
      .from('comments')
      .insert({
        content: content,
        post_id: Number(post_id), // 숫자로 변환하여 안전하게 전달
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("DB Insert Error:", error); // ★ VS Code 터미널에 에러 이유가 뜹니다
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Critical Server Error:", error);
    // JSON 형식이 깨지지 않도록 안전하게 반환
    return NextResponse.json({ error: '알 수 없는 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}