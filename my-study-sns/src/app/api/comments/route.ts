import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// 1. 댓글 목록 조회 (GET)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('post_id');

    if (!postId) return NextResponse.json([], { status: 400 });

    const supabase = createRouteHandlerClient({ cookies });

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

// 2. 댓글 작성 (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { post_id, content } = body;

    const supabase = createRouteHandlerClient({ cookies });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth Error:", authError);
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        content: content,
        post_id: Number(post_id),
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("DB Insert Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch {
    console.error("Critical Server Error");
    return NextResponse.json({ error: '알 수 없는 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
