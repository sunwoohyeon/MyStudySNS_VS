import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: userId } = await params;
    const supabase = createRouteHandlerClient({ cookies });

    try {
        // 1. 프로필 가져오기
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (profileError) throw profileError;

        // 2. 해당 유저가 쓴 게시글 가져오기 (최신순)
        const { data: posts, error: postsError } = await supabase
            .from("posts")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (postsError) throw postsError;

        // 3. 총 유용도 점수 계산
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
            postCount: posts.length,
        });
    } catch (error: unknown) {
        console.error("Profile GET Error:", error);
        const message = error instanceof Error ? error.message : '알 수 없는 오류';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
