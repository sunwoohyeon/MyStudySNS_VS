// src/component/Header.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import { HiMenu, HiSearch, HiOutlinePencilAlt } from "react-icons/hi";
import { IoClose, IoNotifications, IoPersonCircleOutline, IoDocumentTextOutline, IoLogOutOutline } from "react-icons/io5";

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function Header() {
  const { isLoggedIn, logout } = useAuth();
  const supabase = createClientComponentClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isLoggedIn) {
        setNotifications([]);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data);
      }
    };

    fetchNotifications();
  }, [isLoggedIn, supabase]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

  const handleProtectedLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      router.push("/login");
    } else {
      router.push(path);
    }
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  }

  return (
    <>
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-40"> {/* fixed z-40 추가 */}
        {/* max-w-screen-xl, mx-auto, px-6 유지 */}
        <div className="max-w-screen-xl mx-auto flex items-center justify-between px-6 py-3">
        
          {/* ********** [수정] 좌측 영역 **********
            flex-1 제거: 좌측 컨테이너의 확장 제한 (버튼이 중앙 컨텐츠 시작점에 맞춰지도록 함)
            justify-start 유지: 햄버거 버튼을 중앙 컨텐츠의 시작점에 가깝게 배치
          */}
          <div className="flex justify-start">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="Open Menu"
            >
              <HiMenu className="w-6 h-6 text-gray-800 dark:text-gray-100" />
            </button>
          </div>

          {/* 중앙 영역: 로고/타이틀 (가운데 정렬) */}
          <div className="flex justify-center flex-grow"> {/* flex-grow 추가: 남은 공간을 로고가 차지하여 로고를 중앙으로 밀어줌 */}
            <Link href="/" className="text-xl font-bold text-gray-800 dark:text-gray-100">
              My Study SNS
            </Link>
          </div>

          {/* ********** [수정] 우측 영역 **********
            flex-1 제거: 우측 컨테이너의 확장 제한 (버튼이 중앙 컨텐츠 끝점에 맞춰지도록 함)
            justify-end 유지: 버튼 그룹을 중앙 컨텐츠의 끝점에 가깝게 배치
          */}
          <div className="flex justify-end items-stretch space-x-2 sm:space-x-4">
            {isLoggedIn ? (
              <>
                <Link href="/search" className="flex items-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition" aria-label="Search">
                  <HiSearch className="w-6 h-6 text-gray-800 dark:text-gray-100" />
                </Link>
                
                <div className="relative flex items-center">
                  <button onClick={() => setIsNotifOpen(prev => !prev)} className="flex items-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition" aria-label="Notifications">
                    <IoNotifications className="w-6 h-6 text-gray-800 dark:text-gray-100" />
                    {unreadCount > 0 && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
                  </button>
                  {isNotifOpen && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-30">
                      <div className="p-3 font-bold border-b dark:border-gray-700">알림</div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map(notif => (
                            <div key={notif.id} className="p-3 border-b dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                              <p>{notif.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-sm text-gray-500">새 알림이 없습니다.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <button onClick={handleLogout} className="flex items-center p-2 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 transition" aria-label="Logout">
                  <IoLogOutOutline className="w-6 h-6" />
                </button>
              </>
            ) : (
              <Link href="/login" className="bg-black text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-800">
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>
      
      {/* 햄버거 메뉴 및 배경은 그대로 유지 */}
      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black bg-opacity-50 z-10"></div>}
      <aside className={`fixed top-0 left-0 h-full w-80 bg-white z-20 transform transition-transform duration-300 ease-in-out dark:bg-gray-900 dark:text-white ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 flex flex-col h-full">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">메뉴</h2>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <IoClose className="w-6 h-6" />
            </button>
          </div>
          <nav className="mt-8 flex-1">
            <ul className="space-y-2">
              <li><a href="/new-post" onClick={(e) => handleProtectedLink(e as any, "/new-post")} className="flex items-center gap-3 p-3 rounded-lg font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800"><HiOutlinePencilAlt className="w-6 h-6" />글 작성하기</a></li>
              <li><Link href="/search" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><HiSearch className="w-6 h-6" />검색</Link></li>
            </ul>
            <hr className="my-4 border-gray-200 dark:border-gray-700" />
            <ul className="space-y-2">
              <li><a href="/profile" onClick={(e) => handleProtectedLink(e as any, "/profile")} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><IoPersonCircleOutline className="w-6 h-6" />내 프로필</a></li>
              <li><a href="/my-posts" onClick={(e) => handleProtectedLink(e as any, "/my-posts")} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><IoDocumentTextOutline className="w-6 h-6" />내가 쓴 글</a></li>
            </ul>
          </nav>
          {isLoggedIn && (
            <div className="mt-auto">
              <hr className="my-4 border-gray-200 dark:border-gray-700" />
              <ul className="space-y-2">
                <li><button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-gray-800"><IoLogOutOutline className="w-6 h-6" />로그아웃</button></li>
              </ul>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}