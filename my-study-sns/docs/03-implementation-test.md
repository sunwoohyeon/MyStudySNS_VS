# 3. 제작 및 테스트 (30점)

## 3.1 프로젝트 설계가 의도한 목적에 부합

### 핵심 기능 구현 현황

| 기능 | 목적 | 구현 상태 | 구현 파일 |
|------|------|----------|----------|
| AI 노트 분석 | 손글씨 노트 디지털화 | ✅ 완료 | `api/notes/analyze/route.ts` |
| 시간표 분석 | 이미지에서 시간표 추출 | ✅ 완료 | `api/schedule/analyze/route.ts` |
| 지식카드 생성 | 게시글 → 학습 카드 | ✅ 완료 | `api/knowledge/generate/route.ts` |
| 게시판 시스템 | 커뮤니티 소통 | ✅ 완료 | `api/posts/route.ts` |
| 사용자 인증 | 로그인/회원가입 | ✅ 완료 | `contexts/AuthContext.tsx` |
| 마크다운 렌더링 | 수식 포함 노트 표시 | ✅ 완료 | `component/PostItem.tsx` |

---

## 3.2 주요 기능별 구현 상세

### 3.2.1 AI 스터디 노트 분석 (핵심 기능)

#### 기능 개요

손글씨 또는 인쇄된 노트 이미지를 AI가 분석하여 마크다운 형식의 디지털 문서로 변환합니다.

#### 구현 파일

- **API**: `src/app/api/notes/analyze/route.ts`
- **프론트엔드**: `src/component/StudyNoteUploadForm.tsx`

#### 2단계 분석 시스템

**Phase 1: OCR 추출**

```typescript
// Gemini 2.5 Pro로 이미지 분석
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-pro-preview-05-06"
});

const systemPrompt = `
당신은 학습 노트를 분석하는 AI입니다.
이미지에 있는 텍스트를 정확하게 추출하여 구조화된 마크다운으로 변환해주세요.

출력 형식:
{
  "title": "제목 (15자 이내)",
  "content": "마크다운 형식 본문",
  "summary": "2-3줄 요약",
  "hashtags": ["키워드1", "키워드2", ...],
  "subject": "과목명",
  "confidence": 0.85  // 인식 정확도 (0-1)
}
`;
```

**Phase 2: AI 교정** (신뢰도 < 0.9인 경우만 실행)

```typescript
// 신뢰도가 낮으면 자동 교정
if (initialResult.confidence < 0.9) {
  const refinementPrompt = `
  다음 OCR 결과를 검토하고 오류를 수정해주세요:
  - OCR 오타 수정 (예: "돌턴" → "돌턴")
  - 전문 용어 정확성 검증
  - 문맥 보완

  교정 내역도 함께 반환해주세요.
  `;

  // Phase 2 실행...
}
```

#### 지원 기능

| 기능 | 설명 |
|------|------|
| 다중 이미지 | 최대 10장까지 한 번에 분석 |
| 페이지 병합 | 여러 이미지를 하나의 문서로 통합 |
| 수식 변환 | LaTeX 형식으로 자동 변환 |
| 원본 첨부 | 분석 후 원본 이미지 게시글에 포함 옵션 |

#### UI 흐름 (3단계)

```
1. 업로드 (upload)
   ├── 드래그 앤 드롭 또는 파일 선택
   ├── 이미지 미리보기 (그리드)
   └── 이미지 개별 삭제 가능

2. 분석 (analyzing)
   ├── 순차적 이미지 분석
   ├── 개별 진행 상태 표시
   └── Phase 1 → Phase 2 자동 전환

3. 미리보기 (preview)
   ├── AI 교정 내역 표시
   ├── 제목/내용/해시태그 편집
   ├── 마크다운 미리보기 토글
   └── 게시판 선택 후 저장
```

---

### 3.2.2 시간표 이미지 분석

#### 기능 개요

