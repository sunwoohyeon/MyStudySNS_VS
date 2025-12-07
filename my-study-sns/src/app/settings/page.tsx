"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import MainLayout from "@/component/MainLayout";
import { useTheme } from "@/component/ThemeProvider";
import { FiMoon, FiSun, FiBell, FiUserX, FiInfo, FiLogOut, FiCheck } from "react-icons/fi";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  const [settings, setSettings] = useState({
    isNotifyComment: true,
    isMarketingAgreed: false,
  });

  // 내 설정 불러오기
  useEffect(() => {
    const fetchSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_notify_comment, is_marketing_agreed")
        .eq("id", user.id)
        .single();

      if (profile) {
        setSettings({
          isNotifyComment: profile.is_notify_comment ?? true,
          isMarketingAgreed: profile.is_marketing_agreed ?? false,
        });
      }
      setIsLoading(false);
    };
    fetchSettings();
  }, [supabase, router]);

  // 알림 설정 변경 핸들러
  const handleToggleSetting = async (key: 'isNotifyComment' | 'isMarketingAgreed') => {
    const newValue = !settings[key];
    // UI 먼저 변경 (낙관적 업데이트)
    setSettings(prev => ({ ...prev, [key]: newValue }));

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_notify_comment: key === 'isNotifyComment' ? newValue : settings.isNotifyComment,
          is_marketing_agreed: key === 'isMarketingAgreed' ? newValue : settings.isMarketingAgreed,
        }),
      });
      if (!res.ok) throw new Error("저장 실패");
    } catch (e) {
      alert("설정 저장에 실패했습니다.");
      // 실패 시 롤백
      setSettings(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  // 회원 탈퇴 핸들러
  const handleDeleteAccount = async () => {
    const input = prompt("탈퇴하시려면 '탈퇴'라고 입력해주세요.\n모든 게시글과 활동 내역이 삭제됩니다.");
    if (input !== "탈퇴") return;

    try {
      const res = await fetch("/api/settings", { method: "DELETE" });
      if (!res.ok) throw new Error("탈퇴 실패");
      
      await supabase.auth.signOut();
      alert("회원 탈퇴가 완료되었습니다.");
      window.location.href = "/login";
    } catch (e) {
      alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    if(!confirm("로그아웃 하시겠습니까?")) return;
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (isLoading) return <MainLayout><div className="text-center py-20">로딩 중...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-2 px-4">
        <h1 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">설정</h1>

        {/* 1. 화면 설정 */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 mb-3 px-2">화면 설정</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <FiMoon className="text-purple-500" size={20}/> : <FiSun className="text-orange-500" size={20}/>}
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">다크 모드</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {theme === 'dark' ? '현재 다크 모드 사용 중' : '현재 라이트 모드 사용 중'}
                  </div>
                </div>
              </div>
              {/* 토글 스위치 UI */}
              <button 
                onClick={toggleTheme}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </section>

        {/* 2. 알림 설정 */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 mb-3 px-2">알림 설정</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
            
            {/* 댓글 알림 */}
            <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
              <div className="flex items-center gap-3">
                <FiBell className="text-blue-500" size={20}/>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">댓글 알림</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">내 글에 댓글이 달리면 알림 받기</div>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={settings.isNotifyComment} 
                onChange={() => handleToggleSetting('isNotifyComment')}
                className="w-5 h-5 accent-blue-600 cursor-pointer"
              />
            </div>

            {/* 마케팅 수신 */}
            <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
              <div className="flex items-center gap-3">
                <FiCheck className="text-green-500" size={20}/>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">마케팅 정보 수신</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">이벤트 및 혜택 소식 받기</div>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={settings.isMarketingAgreed} 
                onChange={() => handleToggleSetting('isMarketingAgreed')}
                className="w-5 h-5 accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* 3. 앱 정보 및 계정 */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 mb-3 px-2">계정 및 정보</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
            
            <div className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition">
              <FiInfo className="text-gray-400" size={20} />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">버전 정보</div>
              </div>
              <span className="text-sm text-gray-500">v1.0.0 (MVP)</span>
            </div>

            <button onClick={handleLogout} className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition text-left">
              <FiLogOut className="text-gray-400" size={20} />
              <span className="font-medium text-gray-900 dark:text-white">로그아웃</span>
            </button>

            <button onClick={handleDeleteAccount} className="w-full p-4 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition text-left">
              <FiUserX className="text-red-500" size={20} />
              <span className="font-medium text-red-500">회원 탈퇴</span>
            </button>

          </div>
        </section>

      </div>
    </MainLayout>
  );
}