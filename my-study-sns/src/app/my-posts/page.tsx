"use client";

import MainLayout from "@/component/MainLayout"; // 경로 수정
import { useAuth, Post } from "@/contexts/AuthContext";
import Link from "next/link";
import React from "react";
import { BsCheckCircleFill } from "react-icons/bs";

// 날짜 변환 함수
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

// ▼▼▼ MyPostItem 컴포넌트에 전공(major) 표시를 추가합니다. ▼▼▼
const MyPostItem: React.FC<{ post: Post }> = ({ post }) => (
  <Link href={`/post/${post.id}`} className="block p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
    <div className="flex items-center gap-2">
      <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full dark:bg-gray-700 dark:text-gray-300">
        {post.tag}
      </span>
      {post.isSolved && (
        <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
          <BsCheckCircleFill /> 해결됨
        </span>
      )}
    </div>
    <h3 className="font-bold text-lg mt-2 text-gray-900 dark:text-gray-100">{post.title}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
      {/* HTML 태그 제거 (간단 버전) */}
      {post.text.replace(/<[^>]*>?/gm, '')}
    </p>
    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
      {/* ▼▼▼ 전공과 시간을 함께 표시 ▼▼▼ */}
      <span>{post.major}</span>
      <span className="mx-1">·</span>
      <span>{formatRelativeTime(post.createdAt)}</span>
    </div>
  </Link>
);

export default function MyPostsPage() {
  const { posts, isLoggedIn } = useAuth();
  
  // "나"의 글만 필터링 (임시 로직)
  // 실제 앱에서는 유저 ID로 필터링해야 합니다.
  const myPosts = posts.filter(post => post.author === "나 (가짜 데이터)");

  if (!isLoggedIn) {
     return (
      <MainLayout>
        <div className="p-10 text-center">
          <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
          <p className="text-gray-600 dark:text-gray-400">내가 쓴 글을 보려면 로그인해주세요.</p>
          {/* 로그인 페이지 링크나 버튼을 여기에 추가 */}
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
            <p className="text-gray-600 dark:text-gray-400 mt-1">{myPosts.length}개의 글</p>
          </div>
          
          <div>
            {myPosts.length > 0 ? (
              myPosts.map(post => <MyPostItem key={post.id} post={post} />)
            ) : (
              <li className="py-10 px-4 text-center text-gray-500 italic">작성한 글이 없습니다.</li>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
