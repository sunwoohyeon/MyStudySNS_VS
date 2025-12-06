import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 상수 정의
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// 교시별 시간 생성 함수
function generatePeriodTimes(firstPeriodStart: string): string {
    const [startHour, startMin] = firstPeriodStart.split(':').map(Number);

    const periods: string[] = [];
    for (let i = 0; i < 12; i++) {
        const periodStartMin = startHour * 60 + startMin + (i * 60); // 1시간 단위
        const periodEndMin = periodStartMin + 50; // 50분 수업

        const startH = Math.floor(periodStartMin / 60);
        const startM = periodStartMin % 60;
        const endH = Math.floor(periodEndMin / 60);
        const endM = periodEndMin % 60;

        const startStr = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
        const endStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

        periods.push(`* ${i + 1}교시: ${startStr}-${endStr}`);
    }

    return periods.join('\n     ');
}

// 시간표 분석 프롬프트 생성 함수
function createScheduleAnalysisPrompt(firstPeriodStart: string): string {
    const periodTimes = generatePeriodTimes(firstPeriodStart);

    return `당신은 대학교 시간표 이미지를 분석하는 전문가입니다.
이미지에서 모든 수업 정보를 정확하게 추출해주세요.

## 분석 단계

### Step 1: 시간표 구조 파악
- X축(상단): 요일 헤더 확인 (월~금 또는 Mon~Fri)
- Y축(좌측): 시간 눈금 형식 확인
  - 24시간제: 9, 10, 11, 12, 13, 14, 15...
  - 12시간제: 9, 10, 11, 12, 1, 2, 3, 4... (12 이후 1부터 다시 시작)
  - 교시제: 1교시, 2교시, 3교시...

### Step 2: 각 수업 블록 분석
각 색상 블록마다:
1. **요일**: 블록이 위치한 열의 요일
2. **시작 시간**: 블록 상단이 맞닿은 Y축 눈금
3. **종료 시간**: 블록 하단이 맞닿은 Y축 눈금 (또는 시작 + 블록 높이)
4. **과목명**: 블록 내 텍스트 (가장 큰 글씨)
5. **강의실**: 블록 내 장소 정보 (건물명, 호실 등)

### Step 3: 시간 변환 규칙
- **블록 내 시간 텍스트 우선**: "09:30~12:20" 같은 텍스트가 있으면 그대로 사용
- **12시간제 Y축**: 12 다음에 1, 2, 3이 오면 → 13, 14, 15로 변환
- **교시제 참고**: ${periodTimes}

### Step 4: JSON 출력
모든 시간은 24시간제 HH:MM 형식으로 출력

## 응답 형식 (JSON만 반환)
{
  "schedules": [
    {
      "title": "과목명",
      "day_of_week": "월",
      "start_time": "09:00",
      "end_time": "11:00",
      "location": "강의실 또는 null"
    }
  ],
  "total_count": 수업 수,
  "analysis_notes": "Y축 형식, 특이사항 등"
}

## 주의사항
- 같은 과목이 여러 요일에 있으면 각각 별도 항목으로 출력
- 블록 높이를 정확히 측정하여 수업 시간 계산 (2칸 = 2시간)
- 불확실한 정보는 가장 합리적인 추정값 사용
- 시간표가 아닌 이미지면: {"schedules": [], "total_count": 0}`;
}

// 유효한 요일 목록
const VALID_DAYS = ['월', '화', '수', '목', '금', '토', '일'];

// 시간 형식 정규화 (H:MM -> HH:MM)
function normalizeTime(time: string): string {
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
}

// 시간 형식 검증
function isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(time);
}

// 추출된 스케줄 데이터 검증 및 정규화
interface RawScheduleItem {
    title?: string;
    day_of_week?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    confidence?: number;
}

interface ValidatedScheduleItem {
    title: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    location?: string;
    confidence: number;
}

function validateAndNormalizeSchedules(schedules: RawScheduleItem[]): ValidatedScheduleItem[] {
    return schedules
        .filter((item): item is RawScheduleItem & { title: string; day_of_week: string; start_time: string; end_time: string } => {
            // 필수 필드 확인
            if (!item.title || !item.day_of_week || !item.start_time || !item.end_time) {
                return false;
            }
            // 요일 유효성
            if (!VALID_DAYS.includes(item.day_of_week)) {
                return false;
            }
            // 시간 형식 유효성
            if (!isValidTimeFormat(item.start_time) || !isValidTimeFormat(item.end_time)) {
                return false;
            }
            return true;
        })
        .map(item => ({
            title: item.title.trim(),
            day_of_week: item.day_of_week,
            start_time: normalizeTime(item.start_time),
            end_time: normalizeTime(item.end_time),
            location: item.location?.trim() || undefined,
            confidence: item.confidence ?? 1.0
        }));
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
        const { image, mimeType, firstPeriodStart = '09:00' } = await request.json();

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

        // 3. Gemini API 호출 (이미지 분석 정확도를 위해 Pro 모델 사용)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

        const imagePart = {
            inlineData: {
                data: image,
                mimeType: mimeType,
            },
        };

        // 1교시 시작 시간에 맞는 프롬프트 생성
        const prompt = createScheduleAnalysisPrompt(firstPeriodStart);
        const result = await model.generateContent([prompt, imagePart]);

        // 4. 응답 파싱
        const responseText = result.response.text();
        const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        let aiData;
        try {
            aiData = JSON.parse(jsonString);
        } catch {
            console.error("JSON Parse Error. Response:", responseText);
            return NextResponse.json(
                { success: false, error: "시간표 정보를 추출할 수 없습니다. 다른 이미지를 사용해주세요.", code: 'PARSE_ERROR' },
                { status: 500 }
            );
        }

        // 5. 데이터 검증 및 정규화
        const schedules = validateAndNormalizeSchedules(aiData.schedules || []);

        if (schedules.length === 0) {
            return NextResponse.json({
                success: true,
                schedules: [],
                message: "이미지에서 시간표 정보를 찾을 수 없습니다.",
                notes: aiData.notes || null
            });
        }

        return NextResponse.json({
            success: true,
            schedules,
            message: `${schedules.length}개의 수업이 발견되었습니다.`,
            notes: aiData.notes || null
        });

    } catch (error: unknown) {
        console.error("Schedule Analysis Error:", error);

        const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
        return NextResponse.json(
            { success: false, error: message, code: 'SERVER_ERROR' },
            { status: 500 }
        );
    }
}
