import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 1. 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    try {
        const { postId } = await request.json();

        if (!postId) {
            return NextResponse.json({ error: "게시글 ID가 필요합니다." }, { status: 400 });
        }

        // 2. 이미 생성된 카드가 있는지 확인
        const { data: existingCard } = await supabase
            .from("knowledge_cards")
            .select("id")
            .eq("post_id", postId)
            .single();

        if (existingCard) {
            return NextResponse.json({ message: "이미 지식 카드가 존재합니다.", cardId: existingCard.id });
        }

        // 3. 게시글 내용 가져오기 (image_url 추가)
        const { data: post, error: postError } = await supabase
            .from("posts")
            .select("title, content, board, image_url")
            .eq("id", postId)
            .single();

        if (postError || !post) {
            return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
        }

        // Gemini 모델 초기화
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const promptText = `
        다음 내용을 바탕으로 지식 카드를 생성하기 위한 JSON 데이터를 만들어줘.
        응답은 오직 JSON 형식이어야 해.

        {
            "title": "클릭하고 싶은 흥미로운 제목 (원래 제목과 다르게, 호기심 자극)",
            "summary": "핵심 내용 3줄 요약",
            "category": "게시글의 기술/주제 카테고리 (예: Frontend, Backend, CS, Life 등)",
            "keywords": ["핵심키워드1", "핵심키워드2", "핵심키워드3"]
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
                // 이미지 데이터 가져오기
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
                // 이미지 실패 시 텍스트만 전송
                result = await model.generateContent(promptText);
            }
        } else {
            // 텍스트만 있는 경우
            result = await model.generateContent(promptText);
        }

        const responseText = result.response.text();
        // JSON 파싱 (Markdown 코드 블록 제거)
        const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const aiData = JSON.parse(jsonString);

        // 5. DB에 저장
        const { data: newCard, error: insertError } = await supabase
            .from("knowledge_cards")
            .insert({
                post_id: postId,
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

    } catch (error: any) {
        console.error("Knowledge Card Generation Error:", error);
        return NextResponse.json({ error: error.message || "서버 오류가 발생했습니다." }, { status: 500 });
    }
}
