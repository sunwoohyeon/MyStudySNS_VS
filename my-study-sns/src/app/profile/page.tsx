"use client";

import MainLayout from "@/component/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
// ▼▼▼ 계정 연동 관련 아이콘 추가 ▼▼▼
import { IoClose, IoSettingsOutline, IoLinkOutline } from "react-icons/io5";
import { MdOutlineManageAccounts } from "react-icons/md";
import { FaGithub, FaComment } from "react-icons/fa"; // 카카오 아이콘 (예시)
import { SiNaver } from "react-icons/si"; // 네이버 아이콘

// --- 설정 모달 컴포넌트 ---
const SettingsModal: React.FC<{ onClose: () => void; }> = ({ onClose }) => {
  const { theme, toggleTheme } = useAuth();
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6"> <h2 className="text-2xl font-bold dark:text-white">설정</h2> <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"> <IoClose className="w-6 h-6 dark:text-gray-300" /> </button> </div>
        <div className="mb-6"> <h3 className="text-lg font-semibold mb-3 dark:text-gray-200">알림 설정</h3> <div className="space-y-3"> <label className="flex items-center justify-between cursor-pointer"> <span className="text-gray-800 dark:text-gray-200">새 답변 알림</span> <input type="checkbox" className="h-5 w-5 rounded accent-blue-600" defaultChecked /> </label> <label className="flex items-center justify-between cursor-pointer"> <span className="text-gray-800 dark:text-gray-200">새 리뷰 알림</span> <input type="checkbox" className="h-5 w-5 rounded accent-blue-600" defaultChecked /> </label> </div> </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6"> <h3 className="text-lg font-semibold mb-3 dark:text-gray-200">테마 설정</h3> <div className="flex items-center justify-between"> <p className="font-medium text-gray-800 dark:text-gray-200"> 현재: {theme === 'light' ? '라이트 모드 ☀️' : '다크 모드 🌙'} </p> <button onClick={toggleTheme} className="bg-gray-200 dark:bg-gray-700 text-sm font-semibold px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"> 테마 전환 </button> </div> </div>
        <div className="mt-8 text-right"> <button onClick={onClose} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700"> 닫기 </button> </div>
      </div>
    </div>
  );
};

// --- 계정 관리 모달 컴포넌트 ---
const AccountModal: React.FC<{ onClose: () => void; }> = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordValidationError, setPasswordValidationError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validatePassword = (password: string): string => { if (password.length < 8 || password.length > 16) { return "비밀번호는 8~16자 사이여야 합니다."; } if (!/[A-Z]/.test(password)) { return "비밀번호에 대문자가 포함되어야 합니다."; } if (!/[a-z]/.test(password)) { return "비밀번호에 소문자가 포함되어야 합니다."; } if (!/[0-9]/.test(password)) { return "비밀번호에 숫자가 포함되어야 합니다."; } if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) { return "비밀번호에 특수문자가 포함되어야 합니다."; } return ""; };
  useEffect(() => { if (newPassword === "") { setPasswordValidationError(""); } else { setPasswordValidationError(validatePassword(newPassword)); } }, [newPassword]);
  useEffect(() => { if (confirmNewPassword === "") { setPasswordError(""); return; } if (newPassword !== confirmNewPassword) { setPasswordError("새 비밀번호가 일치하지 않습니다."); } else { setPasswordError(""); } }, [newPassword, confirmNewPassword]);
  const handleChangePassword = () => { setError(""); const validationError = validatePassword(newPassword); if (validationError) { setError(validationError); return; } if (currentPassword === "" || newPassword === "" || confirmNewPassword === "") { setError("모든 비밀번호 필드를 입력해주세요."); return; } if (newPassword !== confirmNewPassword) { setError("새 비밀번호가 일치하지 않습니다."); return; } setIsLoading(true); console.log("Password change attempt:", { currentPassword, newPassword }); setTimeout(() => { alert("비밀번호가 변경되었습니다. (가짜 기능)"); setIsLoading(false); onClose(); }, 1000); };
  const isChangePasswordValid = currentPassword !== "" && newPassword !== "" && confirmNewPassword !== "" && passwordValidationError === "" && passwordError === "" && newPassword === confirmNewPassword;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6"> <h2 className="text-2xl font-bold dark:text-white">계정 관리</h2> <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"> <IoClose className="w-6 h-6 dark:text-gray-300" /> </button> </div>
        <div className="space-y-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
          <h3 className="text-lg font-semibold dark:text-gray-200">비밀번호 변경</h3>
          <div> <label htmlFor="currentPassword" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">현재 비밀번호</label> <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /> </div>
          <div> <label htmlFor="newPassword" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">새 비밀번호</label> <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${passwordValidationError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} /> {passwordValidationError && <p className="text-red-500 text-xs mt-1">{passwordValidationError}</p>} <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">8~16자 영문 대/소문자, 숫자, 특수문자를 사용하세요.</p> </div>
          <div> <label htmlFor="confirmNewPassword" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">새 비밀번호 확인</label> <input type="password" id="confirmNewPassword" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${passwordError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} /> {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>} </div>
          <button onClick={handleChangePassword} disabled={!isChangePasswordValid || isLoading} className="w-full p-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"> {isLoading ? "변경 중..." : "비밀번호 변경"} </button>
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
        </div>
        <div className="space-y-4"> <h3 className="text-lg font-semibold dark:text-gray-200">계정 삭제</h3> <p className="text-gray-600 dark:text-gray-300 text-sm">계정을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.</p> <Link href="/delete-account" className="block text-red-500 hover:underline"> 회원 탈퇴 진행하기 </Link> </div>
        <div className="mt-8 text-right"> <button onClick={onClose} className="bg-gray-200 dark:bg-gray-600 font-bold py-2 px-6 rounded-lg hover:bg-gray-300"> 닫기 </button> </div>
      </div>
    </div>
  );
};

