import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1. 로그인 체크
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요한 서비스입니다." }, { status: 401 });

  try {
    const body = await request.json();
    const { title, content, board, tag, imageUrl, hashtags } = body; // hashtags: string[]

    // 2. 게시글 저장
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        title,
        content,
        board,
        tag, // 기존 카테고리 태그 (예: #React)
        user_id: user.id,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (postError) throw postError;

    // 3. 해시태그 처리
    if (hashtags && Array.isArray(hashtags) && hashtags.length > 0) {
      for (const tagName of hashtags) {
        // 3-1. 해시태그가 존재하면 가져오고, 없으면 생성 (upsert는 id를 모를 때 애매하므로 select -> insert 로직 사용)
        // 간단하게 upsert 사용 (name이 unique여야 함)

        // 먼저 해시태그 ID를 찾거나 생성
        let hashtagId;

        const { data: existingTag } = await supabase
          .from("hashtags")
          .select("id")
          .eq("name", tagName)
          .single();

        if (existingTag) {
          hashtagId = existingTag.id;
          // 카운트 증가 (선택사항)
          await supabase.rpc('increment_hashtag_count', { tag_id: hashtagId });
        } else {
          const { data: newTag, error: tagError } = await supabase
            .from("hashtags")
            .insert({ name: tagName, count: 1 })
            .select()
            .single();

          if (tagError) {
            // 동시성 문제로 이미 생겼을 수 있음, 다시 조회
            const { data: retryTag } = await supabase
              .from("hashtags")
              .select("id")
              .eq("name", tagName)
              .single();
            if (retryTag) hashtagId = retryTag.id;
          } else {
            hashtagId = newTag.id;
          }
        }

        // 3-2. 게시글-해시태그 연결
        if (hashtagId) {
          await supabase
            .from("post_hashtags")
            .insert({
              post_id: post.id,
              hashtag_id: hashtagId
            });
        }
      }
    }

    return NextResponse.json({ message: "게시글이 등록되었습니다.", postId: post.id });

  } catch (error: any) {
    console.error("Post creation error:", error);
    return NextResponse.json({ error: error.message || "서버 오류가 발생했습니다." }, { status: 500 });
  }
}