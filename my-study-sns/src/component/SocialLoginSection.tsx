"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Provider } from "@supabase/supabase-js"; 
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { RiKakaoTalkFill } from "react-icons/ri";
import { SiNaver } from "react-icons/si";

export default function SocialLoginSection() {
  const supabase = createClientComponentClient();
  const [loadingProvider, setLoadingProvider] = useState<Provider | "naver" | "kakao" | null>(null);

  const handleSocialLogin = async (provider: Provider | "naver" | "kakao") => {
    try {
      setLoadingProvider(provider);
      
      // 1. 기본 옵션 설정
      let authOptions: any = {
        redirectTo: 'https://mystudysns.shop/auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      };

      // 2. ★ [핵심 수정] 카카오일 때만 강제로 scope 파라미터를 덮어씌움
      if (provider === 'kakao') {
        authOptions.queryParams = {
          ...authOptions.queryParams,
          // 여기에 scope를 넣으면 Supabase 기본값을 무시하고 이것만 보냅니다.
          scope: 'profile_nickname', 
        };
        // 주의: options.scopes 가 아니라 queryParams.scope 입니다.
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: authOptions,
      });

      if (error) throw error;
      
    } catch (error) {
      console.error("소셜 로그인 에러:", error);
      alert("로그인 중 오류가 발생했습니다.");
      setLoadingProvider(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 mt-4">
      {/* 1. 구글 (Google) */}
      <button
        type="button"
        onClick={() => handleSocialLogin("google")}
        disabled={!!loadingProvider}
        className="flex items-center justify-center gap-2 w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
      >
        {loadingProvider === "google" ? (
          <span className="text-sm">이동 중...</span>
        ) : (
          <>
            <FcGoogle size={20} />
            <span>구글로 계속하기</span>
          </>
        )}
      </button>

      {/* 2. 깃허브 (GitHub) */}
      <button
        type="button"
        onClick={() => handleSocialLogin("github")}
        disabled={!!loadingProvider}
        className="flex items-center justify-center gap-2 w-full p-3 bg-[#24292F] text-white rounded-lg font-medium hover:bg-opacity-90 transition"
      >
        {loadingProvider === "github" ? (
          <span className="text-sm">이동 중...</span>
        ) : (
          <>
            <FaGithub size={20} />
            <span>GitHub로 계속하기</span>
          </>
        )}
      </button>

      <div className="flex gap-3">
        {/* 3. 카카오 (Kakao) */}
        <button
          type="button"
          onClick={() => handleSocialLogin("kakao")}
          disabled={!!loadingProvider}
          className="flex-1 flex items-center justify-center gap-2 p-3 bg-[#FEE500] text-[#3c1e1e] rounded-lg font-medium hover:bg-opacity-90 transition"
        >
           {loadingProvider === "kakao" ? (
             <span className="text-xs">..</span>
           ) : (
             <>
               <RiKakaoTalkFill size={20} />
               <span className="hidden sm:inline">카카오</span>
             </>
           )}
        </button>
      </div>
    </div>
  );
}