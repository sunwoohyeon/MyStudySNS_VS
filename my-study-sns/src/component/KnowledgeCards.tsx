"use client";

import React, { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import KnowledgeCardModal from "./KnowledgeCardModal";

type KnowledgeCard = {
  id: number;
  post_id: number;
  user_id?: string;
  title: string;
  summary: string;
  category: string;
  keywords: string[];
};

export default function KnowledgeCards() {
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<KnowledgeCard | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      // 현재 사용자 ID 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);

      // 지식카드 목록 가져오기
      const { data, error } = await supabase
        .from("knowledge_cards")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching knowledge cards:", error);
      } else {
        setCards(data || []);
      }
    };

    fetchData();
  }, [supabase]);

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-xl dark:bg-gray-800">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
        추천 지식카드
      </h2>
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => setSelectedCard(card)}
            className="block flex-shrink-0 w-80 bg-white dark:bg-gray-700 rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden flex flex-col cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setSelectedCard(card)}
          >
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-white bg-blue-500 px-2 py-1 rounded-full">
                  {card.category}
                </span>
              </div>

              <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-gray-50">
                {card.title}
              </h3>

              <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 flex-1">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={{
                    h2: ({ children }) => <span className="font-bold">{children} </span>,
                    h3: ({ children }) => <span className="font-semibold">{children} </span>,
                    p: ({ children }) => <span>{children} </span>,
                    ul: ({ children }) => <span>{children}</span>,
                    ol: ({ children }) => <span>{children}</span>,
                    li: ({ children }) => <span>• {children} </span>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  }}
                >
                  {card.summary}
                </ReactMarkdown>
              </div>

              <div className="flex flex-wrap gap-1 mt-auto">
                {card.keywords?.map((keyword, idx) => (
                  <span key={idx} className="text-[10px] bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">
                    #{keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 지식카드 상세 모달 */}
      {selectedCard && (
        <KnowledgeCardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          currentUserId={currentUserId}
          onDelete={(cardId: number) => {
            setCards(cards.filter(c => c.id !== cardId));
            setSelectedCard(null);
          }}
        />
      )}
    </div>
  );
}