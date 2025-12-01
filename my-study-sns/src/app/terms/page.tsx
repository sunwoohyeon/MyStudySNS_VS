"use client";

import SimpleHeader from "@/component/SimpleHeader"; // SimpleHeader를 import 합니다.
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const termsList = [
  { id: "termsOfService", text: "서비스 이용약관 동의", required: true, details: "여러분을 환영합니다. 본 약관은 다양한 서비스의 이용과 관련하여 서비스를 제공하는 'SNS'와 이를 이용하는 회원과의 관계를 설명하며, 아울러 여러분의 서비스 이용에 도움이 될 수 있는 유익한 정보를 포함하고 있습니다. 서비스를 이용하시거나 회원으로 가입하실 경우 여러분은 본 약관 및 관련 운영 정책을 확인하거나 동의하게 되므로, 잠시 시간을 내시어 주의 깊게 살펴봐 주시기 바랍니다." },
  { id: "privacyPolicy", text: "개인정보 수집 및 이용 동의", required: true, details: "SNS는 서비스의 원활한 제공을 위하여 회원이 동의한 목적과 범위 내에서만 개인정보를 수집∙이용하며, 개인정보 보호 관련 법령에 따라 안전하게 관리합니다. 회원이 서비스를 이용하기 위해 일정 기간 동안 로그인 혹은 접속한 기록이 없는 경우, 안내 후 정보를 파기하거나 분리 보관할 수 있습니다." },
  { id: "age", text: "만 14세 이상입니다.", required: true, details: "정보통신망법에 따라 만 14세 미만 아동의 개인정보 수집 시 법정대리인의 동의가 필요합니다. 본 서비스는 만 14세 이상 회원만 가입할 수 있으며, 가입 시 연령을 허위로 기재할 경우 서비스 이용이 제한될 수 있습니다." },
  { id: "marketing", text: "마케팅 정보 수신 동의", required: false, details: "새로운 기능, 유용한 학습 정보, 이벤트 및 광고성 정보를 이메일 또는 앱 푸시를 통해 받아보실 수 있습니다. 수신에 동의하지 않아도 서비스의 기본 기능 이용에는 아무런 제한이 없습니다. 수신 동의는 언제든지 '내 정보'에서 철회할 수 있습니다." },
];

export default function TermsPage() {
  const router = useRouter();
  const [agreements, setAgreements] = useState({ termsOfService: false, privacyPolicy: false, age: false, marketing: false });
  const [allAgreed, setAllAgreed] = useState(false);

  const handleAgreementChange = (id: keyof typeof agreements) => { setAgreements(prev => ({ ...prev, [id]: !prev[id] })); };

  const handleAllAgreedChange = () => {
    const newValue = !allAgreed;
    setAllAgreed(newValue);
    const newAgreements: typeof agreements = {} as any;
    termsList.forEach(term => { newAgreements[term.id as keyof typeof agreements] = newValue; });
    setAgreements(newAgreements);
  };

  useEffect(() => {
    const allChecked = termsList.every(term => agreements[term.id as keyof typeof agreements]);
    if (allChecked) { setAllAgreed(true); } else { setAllAgreed(false); }
  }, [agreements]);

  const requiredAgreed = termsList.filter(term => term.required).every(term => agreements[term.id as keyof typeof agreements]);

  const handleNext = () => { if (requiredAgreed) { router.push("/join"); } };

  return (
    // ▼▼▼ 최상위 div에 'relative' 클래스를 추가합니다. ▼▼▼
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <SimpleHeader /> {/* 헤더를 추가합니다. */}
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center dark:text-white">서비스 이용약관</h1>
        
        <div className="mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50 dark:border-gray-700">
          <label className="flex items-center cursor-pointer">
            <input type="checkbox" checked={allAgreed} onChange={handleAllAgreedChange} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="ml-3 text-lg font-semibold text-gray-700 dark:text-gray-200">전체 동의하기</span>
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 ml-8">선택 항목에 대한 동의를 포함하여 전체 약관에 동의합니다.</p>
        </div>

        <div className="space-y-4">
          {termsList.map(term => (
            <div key={term.id}>
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" checked={agreements[term.id as keyof typeof agreements]} onChange={() => handleAgreementChange(term.id as keyof typeof agreements)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-3 text-gray-700 dark:text-gray-200">
                  {term.text}
                  <span className={term.required ? "text-blue-500 font-semibold" : "text-gray-500"}> {term.required ? " (필수)" : " (선택)"}</span>
                </span>
              </label>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden mt-2 ml-8 border rounded ${agreements[term.id as keyof typeof agreements] ? 'h-0 p-0 border-transparent' : 'h-24 p-2 border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'}`}>
                <p className="text-sm text-gray-600 dark:text-gray-300">{term.details}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleNext} disabled={!requiredAgreed} className="w-full mt-8 p-3 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
          다음
        </button>
      </div>
    </div>
  );
}