// --- 계정 연동 모달 컴포넌트 ---
const AccountLinkingModal: React.FC<{ onClose: () => void; }> = ({ onClose }) => {
  const [linkedAccounts, setLinkedAccounts] = useState({ naver: false, kakao: true, github: false });
  const handleLinkToggle = (provider: keyof typeof linkedAccounts) => { setLinkedAccounts(prev => ({ ...prev, [provider]: !prev[provider] })); alert(`${provider} 계정 ${linkedAccounts[provider] ? '연동 해제' : '연동'} 완료 (가짜 기능)`); };
  const ProviderButton: React.FC<{ provider: keyof typeof linkedAccounts; name: string; icon: React.ReactNode; bgColor: string; textColor: string; }> = ({ provider, name, icon, bgColor, textColor }) => { const isLinked = linkedAccounts[provider]; return ( <div className="flex items-center justify-between p-3 border rounded-md dark:border-gray-700"> <div className="flex items-center gap-3"> <span className={`p-1.5 rounded-full ${bgColor} ${textColor}`}>{icon}</span> <span className="font-medium dark:text-gray-200">{name}</span> {isLinked && <span className="text-xs font-semibold text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded-full">연동됨</span>} </div> <button onClick={() => handleLinkToggle(provider)} className={`text-sm font-semibold px-3 py-1 rounded-md ${isLinked ? 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300' : 'bg-blue-500 text-white hover:bg-blue-600'}`}> {isLinked ? '연동 해제' : '연동하기'} </button> </div> ); };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6"> <h2 className="text-2xl font-bold dark:text-white">계정 연동 관리</h2> <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"> <IoClose className="w-6 h-6 dark:text-gray-300" /> </button> </div>
        <div className="space-y-4">
          <ProviderButton provider="naver" name="네이버" icon={<SiNaver className="w-4 h-4" />} bgColor="bg-[#03C75A]" textColor="text-white" />
          <ProviderButton provider="kakao" name="카카오" icon={<FaComment className="w-4 h-4" />} bgColor="bg-[#FEE500]" textColor="text-black" />
          <ProviderButton provider="github" name="GitHub" icon={<FaGithub className="w-4 h-4" />} bgColor="bg-black dark:bg-white" textColor="text-white dark:text-black" />
        </div>
        <div className="mt-8 text-right"> <button onClick={onClose} className="bg-gray-200 dark:bg-gray-600 font-bold py-2 px-6 rounded-lg hover:bg-gray-300"> 닫기 </button> </div>
      </div>
    </div>
  );
};

// --- 메인 프로필 페이지 컴포넌트 ---
export default function ProfilePage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false); // 계정 연동 모달 상태 추가
  const userProfile = { name: "전준성", school: "세명대학교", major: "컴퓨터학부", doubleMajor: "정보통신학부" };

  useEffect(() => { if (!isLoggedIn) { const timer = setTimeout(() => { router.push("/login"); }, 100); return () => clearTimeout(timer); } }, [isLoggedIn, router]);
  if (!isLoggedIn) { return <div className="p-8 text-center">로그인 페이지로 이동 중...</div>; }

  return (
    <MainLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">내 프로필</h1>
          <div className="space-y-4 mb-8">
            <div> <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">이름</label> <p className="mt-1 text-lg font-medium text-gray-800 dark:text-gray-200">{userProfile.name}</p> </div>
            <div> <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">학교</label> <p className="mt-1 text-lg font-medium text-gray-800 dark:text-gray-200">{userProfile.school}</p> </div>
            <div> <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">전공</label> <p className="mt-1 text-lg font-medium text-gray-800 dark:text-gray-200">{userProfile.major}</p> </div>
            {userProfile.doubleMajor && ( <div> <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">복수 전공</label> <p className="mt-1 text-lg font-medium text-gray-800 dark:text-gray-200">{userProfile.doubleMajor}</p> </div> )}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <ul className="space-y-2">
              <li> <button onClick={() => setIsSettingsModalOpen(true)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left"> <IoSettingsOutline className="w-6 h-6 text-gray-600 dark:text-gray-400" /> <span className="text-gray-800 dark:text-gray-200">설정</span> </button> </li>
              <li> <button onClick={() => setIsAccountModalOpen(true)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left"> <MdOutlineManageAccounts className="w-6 h-6 text-gray-600 dark:text-gray-400" /> <span className="text-gray-800 dark:text-gray-200">계정 관리</span> </button> </li>
              <li> <button onClick={() => setIsLinkingModalOpen(true)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left"> <IoLinkOutline className="w-6 h-6 text-gray-600 dark:text-gray-400" /> <span className="text-gray-800 dark:text-gray-200">계정 연동 관리</span> </button> </li>
            </ul>
          </div>
        </div>
      </div>
      {isSettingsModalOpen && <SettingsModal onClose={() => setIsSettingsModalOpen(false)} />}
      {isAccountModalOpen && <AccountModal onClose={() => setIsAccountModalOpen(false)} />}
      {isLinkingModalOpen && <AccountLinkingModal onClose={() => setIsLinkingModalOpen(false)} />}
    </MainLayout>
  );
}