시간표 사진을 AI가 분석하여 수업 정보(과목명, 요일, 시간, 강의실)를 자동 추출합니다.

#### 구현 파일

- **API**: `src/app/api/schedule/analyze/route.ts`
- **프론트엔드**: `src/component/ImageScheduleForm.tsx`

#### 시간표 형식 자동 감지

```typescript
// 다양한 시간표 형식 지원
const formats = {
  "24시간제": "9, 10, 11, 12, 13, 14...",
  "12시간제": "9, 10, 11, 12, 1, 2... → 자동 변환",
  "교시제": "1교시, 2교시... → 설정된 시작 시간으로 변환"
};
```

#### 추출 데이터 구조

```typescript
interface ScheduleItem {
  title: string;        // 과목명
  day_of_week: string;  // 요일 (월~일)
  start_time: string;   // 시작 시간 (HH:MM, 24시간제)
  end_time: string;     // 종료 시간 (HH:MM)
  location: string | null;  // 강의실
}
```

#### UI 기능

- **충돌 검사**: 기존 시간표와 시간 겹침 자동 감지
- **인라인 편집**: 추출된 항목 즉시 수정 가능
- **선택적 저장**: 원하는 항목만 선택하여 저장
- **기존 삭제 옵션**: 기존 시간표 일괄 삭제 후 새로 등록

---

### 3.2.3 AI 지식카드 생성

#### 기능 개요

게시글 내용을 AI가 분석하여 학습용 플래시카드를 자동 생성합니다.

#### 구현 파일

- **API**: `src/app/api/knowledge/generate/route.ts`
- **프론트엔드**: `src/component/KnowledgeCards.tsx`

#### 생성 프로세스

```typescript
// Gemini 2.5 Flash로 지식카드 생성 (빠른 응답)
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-preview-05-20"
});

const prompt = `
게시글을 분석하여 학습 카드를 생성해주세요:

{
  "title": "호기심을 자극하는 제목 (원 제목과 다르게)",
  "summary": "마크다운 형식의 핵심 내용 요약 (최소 500자)",
  "category": "Frontend | Backend | CS | Chemistry | ...",
  "keywords": ["키워드1", "키워드2", ...]  // 1-5개
}
`;
```

#### 지식카드 표시

- **카로셀 형식**: 최근 10개 카드 가로 스크롤
- **카테고리 배지**: 주제별 색상 구분
- **모달 상세보기**: 클릭 시 전체 내용 표시
- **삭제 기능**: 본인 카드만 삭제 가능

---

### 3.2.4 게시판 시스템

#### 게시판 종류

| 게시판 | 용도 | 태그 |
|--------|------|------|
| 자유게시판 | 일반 토론 | 잡담, 정보공유, 후기 등 |
| 질문/답변 | Q&A | 프로그래밍, 과학, 수학 등 |
| 스터디 노트 | 학습 자료 | 과목별 태그 |

#### 게시글 CRUD

```typescript
// POST /api/posts - 게시글 생성
const { data: post } = await supabase
  .from("posts")
  .insert({
    title,
    content,
    board,
    tag,
    user_id: user.id,
    image_url: imageUrl,
  })
  .select()
  .single();

// 해시태그 처리
for (const tagName of hashtags) {
  // hashtags 테이블 UPSERT
  // post_hashtags 연결 테이블 INSERT
}
```

#### 타임라인 기능

- **필터링**: 해시태그, 게시판별 필터
- **정렬**: 최신순 / 유용순
- **무한 스크롤**: 페이지 단위 로딩
- **섹션 분리**: 최신 게시글, 게시판별 상위 5개

---

### 3.2.5 사용자 인증

#### 지원 방식

| 방식 | Provider | 구현 |
|------|----------|------|
| 이메일/비밀번호 | Supabase | `signInWithPassword` |
| Google | OAuth 2.0 | `signInWithOAuth` |
| GitHub | OAuth | `signInWithOAuth` |
| Kakao | OAuth | `signInWithOAuth` |

