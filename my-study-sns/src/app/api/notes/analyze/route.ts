import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 상수 정의
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// 노트 분석 프롬프트 생성 함수
function createNoteAnalysisPrompt(): string {
    return `당신은 학습 노트 이미지를 분석하여 구조화된 마크다운 문서로 변환하는 전문가입니다.

## 분석 단계

### Step 1: 콘텐츠 유형 파악
- 손글씨 vs 인쇄물 vs 혼합
- 언어 (한국어, 영어, 혼합)
- 과목/주제 영역 (수학, 과학, 프로그래밍, 언어, 역사 등)

### Step 2: 구조 분석
- 제목/헤더 식별 (크게 쓴 글씨, 밑줄 친 부분)
- 본문 내용 추출
- 목록/번호 항목 인식
- 수식/공식 감지 (LaTeX 형식으로 변환)
- 다이어그램/도표 설명
- 강조 표시/밑줄/형광펜 부분 식별
- 코드 블록 인식

### Step 3: 마크다운 변환 규칙
- 제목: # 또는 ## 사용 (계층 구조 반영)
- 목록: - 또는 1. 사용
- 강조: **볼드** 또는 *이탤릭* 사용
- 수식 (LaTeX):
  * 인라인 수식: $E = mc^2$
  * 블록 수식: $$\\int_0^1 x^2 dx$$
  * 분수: \\frac{a}{b}
  * 루트: \\sqrt{x}
  * 그리스 문자: \\alpha, \\beta, \\gamma
  * 첨자: x^2, x_i
- 코드:
  * 인라인: \`code\`
  * 블록: \`\`\`language\\ncode\\n\`\`\` (언어 자동 감지)
- 중요 개념: > 인용 블록 사용
- 표: 마크다운 테이블 형식

### Step 4: 메타데이터 생성
- 제목: 내용을 대표하는 간결하고 명확한 제목 (15자 이내)
- 요약: 핵심 내용 2-3줄 요약
- 해시태그: 관련 키워드 5-10개 (# 없이)
- 과목: 감지된 과목/주제 영역

## 응답 형식 (반드시 JSON만 반환)
{
  "title": "학습 노트 제목",
  "content": "## 마크다운 형식의 본문\\n\\n내용...",
  "summary": "핵심 내용 요약 (2-3줄)",
  "hashtags": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "subject": "과목/주제 영역",
  "confidence": 0.95
}

## 주의사항
- 읽을 수 없는 부분은 [판독불가]로 표시
- 그림/다이어그램은 [그림: 간단한 설명] 형식으로 기술
- 원본 구조와 논리적 흐름 최대한 유지
- 학습에 도움이 되는 명확한 포맷팅
- 수식은 반드시 LaTeX 문법 사용
- 코드는 적절한 언어 태그와 함께 코드 블록으로 감싸기
- confidence는 전체 내용 인식 정확도 (0-1)
- 노트가 아닌 이미지면: {"title": "", "content": "", "summary": "", "hashtags": [], "subject": "", "confidence": 0}`;
}

// 응답 데이터 검증 및 정규화
interface RawNoteData {
    title?: string;
    content?: string;
    summary?: string;
    hashtags?: string[];
    subject?: string;
    confidence?: number;
}

interface ValidatedNoteData {
    title: string;
    content: string;
    summary: string;
    hashtags: string[];
    subject: string;
    confidence: number;
}

function validateAndNormalizeNoteData(data: RawNoteData): ValidatedNoteData | null {
    // 필수 필드 확인
    if (!data.title || !data.content) {
        return null;
    }

    // 해시태그 정규화 (# 제거, 공백 제거)
    const normalizedHashtags = (data.hashtags || [])
        .map(tag => tag.replace(/^#/, '').trim())
        .filter(tag => tag.length > 0)
        .slice(0, 10); // 최대 10개

    return {
        title: data.title.trim(),
        content: data.content.trim(),
        summary: (data.summary || '').trim(),
        hashtags: normalizedHashtags,
        subject: (data.subject || '기타').trim(),
        confidence: Math.min(1, Math.max(0, data.confidence ?? 0.5))
    };
}

export async function POST(request: Request) {
    const supabase = createRouteHandlerClient({ cookies });

    // 1. 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json(
            { success: false, error: "로그인이 필요합니다.", code: 'UNAUTHORIZED' },
            { status: 401 }
        );
    }

    try {
        // 2. 요청 바디 파싱 및 검증
        const { image, mimeType } = await request.json();

        if (!image || !mimeType) {
            return NextResponse.json(
                { success: false, error: "이미지 데이터가 필요합니다.", code: 'INVALID_IMAGE' },
                { status: 400 }
            );
        }

        if (!VALID_MIME_TYPES.includes(mimeType)) {
            return NextResponse.json(
                { success: false, error: "지원하지 않는 이미지 형식입니다. (JPG, PNG, WebP, GIF 지원)", code: 'INVALID_IMAGE' },
                { status: 400 }
            );
        }

        // Base64 크기 검증 (Base64는 원본의 약 1.37배)
        const estimatedSize = (image.length * 3) / 4;
        if (estimatedSize > MAX_IMAGE_SIZE) {
            return NextResponse.json(
                { success: false, error: "이미지 크기가 너무 큽니다. (최대 10MB)", code: 'IMAGE_TOO_LARGE' },
                { status: 400 }
            );
        }

        // 3. Gemini API 호출 (정확도를 위해 Pro 모델 사용)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

        const imagePart = {
            inlineData: {
                data: image,
                mimeType: mimeType,
            },
        };

        const prompt = createNoteAnalysisPrompt();
        const result = await model.generateContent([prompt, imagePart]);

        // 4. 응답 파싱
        const responseText = result.response.text();
        const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        let aiData: RawNoteData;
        try {
            aiData = JSON.parse(jsonString);
        } catch {
            console.error("JSON Parse Error. Response:", responseText);
            return NextResponse.json(
                { success: false, error: "노트 내용을 추출할 수 없습니다. 다른 이미지를 사용해주세요.", code: 'PARSE_ERROR' },
                { status: 500 }
            );
        }

        // 5. 데이터 검증 및 정규화
        const validatedData = validateAndNormalizeNoteData(aiData);

        if (!validatedData || !validatedData.content) {
            return NextResponse.json({
                success: true,
                data: null,
                message: "이미지에서 학습 노트 내용을 찾을 수 없습니다."
            });
        }

        return NextResponse.json({
            success: true,
            data: validatedData,
            message: "노트 분석이 완료되었습니다."
        });

    } catch (error: unknown) {
        console.error("Note Analysis Error:", error);

        const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
        return NextResponse.json(
            { success: false, error: message, code: 'SERVER_ERROR' },
            { status: 500 }
        );
    }
}
