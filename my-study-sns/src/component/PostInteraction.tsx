"use client";

import { useState, useEffect, useCallback } from "react";
import { FiAlertTriangle, FiCheck } from "react-icons/fi";
import { FaStar, FaRegStar } from "react-icons/fa";

interface Props {
  postId: number;
}

export default function PostInteraction({ postId }: Props) {
  const [myScore, setMyScore] = useState<number | null>(null);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // 신고 폼 상태
  const [reportReason, setReportReason] = useState("스팸/부적절한 홍보");
  const [reportDesc, setReportDesc] = useState("");

  // 데이터 불러오기 함수 (재사용을 위해 분리)
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/interactions?postId=${postId}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAverage(Number(data.average));
        setCount(data.count);
        // 내 점수는 여기서 업데이트 하지 않음 (낙관적 업데이트 유지)
        if (data.myScore > 0) setMyScore(data.myScore);
      }
    } catch (error) {
      console.error("Failed to fetch interactions:", error);
    }
  }, [postId]);

  // 초기 로딩
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 점수 클릭 핸들러
  const handleScore = async (score: number) => {
    // 일단 UI만 먼저 바꿈 (낙관적 업데이트) - 에러나면 되돌려야 함
    const previousScore = myScore;
    setMyScore(score);

    try {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "review", postId, score }),
      });

      const result = await res.json(); // ★ 서버 응답 메시지 받기

      if (!res.ok) {
        // ★ 서버가 보낸 에러 메시지 출력 (예: "본인의 게시글에는...")
        alert(result.error || "오류가 발생했습니다.");
        setMyScore(previousScore); // 에러 났으니 점수 되돌리기
      } else {
        // ★ 성공 시, 최신 데이터 다시 불러오기 (확실한 동기화)
        await fetchData();
      }
    } catch (e) {
      alert("네트워크 오류가 발생했습니다.");
      setMyScore(previousScore);
    }
  };

  // 신고 제출 핸들러
  const handleReport = async () => {
    if (!confirm("정말로 신고하시겠습니까?")) return;

    try {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "report",
          postId,
          reason: reportReason,
          description: reportDesc
        }),
      });

      const result = await res.json(); // ★ 서버 응답 받기

      if (res.ok) {
        alert("신고가 접수되었습니다. 운영진 확인 후 조치하겠습니다.");
        setIsReportModalOpen(false);
        setReportDesc("");
      } else {
        // ★ 구체적인 에러 메시지 출력
        alert(result.error || "오류가 발생했습니다.");
      }
    } catch (e) {
      alert("신고 접수 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="w-full mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 relative flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1 text-yellow-400 text-2xl">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              onClick={() => handleScore(score)}
              className="hover:scale-110 transition-transform focus:outline-none"
            >
              {(myScore || 0) >= score ? <FaStar /> : <FaRegStar />}
            </button>
          ))}
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-gray-900 dark:text-white leading-none">
            {average.toFixed(1)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {count}명 참여
          </span>
        </div>
      </div>

      <button
        onClick={() => setIsReportModalOpen(true)}
        className="absolute right-0 bottom-0 flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <FiAlertTriangle className="text-sm" />
        <span>게시글 신고</span>
      </button>

      {/* --- 신고 모달 --- */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl p-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
              <FiAlertTriangle /> 신고하기
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">신고 사유</label>
                <select
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                >
                  <option>스팸 / 부적절한 홍보</option>
                  <option>욕설 / 비하 발언</option>
                  <option>음란물 / 청소년 유해 정보</option>
                  <option>저작권 침해 / 명의 도용</option>
                  <option>개인정보 노출</option>
                  <option>기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">상세 내용 (선택)</label>
                <textarea
                  className="w-full p-2 border rounded h-24 resize-none dark:bg-gray-700 dark:border-gray-600"
                  placeholder="신고 사유를 자세히 적어주시면 운영에 도움이 됩니다."
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                >
                  취소
                </button>
                <button
                  onClick={handleReport}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold"
                >
                  신고 제출
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}