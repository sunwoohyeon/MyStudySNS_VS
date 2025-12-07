import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore as any });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요한 서비스입니다." }, { status: 401 });

  try {
    const body = await request.json();
    const { title, content, board, tag, imageUrl, hashtags } = body;

    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        title,
        content,
        board,
        tag,
        user_id: user.id,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (postError) throw postError;

    if (hashtags && Array.isArray(hashtags) && hashtags.length > 0) {
      for (const tagName of hashtags) {
        let hashtagId;

        const { data: existingTag } = await supabase
          .from("hashtags")
          .select("id, count")
          .eq("name", tagName)
          .single();

        if (existingTag) {
          hashtagId = existingTag.id;
          // count 직접 증가 (RPC 대신)
          const { error: updateError } = await supabase
            .from("hashtags")
            .update({ count: (existingTag.count || 0) + 1 })
            .eq("id", hashtagId);

          if (updateError) {
            console.error("Hashtag count update failed:", updateError);
          }
        } else {
          const { data: newTag, error: tagError } = await supabase
            .from("hashtags")
            .insert({ name: tagName, count: 1 })
            .select()
            .single();

          if (tagError) {
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

  } catch (error: unknown) {
    console.error("Post creation error:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
