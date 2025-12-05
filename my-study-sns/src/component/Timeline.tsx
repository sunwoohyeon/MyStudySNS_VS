"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BsHandThumbsUpFill } from "react-icons/bs";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/* ------------------------------------------------------------------------
📌 타입 정의
------------------------------------------------------------------------ */

// post_hashtags → hashtags(name) 관계 타입
interface PostHashtagRow {
  post_id: number;
  hashtags: {
    name: string;
  }[] | null;   // ✅ 배열로 변경
}

// 메인 Post 타입
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
  hashtags?: string[];
}

/* ------------------------------------------------------------------------
📌 상대시간 포맷 함수
------------------------------------------------------------------------ */

const formatRelativeTime = (date: string | Date) => {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diff < 60) return "방금 전";
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;

  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(d.getDate()).padStart(2, "0")}`;
};

/* ------------------------------------------------------------------------
📌 PostItem — 개별 게시글 UI + 수정/삭제 포함
------------------------------------------------------------------------ */

const PostItem: React.FC<{ post: Post; currentUserId?: string }> = ({
  post,
  currentUserId,
}) => {
  const router = useRouter();
  const isMyPost = currentUserId === post.user_id;

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  const handleSave = async () => {
    await fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    setIsEditing(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("삭제하시겠습니까?")) return;
    await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    router.refresh();
  };

  if (post.isHidden)
    return (
      <li className="py-4 px-4 text-sm text-gray-400 italic dark:text-gray-500">
        사용자 신고로 숨김 처리된 게시물입니다.
      </li>
    );

  return (
    <li className="py-4 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition rounded-md">
      <div className="flex items-start justify-between gap-4">
        {/* ---------------- LEFT ---------------- */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-sm rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2 mt-2">
                <button
                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
                  onClick={handleSave}
                >
                  저장
                </button>
                <button
                  className="px-2 py-1 bg-gray-300 dark:bg-gray-600 text-xs rounded"
                  onClick={() => setIsEditing(false)}
                >
                  취소
                </button>
              </div>
            </>
          ) : (
            <Link
              href={`/post/${post.id}`}
              className="block text-[15px] sm:text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 hover:underline"
            >
              {post.title}
            </Link>
          )}

          {/* 메타 정보 */}
          <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {post.author}
            </span>
            <span className="opacity-70">({post.major})</span>
            <span className="mx-1">·</span>
            <span>{formatRelativeTime(post.createdAt)}</span>

            {/* 해시태그 */}
            {post.hashtags?.length ? (
              <div className="flex gap-1 ml-2 flex-wrap">
                {post.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full text-[10px]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}

            {/* 수정 / 삭제 */}
            {isMyPost && !isEditing && (
              <div className="flex gap-2 ml-2">
                <button
                  className="text-blue-500 hover:underline"
                  onClick={() => setIsEditing(true)}
                >
                  수정
                </button>
                <button
                  className="text-red-500 hover:underline"
                  onClick={handleDelete}
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ---------------- RIGHT ---------------- */}
        <div className="hidden sm:flex flex-col items-end gap-2">
          {post.isSolved && (
            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs rounded-full">
              해결됨
            </span>
          )}

          <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded-full">
            {post.tag}
          </span>

          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <BsHandThumbsUpFill className="w-4 h-4 text-blue-500" />
            <span className="font-bold">{post.usefulScore.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </li>
  );
};

/* ------------------------------------------------------------------------
📌 BoardSection — 섹션 UI 묶음 (정렬 + 목록 + 더보기)
------------------------------------------------------------------------ */

const BoardSection: React.FC<{
  title: string;
  posts: Post[];
  sortBy: "latest" | "useful";
  onSortChange: (v: "latest" | "useful") => void;
  currentUserId?: string;
  limit?: number;
}> = ({ title, posts, sortBy, onSortChange, currentUserId, limit }) => {
  const list = limit ? posts.slice(0, limit) : posts;
  const link = title === "최신 게시글" ? "/board/all" : `/board/${title}`;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
        <h2 className="font-bold text-gray-900 dark:text-gray-100">{title}</h2>

        <div className="flex items-center gap-2 text-xs">
          <button
            className={
              sortBy === "latest"
                ? "font-bold text-blue-500"
                : "text-gray-500 dark:text-gray-400"
            }
            onClick={() => onSortChange("latest")}
          >
            최신순
          </button>
          <span className="text-gray-300">|</span>
          <button
            className={
              sortBy === "useful"
                ? "font-bold text-blue-500"
                : "text-gray-500 dark:text-gray-400"
            }
            onClick={() => onSortChange("useful")}
          >
            유용순
          </button>
        </div>

        <Link href={link} className="text-xs text-gray-500 hover:underline">
          + 더보기
        </Link>
      </div>

      <ul>
        {list.length ? (
          list.map((p) => (
            <PostItem key={p.id} post={p} currentUserId={currentUserId} />
          ))
        ) : (
          <li className="py-8 text-center text-gray-400 dark:text-gray-500">
            게시글이 없습니다.
          </li>
        )}
      </ul>
    </div>
  );
};

/* ------------------------------------------------------------------------
📌 Timeline — 무한스크롤 + 정렬 + 모든 게시판 출력
------------------------------------------------------------------------ */

export default function Timeline({ selectedTopic }: { selectedTopic: string }) {
  const supabase = createClientComponentClient();

  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>();
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const loader = useRef<HTMLDivElement | null>(null);

  const PAGE_SIZE = 10;

  // 정렬 상태
  const [sortOrders, setSortOrders] = useState({
    latest: "latest",
    freeBoard: "latest",
    qaBoard: "latest",
    studyNote: "latest",
  } as const);

  const changeSort = (
    key: keyof typeof sortOrders,
    value: "latest" | "useful"
  ) => setSortOrders((prev) => ({ ...prev, [key]: value }));

  /* ------------------ 유저 정보 로드 ------------------ */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id);
    });
  }, []);

  /* ---------------- 태그 바뀌면 리스트 초기화 ---------------- */
  useEffect(() => {
    setPage(0);
    setPosts([]);
    setHasMore(true);
  }, [selectedTopic]);

  /* ------------------ 게시글 불러오기 ------------------ */
  const fetchPosts = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("posts")
      .select(`*, profiles(username, major)`, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    // 태그 필터링
    if (selectedTopic !== "전체") {
      const { data: tagData } = await supabase
        .from("hashtags")
        .select("id")
        .eq("name", selectedTopic)
        .single();

      if (!tagData) {
        setHasMore(false);
        setIsLoading(false);
        return;
      }

      const { data: tagPosts } = await supabase
        .from("post_hashtags")
        .select("post_id")
        .eq("hashtag_id", tagData.id);

      const ids = tagPosts?.map((p) => p.post_id) || [];

      if (ids.length === 0) {
        setHasMore(false);
        setIsLoading(false);
        return;
      }

      query = query.in("id", ids);
    }

    const { data, count } = await query;

    if (data) {
      const postIds = data.map((p) => p.id);

      // 리뷰 점수 가져오기
      const { data: reviews } = await supabase
        .from("reviews")
        .select("post_id, score")
        .in("post_id", postIds);

      const scoreMap: Record<number, number> = {};
      reviews?.forEach((r) => {
        scoreMap[r.post_id] = (scoreMap[r.post_id] || 0) + r.score;
      });

      // 해시태그 가져오기
      const { data: tagRowsData } = await supabase
  .from("post_hashtags")
  .select("post_id, hashtags(name)")
  .in("post_id", postIds);

const tagRows = (tagRowsData ?? []) as PostHashtagRow[];
const tagMap: Record<number, string[]> = {};

tagRows.forEach((row) => {
  if (!tagMap[row.post_id]) tagMap[row.post_id] = [];

  row.hashtags?.forEach((h) => {
    if (h?.name) {
      tagMap[row.post_id].push(h.name);
    }
  });
});


      const newPosts: Post[] = data.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        author: p.profiles?.username,
        major: p.profiles?.major,
        createdAt: p.created_at,
        user_id: p.user_id,
        tag: p.tag,
        board: p.board,
        isSolved: false,
        isHidden: false,
        usefulScore: scoreMap[p.id] || 0,
        hashtags: tagMap[p.id] || [],
      }));

      setPosts((prev) => [...prev, ...newPosts]);

      if (data.length < PAGE_SIZE || (count && to >= count)) {
        setHasMore(false);
      }
    }

    setIsLoading(false);
  }, [page, selectedTopic, isLoading, hasMore]);

  /* -------- page가 바뀌면 fetch -------- */
  useEffect(() => {
    fetchPosts();
  }, [page]);

  /* -------- Intersection Observer (무한스크롤) -------- */
  useEffect(() => {
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "32px" }
    );

    if (loader.current) ob.observe(loader.current);
    return () => ob.disconnect();
  }, [hasMore, isLoading]);

  /* -------- 정렬 함수 -------- */
  const sort = (arr: Post[], mode: "latest" | "useful") =>
    [...arr].sort((a, b) =>
      mode === "useful"
        ? b.usefulScore - a.usefulScore
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  /* ====================================================================
  📌 최종 UI 렌더링
  ==================================================================== */

  return (
    <div className="p-2 sm:p-0 pb-10">
      <div className="space-y-8">
        {/* 최신 게시글 */}
        <BoardSection
          title="최신 게시글"
          posts={sort(posts, sortOrders.latest)}
          sortBy={sortOrders.latest}
          onSortChange={(v) => changeSort("latest", v)}
          currentUserId={currentUserId}
        />

        {/* 자유게시판 */}
        <BoardSection
          title="자유게시판"
          posts={sort(
            posts.filter((p) => !p.board || p.board === "자유게시판"),
            sortOrders.freeBoard
          )}
          sortBy={sortOrders.freeBoard}
          onSortChange={(v) => changeSort("freeBoard", v)}
          currentUserId={currentUserId}
          limit={5}
        />

        {/* 질문/답변 */}
        <BoardSection
          title="질문/답변"
          posts={sort(
            posts.filter((p) => p.board === "질문/답변"),
            sortOrders.qaBoard
          )}
          sortBy={sortOrders.qaBoard}
          onSortChange={(v) => changeSort("qaBoard", v)}
          currentUserId={currentUserId}
          limit={5}
        />

        {/* 스터디 노트 */}
        <BoardSection
          title="스터디 노트"
          posts={sort(
            posts.filter((p) => p.board === "스터디노트"),
            sortOrders.studyNote
          )}
          sortBy={sortOrders.studyNote}
          onSortChange={(v) => changeSort("studyNote", v)}
          currentUserId={currentUserId}
          limit={5}
        />
      </div>

      {/* infinite scroll trigger */}
      <div ref={loader} className="h-12 flex justify-center items-center mt-6">
        {isLoading && (
          <div className="flex gap-2 text-gray-400 animate-pulse">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}
