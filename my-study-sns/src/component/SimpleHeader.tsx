"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import LogoutButton from "./LogoutButton";
import Sidebar from "./Sidebar";
import { FiMenu, FiSearch, FiBell, FiX, FiMessageSquare, FiThumbsUp, FiAlertCircle } from "react-icons/fi";

// 알림 타입 정의
interface Notification {
  id: number;
  type: 'comment' | 'review' | 'report';
  content: string;
  is_read: boolean;
  created_at: string;
  post_id: number;
  sender?: { username: string }; // join 된 데이터
}

export default function SimpleHeader() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 검색 관련 상태
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ★ 알림 관련 상태 추가
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const notiRef = useRef<HTMLDivElement>(null); // 드롭다운 외부 클릭 감지용

  const router = useRouter();
  const supabase = createClientComponentClient();

  // 1. 유저 정보 및 알림 가져오기
  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // 알림 목록 조회 (최신순)
        const { data } = await supabase
          .from('notifications')
          .select('*, sender:profiles(username)') // sender_id를 이용해 profiles의 username 가져오기
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10); // 최근 10개만

        if (data) setNotifications(data as any);
      } else {
        setNotifications([]); // 로그아웃 시 알림 초기화
      }
    };

    initData();

    // ★ 인증 상태 변경 감지 (로그인/로그아웃 시 헤더 자동 업데이트)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user || null);
        if (session?.user) initData();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setNotifications([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // 2. 검색창 포커스
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // 3. 외부 클릭 시 알림창 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
        setIsNotiOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 안 읽은 알림 있는지 확인 (빨간 점 용)
  const hasUnread = notifications.some(n => !n.is_read);

  // 알림 아이콘 클릭 핸들러 (열면서 읽음 처리)
  const handleToggleNoti = async () => {
    if (!isNotiOpen) {
      // 열릴 때: UI상에서 빨간 점 즉시 제거 (낙관적 업데이트)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

      // 서버에 읽음 처리 요청
      await fetch('/api/notifications', { method: 'PATCH' });
    }
    setIsNotiOpen(!isNotiOpen);
  };

  // 검색 실행
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setIsSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(keyword)}`);
    setKeyword("");
  };

  // 알림 아이콘 선택 (타입별)
  const getNotiIcon = (type: string) => {
    switch (type) {
      case 'comment': return <FiMessageSquare className="text-blue-500 mt-1" size={16} />;
      case 'review': return <FiThumbsUp className="text-orange-500 mt-1" size={16} />;
      case 'report': return <FiAlertCircle className="text-red-500 mt-1" size={16} />;
      default: return <FiBell className="text-gray-500 mt-1" size={16} />;
    }
  };

  // 시간 포맷
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000; // 초 단위
    if (diff < 60) return "방금 전";
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <>
      <header className="sticky top-0 left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-30 h-16 transition-colors duration-300">
        <div className=" w-full px-48 h-full flex items-center justify-between relative">

          {/* 좌측: 메뉴 버튼 */}
          <div className={`flex items-center ${isSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
            >
              <FiMenu size={24} />
            </button>
          </div>

          {/* 중앙: 로고 */}
          <div className={`absolute left-1/2 transform -translate-x-1/2 ${isSearchOpen ? 'hidden sm:block' : 'block'}`}>
            <Link href="/" className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              My Study SNS
            </Link>
          </div>

          {/* 우측: 아이콘 영역 */}
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">

            {/* 검색바 */}
            <div className={`flex items-center transition-all duration-300 ${isSearchOpen
                ? 'absolute left-0 top-0 w-full h-full bg-white dark:bg-gray-900 px-4 z-40 sm:static sm:w-auto sm:p-0 sm:block'
                : ''
              }`}>

              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="w-full flex items-center gap-2">
                  <FiSearch className="text-gray-400 sm:hidden" size={20} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="검색..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                  <button type="button" onClick={() => setIsSearchOpen(false)} className="p-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white">
                    <FiX size={20} />
                  </button>
                </form>
              ) : (
                <button onClick={() => setIsSearchOpen(true)} className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                  <FiSearch size={24} />
                </button>
              )}
            </div>

            {/* 알림 및 로그인 버튼 */}
            {!isSearchOpen && (
              <>
                {user ? (
                  <>
                    {/* ★ 알림 아이콘 & 드롭다운 */}
                    <div className="relative" ref={notiRef}>
                      <button
                        onClick={handleToggleNoti}
                        className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                      >
                        <FiBell size={24} />
                        {/* 빨간 점 (안 읽은 알림 있을 때만) */}
                        {hasUnread && (
                          <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-gray-900 bg-red-500 animate-pulse"></span>
                        )}
                      </button>

                      {/* 알림 드롭다운 메뉴 */}
                      {isNotiOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                          <div className="p-3 border-b border-gray-100 dark:border-gray-700 font-bold text-gray-900 dark:text-white flex justify-between items-center">
                            <span>알림</span>
                            {notifications.length > 0 && <span className="text-xs text-gray-400 font-normal">최근 10개</span>}
                          </div>
                          <ul className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                              notifications.map((noti) => (
                                <li key={noti.id} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                                  <Link
                                    href={`/post/${noti.post_id}`}
                                    onClick={() => setIsNotiOpen(false)}
                                    className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                                  >
                                    <div className="flex gap-3 items-start">
                                      {getNotiIcon(noti.type)}
                                      <div className="flex-1">
                                        <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                                          <span className="font-bold mr-1">
                                            {noti.type === 'report' ? '알림' : noti.sender?.username || '알 수 없음'}
                                          </span>
                                          {noti.type === 'comment' && '님이 댓글을 남겼습니다:'}
                                          {noti.type === 'review' && '님이 회원님의 글을 추천했습니다.'}
                                          {noti.type === 'report' && '신고가 접수되었습니다.'}
                                        </p>
                                        {noti.type === 'comment' && (
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">"{noti.content}"</p>
                                        )}
                                        <p className="text-[10px] text-gray-400 mt-1 text-right">{formatTime(noti.created_at)}</p>
                                      </div>
                                    </div>
                                  </Link>
                                </li>
                              ))
                            ) : (
                              <li className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                새로운 알림이 없습니다.
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    <LogoutButton />
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="bg-black dark:bg-white text-white dark:text-black text-sm font-bold px-5 py-2 rounded hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors whitespace-nowrap ml-2"
                  >
                    로그인
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
      />
    </>
  );
}