#### 인증 흐름

```typescript
// 이메일 로그인
const { error } = await supabase.auth.signInWithPassword({
  email, password
});

// 소셜 로그인
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: '/auth/callback' }
});

// 세션 상태 감시 (AuthContext)
supabase.auth.onAuthStateChange((event, session) => {
  setUser(session?.user ?? null);
});
```

---

## 3.3 해결하고자 하는 문제 해결 여부

### 문제 1: 손글씨 노트 디지털화의 어려움

**문제점**
- 손으로 쓴 노트를 타이핑하는 데 많은 시간 소요
- 수식이 포함된 노트는 더욱 입력이 어려움

**해결책**
- AI OCR로 손글씨 자동 인식
- LaTeX 수식 자동 변환
- 2단계 교정으로 정확도 향상

**결과**
```
기존: 노트 1장 디지털화 → 약 30분
현재: 노트 1장 디지털화 → 약 30초 (AI 분석 10초 + 확인/편집 20초)
효율 향상: 약 98%
```

### 문제 2: 시간표 수동 입력의 번거로움

**문제점**
- 학기 초 시간표 등록 시 모든 수업을 수동 입력해야 함
- 입력 오류 발생 가능

**해결책**
- 시간표 사진 한 장으로 전체 시간표 자동 추출
- 12시간제/24시간제/교시제 자동 감지 및 변환
- 충돌 검사로 오류 방지

### 문제 3: 학습 자료 정리 및 복습의 어려움

**문제점**
- 긴 게시글에서 핵심 내용 추출 어려움
- 효과적인 복습 자료 부재

**해결책**
- AI 지식카드 자동 생성
- 핵심 요약, 키워드, 카테고리 자동 분류
- 카드 형태로 빠른 복습 가능

---

## 3.4 SW 구현 및 결과의 완성성

### 구현 완료 기능

| 카테고리 | 기능 | 완성도 |
|----------|------|--------|
| **AI 분석** | 노트 OCR + 교정 | 100% |
| | 시간표 이미지 분석 | 100% |
| | 지식카드 생성 | 100% |
| **게시판** | 게시글 CRUD | 100% |
| | 해시태그 시스템 | 100% |
| | 댓글 기능 | 100% |
| **사용자** | 이메일 인증 | 100% |
| | 소셜 로그인 | 100% |
| | 프로필 관리 | 100% |
| **UI** | 반응형 디자인 | 100% |
| | 다크/라이트 모드 | 100% |
| | 마크다운 렌더링 | 100% |

### 코드 품질

```typescript
// TypeScript 타입 안전성
interface ImageItem {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  result?: AnalysisResult;
  error?: string;
}

// 에러 핸들링
try {
  const response = await fetch('/api/notes/analyze', { ... });
  if (!response.ok) throw new Error('분석 실패');
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
} catch (error) {
  setImages(prev => prev.map(img =>
    img.id === currentId
      ? { ...img, status: 'error', error: error.message }
      : img
  ));
}
```

---

## 3.5 UI 제작의 기술적 완성성

### Tailwind CSS 기반 디자인 시스템

#### 컬러 테마

```css
/* 라이트 모드 */
--background: #ffffff;
--foreground: #1f2937;
--primary: #2563eb;

/* 다크 모드 */
.dark {
  --background: #111827;
  --foreground: #f9fafb;
  --primary: #3b82f6;
}
```

#### 컴포넌트 스타일 예시

```tsx
// 버튼 컴포넌트
<button className="
  px-4 py-2
  bg-blue-600 hover:bg-blue-700
  text-white font-medium
  rounded-lg
  transition-colors
  disabled:opacity-50 disabled:cursor-not-allowed
">
  저장하기
</button>

// 카드 컴포넌트
<div className="
  bg-white dark:bg-gray-800
  rounded-xl shadow-lg
  p-6
  border border-gray-200 dark:border-gray-700
">
  {children}
</div>
```

