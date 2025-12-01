"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TERMS_OF_SERVICE, PRIVACY_POLICY, MARKETING_CONSENT } from "@/constants/terms";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // 소셜 유저 판별
  const [isSocialUser, setIsSocialUser] = useState(false);
  const [socialUserId, setSocialUserId] = useState("");

  // --- 초기 진입 시: 소셜 유저인지(전공 미입력 상태인지) 확인 ---
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 프로필 조회
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // ★ [변경] 프로필이 있고, 전공이 '전공 미입력'이면 -> 추가 정보 입력 모드 ON
        if (profile && profile.major === '전공 미입력') {
          setIsSocialUser(true);
          setSocialUserId(user.id);

          // 기존에 트리거가 넣어준 임시 데이터 불러오기
          setFormData(prev => ({
            ...prev,
            email: user.email || "",
            username: profile.username || "", // 트리거가 만든 임시 닉네임 가져오기
            firstName: profile.first_name || "",
            lastName: profile.last_name || "",
          }));
        } else if (profile && profile.major !== '전공 미입력') {
          // 이미 정보 입력 다 한 유저가 /signup 들어오면 홈으로
          router.replace('/');
        }
      }
    };
    checkSession();
  }, [router, supabase]);

  // --- 약관 동의 상태 ---
  const [terms, setTerms] = useState({
    service: false,
    privacy: false,
    age: false,
    marketing: false,
  });

  const handleAllCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setTerms({ service: checked, privacy: checked, age: checked, marketing: checked });
  };
  const handleTermCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setTerms((prev) => ({ ...prev, [name]: checked }));
  };
  const isEssentialChecked = terms.service && terms.privacy && terms.age;

  // --- 2단계 폼 데이터 ---
  const [formData, setFormData] = useState({
    lastName: "", firstName: "", schoolName: "", major: "", doubleMajor: "",
    email: "", password: "", passwordConfirm: "", username: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- ★ [핵심] 회원가입(정보 저장) 핸들러 ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSignup called");
    console.log("Terms:", terms);
    console.log("FormData:", formData);
    console.log("isEssentialChecked:", isEssentialChecked);

    if (!isEssentialChecked) {
      console.log("Essential terms not checked");
      return alert("필수 약관에 동의해주세요.");
    }

    // 일반 가입일 때만 비밀번호 체크
    if (!isSocialUser) {
      if (formData.password.length < 8) return alert("비밀번호는 8자 이상이어야 합니다.");
      if (formData.password !== formData.passwordConfirm) return alert("비밀번호가 일치하지 않습니다.");
    }

    if (formData.username.length < 2) return alert("닉네임은 2글자 이상이어야 합니다.");

    try {
      setIsLoading(true);
      let userId = socialUserId;

      // 1. 일반 가입: Auth 생성 (소셜은 이미 있으므로 패스)
      if (!isSocialUser) {
        console.log("Creating auth user...");
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.username,
              full_name: `${formData.lastName}${formData.firstName}`,
            },
          },
        });
        if (authError) {
          console.error("Auth error:", authError);
          throw authError;
        }
        if (!authData.user) throw new Error("회원가입 실패");
        userId = authData.user.id;
        console.log("Auth user created:", userId);
      }

      // 2. DB Profiles 처리
      console.log("Upserting profile...");
      if (isSocialUser) {
        // ★ [변경] 소셜 유저는 이미 트리거가 만든 행이 있으므로 'UPDATE' 해야 함
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            username: formData.username,
            last_name: formData.lastName,
            first_name: formData.firstName,
            school_name: formData.schoolName,
            major: formData.major, // 사용자가 입력한 진짜 전공으로 덮어씌움
            double_major: formData.doubleMajor,
            is_marketing_agreed: terms.marketing,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId); // 내 ID에 해당하는 행 수정

        if (updateError) throw updateError;

        alert("가입이 완료되었습니다! 홈으로 이동합니다.");
        window.location.href = "/";

      } else {
        // 일반 유저는 안전하게 upsert 사용
        const { error: insertError } = await supabase
          .from("profiles")
          .upsert({
            id: userId,
            username: formData.username,
            last_name: formData.lastName,
            first_name: formData.firstName,
            school_name: formData.schoolName,
            major: formData.major,
            double_major: formData.doubleMajor,
            is_marketing_agreed: terms.marketing,
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error("Profile insert error:", insertError);
          throw insertError;
        }

        alert("이메일 인증시 로그인이 가능합니다. 이메일을 확인해주세요.");
        router.replace("/login");
      }

    } catch (error: any) {
      console.error("Signup error catch:", error);
      alert(error.message || "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg border border-gray-100 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">
          My Study SNS
        </h1>

        {/* ★ [변경] 제목을 단계(Step)에 맞춰 명확하게 변경 */}
        <h2 className="text-xl font-semibold text-center mb-6 text-gray-700 dark:text-gray-300">
          {step === 1 ? "서비스 이용약관" : "추가 정보 입력"}
        </h2>

        {/* --- Step 1 UI (약관 동의) --- */}
        {step === 1 && (
          <div className="space-y-6">

            {/* ★ [변경] Step 1 안내 문구: 약관 동의 강조 */}
            {isSocialUser && (
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300 text-center mb-4">
                👋 반가워요! 서비스 이용을 위해<br />
                <b>필수 약관에 동의</b>해주세요.
              </div>
            )}

            {/* 전체 동의 박스 (기존 유지) */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isEssentialChecked && terms.marketing} onChange={handleAllCheck} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                <span className="font-bold text-gray-800 dark:text-gray-200">전체 동의하기</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-8">
                선택 항목에 대한 동의를 포함하여 전체 약관에 동의합니다.
              </p>
            </div>

            {/* 개별 약관 항목들 (기존 유지) */}
            <div className="space-y-4">
              {/* ... (약관 내용들은 그대로 둠) ... */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="service" checked={terms.service} onChange={handleTermCheck} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">[필수] 서비스 이용약관 동의</span>
                </label>
                <div className="h-24 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 rounded border border-gray-200 dark:border-gray-700 whitespace-pre-wrap leading-relaxed">{TERMS_OF_SERVICE}</div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="privacy" checked={terms.privacy} onChange={handleTermCheck} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">[필수] 개인정보 수집 및 이용 동의</span>
                </label>
                <div className="h-24 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 rounded border border-gray-200 dark:border-gray-700 whitespace-pre-wrap leading-relaxed">{PRIVACY_POLICY}</div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="age" checked={terms.age} onChange={handleTermCheck} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">[필수] 만 14세 이상입니다.</span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="marketing" checked={terms.marketing} onChange={handleTermCheck} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">[선택] 마케팅 정보 수신 동의</span>
                </label>
                <div className="h-20 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 rounded border border-gray-200 dark:border-gray-700 whitespace-pre-wrap leading-relaxed">{MARKETING_CONSENT}</div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!isEssentialChecked}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              다음으로 (정보 입력)
            </button>
          </div>
        )}

        {/* --- Step 2 UI (정보 입력) --- */}
        {step === 2 && (
          <form onSubmit={handleSignup} className="space-y-4">

            {/* ★ [추가] Step 2 안내 문구: 학교/전공 입력 강조 */}
            {isSocialUser && (
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300 text-center mb-2">
                <b>학교 및 전공 정보</b>를 입력해주세요.
              </div>
            )}

            {/* 입력 폼들 (기존 유지) */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">성</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">이름</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600" />
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">학교이름 (선택)</label>
                <input type="text" name="schoolName" value={formData.schoolName} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">전공</label>
                <input type="text" name="major" value={formData.major} onChange={handleInputChange} required placeholder="주전공" className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">복수전공 (선택)</label>
              <input type="text" name="doubleMajor" value={formData.doubleMajor} onChange={handleInputChange} placeholder="복수전공이 있다면 입력하세요" className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">이메일</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required readOnly={isSocialUser} className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none dark:bg-gray-700 dark:border-gray-600 ${isSocialUser ? 'bg-gray-100 text-gray-500' : 'focus:border-blue-500'}`} />
            </div>

            {!isSocialUser && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">비밀번호</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} required placeholder="8자 이상 입력" className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">비밀번호 확인</label>
                  <input type="password" name="passwordConfirm" value={formData.passwordConfirm} onChange={handleInputChange} required placeholder="비밀번호 재입력" className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600" />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs text-gray-500 mb-1">닉네임</label>
              <input type="text" name="username" value={formData.username} onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600" />
            </div>

            <div className="pt-4 flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition dark:bg-gray-700 dark:text-gray-300">이전으로</button>
              <button type="submit" disabled={isLoading} className="flex-[2] py-3 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-900 transition dark:bg-blue-600">
                {isLoading ? "저장 중..." : "완료"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}