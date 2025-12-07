import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 상수 정의
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const REFINEMENT_CONFIDENCE_THRESHOLD = 0.9; // 이 값 이상이면 교정 생략

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

## 응답 형식
반드시 아래 JSON 형식으로만 응답하세요. 다른 설명이나 텍스트 없이 JSON만 출력하세요.

\`\`\`json
{
  "title": "학습 노트 제목 (15자 이내)",
  "content": "마크다운 형식의 본문 내용",
  "summary": "핵심 내용 요약 2-3줄",
  "hashtags": ["키워드1", "키워드2", "키워드3"],
  "subject": "과목명",
  "confidence": 0.95
}
\`\`\`

## 주의사항
- 읽을 수 없는 부분은 [판독불가]로 표시
- 그림/다이어그램은 [그림: 간단한 설명] 형식으로 기술
- 원본 구조와 논리적 흐름 최대한 유지
- 수식은 반드시 LaTeX 문법 사용 ($ 또는 $$ 사용)
- 코드는 적절한 언어 태그와 함께 코드 블록으로 감싸기
- confidence는 전체 내용 인식 정확도 (0-1)
- 노트가 아닌 이미지인 경우에도 빈 값으로 JSON 형식 유지`;
}

// 교정 프롬프트 생성 함수 (2단계)
function createRefinePrompt(rawContent: string, subject: string, title: string): string {
    return `당신은 ${subject} 분야의 전문가입니다.
아래 학습 노트 내용은 OCR로 추출되어 오류가 있을 수 있습니다.
당신의 지식을 활용하여 내용을 교정하고 보완해주세요.

## 교정 규칙

### 1. 전문 용어 교정
- OCR 오류로 인한 오탈자 수정 (예: "돌턴" → "돌턴", "톰" → "톰슨", "러더포" → "러더퍼드")
- 불완전하게 인식된 단어를 문맥에 맞게 복원
- 학술/과학 용어의 정확성 검증 (인명, 법칙명, 공식명 등)

### 2. 문맥 보완
- 끊긴 문장을 자연스럽게 연결
- 누락된 접속사/조사 추가
- 논리적 흐름이 자연스럽도록 개선

### 3. 내용 정확성 검증
- 과학적/학술적 사실 오류 수정 (예: 잘못된 연도, 발견자, 공식 등)
- 부정확한 설명 보완
- [판독불가] 부분은 문맥과 당신의 지식으로 유추하여 채우기

### 4. 반드시 유지할 사항
- 원본의 구조(헤더, 목록, 강조) 유지
- LaTeX 수식 문법 유지 및 검증 ($ 또는 $$ 사용)
- 코드 블록 유지
- **원본에 없는 완전히 새로운 내용은 추가하지 않기**
- 원본의 학습 목적과 범위 유지

## 원본 제목
${title}

## 원본 내용
${rawContent}

## 응답 형식
반드시 아래 JSON 형식으로만 응답하세요.

\`\`\`json
{
  "content": "교정된 마크다운 본문",
  "corrections": [
    {"original": "원본 텍스트", "corrected": "수정된 텍스트", "reason": "수정 이유"}
  ],
  "confidence": 0.95
}
\`\`\`

주의: corrections 배열에는 주요 수정 사항만 최대 10개까지 포함하세요.`;
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

// 교정 데이터 인터페이스
interface CorrectionItem {
    original: string;
    corrected: string;
    reason: string;
}

interface RawRefineData {
    content?: string;
    corrections?: CorrectionItem[];
    confidence?: number;
}

interface RefinementInfo {
    applied: boolean;
    corrections: CorrectionItem[];
    refinedConfidence: number;
}

interface ValidatedNoteData {
    title: string;
    content: string;
    rawContent?: string;  // 원본 추출 내용 (교정 전)
    summary: string;
    hashtags: string[];
    subject: string;
    confidence: number;
    refinement?: RefinementInfo;
}

// JSON 문자열 추출 헬퍼 함수
function extractJsonFromResponse(responseText: string): string {
    let jsonString = responseText;

    // 방법 1: ```json ... ``` 블록에서 추출
    const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
        jsonString = jsonBlockMatch[1];
    } else {
        // 방법 2: ``` ... ``` 블록에서 추출
        const codeBlockMatch = responseText.match(/```\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            jsonString = codeBlockMatch[1];
        } else {
            // 방법 3: { } 객체 직접 추출
            const jsonObjectMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonObjectMatch) {
                jsonString = jsonObjectMatch[0];
            }
        }
    }

    return jsonString.trim();
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

        // ========== Phase 1: OCR 추출 ==========
        const extractPrompt = createNoteAnalysisPrompt();
        console.log("[Phase 1] Starting OCR extraction...");
        const extractResult = await model.generateContent([extractPrompt, imagePart]);

        const extractResponseText = extractResult.response.text();
        console.log("[Phase 1] Gemini Raw Response:", extractResponseText.substring(0, 500));

        const extractJsonString = extractJsonFromResponse(extractResponseText);
        console.log("[Phase 1] Extracted JSON:", extractJsonString.substring(0, 300));

        let rawAiData: RawNoteData;
        try {
            rawAiData = JSON.parse(extractJsonString);
        } catch (parseError) {
            console.error("[Phase 1] JSON Parse Error:", parseError);
            console.error("[Phase 1] Failed JSON String:", extractJsonString.substring(0, 1000));
            return NextResponse.json(
                { success: false, error: "노트 내용을 추출할 수 없습니다. 다른 이미지를 사용해주세요.", code: 'PARSE_ERROR' },
                { status: 500 }
            );
        }

        // Phase 1 데이터 검증
        const phase1Data = validateAndNormalizeNoteData(rawAiData);

        if (!phase1Data || !phase1Data.content) {
            return NextResponse.json({
                success: true,
                data: null,
                message: "이미지에서 학습 노트 내용을 찾을 수 없습니다."
            });
        }

        // ========== Phase 2: AI 교정 ==========
        // 신뢰도가 높으면 교정 생략 (성능 최적화)
        if (phase1Data.confidence >= REFINEMENT_CONFIDENCE_THRESHOLD) {
            console.log(`[Phase 2] Skipped - confidence ${phase1Data.confidence} >= ${REFINEMENT_CONFIDENCE_THRESHOLD}`);
            return NextResponse.json({
                success: true,
                data: {
                    ...phase1Data,
                    refinement: {
                        applied: false,
                        corrections: [],
                        refinedConfidence: phase1Data.confidence
                    }
                },
                message: "노트 분석이 완료되었습니다. (교정 생략: 높은 신뢰도)"
            });
        }

        console.log("[Phase 2] Starting content refinement...");
        let finalData: ValidatedNoteData = { ...phase1Data };

        try {
            const refinePrompt = createRefinePrompt(
                phase1Data.content,
                phase1Data.subject,
                phase1Data.title
            );
            const refineResult = await model.generateContent(refinePrompt);
            const refineResponseText = refineResult.response.text();
            console.log("[Phase 2] Refine Response:", refineResponseText.substring(0, 500));

            const refineJsonString = extractJsonFromResponse(refineResponseText);
            const refineData: RawRefineData = JSON.parse(refineJsonString);

            if (refineData.content) {
                // 교정 성공: 교정된 내용으로 업데이트
                finalData = {
                    ...phase1Data,
                    rawContent: phase1Data.content,  // 원본 저장
                    content: refineData.content.trim(),  // 교정된 내용
                    refinement: {
                        applied: true,
                        corrections: (refineData.corrections || []).slice(0, 10),
                        refinedConfidence: Math.min(1, Math.max(0, refineData.confidence ?? 0.8))
                    }
                };
                console.log(`[Phase 2] Refinement completed with ${finalData.refinement?.corrections.length || 0} corrections`);
            } else {
                // 교정 실패: 원본 사용
                console.warn("[Phase 2] No refined content, using original");
                finalData.refinement = {
                    applied: false,
                    corrections: [],
                    refinedConfidence: phase1Data.confidence
                };
            }
        } catch (refineError) {
            // 교정 중 오류 발생: 원본 사용 (fallback)
            console.error("[Phase 2] Refinement Error:", refineError);
            finalData.refinement = {
                applied: false,
                corrections: [],
                refinedConfidence: phase1Data.confidence
            };
        }

        return NextResponse.json({
            success: true,
            data: finalData,
            message: finalData.refinement?.applied
                ? "노트 분석 및 AI 교정이 완료되었습니다."
                : "노트 분석이 완료되었습니다."
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
