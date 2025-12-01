// src/app/page.tsx (최종 수정)
"use client";

import { useState } from 'react';
import KnowledgeCards from "@/component/KnowledgeCards"; 
import ScheduleWidget from "@/component/ScheduleWidget"; 
import Timeline from "@/component/Timeline"; 
import TopicFilter from "@/component/TopicFilter"; 

export default function IndexPage() {
  const [selectedTopic, setSelectedTopic] = useState("전체"); 
  
  return (
    // ★ 수정된 부분: max-w-7xl 제거, px-48 (12rem/192px) 적용
    //               Tailwind 기본 설정에서 px-96 (24rem)이 최대입니다.
    //               px-48을 사용하여 좌우 여백을 극대화합니다.
    <div className="w-full px-48 py-8">
      
      {/* ★ 수정된 부분: 그리드 레이아웃 비율을 4:8로 변경합니다. */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

        {/* --- 좌측 영역: 시간표 (4/12 너비) --- */}
        {/* ★ 수정: md:col-span-6 -> md:col-span-4로 변경 */}
        <div className="md:col-span-4 space-y-8">
            <ScheduleWidget />
        </div>

        {/* --- 우측 영역: 지식 카드, 필터, 게시글 (8/12 너비) --- */}
        {/* ★ 수정: md:col-span-6 -> md:col-span-8로 변경 */}
        <div className="md:col-span-8 space-y-8">
            
            {/* 1. 추천 지식 카드 */}
            <KnowledgeCards /> 
            
            {/* 2. 주제 필터링 버튼 목록 */}
            <TopicFilter activeTopic={selectedTopic} setActiveTopic={setSelectedTopic} /> 

            {/* 3. 메인 타임라인 */}
            <Timeline selectedTopic={selectedTopic} /> 
        </div>
      </div>
    </div>
  );
}