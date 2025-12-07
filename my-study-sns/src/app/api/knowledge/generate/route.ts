import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    try {
        const { postId } = await request.json();

        if (!postId) {
            return NextResponse.json({ error: "게시글 ID가 필요합니다." }, { status: 400 });
        }

        const { data: existingCard } = await supabase
            .from("knowledge_cards")
            .select("id")
            .eq("post_id", postId)
            .single();

        if (existingCard) {
            return NextResponse.json({ message: "이미 지식 카드가 존재합니다.", cardId: existingCard.id });
        }

        const { data: post, error: postError } = await supabase
            .from("posts")
            .select("title, content, board, image_url")
            .eq("id", postId)
            .single();

        if (postError || !post) {
            return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const promptText = `
다음 학습 자료를 분석하여 **공부에 도움이 되는 지식카드**를 생성해줘.
응답은 오직 JSON 형식이어야 해.

{
    "title": "클릭하고 싶은 흥미로운 제목 (원래 제목과 다르게, 호기심 자극)",
    "summary": "아래 형식으로 핵심 내용을 정리해줘 (마크다운 형식):\\n\\n## 핵심 개념\\n- 주요 개념과 정의를 bullet point로 정리\\n- 중요한 용어 설명\\n\\n## 중요 포인트\\n- 시험/면접에 나올 수 있는 핵심 내용\\n- 꼭 암기해야 할 공식, 법칙, 원리\\n- 자주 틀리는 부분이나 주의사항\\n\\n## 한줄 요약\\n전체 내용을 한 문장으로 정리\\n\\n(최소 500자 이상으로 충분히 작성)",
    "category": "게시글의 기술/주제 카테고리 (예: Frontend, Backend, CS, Chemistry, Physics, Math, Life 등)",
    "keywords": ["핵심키워드1", "핵심키워드2", "핵심키워드3", "핵심키워드4", "핵심키워드5"]
}

[게시글 정보]
제목: ${post.title}
게시판: ${post.board}
내용:
${post.content}
`;

        let result;

        if (post.image_url) {
            try {
                const imageResp = await fetch(post.image_url);
                const imageBuffer = await imageResp.arrayBuffer();
                const base64Image = Buffer.from(imageBuffer).toString("base64");

                const imagePart = {
                    inlineData: {
                        data: base64Image,
                        mimeType: imageResp.headers.get("content-type") || "image/jpeg",
                    },
                };

                result = await model.generateContent([promptText, imagePart]);
            } catch (imgError) {
                console.error("Image fetch failed, falling back to text only:", imgError);
                result = await model.generateContent(promptText);
            }
        } else {
            result = await model.generateContent(promptText);
        }

        const responseText = result.response.text();
        const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const aiData = JSON.parse(jsonString);

        const { data: newCard, error: insertError } = await supabase
            .from("knowledge_cards")
            .insert({
                post_id: postId,
                user_id: user.id,
                title: aiData.title,
                summary: aiData.summary,
                category: aiData.category,
                keywords: aiData.keywords
            })
            .select()
            .single();

        if (insertError) {
            console.error("DB Insert Error:", insertError);
            throw insertError;
        }

        return NextResponse.json({ message: "지식 카드가 생성되었습니다.", card: newCard });

    } catch (error: unknown) {
        console.error("Knowledge Card Generation Error:", error);
        const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
