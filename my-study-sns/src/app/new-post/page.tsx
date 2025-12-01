"use client";

import MainLayout from "@/component/MainLayout";
import PostForm from "@/component/PostForm";
import { useState } from "react";

const BoardSelector = ({ selectedBoard, setSelectedBoard }: { selectedBoard: string, setSelectedBoard: (board: string) => void }) => {
  const boards = ["자유게시판", "질문/답변", "스터디 노트"];
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">보드 선택</h2>
      <div className="flex gap-2">
        {boards.map(board => (
          <button key={board} onClick={() => setSelectedBoard(board)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedBoard === board ? 'bg-blue-600 text-white font-bold' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}>
            {board}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function NewPostPage() {
  const [selectedBoard, setSelectedBoard] = useState("자유게시판");
  
  return (
    <MainLayout>
      {/* ▼▼▼ 이 div에 mx-auto 클래스를 추가하여 중앙 정렬합니다. ▼▼▼ */}
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">새 글 작성하기</h1>
        
        <BoardSelector selectedBoard={selectedBoard} setSelectedBoard={setSelectedBoard} />
        
        <PostForm selectedBoard={selectedBoard} />
      </div>
    </MainLayout>
  );
}