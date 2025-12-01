"use client";

import SimpleHeader from "@/component/SimpleHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function DeleteAccountPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [confirmationText, setConfirmationText] = useState("");
  const requiredText = "탈퇴 동의";

  const handleDelete = () => {
    if (confirmationText !== requiredText) return;
    // '가짜' 회원 탈퇴 로직
    logout();
    alert("계정이 삭제되었습니다. 이용해주셔서 감사합니다.");
    router.push("/");
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <SimpleHeader />
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold mb-4 text-red-500">회원 탈퇴</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          정말로 계정을 삭제하시겠습니까? <br/>
          모든 게시글과 활동 내역이 영구적으로 삭제되며, 복구할 수 없습니다.
        </p>
        
        <div className="text-left my-6">
          <label htmlFor="confirm" className="text-sm font-medium text-gray-700 dark:text-gray-200">
            계정 삭제를 확인하려면 아래에 "<span className="font-bold">{requiredText}</span>" 라고 입력해주세요.
          </label>
          <input 
            type="text" 
            id="confirm"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/settings" className="w-full p-3 bg-gray-200 dark:bg-gray-600 rounded-lg font-semibold text-center hover:bg-gray-300">
            취소
          </Link>
          <button
            onClick={handleDelete}
            disabled={confirmationText !== requiredText}
            className="w-full p-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            계정 영구 삭제
          </button>
        </div>
      </div>
    </div>
  );
}