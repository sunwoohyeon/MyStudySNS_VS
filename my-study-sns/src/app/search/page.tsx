// src/app/search/page.tsx
"use client";

import MainLayout from "@/component/MainLayout";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { BsCheckCircleFill, BsHandThumbsUpFill } from "react-icons/bs";

// UI 표시용 인터페이스 정의
interface SearchPost {
  id: number;
  title: string;
  content: string;
  tag: string;
  created_at: string;
  author: string;     // joined from profiles
  major: string;      // joined from profiles
  useful_score: number; // 실제 DB에는 없을 수 있으니 임시 처리하거나 reviews 조인 필요
  is_solved: boolean; // DB 컬럼명 확인 필요 (여기선 가정)
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

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || ""; // URL에서 검색어 추출
  const supabase = createClientComponentClient();

  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [loading, setLoading] = useState(false);

  // ★ Supabase DB 검색 실행
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) return;

      setLoading(true);
      try {
        // Supabase .or() 문법을 사용하여 다중 컬럼 검색 (LIKE 검색)
        // posts 테이블 조회 + profiles 테이블 조인 (닉네임, 전공 가져오기)
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles (username, major)
          `)
          .or(`title.ilike.%${query}%,content.ilike.%${query}%,tag.ilike.%${query}%`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // DB 데이터를 UI 포맷으로 변환
        const formattedData: SearchPost[] = (data || []).map((item: any) => ({
          id: item.id,
          title: item.title || "제목 없음",
          content: item.content || "",
          tag: item.tag || "일반",
          created_at: item.created_at,
          author: item.profiles?.username || "알 수 없음",
          major: item.profiles?.major || "전공 미입력",
          useful_score: 0, // 평점 기능 구현 시 reviews 테이블 집계 필요 (현재는 0)
          is_solved: false, // 채택 기능 구현 시 필드 연동 필요
        }));

        setPosts(formattedData);
      } catch (err) {
        console.error("검색 에러:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, supabase]);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto w-full py-8 px-4">
        
        {/* 검색 결과 헤더 */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {query ? `'${query}' 검색 결과` : "검색어를 입력해주세요"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {loading ? "검색 중..." : `총 ${posts.length}개의 게시글을 찾았습니다.`}
          </p>
        </div>

        {/* 결과 리스트 */}
        <div className="space-y-4">
          {loading ? (
             // 로딩 스켈레톤 UI
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
                  {post.content.replace(/<[^>]*>?/gm, '')} {/* HTML 태그 제거 */}
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
          ) : (
            // 검색 결과 없음
            <div className="py-20 text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg">검색 결과가 없습니다.</p>
              <p className="text-sm mt-2">다른 키워드로 검색해보세요.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}