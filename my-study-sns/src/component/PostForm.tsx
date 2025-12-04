"use client";

import { useAuth } from "@/contexts/AuthContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

const tags = ["React", "Next.js", "Python", "자료구조", "알고리즘", "CS", "기타"];

export default function PostForm({ selectedBoard }: { selectedBoard: string }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isLoggedIn } = useAuth();
  const supabase = createClientComponentClient();
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (title.trim() === "" || text.trim() === "" || !selectedTag) return;

    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요합니다.");
        router.push("/login");
        return;
      }

      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: text.trim(),
          tag: selectedTag,
          board: selectedBoard
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError("게시글 작성 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="py-5">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg dark:bg-red-900 dark:text-red-300">
          {error}
        </div>
      )}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목을 입력하세요"
        maxLength={120}
        required
        disabled={isSubmitting}
        className="w-full p-3 mb-4 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
      />
      <textarea
        onChange={(e) => setText(e.target.value)}
        value={text}
        rows={10}
        maxLength={10000}
        placeholder="무엇을 공부하고 있나요? 질문이나 지식을 공유해 보세요!"
        required
        disabled={isSubmitting}
        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
      />
      <div className="my-4">
        <h3 className="text-md font-semibold mb-2 text-gray-800 dark:text-gray-200">태그 선택</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              disabled={isSubmitting}
              className={`px-3 py-1 text-sm rounded-full transition-colors
                ${selectedTag === tag
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                }
                disabled:opacity-50`
              }
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end mt-3">
        <button
          type="submit"
          className="bg-blue-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          disabled={title.trim() === "" || text.trim() === "" || !selectedTag || isSubmitting}
        >
          {isSubmitting ? "게시 중..." : "게시"}
        </button>
      </div>
    </form>
  );
}
