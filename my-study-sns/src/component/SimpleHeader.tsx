"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import LogoutButton from "./LogoutButton";
import Sidebar from "./Sidebar";

import {
  FiMenu,
  FiSearch,
  FiBell,
  FiX,
  FiMessageSquare,
  FiThumbsUp,
  FiAlertCircle
} from "react-icons/fi";

interface Notification {
  id: number;
  type: "comment" | "review" | "report";
  content: string;
  is_read: boolean;
  created_at: string;
  post_id: number;
  sender?: { username: string };
}

export default function SimpleHeader() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [keyword, setKeyword] = useState("");
  const notiRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ------------------------- 유저 / 알림 로딩 -------------------------
  useEffect(() => {
    const init = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("notifications")
          .select("*, sender:profiles(username)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (data) setNotifications(data as any);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          setUser(session?.user || null);
          init();
        }
        if (event === "SIGNED_OUT") {
          setUser(null);
          setNotifications([]);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  // ------------------------- 검색창 포커스 -------------------------
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // ---------------------- 알림창 외부 클릭 닫기 ----------------------
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) {
        setIsNotiOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ---------------------- 검색 ----------------------
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setIsSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(keyword)}`);
    setKeyword("");
  };

  // ---------------------- 알림 ----------------------
  const hasUnread = notifications.some((n) => !n.is_read);

  const handleToggleNoti = async () => {
    if (!isNotiOpen) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      await fetch("/api/notifications", { method: "PATCH" });
    }
    setIsNotiOpen((prev) => !prev);
  };

  const getNotiIcon = (type: string) => {
    switch (type) {
      case "comment":
        return <FiMessageSquare className="text-blue-500 mt-1" size={16} />;
      case "review":
        return <FiThumbsUp className="text-orange-500 mt-1" size={16} />;
      case "report":
        return <FiAlertCircle className="text-red-500 mt-1" size={16} />;
      default:
        return <FiBell size={16} className="text-gray-500 mt-1" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 60) return "방금 전";
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // ==========================================================================
  //     ★★★ 반응형 헤더 최적화된 정답 구조 ★★★
  // ==========================================================================
  //
  //  [왼쪽: 메뉴] [중앙: 로고 - flex 중앙] [오른쪽: 아이콘]
  //  모바일에서도 충돌 없음
  //  absolute 제거 → flex 기반 중앙정렬
  // ==========================================================================

  return (
    <>
      <header className="sticky top-0 w-full h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-30">
        <div className="w-full h-full flex items-center px-4 sm:px-6 lg:px-12">

          {/* -------------------------- 왼쪽 영역 -------------------------- */}
          <div className={`${isSearchOpen ? "hidden sm:flex" : "flex"} flex-shrink-0 items-center`}>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FiMenu size={24} />
            </button>
          </div>

          {/* -------------------------- 중앙 로고 -------------------------- */}
          <div className="flex-grow flex justify-center pointer-events-none">
            {!isSearchOpen && (
              <Link
                href="/"
                className="pointer-events-auto text-xl font-extrabold text-gray-900 dark:text-white"
              >
                My Study SNS
              </Link>
            )}
          </div>

          {/* -------------------------- 오른쪽 영역 -------------------------- */}
          <div className="flex-shrink-0 flex items-center gap-2 sm:gap-4">

            {/* -------- 검색창 -------- */}
            <div
              className={`flex items-center transition-all duration-300 ${
                isSearchOpen
                  ? "absolute left-0 top-0 w-full h-full px-4 sm:px-6 bg-white dark:bg-gray-900 z-40"
                  : ""
              }`}
            >
              {isSearchOpen ? (
                <form
                  onSubmit={handleSearch}
                  className="flex items-center gap-2 w-full"
                >
                  <FiSearch size={20} className="text-gray-400 sm:hidden" />

                  <input
                    ref={searchInputRef}
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="검색..."
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-900 dark:text-white"
                  />

                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="p-2 text-gray-500 dark:text-gray-400"
                  >
                    <FiX size={20} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <FiSearch size={24} />
                </button>
              )}
            </div>

            {/* -------- 알림 & 로그인/로그아웃 -------- */}
            {!isSearchOpen && (
              <>
                {user ? (
                  <>
                    {/* 알림 버튼 */}
                    <div className="relative flex-shrink-0" ref={notiRef}>
                      <button
                        onClick={handleToggleNoti}
                        className="p-2 rounded-full relative text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <FiBell size={24} />
                        {hasUnread && (
                          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse" />
                        )}
                      </button>

                      {/* 알림 드롭다운 */}
                      {isNotiOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50">
                          <div className="p-3 border-b dark:border-gray-700 font-bold flex justify-between">
                            <span>알림</span>
                            {notifications.length > 0 && (
                              <span className="text-xs text-gray-400">
                                최근 10개
                              </span>
                            )}
                          </div>

                          <ul className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                              notifications.map((n) => (
                                <li
                                  key={n.id}
                                  className="border-b dark:border-gray-700/50"
                                >
                                  <Link
                                    href={`/post/${n.post_id}`}
                                    onClick={() => setIsNotiOpen(false)}
                                    className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                  >
                                    <div className="flex gap-3">
                                      {getNotiIcon(n.type)}
                                      <div className="flex-1">
                                        <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                                          <span className="font-bold">
                                            {n.sender?.username}
                                          </span>{" "}
                                          {n.type === "comment" &&
                                            "님이 댓글을 남겼습니다"}
                                          {n.type === "review" &&
                                            "님이 글을 추천했습니다"}
                                          {n.type === "report" &&
                                            "신고가 접수되었습니다"}
                                        </p>

                                        {n.type === "comment" && (
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                            "{n.content}"
                                          </p>
                                        )}

                                        <p className="text-[10px] text-gray-400 mt-1 text-right">
                                          {formatTime(n.created_at)}
                                        </p>
                                      </div>
                                    </div>
                                  </Link>
                                </li>
                              ))
                            ) : (
                              <li className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                                새로운 알림이 없습니다.
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* 로그아웃 */}
                    <LogoutButton />
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="px-5 py-2 rounded bg-black text-white text-sm dark:bg-white dark:text-black font-semibold"
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
