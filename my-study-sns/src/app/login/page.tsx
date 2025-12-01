"use client";

import { supabase } from "@/lib/supabaseBrowserClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
// ▼ [변경] 새로 만든 소셜 로그인 컴포넌트 임포트
import SocialLoginSection from "@/component/SocialLoginSection";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "email") setEmail(value);
    else if (name === "password") setPassword(value);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (isLoading || email === "" || password === "") return;

    try {
      setIsLoading(true);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (signInError) {
        if (signInError.message === "Invalid login credentials") {
          setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        } else {
          setError("로그인에 실패했습니다. 입력 정보를 확인해주세요.");
        }
      } else {
        router.push("/");
      }
    } catch (e) {
      setError("로그인 중 알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">
          로그인
        </h1>

        {/* 이메일 로그인 폼 */}
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <input
            onChange={onChange}
            name="email"
            value={email}
            placeholder="이메일"
            type="email"
            required
            className="p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <input
            onChange={onChange}
            name="password"
            value={password}
            placeholder="비밀번호"
            type="password"
            required
            className="p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 p-3 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {error !== "" && (
          <span className="block text-red-500 font-semibold mt-4 text-center text-sm">
            {error}
          </span>
        )}

        <div className="text-center mt-6">
          <span className="text-gray-600 dark:text-gray-400">
            계정이 없으신가요?{" "}
          </span>
          <Link href="/signup" className="text-blue-500 hover:underline">
            회원가입
          </Link>
        </div>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
              또는 소셜 계정으로 로그인
            </span>
          </div>
        </div>

        {/* ★ [변경] 소셜 로그인 섹션 추가 */}
        <SocialLoginSection />

      </div>
    </div>
  );
}