"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { FiImage, FiX, FiArrowLeft } from "react-icons/fi";
import HashtagInput from "@/component/HashtagInput";

export default function WritePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    board: "자유게시판",
    tag: "일반",
  });
  const [hashtags, setHashtags] = useState<string[]>([]);

  // 입력 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 이미지 선택 및 즉시 업로드 핸들러
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("로그인이 필요합니다.");
      router.replace("/login");
      return;
    }

    try {
      setIsLoading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("post-images")
        .getPublicUrl(fileName);

      const imageMarkdown = `\n![image](${publicUrl})\n`;

      setFormData((prev) => {
        const textarea = textAreaRef.current;
        let newContent = prev.content;

        if (textarea) {
          const startPos = textarea.selectionStart;
          const endPos = textarea.selectionEnd;

          newContent =
            prev.content.substring(0, startPos) +
            imageMarkdown +
            prev.content.substring(endPos);

          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(startPos + imageMarkdown.length, startPos + imageMarkdown.length);
          }, 0);
        } else {
          newContent = prev.content + imageMarkdown;
        }

        return { ...prev, content: newContent };
      });

    } catch (error: any) {
      console.error(error);
      alert("이미지 업로드 실패: " + error.message);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 작성 완료 핸들러
  const handleSubmit = async () => {
    if (!formData.title.trim()) return alert("제목을 입력해주세요.");
    if (!formData.content.trim()) return alert("내용을 입력해주세요.");

    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요합니다.");
        router.replace("/login");
        return;
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          board: formData.board,
          tag: formData.tag,
          imageUrl: null,
          hashtags: hashtags,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "게시글 등록 실패");
      }

      alert("게시글이 등록되었습니다.");
      router.replace("/");
      router.refresh();

    } catch (error: any) {
      console.error(error);
      alert("업로드 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 h-14 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full dark:text-gray-300 dark:hover:bg-gray-800">
          <FiArrowLeft size={24} />
        </button>
        <span className="font-bold text-lg text-gray-900 dark:text-white">글쓰기</span>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="text-blue-600 font-bold px-3 py-1.5 rounded-lg hover:bg-blue-50 disabled:text-gray-400 dark:text-blue-400 dark:hover:bg-gray-800"
        >
          {isLoading ? "처리 중..." : "완료"}
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="w-full">
          <select
            name="board"
            value={formData.board}
            onChange={handleChange}
            className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="자유게시판">자유게시판</option>
            <option value="질문/답변">질문/답변</option>
            <option value="스터디 노트">스터디 노트</option>
          </select>
        </div>

        <HashtagInput tags={hashtags} setTags={setHashtags} />

        <input
          type="text"
          name="title"
          placeholder="제목을 입력하세요"
          value={formData.title}
          onChange={handleChange}
          className="w-full text-2xl font-bold placeholder-gray-300 border-none outline-none bg-transparent dark:text-white dark:placeholder-gray-600"
        />

        <hr className="border-gray-100 dark:border-gray-800" />

        <textarea
          ref={textAreaRef}
          name="content"
          placeholder="내용을 입력하세요. 하단 버튼을 눌러 사진을 본문에 추가할 수 있습니다."
          value={formData.content}
          onChange={handleChange}
          className="w-full min-h-[400px] text-lg leading-relaxed resize-none border-none outline-none bg-transparent dark:text-gray-200 dark:placeholder-gray-600"
        />

        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-3 dark:bg-gray-900 dark:border-gray-800">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100 transition dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              <FiImage size={28} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            <span className="text-xs text-gray-400">
              {isLoading ? "이미지 업로드 중..." : "사진 버튼을 누르면 본문에 이미지가 삽입됩니다."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
