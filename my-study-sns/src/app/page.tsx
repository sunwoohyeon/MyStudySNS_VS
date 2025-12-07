// src/app/page.tsx
"use client";

import { useState } from 'react';
import KnowledgeCards from "@/component/KnowledgeCards"; 
import ScheduleWidget from "@/component/ScheduleWidget"; 
import Timeline from "@/component/Timeline"; 
import TopicFilter from "@/component/TopicFilter"; 

export default function IndexPage() {
  const [selectedTopic, setSelectedTopic] = useState("전체"); 
  
  return (
    <div className="w-full max-w-7xl mx-auto px-8 sm:px-6 lg:px-12 xl:px-20 pt-0 pb-2">

      {/* 그리드 레이아웃: 1열 → (md 이상) 12열 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

        {/* 좌측 영역: 시간표 (4/12) */}
        <div className="md:col-span-4 space-y-8">
          <ScheduleWidget />
        </div>

        {/* 우측 영역: 지식카드 + 필터 + 타임라인 (8/12) */}
        <div className="md:col-span-8 space-y-8">
          
          {/* 추천 지식 카드 */}
          <KnowledgeCards />

          {/* 메인 타임라인 */}
          <Timeline selectedTopic={selectedTopic} />

        </div>
      </div>
    </div>
  );
}
