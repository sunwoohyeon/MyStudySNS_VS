"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BsHandThumbsUpFill } from "react-icons/bs";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/* ------------------------------------------------------------------------
📌 타입 정의
------------------------------------------------------------------------ */

interface HashtagRow {
  post_id: number;
  hashtags: { name: string }[] | { name: string } | null;
}

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

type SortMode = "latest" | "useful";
type SortKey = "latest" | "freeBoard" | "qaBoard" | "studyNote";

/* ------------------------------------------------------------------------
📌 상대 시간 포맷
------------------------------------------------------------------------ */

const formatRelativeTime = (date: string | Date): string => {
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
📌 PostItem — 개별 게시글 카드
------------------------------------------------------------------------ */

interface PostItemProps {
  post: Post;
  currentUserId?: string;
}

const PostItem: React.FC<PostItemProps> = ({ post, currentUserId }) => {
  const router = useRouter();
  const isMyPost = currentUserId === post.user_id;

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!editContent.trim()) return alert("내용을 입력해주세요.");

    try {
      setIsLoading(true);
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (!res.ok) throw new Error();
      setIsEditing(false);
      router.refresh();
    } catch {
      alert("게시글 수정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  if (post.isHidden) {
    return (
      <li className="py-3 px-4 text-gray-400 italic dark:text-gray-500">
        신고로 인해 숨긴 게시물입니다.
      </li>
    );
  }

  return (
    <li className="py-3 px-4 border-b last:border-0 bg-white dark:bg-gray-800 dark:border-gray-700">
      <div className="flex justify-between gap-4">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div>
              <textarea
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white"
                rows={3}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleSave}
                  className="bg-blue-500 text-white text-xs px-2 py-1 rounded"
                >
                  저장
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-300 text-xs px-2 py-1 rounded"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <Link
              href={`/post/${post.id}`}
              className="font-medium text-gray-800 dark:text-gray-200 block truncate hover:underline"
            >
              {post.title}
            </Link>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-1 mt-1">
            <span className="font-semibold">{post.author}</span>
            <span>({post.major})</span>
            <span>·</span>
            <span>{formatRelativeTime(post.createdAt)}</span>

            {post.hashtags && post.hashtags.length > 0 && (
              <div className="flex gap-1 ml-2 flex-wrap">
                {post.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 text-[10px] rounded bg-blue-50 dark:bg-blue-900/30 text-blue-500"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {isMyPost && !isEditing && (
              <span className="ml-2 flex gap-1">
                <button
                  className="text-blue-500 hover:underline"
                  onClick={() => setIsEditing(true)}
                >
                  수정
                </button>
                <span>|</span>
                <button
                  className="text-red-500 hover:underline"
                  onClick={handleDelete}
                >
                  삭제
                </button>
              </span>
            )}
          </div>
        </div>

        {/* PC Only */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded">
            {post.tag}
          </span>
          <div className="flex items-center gap-1">
            <BsHandThumbsUpFill className="text-blue-500" />
            <span>{post.usefulScore.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </li>
  );
};

/* ------------------------------------------------------------------------
📌 BoardSection
------------------------------------------------------------------------ */

const BoardSection = ({
  title,
  posts,
  sortBy,
  onSortChange,
  currentUserId,
  limit,
}: {
  title: string;
  posts: Post[];
  sortBy: SortMode;
  onSortChange: (mode: SortMode) => void;
  currentUserId?: string;
  limit?: number;
}) => {
  const boardLink =
    title === "최신 게시글" ? "/board/all" : `/board/${encodeURIComponent(title)}`;

  const displayPosts = limit ? posts.slice(0, limit) : posts;

  return (
    <div className="border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
      <div className="flex justify-between p-4 border-b dark:border-gray-700">
        <div className="flex gap-4">
          <h2 className="font-bold text-gray-800 dark:text-gray-100">{title}</h2>

          <div className="flex flex-wrap items-center gap-3 text-[11px] sm:text-xs">
            <button
              onClick={() => onSortChange("latest")}
              className={`
                    px-2 py-1 rounded-md transition
                    ${sortBy === "latest"
                      ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}
                  `}            
              >
              최신순
            </button>
            <span className="text-gray-300 dark:text-gray-600 select-none">|</span>
            <button
              onClick={() => onSortChange("useful")}
              className={`
                    px-2 py-1 rounded-md transition
                    ${sortBy === "useful"
                      ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}
                  `}
            >
              유용순
            </button>
          </div>
        </div>

        <Link href={boardLink} className="text-xs text-gray-500 hover:underline">
          + 더보기
        </Link>
      </div>

      <ul className="divide-y dark:divide-gray-700">
        {displayPosts.length > 0 ? (
          displayPosts.map((post) => (
            <PostItem key={post.id} post={post} currentUserId={currentUserId} />
          ))
        ) : (
          <li className="py-8 text-center text-gray-400">게시글이 없습니다.</li>
        )}
      </ul>
    </div>
  );
};

/* ------------------------------------------------------------------------
📌 Timeline — 무한스크롤 + 최신 게시글 규칙
------------------------------------------------------------------------ */

export default function Timeline({ selectedTopic }: { selectedTopic: string }) {
  const supabase = createClientComponentClient();

  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>();

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const loader = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 10;

  const [sortOrders, setSortOrders] = useState<Record<SortKey, SortMode>>({
    latest: "latest",
    freeBoard: "latest",
    qaBoard: "latest",
    studyNote: "latest",
  });

  const handleSortChange = (key: SortKey, mode: SortMode) => {
    setSortOrders((prev) => ({ ...prev, [key]: mode }));
  };

  /* ---------------- user info ---------------- */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id);
    });
  }, []);

  /* ---------------- topic change → reset ---------------- */
  useEffect(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
  }, [selectedTopic]);

  /* ---------------- fetch posts ---------------- */
  const fetchPosts = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    try {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("posts")
        .select(`*, profiles(username, major)`, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      // 태그 필터
      if (selectedTopic !== "전체") {
        const { data: tagInfo } = await supabase
          .from("hashtags")
          .select("id")
          .eq("name", selectedTopic)
          .single();

        if (!tagInfo) {
          setHasMore(false);
          setIsLoading(false);
          return;
        }

        const { data: tagged } = await supabase
          .from("post_hashtags")
          .select("post_id")
          .eq("hashtag_id", tagInfo.id);

        const ids = tagged?.map((x) => x.post_id) ?? [];

        if (ids.length === 0) {
          setHasMore(false);
          setIsLoading(false);
          return;
        }

        query = query.in("id", ids);
      }

      const { data, count } = await query;

      if (data?.length) {
        const ids = data.map((p: any) => p.id);

        /* 리뷰 점수 */
        const scoreMap: Record<number, number> = {};
        const { data: reviews } = await supabase
          .from("reviews")
          .select("post_id, score")
          .in("post_id", ids);

        reviews?.forEach((r) => {
          scoreMap[r.post_id] = (scoreMap[r.post_id] || 0) + r.score;
        });

        /* 해시태그 */
        const hashtagMap: Record<number, string[]> = {};
        const { data: hashtagData } = await supabase
          .from("post_hashtags")
          .select(
            `
            post_id,
            hashtags (name)
          `
          )
          .in("post_id", ids);

        (hashtagData as HashtagRow[])?.forEach((h) => {
        if (!hashtagMap[h.post_id]) hashtagMap[h.post_id] = [];

        const tags = h.hashtags;

        // 배열 형태일 때
        if (Array.isArray(tags)) {
          tags.forEach((t) => t?.name && hashtagMap[h.post_id].push(t.name));
        }
        // 단일 객체일 때
        else if (tags && typeof tags === "object" && "name" in tags) {
          hashtagMap[h.post_id].push(tags.name);
        }
        });


        const newPosts: Post[] = data.map((p: any) => ({
          id: p.id,
          title: p.title || "제목 없음",
          content: p.content,
          author: p.profiles?.username || "익명",
          createdAt: p.created_at,
          user_id: p.user_id,
          major: p.profiles?.major,
          tag: p.tag,
          usefulScore: scoreMap[p.id] || 0,
          isSolved: false,
          isHidden: false,
          board: p.board,
          hashtags: hashtagMap[p.id] ?? [],
        }));

        setPosts((prev) => [
          ...prev,
          ...newPosts.filter((x) => !prev.some((p) => p.id === x.id)),
        ]);

        if (count !== null && to >= count - 1) {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error(err);
    }

    setIsLoading(false);
  }, [page, selectedTopic, isLoading, hasMore]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  /* ---------------- infinite scroll ---------------- */
  useEffect(() => {
    if (!loader.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: "20px", threshold: 0 }
    );

    observer.observe(loader.current);

    return () => observer.disconnect();
  }, [isLoading, hasMore]);

  /* ---------------- 정렬 + 최신게시글 규칙 ---------------- */

  const sortPosts = (arr: Post[], mode: SortMode) =>
    [...arr].sort((a, b) =>
      mode === "useful"
        ? b.usefulScore - a.usefulScore
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  let latestPosts = sortPosts(posts, sortOrders.latest);

  if (latestPosts.length >= 10) {
    latestPosts = latestPosts.slice(0, 10);
  } else {
    latestPosts = latestPosts.filter(
      (p) => new Date(p.createdAt) >= oneWeekAgo
    );
  }

  const freeBoardPosts = sortPosts(
    posts.filter((p) => p.board === "자유게시판"),
    sortOrders.freeBoard
  );

  const qaPosts = sortPosts(
    posts.filter((p) => p.board === "질문/답변"),
    sortOrders.qaBoard
  );

  const studyNotePosts = sortPosts(
    posts.filter((p) => p.board === "스터디노트"),
    sortOrders.studyNote
  );

  /* ---------------- render ---------------- */

  return (
    <div className="p-2 sm:p-0 pb-10">
      <div className="space-y-8">
        <BoardSection
          title="최신 게시글"
          posts={latestPosts}
          sortBy={sortOrders.latest}
          onSortChange={(m) => handleSortChange("latest", m)}
          currentUserId={currentUserId}
        />

        <BoardSection
          title="자유게시판"
          posts={freeBoardPosts}
          sortBy={sortOrders.freeBoard}
          onSortChange={(m) => handleSortChange("freeBoard", m)}
          currentUserId={currentUserId}
          limit={5}
        />

        <BoardSection
          title="질문/답변"
          posts={qaPosts}
          sortBy={sortOrders.qaBoard}
          onSortChange={(m) => handleSortChange("qaBoard", m)}
          currentUserId={currentUserId}
          limit={5}
        />

        <BoardSection
          title="스터디 노트"
          posts={studyNotePosts}
          sortBy={sortOrders.studyNote}
          onSortChange={(m) => handleSortChange("studyNote", m)}
          currentUserId={currentUserId}
          limit={5}
        />
      </div>

      {/* 무한 스크롤 로더 */}
      <div ref={loader} className="h-10 flex justify-center items-center mt-4">
        {isLoading && (
          <div className="flex gap-2 text-gray-500">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            />
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
