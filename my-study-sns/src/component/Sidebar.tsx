"use client";

import Link from "next/link";
import { FiX, FiEdit3, FiHome, FiUser, FiSettings } from "react-icons/fi";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* [변경점] bg-white -> bg-white dark:bg-gray-900 (사이드바 배경) */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* [변경점] border 색상 및 아이콘 색상 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <span className="text-xl font-bold text-gray-800 dark:text-white">Menu</span>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300">
            <FiX size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {/* [변경점] '게시글 작성' 버튼은 파란색 유지하되 배경 톤 조정 */}
          <Link
            href="/write"
            onClick={onClose}
            className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition font-bold"
          >
            <FiEdit3 size={20} />
            게시글 작성하기
          </Link>

          <div className="border-t my-2 border-gray-200 dark:border-gray-800"></div>

          {/* [변경점] 일반 메뉴 텍스트 및 호버 색상 */}
          <Link href="/" onClick={onClose} className="flex items-center gap-3 p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
            <FiHome size={20} />
            홈으로
          </Link>
          
          {user && (
            <Link href="/mypage" onClick={onClose} className="flex items-center gap-3 p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
              <FiUser size={20} />
              마이페이지
            </Link>
          )}
          
           <Link href="/settings" onClick={onClose} className="flex items-center gap-3 p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
              <FiSettings size={20} />
              설정
            </Link>
        </nav>

        {user && (
          // [변경점] 하단 유저 정보 배경색 및 테두리
          <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">로그인 중</p>
            <p className="font-bold text-gray-800 dark:text-white">{user.email}</p>
          </div>
        )}
      </div>
    </>
  );
}