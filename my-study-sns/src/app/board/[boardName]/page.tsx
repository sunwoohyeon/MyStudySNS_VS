// src/app/board/[boardName]/page.tsx (Server Component)

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import KnowledgeCards from "@/component/KnowledgeCards";
import PostList from "@/component/PostList";

interface Post {
    id: number;
    title: string;
    content: string;
    author: string;
    createdAt: string;
    major: string;
    tag: string;
    isSolved: boolean;
    usefulScore: number;
    isHidden: boolean;
    board: string;
    user_id: string;
}

interface BoardPageProps {
    params: Promise<{
        boardName: string;
    }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
    const { boardName: encodedBoardName } = await params;
    const boardName = decodeURIComponent(encodedBoardName);
    const isAllBoard = boardName === 'all';
    const supabase = createServerComponentClient({ cookies });

    let initialPosts: Post[] = [];
    let errorMessage: string | null = null;

    try {
        let query = supabase
            .from('posts')
            .select('*, profiles(username, major)')
            .order('created_at', { ascending: false })
            .limit(100);

        if (!isAllBoard) {
            query = query.eq('board', boardName);
        }

        const { data, error } = await query;

        if (error) {
            console.error('BoardPage Data Fetching Error:', error);
            errorMessage = '게시글 데이터를 불러오는 중 오류가 발생했습니다.';
        } else if (data) {
            const postIds = data.map((p: { id: number }) => p.id);
            let scoreMap: Record<number, number> = {};

            if (postIds.length > 0) {
                const { data: reviews } = await supabase
                    .from('reviews')
                    .select('post_id, score')
                    .in('post_id', postIds);

                reviews?.forEach((r: { post_id: number; score: number }) => {
                    scoreMap[r.post_id] = (scoreMap[r.post_id] || 0) + r.score;
                });
            }

            initialPosts = data.map((p: {
                id: number;
                title: string;
                content: string;
                created_at: string;
                user_id: string;
                tag: string;
                is_solved?: boolean;
                is_hidden?: boolean;
                board: string;
                profiles?: { username: string; major: string };
            }) => ({
                id: p.id,
                title: p.title || "제목 없음",
                content: p.content,
                author: p.profiles?.username || "익명",
                createdAt: p.created_at,
                user_id: p.user_id,
                major: p.profiles?.major || "전공무관",
                tag: p.tag || "일반",
                isSolved: p.is_solved || false,
                usefulScore: scoreMap[p.id] || 0,
                isHidden: p.is_hidden || false,
                board: p.board || "자유게시판",
            }));
        }
    } catch (e) {
        errorMessage = '서버 통신 중 심각한 오류가 발생했습니다.';
        console.error(e);
    }

    const pageTitle = isAllBoard ? '전체 게시글' : boardName;

    return (
        <div className="container mx-auto px-2 sm:px-4 max-w-4xl space-y-8 py-8">
            <KnowledgeCards />

            {errorMessage ? (
                <div className="p-10 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-center">
                    <p className="font-bold mb-2">데이터 로딩 실패: {pageTitle}</p>
                    <p>{errorMessage}</p>
                    <p className="mt-2 text-sm">페이지를 새로고침하거나 관리자에게 문의하세요.</p>
                </div>
            ) : (
                <PostList initialPosts={initialPosts} boardName={boardName} />
            )}
        </div>
    );
}
