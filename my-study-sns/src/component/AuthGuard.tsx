"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // 유저 상태 검사 함수
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 로그인이 안 되어 있으면 검사할 필요 없음
      if (!session) return;

      // 프로필 가져오기
      const { data: profile } = await supabase
        .from("profiles")
        .select("major")
        .eq("id", session.user.id)
        .single();

      // 콘솔에서 확인용 (F12 눌러서 확인 가능)
      console.log("AuthGuard 감지 중... 현재 전공 상태:", profile?.major);

      // ★ 조건: 프로필은 있는데, 전공이 '전공 미입력'이고, 현재 회원가입 페이지가 아니라면?
      if (profile && profile.major === '전공 미입력' && pathname !== "/signup") {
        console.log("🚨 추가 정보 미입력 유저 발견! 회원가입 페이지로 이동합니다.");
        router.replace("/signup");
      }
    };

    // 1. 페이지 로드 시 즉시 실행
    checkUser();

    // 2. 로그인 상태가 변할 때(새로고침 등)마다 실행 (더 강력한 감지)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router, supabase]);

  return null;
}