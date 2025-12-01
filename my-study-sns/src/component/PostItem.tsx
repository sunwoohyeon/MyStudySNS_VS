"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Post 데이터 타입 정의
interface PostProps {
  post: {
    id: number;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
      username: string;
    } | null;
  };
  currentUserId: string | undefined;
}

export default function PostItem({ post, currentUserId }: PostProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isLoading, setIsLoading] = useState(false);

  // 1. 수정 모드 켜기
  const handleEditClick = () => {
    setIsEditing(true);
    setEditContent(post.content);
  };

  // 2. 수정 취소
  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(post.content);
  };

  // 3. 수정 저장 (PATCH 요청)
  const handleSave = async () => {
    if (!editContent.trim()) return alert("내용을 입력해주세요.");
    if (editContent === post.content) return setIsEditing(false); // 변경사항 없으면 그냥 닫기

    try {
      setIsLoading(true);
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (!res.ok) throw new Error("수정 실패");

      setIsEditing(false);
      router.refresh(); // 데이터 갱신 (화면 업데이트)
    } catch (error) {
      console.error(error);
      alert("게시글 수정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. 삭제 (DELETE 요청)
  const handleDelete = async () => {
    if (!confirm("정말 이 게시글을 삭제하시겠습니까?")) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("삭제 실패");

      router.refresh(); // 데이터 갱신 (화면 업데이트)
    } catch (error) {
      console.error(error);
      alert("삭제에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 작성자 본인인지 확인 (본인 글만 수정/삭제 버튼 보임)
  const isMyPost = currentUserId === post.user_id;

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
      {/* 상단: 작성자 및 날짜 */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          {/* 프로필 이미지 대용 아이콘 */}
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
            {post.profiles?.username ? post.profiles.username[0] : "?"}
          </div>
          <span className="font-semibold text-gray-900">
            {post.profiles?.username || "알 수 없는 사용자"}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(post.created_at).toLocaleDateString()}{" "}
          {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* 본문 영역: 수정 모드 vs 조회 모드 */}
      <div className="mb-4">
        {isEditing ? (
          <textarea
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none h-32"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            disabled={isLoading}
          />
        ) : (
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        )}
      </div>

      {/* 하단 버튼 영역 (본인 글일 때만 표시) */}
      {isMyPost && (
        <div className="flex justify-end gap-2 text-sm">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-3 py-1.5 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-3 py-1.5 text-white bg-blue-600 rounded hover:bg-blue-700 transition"
              >
                {isLoading ? "저장 중..." : "저장완료"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEditClick}
                className="px-3 py-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
              >
                삭제
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}