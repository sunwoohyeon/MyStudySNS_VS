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

  const isMyPost = currentUserId === post.user_id;

  /* ------------------------- 수정 모드 제어 ------------------------- */
  const handleEditClick = () => {
    setIsEditing(true);
    setEditContent(post.content);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(post.content);
  };

  /* ------------------------- PATCH: 수정 저장 ------------------------- */
  const handleSave = async () => {
    if (!editContent.trim()) return alert("내용을 입력해주세요.");

    try {
      setIsLoading(true);
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (!res.ok) throw new Error("수정 실패");

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("게시글 수정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------- DELETE: 게시글 삭제 ------------------------- */
  const handleDelete = async () => {
    if (!confirm("정말 이 게시글을 삭제하시겠습니까?")) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("삭제 실패");

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("삭제에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------- UI RETURN ------------------------- */

  return (
    <div className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow overflow-hidden">

      {/* ------ 작성자 정보 + 날짜 ------ */}
      <div className="flex items-center justify-between mb-3 gap-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs flex-shrink-0">
            {post.profiles?.username ? post.profiles.username[0] : "?"}
          </div>

          <span className="font-semibold text-gray-900 dark:text-white truncate">
            {post.profiles?.username || "알 수 없는 사용자"}
          </span>
        </div>

        <span className="text-[11px] text-gray-500 dark:text-gray-400 flex-shrink-0">
          {new Date(post.created_at).toLocaleDateString()}{" "}
          {new Date(post.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* ------ 본문 영역 ------ */}
      <div className="mb-4">
        {isEditing ? (
          <textarea
            className="w-full p-3 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm resize-none focus:ring-2 focus:ring-blue-500 h-28 sm:h-32"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            disabled={isLoading}
          />
        ) : (
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed break-words">
            {post.content}
          </p>
        )}
      </div>

      {/* ------ 하단 버튼 영역 ------ */}
      {isMyPost && (
        <div className="flex justify-end gap-2 text-sm">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-3 py-1.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500 transition"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                {isLoading ? "저장 중..." : "저장완료"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEditClick}
                className="px-3 py-1.5 rounded text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
              >
                수정
              </button>

              <button
                onClick={handleDelete}
                className="px-3 py-1.5 rounded text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
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
