// src/app/board/[boardName]/page.tsx (최종 수정 - Server Component)

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import KnowledgeCards from "@/component/KnowledgeCards";
import PostList from "@/component/PostList"; // ★ 클라이언트 컴포넌트 분리

// --- DB 스키마에 맞는 타입 정의 (실제 프로젝트에 맞춰야 함) ---
// Post 타입은 DB에서 가져온 데이터 형태를 반영해야 합니다.
interface Post {
    id: number;
    title: string;
    content: string;
    author: string; // profiles에서 join된 username
    createdAt: string;
    major: string; // profiles에서 join된 major
    tag: string;
    isSolved: boolean;
    usefulScore: number;
    isHidden: boolean;
    board: string;
    user_id: string;
}

// Next.js가 동적으로 파라미터를 읽습니다.
interface BoardPageProps {
    params: {
        boardName: string; // URL의 [boardName] 값 (예: '자유게시판')
    };
}

// Server Component: DB 접근 및 데이터 로딩 담당
export default async function BoardPage({ params }: BoardPageProps) {
    const boardName = decodeURIComponent(params.boardName);
    const isAllBoard = boardName === 'all';
    const supabase = createServerComponentClient({ cookies });

    let initialPosts: Post[] = [];
    let errorMessage: string | null = null;

    try {
        // DB에서 해당 게시판의 글을 가져옵니다.
        // 현재는 서버에서 100개만 가져오고, 클라이언트에서 필터링/정렬/페이지네이션을 처리합니다.
        let query = supabase
            .from('posts')
            .select('*, profiles(username, major)') // user 정보 JOIN
            .order('created_at', { ascending: false })
            .limit(100); // 성능을 위해 상위 100개만 가져옵니다.

        // 특정 게시판만 필터링
        if (!isAllBoard) {
            query = query.eq('board', boardName);
        }

        const { data, error } = await query;

        if (error) {
            console.error('BoardPage Data Fetching Error:', error);
            errorMessage = '게시글 데이터를 불러오는 중 오류가 발생했습니다.';
        } else if (data) {
            // ★ 리뷰 점수 가져오기
            const postIds = data.map((p: any) => p.id);
            let scoreMap: Record<number, number> = {};

            if (postIds.length > 0) {
                const { data: reviews } = await supabase
                    .from('reviews')
                    .select('post_id, score')
                    .in('post_id', postIds);

                reviews?.forEach((r: any) => {
                    scoreMap[r.post_id] = (scoreMap[r.post_id] || 0) + r.score;
                });
            }

            initialPosts = data.map((p: any) => ({
                id: p.id,
                title: p.title || "제목 없음",
                content: p.content,
                author: p.profiles?.username || "익명",
                createdAt: p.created_at,
                user_id: p.user_id,
                major: p.profiles?.major || "전공무관",
                tag: p.tag || "일반",
                isSolved: p.is_solved || false,
                usefulScore: scoreMap[p.id] || 0, // ★ 계산된 점수 적용
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
        // 전역 레이아웃은 layout.tsx가 담당하므로 MainLayout은 제거되었습니다.
        <div className="container mx-auto px-2 sm:px-4 max-w-4xl space-y-8 py-8">

            <KnowledgeCards />

            {errorMessage ? (
                // 오류 메시지 표시 (다크 모드 지원)
                <div className="p-10 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-center">
                    <p className="font-bold mb-2">데이터 로딩 실패: {pageTitle}</p>
                    <p>{errorMessage}</p>
                    <p className="mt-2 text-sm">페이지를 새로고침하거나 관리자에게 문의하세요.</p>
                </div>
            ) : (
                // 데이터가 정상적으로 로드되면 클라이언트 컴포넌트에 전달
                <PostList initialPosts={initialPosts} boardName={boardName} />
            )}
        </div>
    );
}