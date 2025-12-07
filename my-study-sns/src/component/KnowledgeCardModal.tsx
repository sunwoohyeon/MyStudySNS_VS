"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { FaExternalLinkAlt, FaTrash } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

type KnowledgeCard = {
  id: number;
  post_id: number;
  user_id?: string;
  title: string;
  summary: string;
  category: string;
  keywords: string[];
};

interface KnowledgeCardModalProps {
  card: KnowledgeCard;
  onClose: () => void;
  currentUserId?: string;
  onDelete?: (cardId: number) => void;
}

export default function KnowledgeCardModal({ card, onClose, currentUserId, onDelete }: KnowledgeCardModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwner = currentUserId && card.user_id === currentUserId;

  const handleDelete = async () => {
    if (!confirm("이 지식카드를 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/knowledge/${card.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "삭제에 실패했습니다.");
      }

      alert("지식카드가 삭제되었습니다.");
      onDelete?.(card.id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsDeleting(false);
    }
  };
  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // 모달이 열릴 때 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* 헤더 */}
        <div className="flex justify-between items-start p-5 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xs font-semibold text-white bg-blue-500 px-3 py-1 rounded-full">
            {card.category}
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 transition-colors"
            aria-label="닫기"
          >
            <IoClose className="w-6 h-6" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-5 overflow-y-auto flex-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {card.title}
          </h2>

          <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h2: ({ children }) => (
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-4 mb-2 border-b border-gray-200 dark:border-gray-600 pb-1">
                    {children}
                  </h2>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-2">
                    {children}
                  </ul>
                ),
                li: ({ children }) => (
                  <li className="text-gray-700 dark:text-gray-300">{children}</li>
                ),
                p: ({ children }) => (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900 dark:text-gray-100">
                    {children}
                  </strong>
                ),
              }}
            >
              {card.summary}
            </ReactMarkdown>
          </div>

          {/* 키워드 */}
          {card.keywords && card.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {card.keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded"
                >
                  #{keyword}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-5 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <Link
            href={`/post/${card.post_id}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <FaExternalLinkAlt className="w-4 h-4" />
            원본 게시글 보기
          </Link>

          {(isOwner || onDelete) && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center justify-center gap-2 w-full py-3 border border-red-300 text-red-500 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <FaTrash className="w-4 h-4" />
              {isDeleting ? "삭제 중..." : "지식카드 삭제"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
