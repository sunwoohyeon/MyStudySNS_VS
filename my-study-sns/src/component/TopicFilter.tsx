"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface TopicFilterProps {
  activeTopic: string;
  setActiveTopic: (topic: string) => void;
}

export default function TopicFilter({ activeTopic, setActiveTopic }: TopicFilterProps) {
  const [topics, setTopics] = useState<string[]>(["전체"]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchPopularHashtags = async () => {
      const { data, error } = await supabase
        .from('hashtags')
        .select('name')
        .order('count', { ascending: false })
        .limit(10);

      if (data) {
        const fetchedTopics = data.map((t: any) => t.name);
        setTopics(["전체", ...fetchedTopics]);
      }
    };

    fetchPopularHashtags();
  }, []);

  const handleTopicClick = (topic: string) => {
    setActiveTopic(topic);
  };

  return (
    <div className="border-b border-gray-200 rounded-xl dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* ▼▼▼ 이 div의 여백(padding) 클래스를 수정했습니다. ▼▼▼ */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => handleTopicClick(topic)}
              className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors duration-200 flex-shrink-0
                ${activeTopic === topic
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                }`
              }
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}