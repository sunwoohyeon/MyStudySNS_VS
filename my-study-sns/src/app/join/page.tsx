"use client";

import Link from "next/link";
import SimpleHeader from "@/component/SimpleHeader";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function JoinPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    school: "",
    major: "",
    doubleMajor: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(""); // Submit 에러
  const [passwordError, setPasswordError] = useState(""); // 확인 일치 에러
  const [passwordValidationError, setPasswordValidationError] = useState(""); // 유효성 검사 에러

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 비밀번호 유효성 검사 함수 (AccountModal에서 가져옴)
  const validatePassword = (password: string): string => {
    if (password.length < 8 || password.length > 16) {
      return "비밀번호는 8~16자 사이여야 합니다.";
    }
    if (!/[a-z]/.test(password)) {
      return "비밀번호에 소문자가 포함되어야 합니다.";
    }
    if (!/[0-9]/.test(password)) {
      return "비밀번호에 숫자가 포함되어야 합니다.";
    }
    // eslint-disable-next-line no-useless-escape
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return "비밀번호에 특수문자가 포함되어야 합니다.";
    }
    return ""; // 유효하면 빈 문자열 반환
  };

  // 비밀번호 유효성 검사 로직 (AccountModal에서 가져옴)
  useEffect(() => {
    if (formData.password === "") {
      setPasswordValidationError("");
    } else {
      setPasswordValidationError(validatePassword(formData.password));
    }
  }, [formData.password]);

  // 비밀번호 확인 일치 로직
  useEffect(() => {
    if (formData.confirmPassword === "") { setPasswordError(""); return; }
    if (formData.password !== formData.confirmPassword) { setPasswordError("비밀번호가 일치하지 않습니다."); } else { setPasswordError(""); }
  }, [formData.password, formData.confirmPassword]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const validationError = validatePassword(formData.password); // 최종 유효성 검사
    if (validationError) { setError(validationError); return; } // Submit 시 유효성 에러 표시

    const { password, confirmPassword, doubleMajor, ...requiredFields } = formData;
    if (Object.values(requiredFields).some(field => field === "") || password === "") { setError("복수 전공을 제외한 모든 필수 필드를 입력해주세요."); return; }
    if (password !== confirmPassword) { setError("비밀번호가 일치하지 않습니다."); return; }

    try {
      setIsLoading(true);
      console.log("회원가입 시도:", formData);
      alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
      router.push("/login");
    } catch (e) { setError("회원가입 중 오류가 발생했습니다."); } finally { setIsLoading(false); }
  };

  // 가입 버튼 활성화 조건: 필수 필드 입력 + 유효성 통과 + 비밀번호 일치
  const isFormValid =
    formData.lastName !== "" &&
    formData.firstName !== "" &&
    formData.school !== "" &&
    formData.major !== "" &&
    formData.email !== "" &&
    formData.password !== "" &&
    formData.confirmPassword !== "" &&
    passwordValidationError === "" && // 유효성 에러 없음
    passwordError === "" && // 확인 에러 없음
    formData.password === formData.confirmPassword;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <SimpleHeader />
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">회원가입</h1>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">

          <div className="grid grid-cols-2 gap-4">
            <input onChange={onChange} name="lastName" value={formData.lastName} placeholder="성" type="text" required className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <input onChange={onChange} name="firstName" value={formData.firstName} placeholder="이름" type="text" required className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input onChange={onChange} name="school" value={formData.school} placeholder="학교이름" type="text" required className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <input onChange={onChange} name="major" value={formData.major} placeholder="전공" type="text" required className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <div></div>
            <input onChange={onChange} name="doubleMajor" value={formData.doubleMajor} placeholder="복수 전공 (선택)" type="text" className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>

          <input onChange={onChange} name="email" value={formData.email} placeholder="이메일" type="email" required className="p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />

          {/* ▼▼▼ 비밀번호 칸 수정 ▼▼▼ */}
          <div>
            <input
              onChange={onChange}
              name="password"
              value={formData.password}
              placeholder="비밀번호"
              type="password"
              required
              className={`w-full p-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${passwordValidationError ? 'border-red-500' : 'border-gray-300'}`}
            />
            {/* 유효성 검사 에러 메시지 */}
            {passwordValidationError && <p className="text-red-500 text-xs mt-1">{passwordValidationError}</p>}
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">8~16자 영문 대/소문자, 숫자, 특수문자를 사용하세요.</p>
          </div>

          {/* ▼▼▼ 비밀번호 확인 칸 수정 ▼▼▼ */}
          <div>
            <input
              onChange={onChange}
              name="confirmPassword"
              value={formData.confirmPassword}
              placeholder="비밀번호 확인"
              type="password"
              required
              className={`w-full p-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${passwordError ? 'border-red-500' : 'border-gray-300'}`}
            />
            {/* 확인 일치 에러 메시지 */}
            {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className="mt-4 p-3 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "가입 중..." : "회원가입"}
          </button>
        </form>
        {error && <span className="block text-red-500 font-semibold mt-4 text-center">{error}</span>}

        <div className="text-center mt-6">
          <span className="text-gray-600 dark:text-gray-400">이미 계정이 있으신가요? </span>
          <Link href="/login" className="text-blue-500 hover:underline"> 로그인 </Link>
        </div>
      </div>
    </div>
  );
}