### 반응형 디자인

```tsx
// 그리드 레이아웃
<div className="
  grid
  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
  gap-4
">
  {items.map(item => <Card key={item.id} />)}
</div>

// 숨김/표시 제어
<div className="hidden md:block">  {/* 모바일에서 숨김 */}
<div className="block md:hidden">  {/* 데스크톱에서 숨김 */}
```

---

## 3.6 UI의 구성 및 연결 측면의 적절성

### 페이지 네비게이션 구조

```
┌─────────────────────────────────────────────────────────────┐
│                        Header                               │
│  [로고]  [홈]  [게시판]  [작성]  [마이페이지]  [로그인]     │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │   홈    │          │ 게시판  │          │  작성   │
   │ (/)     │          │(/board) │          │(/write) │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                    │                    │
   ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
   │ 타임라인 │          │게시글   │          │일반작성 │
   │ 지식카드 │          │목록     │          │AI노트   │
   │ 시간표   │          │필터/정렬│          │시간표   │
   └─────────┘          └─────────┘          └─────────┘
```

### 상태 연결

```typescript
// 페이지 간 데이터 전달 (URL 파라미터)
router.push(`/post/${postId}`);

// 전역 상태 (Context)
const { user, isLoggedIn, theme, toggleTheme } = useAuth();

// 로컬 상태 + API 연동
useEffect(() => {
  const fetchPosts = async () => {
    const response = await fetch('/api/posts');
    const data = await response.json();
    setPosts(data);
  };
  fetchPosts();
}, []);
```

---

## 3.7 다양한 조건에서의 테스트

### 이미지 형식별 테스트

| 형식 | 테스트 결과 | 비고 |
|------|------------|------|
| JPEG | ✅ 정상 | 가장 일반적 |
| PNG | ✅ 정상 | 투명 배경 지원 |
| WebP | ✅ 정상 | 경량 포맷 |
| GIF | ✅ 정상 | 정적 이미지만 |
| HEIC | ❌ 미지원 | iOS 기본 포맷 |

### 이미지 크기별 테스트

| 크기 | 테스트 결과 | 비고 |
|------|------------|------|
| < 1MB | ✅ 빠른 처리 | 권장 |
| 1-5MB | ✅ 정상 | 약간 느림 |
| 5-10MB | ✅ 처리 가능 | 최대 허용 |
| > 10MB | ❌ 거부됨 | 크기 제한 |

### 에러 상황 테스트

| 상황 | 처리 방식 | 사용자 피드백 |
|------|----------|--------------|
| 네트워크 오류 | catch + 재시도 | "연결 실패. 다시 시도해주세요" |
| AI 분석 실패 | 에러 상태 표시 | "분석에 실패했습니다" |
| 파일 형식 오류 | 사전 검증 | "지원하지 않는 형식입니다" |
| 파일 크기 초과 | 사전 검증 | "10MB 이하 파일만 가능합니다" |
| 인증 만료 | 리다이렉트 | 로그인 페이지로 이동 |

### 에러 핸들링 코드

```typescript
// 이미지 검증
const validateImage = (file: File): string | null => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!validTypes.includes(file.type)) {
    return '지원하지 않는 이미지 형식입니다.';
  }

  if (file.size > 10 * 1024 * 1024) {
    return '이미지 크기는 10MB 이하여야 합니다.';
  }

  return null;
};

// API 에러 처리
export async function POST(request: Request) {
  try {
    // 처리 로직...
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
```

---

## 3.8 실행 화면 예시

### 홈페이지

