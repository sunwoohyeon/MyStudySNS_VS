"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BsHandThumbsUpFill } from "react-icons/bs";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// --- 타입 정의 ---
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
  hashtags?: string[]; // ★ 해시태그 추가
}

// --- 날짜 변환 함수 ---
const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const postDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  if (diffInSeconds < 60) return "방금 전";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}시간 전`;

  const year = postDate.getFullYear();
  const month = String(postDate.getMonth() + 1).padStart(2, '0');
  const day = String(postDate.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

// --- 개별 포스트 아이템 ---
const PostItem: React.FC<{ post: Post; currentUserId?: string }> = ({ post, currentUserId }) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isLoading, setIsLoading] = useState(false);

  const isMyPost = currentUserId === post.user_id;

  // --- 수정 버튼 클릭 시 처리 ---
  const handleSave = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error('수정 실패');
      setIsEditing(false);
      router.refresh();
    } catch (e) {
      alert('오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 삭제 버튼 클릭 시 처리 ---
  const handleDelete = async () => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      router.refresh();
    } catch (e) {
      alert('삭제 실패');
    }
  };

  if (post.isHidden) {
    return (
      <li className="py-3 px-4 text-sm text-gray-400 italic dark:text-gray-500">
        사용자들의 신고로 숨김 처리된 게시물입니다.
      </li>
    );
  }

  return (
    <li className="py-3 px-4 border-b border-gray-100 dark:border-gray-700 last:border-0 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 overflow-hidden min-w-0">
          {isEditing ? (
            <div className="mb-2">
              <textarea
                className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2 mt-1">
                <button onClick={handleSave} className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition">저장</button>
                <button onClick={() => setIsEditing(false)} className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition">취소</button>
              </div>
            </div>
          ) : (
            <Link href={`/post/${post.id}`} className="text-base font-medium text-gray-800 dark:text-gray-200 hover:underline block truncate">
              {post.title}
            </Link>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-1">
            <span className="font-semibold">{post.author}</span>
            <span className="ml-1 opacity-75">({post.major})</span>
            <span className="mx-1">·</span>
            <span>{formatRelativeTime(post.createdAt)}</span>

            {/* ★ 해시태그 표시 */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="flex gap-1 ml-2">
                {post.hashtags.map((tag, idx) => (
                  <span key={idx} className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded text-[10px]">#{tag}</span>
                ))}
              </div>
            )}

            {isMyPost && !isEditing && (
              <div className="ml-3 flex gap-1">
                <button onClick={() => setIsEditing(true)} className="text-blue-500 hover:underline">수정</button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button onClick={handleDelete} className="text-red-500 hover:underline">삭제</button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 mt-0.5 hidden sm:flex">
          {post.isSolved && (
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full dark:bg-green-900/50 dark:text-green-300">해결됨</span>
          )}
          <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full dark:bg-gray-700 dark:text-gray-300">{post.tag}</span>
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <BsHandThumbsUpFill className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span className="font-bold w-6 text-right">{post.usefulScore.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </li>
  );
};

// --- 게시판 섹션 (BoardSection) ---
const BoardSection: React.FC<{
  title: string;
  posts: Post[];
  sortBy: 'latest' | 'useful';
  onSortChange: (sortBy: 'latest' | 'useful') => void;
  currentUserId?: string;
  limit?: number;
}> = ({ title, posts, sortBy, onSortChange, currentUserId, limit }) => {
  const SortButtons = (
    <div className="flex items-center text-xs space-x-2">
      <button onClick={() => onSortChange('latest')} className={sortBy === 'latest' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}>최신순</button>
      <span className="text-gray-300 dark:text-gray-600">|</span>
      <button onClick={() => onSortChange('useful')} className={sortBy === 'useful' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}>유용순</button>
    </div>
  );

  const boardLink = title === "최신 게시글" ? "/board/all" : `/board/${encodeURIComponent(title)}`;
  const displayPosts = limit ? posts.slice(0, limit) : posts;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300">
      <div className="flex justify-between items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 flex-shrink-0">{title}</h2>
          {SortButtons}
        </div>
        <Link href={boardLink} className="text-xs text-gray-500 dark:text-gray-400 hover:underline flex-shrink-0">
          + 더보기
        </Link>
      </div>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {displayPosts.length > 0 ? (
          displayPosts.map(post => (<PostItem key={post.id} post={post} currentUserId={currentUserId} />))
        ) : (
          <li className="py-8 px-4 text-sm text-gray-400 italic text-center dark:text-gray-500">게시글이 없습니다.</li>
        )}
      </ul>
    </div>
  );
};

// --- 메인 타임라인 컴포넌트 ---
export default function Timeline({ selectedTopic }: { selectedTopic: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const supabase = createClientComponentClient();

  // 무한 스크롤 관련 상태
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const loader = useRef(null);
  const PAGE_SIZE = 10; // 한 번에 불러올 개수

  // 1. 초기 유저 확인
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
    };
    checkUser();
  }, [supabase]);

  // 2. 태그(selectedTopic)가 바뀌면 초기화
  useEffect(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
  }, [selectedTopic]);

  // 3. 데이터 Fetching 함수 (태그 필터링 + 페이지네이션 적용)
  const fetchPosts = useCallback(async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    try {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('posts')
        .select(`
          *, 
          profiles(username, major)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // ★ 1순위: 태그 필터링 적용 (새로운 해시태그 시스템 사용)
      if (selectedTopic !== "전체") {
        // 1. 해당 해시태그를 가진 게시글 ID 찾기
        const { data: tagData, error: tagError } = await supabase
          .from('hashtags')
          .select('id')
          .eq('name', selectedTopic)
          .single();

        if (tagError || !tagData) {
          // 태그가 없으면 게시글도 없음
          setPosts([]);
          setHasMore(false);
          setIsLoading(false);
          return;
        }

        const { data: postTags } = await supabase
          .from('post_hashtags')
          .select('post_id')
          .eq('hashtag_id', tagData.id);

        const filteredPostIds = postTags?.map((pt: any) => pt.post_id) || [];

        if (filteredPostIds.length === 0) {
          setPosts([]);
          setHasMore(false);
          setIsLoading(false);
          return;
        }

        // 2. 해당 ID를 가진 게시글만 조회
        query = query.in('id', filteredPostIds);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      if (data) {
        // ★ 리뷰 점수 및 해시태그 가져오기
        const postIds = data.map((p: any) => p.id);
        let scoreMap: Record<number, number> = {};
        let hashtagMap: Record<number, string[]> = {};

        if (postIds.length > 0) {
          // 1. 리뷰 점수 가져오기
          const { data: reviews } = await supabase
            .from('reviews')
            .select('post_id, score')
            .in('post_id', postIds);

          reviews?.forEach((r: any) => {
            scoreMap[r.post_id] = (scoreMap[r.post_id] || 0) + r.score;
          });

          // 2. 해시태그 가져오기 (별도 쿼리로 분리하여 안정성 확보)
          const { data: hashtagsData } = await supabase
            .from('post_hashtags')
            .select(`
              post_id,
              hashtags (name)
            `)
            .in('post_id', postIds);

          hashtagsData?.forEach((h: any) => {
            if (!hashtagMap[h.post_id]) {
              hashtagMap[h.post_id] = [];
            }
            if (h.hashtags?.name) {
              hashtagMap[h.post_id].push(h.hashtags.name);
            }
          });
        }

        const newPosts: Post[] = data.map((p: any) => ({
          id: p.id,
          title: p.title || "제목 없음",
          content: p.content,
          author: p.profiles?.username || "익명",
          createdAt: p.created_at,
          user_id: p.user_id,
          major: p.profiles?.major || "전공무관",
          tag: p.tag || "일반",
          isSolved: false,
          usefulScore: scoreMap[p.id] || 0,
          isHidden: false,
          board: p.board || "자유게시판",
          // ★ 해시태그 매핑 (별도 조회 결과 사용)
          hashtags: hashtagMap[p.id] || []
        }));

        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPosts];
        });

        if (count !== null && from + PAGE_SIZE >= count) {
          setHasMore(false);
        } else if (data.length < PAGE_SIZE) {
          setHasMore(false);
        }
      }
    } catch (err: any) {
      // ★ 디버깅을 위한 상세 로그 출력
      console.error('FetchPosts Error Details:', err);
      if (err?.message) console.error('Error Message:', err.message);
      if (err?.details) console.error('Error Details:', err.details);
      if (err?.hint) console.error('Error Hint:', err.hint);

      // 사용자에게 알림 (선택 사항)
      // alert("게시글을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedTopic, hasMore, isLoading, supabase]);

  // page 상태가 바뀌면 fetch 실행
  useEffect(() => {
    fetchPosts();
  }, [page, selectedTopic]);

  // 4. Infinite Scroll Observer (바닥 감지)
  useEffect(() => {
    const option = { root: null, rootMargin: "20px", threshold: 0 };
    const observer = new IntersectionObserver(entries => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoading) {
        setPage(prev => prev + 1);
      }
    }, option);

    if (loader.current) observer.observe(loader.current);

    return () => {
      if (loader.current) observer.unobserve(loader.current);
    };
  }, [hasMore, isLoading]);

  // --- 정렬 및 분류 로직 ---
  const [sortOrders, setSortOrders] = useState({
    latest: 'latest' as 'latest' | 'useful',
    freeBoard: 'latest' as 'latest' | 'useful',
    qaBoard: 'latest' as 'latest' | 'useful',
    studyNote: 'latest' as 'latest' | 'useful',
  });
  const handleSortChange = (boardKey: keyof typeof sortOrders, sortBy: 'latest' | 'useful') => { setSortOrders(prev => ({ ...prev, [boardKey]: sortBy })); };

  const sortPosts = (postsToSort: Post[], sortBy: 'latest' | 'useful') => {
    return [...postsToSort].sort((a, b) => {
      if (sortBy === 'useful') return b.usefulScore - a.usefulScore;
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  };

  const latestSorted = sortPosts(posts, sortOrders.latest);
  const freeBoardSorted = sortPosts(posts.filter(p => p.board === '자유게시판' || !p.board), sortOrders.freeBoard);
  const qaBoardSorted = sortPosts(posts.filter(p => p.board === '질문/답변'), sortOrders.qaBoard);
  const studyNoteSorted = sortPosts(posts.filter(p => p.board === '스터디노트'), sortOrders.studyNote);

  return (
    <div className="p-2 sm:p-0 pb-10">
      <div className="space-y-8">
        <BoardSection
          title="최신 게시글"
          posts={latestSorted}
          sortBy={sortOrders.latest}
          onSortChange={(sort) => handleSortChange('latest', sort)}
          currentUserId={currentUserId}
        />
        <BoardSection title="자유게시판" posts={freeBoardSorted} sortBy={sortOrders.freeBoard} onSortChange={(sort) => handleSortChange('freeBoard', sort)} currentUserId={currentUserId} limit={5} />
        <BoardSection title="질문/답변" posts={qaBoardSorted} sortBy={sortOrders.qaBoard} onSortChange={(sort) => handleSortChange('qaBoard', sort)} currentUserId={currentUserId} limit={5} />
        <BoardSection title="스터디 노트" posts={studyNoteSorted} sortBy={sortOrders.studyNote} onSortChange={(sort) => handleSortChange('studyNote', sort)} currentUserId={currentUserId} limit={5} />
      </div>

      {/* ★ 무한 스크롤 트리거 */}
      <div ref={loader} className="h-10 flex justify-center items-center mt-4">
        {isLoading && (
          <div className="flex gap-2 items-center text-gray-500">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
      </div>
    </div>
  );
}
