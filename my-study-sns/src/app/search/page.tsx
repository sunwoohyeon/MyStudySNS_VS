// src/app/search/page.tsx
"use client";

import MainLayout from "@/component/MainLayout";
import Link from "next/link";
import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { BsCheckCircleFill, BsHandThumbsUpFill } from "react-icons/bs";
import { FiSearch } from "react-icons/fi";

// UI 표시용 인터페이스 정의
interface SearchPost {
  id: number;
  title: string;
  content: string;
  tag: string;
  created_at: string;
  author: string;
  major: string;
  useful_score: number;
  is_solved: boolean;
}

// 날짜 포맷 함수
const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const typeParam = searchParams.get("type") || "all";
  const matchParam = searchParams.get("match") || "contains";

  const supabaseRef = useRef(createClientComponentClient());
  const supabase = supabaseRef.current;

  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [loading, setLoading] = useState(false);

  // 필터 상태
  const [searchType, setSearchType] = useState(typeParam);
  const [matchType, setMatchType] = useState(matchParam);
  const [searchInput, setSearchInput] = useState(query);

  // URL 파라미터가 변경되면 상태 동기화
  useEffect(() => {
    setSearchType(typeParam);
    setMatchType(matchParam);
    setSearchInput(query);
  }, [query, typeParam, matchParam]);

  // 검색 실행
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchInput.trim()) return;

    const params = new URLSearchParams();
    params.set("q", searchInput.trim());
    params.set("type", searchType);
    params.set("match", matchType);

    router.push(`/search?${params.toString()}`);
  };

  // 필터 변경 시 자동 검색
  const handleFilterChange = (newType: string, newMatch: string) => {
    if (!query) return;

    const params = new URLSearchParams();
    params.set("q", query);
    params.set("type", newType);
    params.set("match", newMatch);

    router.push(`/search?${params.toString()}`);
  };

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) return;

      setLoading(true);
      try {
        let allData: any[] = [];

        // 해시태그 검색 헬퍼 함수
        const searchByHashtag = async () => {
          // 1. hashtags 테이블에서 매칭되는 해시태그 ID 찾기
          let hashtagQuery = supabase.from('hashtags').select('id');
          if (matchType === "exact") {
            hashtagQuery = hashtagQuery.eq('name', query);
          } else {
            hashtagQuery = hashtagQuery.ilike('name', `%${query}%`);
          }
          const { data: hashtags } = await hashtagQuery;
          const hashtagIds = (hashtags || []).map((h: any) => h.id);

          if (hashtagIds.length === 0) return [];

          // 2. post_hashtags에서 해당 해시태그를 가진 게시글 ID 찾기
          const { data: postHashtags } = await supabase
            .from('post_hashtags')
            .select('post_id')
            .in('hashtag_id', hashtagIds);
          const postIds = (postHashtags || []).map((ph: any) => ph.post_id);

          if (postIds.length === 0) return [];

          // 3. 해당 게시글들 조회
          const { data, error } = await supabase
            .from('posts')
            .select('*, profiles(username, major)')
            .in('id', postIds)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data || [];
        };

        // 검색 대상과 방식에 따라 쿼리 빌드
        if (searchType === "hashtag") {
          // 해시태그 검색
          allData = await searchByHashtag();

        } else if (searchType === "author") {
          // 작성자 검색
          let queryBuilder = supabase
            .from('posts')
            .select(`*, profiles!inner(username, major)`);

          if (matchType === "exact") {
            queryBuilder = queryBuilder.eq('profiles.username', query);
          } else {
            queryBuilder = queryBuilder.ilike('profiles.username', `%${query}%`);
          }

          const { data, error } = await queryBuilder.order('created_at', { ascending: false });
          if (error) throw error;
          allData = data || [];

        } else if (searchType === "all") {
          // 전체 검색: 제목, 내용, 태그 + 작성자 모두 검색
          // 1. 제목, 내용, 태그 검색
          let postQuery = supabase
            .from('posts')
            .select(`*, profiles(username, major)`);

          if (matchType === "exact") {
            postQuery = postQuery.or(`title.eq.${query},content.eq.${query},tag.eq.${query}`);
          } else {
            postQuery = postQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%,tag.ilike.%${query}%`);
          }

          const { data: postData, error: postError } = await postQuery.order('created_at', { ascending: false });
          if (postError) throw postError;

          // 2. 작성자 검색
          let authorQuery = supabase
            .from('posts')
            .select(`*, profiles!inner(username, major)`);

          if (matchType === "exact") {
            authorQuery = authorQuery.eq('profiles.username', query);
          } else {
            authorQuery = authorQuery.ilike('profiles.username', `%${query}%`);
          }

          const { data: authorData, error: authorError } = await authorQuery.order('created_at', { ascending: false });
          if (authorError) throw authorError;

          // 3. 해시태그 검색
          const hashtagData = await searchByHashtag();

          // 4. 세 결과 합치기 (중복 제거)
          const postIds = new Set((postData || []).map((p: any) => p.id));
          const uniqueAuthorData = (authorData || []).filter((p: any) => !postIds.has(p.id));

          // 작성자 검색 결과 ID도 추가
          uniqueAuthorData.forEach((p: any) => postIds.add(p.id));
          const uniqueHashtagData = hashtagData.filter((p: any) => !postIds.has(p.id));

          allData = [...(postData || []), ...uniqueAuthorData, ...uniqueHashtagData];

          // 날짜순 정렬
          allData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        } else {
          // 제목 또는 내용 검색
          let queryBuilder = supabase
            .from('posts')
            .select(`*, profiles(username, major)`);

          if (matchType === "exact") {
            if (searchType === "title") {
              queryBuilder = queryBuilder.eq('title', query);
            } else {
              queryBuilder = queryBuilder.eq('content', query);
            }
          } else {
            if (searchType === "title") {
              queryBuilder = queryBuilder.ilike('title', `%${query}%`);
            } else {
              queryBuilder = queryBuilder.ilike('content', `%${query}%`);
            }
          }

          const { data, error } = await queryBuilder.order('created_at', { ascending: false });
          if (error) throw error;
          allData = data || [];
        }

        const formattedData: SearchPost[] = allData.map((item: any) => ({
          id: item.id,
          title: item.title || "제목 없음",
          content: item.content || "",
          tag: item.tag || "일반",
          created_at: item.created_at,
          author: item.profiles?.username || "알 수 없음",
          major: item.profiles?.major || "전공 미입력",
          useful_score: 0,
          is_solved: false,
        }));

        setPosts(formattedData);
      } catch (err) {
        console.error("검색 에러:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchType, matchType]);

  return (
    <div className="max-w-4xl mx-auto w-full py-8 px-4">
      {/* 검색 입력창 */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="검색어를 입력하세요..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            검색
          </button>
        </div>
      </form>

      {/* 검색 필터 */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* 검색 대상 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">검색 대상:</span>
          <select
            value={searchType}
            onChange={(e) => {
              setSearchType(e.target.value);
              if (query) handleFilterChange(e.target.value, matchType);
            }}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체</option>
            <option value="title">제목</option>
            <option value="content">내용</option>
            <option value="author">작성자</option>
            <option value="hashtag">해시태그</option>
          </select>
        </div>

        {/* 검색 방식 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">검색 방식:</span>
          <select
            value={matchType}
            onChange={(e) => {
              setMatchType(e.target.value);
              if (query) handleFilterChange(searchType, e.target.value);
            }}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="contains">포함</option>
            <option value="exact">정확히 일치</option>
          </select>
        </div>
      </div>

      {/* 검색 결과 헤더 */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {query ? `'${query}' 검색 결과` : "검색어를 입력해주세요"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {loading ? "검색 중..." : query ? `총 ${posts.length}개의 게시글을 찾았습니다.` : ""}
        </p>
      </div>

      {/* 결과 리스트 */}
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 h-32"></div>
          ))
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all group"
            >
              {/* 상단: 태그 및 상태 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-xs font-semibold px-2 py-1 rounded">
                    #{post.tag}
                  </span>
                  {post.is_solved && (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400">
                      <BsCheckCircleFill /> 해결됨
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{formatRelativeTime(post.created_at)}</span>
              </div>

              {/* 중단: 제목 및 내용 미리보기 */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {post.content.replace(/<[^>]*>?/gm, '')}
              </p>

              {/* 하단: 작성자 정보 */}
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{post.author}</span>
                  <span>·</span>
                  <span>{post.major}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BsHandThumbsUpFill className="text-blue-400" />
                  <span>{post.useful_score}</span>
                </div>
              </div>
            </Link>
          ))
        ) : query ? (
          <div className="py-20 text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg">검색 결과가 없습니다.</p>
            <p className="text-sm mt-2">다른 키워드로 검색해보세요.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="max-w-4xl mx-auto w-full py-8 px-4">
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mt-2 animate-pulse"></div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 h-32"></div>
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <MainLayout>
      <Suspense fallback={<SearchFallback />}>
        <SearchContent />
      </Suspense>
    </MainLayout>
  );
}
