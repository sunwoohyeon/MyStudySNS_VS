"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import MainLayout from "@/component/MainLayout";
import Link from "next/link";
import PostInteraction from "@/component/PostInteraction";
import CommentSection from "@/component/CommentSection";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface PostDetail {
  id: number;
  title: string;
  content: string;
  created_at: string;
  tag: string;
  board: string;
  user_id: string;
  image_url: string | null;
  profiles: {
    username: string;
  } | null;
  post_hashtags?: {
    hashtags: {
      name: string;
    } | null;
  }[];
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabaseRef = useRef(createClientComponentClient());
  const supabase = supabaseRef.current;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      // 1. 현재 로그인 유저 확인
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);

      // 2. URL에서 게시글 ID 가져오기
      const postId = params.id;

      // 3. DB에서 해당 게시글 조회 (해시태그 포함)
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *, 
          profiles(username),
          post_hashtags(
            hashtags(name)
          )
        `)
        .eq("id", postId)
        .single();

      if (error) {
        console.error(error);
        alert("게시글을 불러오지 못했습니다.");
        router.push("/"); // 에러 시 메인으로 튕기기
        return;
      }

      setPost(data);
      setIsLoading(false);
    };

    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, router]);

  // 삭제 기능
  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const { error } = await supabase.from("posts").delete().eq("id", post?.id);

    if (error) {
      alert("삭제 실패");
    } else {
      alert("삭제되었습니다.");
      router.replace("/"); // 삭제 후 메인으로 이동
    }
  };

  // 지식 카드 생성 기능
  const handleGenerateCard = async () => {
    if (!confirm("이 게시글을 기반으로 AI 지식 카드를 생성하시겠습니까?")) return;
    setIsGeneratingCard(true);
    try {
      const res = await fetch("/api/knowledge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post?.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.message) {
          alert(data.message); // "이미 존재합니다" 등
        } else {
          throw new Error(data.error || "생성 실패");
        }
      } else {
        alert("✨ 지식 카드가 성공적으로 생성되었습니다!");
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingCard(false);
    }
  };

  if (isLoading) return <MainLayout><div className="text-center py-20">로딩 중...</div></MainLayout>;
  if (!post) return <MainLayout><div className="text-center py-20">게시글이 없습니다.</div></MainLayout>;

  const isMyPost = currentUserId === post.user_id;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto w-full py-8 px-4">

        {/* 뒤로가기 버튼 */}
        <Link href="/" className="text-gray-500 hover:text-blue-600 mb-4 inline-block">
          &larr; 목록으로 돌아가기
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden p-6 sm:p-8">

          {/* 게시글 헤더 (태그, 제목, 날짜) */}
          <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                {post.board}
              </span>
              {/* 동적 해시태그 표시 */}
              {post.post_hashtags && post.post_hashtags.length > 0 ? (
                post.post_hashtags.map((ph, idx) => (
                  ph.hashtags && (
                    <span key={idx} className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                      #{ph.hashtags.name}
                    </span>
                  )
                ))
              ) : (
                // 해시태그가 없을 경우 기존 태그 표시 (하위 호환성)
                <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                  #{post.tag}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {post.title}
            </h1>

            <div className="flex justify-between items-end">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-gray-200">
                  {post.profiles?.username || "알 수 없음"}
                </span>
                <span className="mx-2">|</span>
                <span>{new Date(post.created_at).toLocaleString()}</span>
              </div>

              {/* 본인 글일 경우 삭제 버튼 및 지식카드 생성 버튼 표시 */}
              {isMyPost && (
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateCard}
                    disabled={isGeneratingCard}
                    className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded text-sm transition disabled:opacity-50"
                  >
                    {isGeneratingCard ? "생성 중..." : "✨ 지식카드 만들기"}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-red-500 hover:bg-red-50 px-3 py-1 rounded text-sm transition"
                  >
                    삭제하기
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* (구) 게시글 이미지 렌더링 영역 - 하위 호환성 유지 */}
          {post.image_url && (
            <div className="mb-8 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 bg-gray-50">
              <img
                src={post.image_url}
                alt="게시글 첨부 이미지"
                className="w-full h-auto object-contain max-h-[500px]"
              />
            </div>
          )}

          {/* 게시글 본문 (마크다운 렌더링) */}
          <div className="prose dark:prose-invert max-w-none mb-12 break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={{
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                p: ({ node, ref, ...props }: any) => <p style={{ whiteSpace: "pre-wrap", minHeight: "1em" } as any} {...props} />
              }}
            >
              {post.content.replace(/\n(?=\n)/g, "\n\u00A0")}
            </ReactMarkdown>
          </div>

          {/* 리뷰 및 신고 기능 */}
          <PostInteraction postId={Number(params.id)} />

          {/* 댓글 섹션 */}
          <CommentSection
            postId={Number(params.id)}
            postAuthorId={post.user_id}
            boardType={post.board}
          />

        </div>
      </div>
    </MainLayout>
  );
}