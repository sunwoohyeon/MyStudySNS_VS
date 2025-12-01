"use client";

import { useState, useEffect } from 'react';
import { FaPaperPlane, FaCheckCircle, FaEllipsisV, FaTrash, FaPen } from 'react-icons/fa';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user_id: string;
  is_accepted: boolean;
  profiles: {
    username: string;
    school_name: string;
    major: string;
  };
}

interface Props {
  postId: number;
  postAuthorId: string;
  boardType: string;
}

export default function CommentSection({ postId, postAuthorId, boardType }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const supabase = createClientComponentClient();

  // 초기 데이터 로드
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      if (!isNaN(postId)) {
        fetchComments();
      }
    };
    init();
  }, [postId]);

  const fetchComments = async () => {
    const res = await fetch(`/api/comments?post_id=${postId}`);
    if (res.ok) {
      const data = await res.json();
      setComments(data);
    }
  };

  // 댓글 작성 함수 (★ 여기가 수정되었습니다)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // 디버깅용: postId가 숫자가 맞는지 확인
    console.log("댓글 작성 시도 - PostID:", postId);

    if (isNaN(postId)) {
      alert("게시글 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, content: newComment }),
      });

      // ★ 서버 에러 확인 로직 추가
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "댓글 등록에 실패했습니다.");
      }

      setNewComment('');
      await fetchComments(); // 목록 갱신

    } catch (error: any) {
      console.error("댓글 작성 에러:", error);
      alert(`오류 발생: ${error.message}`); // 사용자에게 에러 내용 알려줌
    } finally {
      setLoading(false);
    }
  };

  // 답변 채택
  const handleAdopt = async (commentId: number) => {
    if (!confirm("이 답변을 채택하시겠습니까?\n채택 후에는 변경할 수 없습니다.")) return;

    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'adopt', postId }),
    });

    if (res.ok) {
      fetchComments();
      alert("답변이 채택되었습니다!");
    } else {
      alert("채택에 실패했습니다.");
    }
  };

  // 댓글 삭제
  const handleDelete = async (commentId: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
    fetchComments();
  };

  // 수정 모드 진입
  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  // 수정 저장
  const saveEdit = async (commentId: number) => {
    await fetch(`/api/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent }),
    });
    setEditingId(null);
    fetchComments();
  };

  const isPostAuthor = currentUserId === postAuthorId;
  const isQnABoard = boardType === "질문/답변";
  const hasAcceptedAnswer = comments.some(c => c.is_accepted);

  return (
    <div className="mt-10 border-t border-gray-100 dark:border-gray-700 pt-8">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
        댓글 <span className="text-blue-600">{comments.length}</span>
      </h3>

      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmit} className="relative mb-10">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={currentUserId ? "지식을 나눠주세요 (매너있는 댓글 부탁드립니다)" : "로그인이 필요합니다"}
          disabled={!currentUserId || loading}
          className="w-full p-4 pr-14 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition min-h-[100px] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
        <button
          type="submit"
          // 버튼이 비활성화되는 조건: 로그아웃 상태 or 로딩중 or 내용없음
          disabled={!currentUserId || loading || !newComment.trim()}
          className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
        >
          <FaPaperPlane size={16} />
        </button>
      </form>

      {/* 댓글 목록 */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={`group relative p-5 rounded-xl transition-all ${comment.is_accepted
                ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
                : 'bg-white border border-gray-100 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700'
              }`}
          >
            {comment.is_accepted && (
              <div className="absolute -top-3 left-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                <FaCheckCircle /> 질문자 채택
              </div>
            )}

            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${comment.is_accepted ? 'bg-green-500' : 'bg-gray-400'}`}>
                  {comment.profiles?.username.substring(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${comment.user_id}`} className="font-bold text-sm text-gray-900 dark:text-gray-100 hover:text-blue-600 hover:underline transition">
                      {comment.profiles?.username}
                    </Link>
                    {comment.user_id === postAuthorId && (
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">작성자</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 flex gap-2">
                    <span>{comment.profiles?.major}</span>
                    <span>·</span>
                    <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* 채택 버튼 */}
                {isPostAuthor && isQnABoard && !hasAcceptedAnswer && comment.user_id !== currentUserId && (
                  <button
                    onClick={() => handleAdopt(comment.id)}
                    className="text-xs bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded-full hover:border-green-500 hover:text-green-500 transition flex items-center gap-1 font-medium"
                  >
                    <FaCheckCircle /> 채택하기
                  </button>
                )}

                {/* 본인 댓글 관리 */}
                {currentUserId === comment.user_id && (
                  <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(comment)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded">
                      <FaPen size={12} />
                    </button>
                    <button onClick={() => handleDelete(comment.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                      <FaTrash size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {editingId === comment.id ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-gray-700">취소</button>
                  <button onClick={() => saveEdit(comment.id)} className="text-xs px-3 py-1 bg-blue-500 rounded hover:bg-blue-600 text-white">저장</button>
                </div>
              </div>
            ) : (
              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${comment.is_accepted ? 'text-gray-800 font-medium' : 'text-gray-700'} dark:text-gray-300`}>
                {comment.content}
              </p>
            )}
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-gray-400 text-sm">아직 댓글이 없습니다. 첫 번째 지식을 공유해주세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}