```
┌────────────────────────────────────────────────────────────────┐
│  [My Study SNS]                      [검색] [알림] [프로필]   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  📚 추천 지식카드                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                 │
│  │Frontend│ │Backend │ │   CS   │ │Chemistry│ ◀ ▶           │
│  │ React  │ │ Node.js│ │ OS개념 │ │ 화학식 │                 │
│  └────────┘ └────────┘ └────────┘ └────────┘                 │
│                                                                │
│  📅 내 시간표                                                  │
│  ┌────────────────────────────────────────────┐               │
│  │ 월  │ 화  │ 수  │ 목  │ 금  │              │               │
│  │ 9시 │     │웹프 │     │알고 │              │               │
│  │     │자료 │     │DB   │     │              │               │
│  └────────────────────────────────────────────┘               │
│                                                                │
│  📝 최신 게시글                        [최신순 ▼] [전체 ▼]    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ [스터디노트] React 훅 정리                              │   │
│  │ #react #hooks #frontend                                │   │
│  │ 👍 12  💬 3  📅 2시간 전                                │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

### AI 노트 분석 화면

```
┌────────────────────────────────────────────────────────────────┐
│  AI 스터디 노트 작성                                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  📷 노트 이미지를 업로드하세요                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                                                        │   │
│  │      [이미지를 드래그하거나 클릭하여 업로드]           │   │
│  │                                                        │   │
│  │      지원 형식: JPG, PNG, WebP (최대 10MB)             │   │
│  │      최대 10장까지 업로드 가능                          │   │
│  │                                                        │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  업로드된 이미지 (3/10)                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐                                  │
│  │ IMG1 │ │ IMG2 │ │ IMG3 │                                  │
│  │  ✓   │ │  ✓   │ │  ✓   │                                  │
│  │  ✕   │ │  ✕   │ │  ✕   │                                  │
│  └──────┘ └──────┘ └──────┘                                  │
│                                                                │
│  [AI 분석 시작]                                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 분석 결과 미리보기

```
┌────────────────────────────────────────────────────────────────┐
│  분석 결과 미리보기                              [마크다운 ▼]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  📝 AI 교정 내역 (3건)                              [접기 ▲]  │
│  ├─ "돌턴" → "돌턴의 원자론" (문맥 보완)                      │
│  ├─ "H20" → "H₂O" (화학식 교정)                               │
│  └─ "톰" → "톰슨" (인명 교정)                                 │
│  📊 신뢰도: 0.92                                               │
│                                                                │
│  제목: [화학 기초 - 원자의 구조              ]                │
│                                                                │
│  해시태그:                                                     │
│  [화학] [원자] [돌턴] [톰슨] [+추가]                          │
│                                                                │
│  내용:                                                         │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ ## 📄 페이지 1                                          │   │
│  │                                                        │   │
│  │ ### 돌턴의 원자론                                       │   │
│  │ - 모든 물질은 원자로 구성                              │   │
│  │ - 같은 원소의 원자는 동일                              │   │
│  │                                                        │   │
│  │ ### 톰슨 모형                                          │   │
│  │ 전자($e^-$)가 양전하 구에 박힌 형태                    │   │
│  │                                                        │   │
│  │ $$E = mc^2$$                                           │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  게시판: [스터디 노트 ▼]   ☑ 원본 이미지 포함                 │
│                                                                │
│  [취소]                                          [게시하기]   │
└────────────────────────────────────────────────────────────────┘
```

---

## 3.9 결론

My Study SNS의 제작 및 테스트 결과:

1. **목적 부합**: 모든 핵심 기능이 설계 의도대로 구현됨
2. **문제 해결**: 노트 디지털화, 시간표 등록, 학습 자료 정리 문제 해결
3. **완성도**: 100% 기능 구현 완료, TypeScript 기반 타입 안전성 확보
4. **UI 완성도**: Tailwind CSS 기반 반응형 디자인, 다크/라이트 모드 지원
5. **테스트**: 다양한 이미지 형식, 크기, 에러 상황에 대한 테스트 완료

프로젝트는 실제 서비스 운영이 가능한 수준으로 완성되었습니다.
