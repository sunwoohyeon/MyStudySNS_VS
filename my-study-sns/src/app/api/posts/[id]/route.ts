import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// DELETE 함수 (쿠키 인증 버전)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const postId = params.id;
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    // 1. 쿠키로 사용자 인증
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
    }

    // 2. 권한 확인 (본인 글인지)
    const { data: post, error: findError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (findError || !post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    }
    if (post.user_id !== user.id) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    // 3. 삭제 실행 (Cascade Delete 수동 구현)
    // 연관된 데이터(리뷰, 신고, 해시태그)를 먼저 삭제합니다.
    await supabase.from('reviews').delete().eq('post_id', postId);
    await supabase.from('reports').delete().eq('post_id', postId);
    await supabase.from('post_hashtags').delete().eq('post_id', postId);

    const { error: deleteError } = await supabase.from('posts').delete().eq('id', postId);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: '게시글이 성공적으로 삭제되었습니다.' }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: '알 수 없는 오류가 발생했습니다.' }, { status: 500 });
  }
}

// PATCH 함수 (쿠키 인증 버전)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const postId = params.id;
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    // 1. 쿠키로 사용자 인증
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
    }

    // 2. 수정할 내용 받기
    const { content } = await request.json();
    if (!content) {
      return NextResponse.json({ error: '수정할 내용을 입력해주세요.' }, { status: 400 });
    }

    // 3. 권한 확인 (본인 글인지)
    const { data: post, error: findError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (findError || !post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    }
    if (post.user_id !== user.id) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
    }

    // 4. 수정 실행
    const { data: updateData, error: updateError } = await supabase
      .from('posts')
      .update({ content: content })
      .eq('id', postId)
      .select();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updateData[0]);

  } catch (error) {
    return NextResponse.json({ error: '알 수 없는 오류가 발생했습니다.' }, { status: 500 });
  }
}