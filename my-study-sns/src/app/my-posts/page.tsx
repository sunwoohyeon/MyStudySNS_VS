"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import MainLayout from "@/component/MainLayout";
import Link from "next/link";
import { BsCheckCircleFill } from "react-icons/bs";

interface Post {
  id: number;
  title: string;
  content: string;
  tag: string;
  board: string;
  created_at: string;
  is_solved?: boolean;
}

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

const MyPostItem: React.FC<{ post: Post }> = ({ post }) => (
  <Link href={`/post/${post.id}`} className="block p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
    <div className="flex items-center gap-2">
      <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full dark:bg-gray-700 dark:text-gray-300">
        {post.board}
      </span>
      <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300">
        #{post.tag}
      </span>
      {post.is_solved && (
        <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
          <BsCheckCircleFill /> 해결됨
        </span>
      )}
    </div>
    <h3 className="font-bold text-lg mt-2 text-gray-900 dark:text-gray-100">{post.title || "제목 없음"}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
      {post.content.replace(/<[^>]*>?/gm, '')}
    </p>
    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
      <span>{formatRelativeTime(post.created_at)}</span>
    </div>
  </Link>
);

export default function MyPostsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchMyPosts = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsLoggedIn(false);
        setIsLoading(false);
        return;
      }

      setIsLoggedIn(true);

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('내 글 조회 에러:', error);
      } else {
        setPosts(data || []);
      }

      setIsLoading(false);
    };

    fetchMyPosts();
  }, [supabase, router]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-10 text-center text-gray-500">로딩 중...</div>
      </MainLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <MainLayout>
        <div className="p-10 text-center">
          <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
          <p className="text-gray-600 dark:text-gray-400">내가 쓴 글을 보려면 로그인해주세요.</p>
          <Link href="/login" className="text-blue-500 hover:underline mt-4 inline-block">
            로그인하기
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">내가 쓴 글</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{posts.length}개의 글</p>
          </div>

          <div>
            {posts.length > 0 ? (
              posts.map(post => <MyPostItem key={post.id} post={post} />)
            ) : (
              <div className="py-10 px-4 text-center text-gray-500 italic">
                작성한 글이 없습니다.
                <Link href="/write" className="text-blue-500 hover:underline ml-2">
                  첫 글 작성하기
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
