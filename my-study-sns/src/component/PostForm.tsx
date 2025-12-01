"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

const tags = ["React", "Next.js", "Python", "자료구조", "알고리즘", "CS", "기타"];

// ▼▼▼ selectedBoard를 props로 받도록 수정했습니다. ▼▼▼
export default function PostForm({ selectedBoard }: { selectedBoard: string }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const { addPost } = useAuth();
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (title.trim() === "" || text.trim() === "" || !selectedTag) return;
    
    // ▼▼▼ addPost 호출 시 props로 받은 board 정보도 함께 넘겨줍니다. ▼▼▼
    addPost({ title, text, tag: selectedTag, board: selectedBoard });
    
    router.push("/");
  };

  return (
    <form onSubmit={onSubmit} className="py-5">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목을 입력하세요"
        maxLength={120}
        required
        className="w-full p-3 mb-4 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
      />
      <textarea
        onChange={(e) => setText(e.target.value)}
        value={text}
        rows={10}
        maxLength={10000}
        placeholder="무엇을 공부하고 있나요? 질문이나 지식을 공유해 보세요!"
        required
        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
      />
      <div className="my-4">
        <h3 className="text-md font-semibold mb-2 text-gray-800 dark:text-gray-200">태그 선택</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 text-sm rounded-full transition-colors
                ${selectedTag === tag 
                  ? 'bg-blue-600 text-white font-bold' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                }`
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
          disabled={title.trim() === "" || text.trim() === "" || !selectedTag}
        >
          게시
        </button>
      </div>
    </form>
  );
}