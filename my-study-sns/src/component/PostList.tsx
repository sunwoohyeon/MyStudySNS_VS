// src/component/PostList.tsx
"use client";

import React, { useState, useMemo } from 'react';
import Link from "next/link";
import { BsHandThumbsUpFill } from "react-icons/bs";
import { FiArrowLeft } from "react-icons/fi";

// --- 타입 정의 (BoardPage에서 넘겨받음) ---
// Post 타입은 프로젝트 전역에서 사용되는 타입이라고 가정합니다.
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

// --- 개별 포스트 UI 컴포넌트 ---
const PostItem: React.FC<{ post: Post }> = ({ post }) => {
    if (post.isHidden) {
        return (
            <li className="py-3 px-4 text-sm text-gray-400 italic dark:text-gray-500 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-0">
                사용자들의 신고로 숨김 처리된 게시물입니다.
            </li>
        );
    }

    return (
        // ★ 다크 모드 배경색 수정 (배경색과 호버색을 명시적으로 추가)
        <li className="py-3 px-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
                {/* 왼쪽: 제목, 작성자, 시간 */}
                <div className="flex-1 overflow-hidden min-w-0">
                    <Link href={`/post/${post.id}`} className="text-base font-medium text-gray-800 dark:text-gray-200 hover:underline block truncate">
                        {post.title}
                    </Link>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="font-semibold">{post.author}</span>
                        <span className="ml-1">({post.major})</span>
                        <span className="mx-1">·</span>
                        <span>{formatRelativeTime(post.createdAt)}</span>
                    </div>
                </div>
                {/* 오른쪽: 해결됨, 태그, 점수 */}
                <div className="flex items-center gap-3 flex-shrink-0 mt-0.5 hidden sm:flex">
                    {post.isSolved && (
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full dark:bg-green-900/50 dark:text-green-300">
                            해결됨
                        </span>
                    )}
                    <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full dark:bg-gray-700 dark:text-gray-300">
                        {post.tag}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <BsHandThumbsUpFill className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                        {/* usefulScore는 숫자가 아닐 수 있으므로 기본값 설정 */}
                        <span className="font-bold w-6 text-right">{(post.usefulScore || 0).toFixed(1)}</span>
                    </div>
                </div>
            </div>
        </li>
    );
};

// --- 페이지네이션 UI 컴포넌트 ---
const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void; }> = ({ currentPage, totalPages, onPageChange }) => {
    // ... (페이지네이션 로직은 그대로 유지)
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  
    const maxPageNumbersToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageNumbersToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPageNumbersToShow - 1);
  
    if (endPage - startPage + 1 < maxPageNumbersToShow) {
      startPage = Math.max(1, endPage - maxPageNumbersToShow + 1);
    }
  
    const pagesToDisplay = pageNumbers.slice(startPage - 1, endPage);
  
    return (
      <nav className="flex items-center justify-center gap-2 mt-8 mb-4">
        {/* 이전 페이지 버튼 */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          이전
        </button>
  
        {/* 페이지 번호 버튼 */}
        {startPage > 1 && (
             <span className="px-3 py-1 dark:text-gray-400">...</span>
        )}
        {pagesToDisplay.map(number => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`px-3 py-1 border rounded-md ${currentPage === number ? 'bg-blue-500 text-white border-blue-500 dark:bg-blue-600 dark:border-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300'}`}
          >
            {number}
          </button>
        ))}
        {endPage < totalPages && (
             <span className="px-3 py-1 dark:text-gray-400">...</span>
        )}
  
        {/* 다음 페이지 버튼 */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          다음
        </button>
      </nav>
    );
  };


// --- 메인 PostList 컴포넌트 (클라이언트 측 필터링/정렬/페이지네이션 담당) ---
export default function PostList({ initialPosts, boardName }: { initialPosts: Post[]; boardName: string; }) {
    const [sortBy, setSortBy] = useState<'latest' | 'useful'>('latest');
    const [selectedTopic, setSelectedTopic] = useState("전체");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // 1. 주제 필터링
    const filteredPosts = useMemo(() => {
        let filtered = initialPosts.filter(post => !post.isHidden); 
        if (selectedTopic !== '전체') {
            filtered = filtered.filter(post => post.tag === selectedTopic);
        }
        return filtered;
    }, [initialPosts, selectedTopic]);

    // 2. 정렬
    const sortedPosts = useMemo(() => {
        return [...filteredPosts].sort((a, b) => {
            if (sortBy === 'useful') return b.usefulScore - a.usefulScore;
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });
    }, [filteredPosts, sortBy]);

    // 3. 페이지네이션
    const indexOfLastPost = currentPage * itemsPerPage;
    const indexOfFirstPost = indexOfLastPost - itemsPerPage;
    const currentPosts = sortedPosts.slice(indexOfFirstPost, indexOfLastPost);
    const totalPages = Math.ceil(sortedPosts.length / itemsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const SortButtons = (
        <div className="flex items-center text-sm space-x-2">
             {/* ★ 다크 모드 스타일 적용 및 hover 색상 수정 */}
            <button onClick={() => setSortBy('latest')} className={sortBy === 'latest' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}>최신순</button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button onClick={() => setSortBy('useful')} className={sortBy === 'useful' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}>유용순</button>
        </div>
    );
    
    const pageTitle = boardName === 'all' ? '전체 게시글' : boardName;

    return (
        <div className="w-full max-w-5xl space-y-8">
            {/* 메인으로 돌아가기 버튼 */}
            <div className="flex items-center">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    <FiArrowLeft className="w-5 h-5" />
                    <span>메인으로</span>
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex justify-between items-center gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex-shrink-0">{pageTitle}</h1>
                    {SortButtons}
                </div>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {currentPosts.length > 0 ? (
                        currentPosts.map(post => <PostItem key={post.id} post={post} />)
                    ) : (
                        <li className="py-10 px-4 text-center text-gray-500 italic dark:text-gray-400">게시글이 없습니다.</li>
                    )}
                </ul>
                {totalPages > 1 && (
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                )}
            </div>
        </div>
    );
}