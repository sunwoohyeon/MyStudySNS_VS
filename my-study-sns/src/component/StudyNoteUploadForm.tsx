// src/component/StudyNoteUploadForm.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaTimes, FaCloudUploadAlt, FaSpinner, FaExclamationTriangle, FaArrowLeft, FaEye, FaEdit, FaImage } from 'react-icons/fa';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import HashtagInput from './HashtagInput';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// 타입 정의
interface ExtractedNoteData {
    title: string;
    content: string;
    summary: string;
    hashtags: string[];
    subject: string;
    confidence: number;
}

interface StudyNoteUploadFormProps {
    onClose: () => void;
    onSuccess?: (postId: number) => void;
}

type Step = 'upload' | 'preview' | 'saving';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const BOARDS = ['스터디 노트', '자유게시판', '질문/답변'] as const;

// 파일을 Base64로 변환하는 유틸리티 함수
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

const StudyNoteUploadForm: React.FC<StudyNoteUploadFormProps> = ({ onClose, onSuccess }) => {
    const router = useRouter();
    const supabase = createClientComponentClient();

    // 기본 상태
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // 3단계 UX 상태
    const [step, setStep] = useState<Step>('upload');
    const [extractedData, setExtractedData] = useState<ExtractedNoteData | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    // 편집 가능한 필드
    const [editedTitle, setEditedTitle] = useState('');
    const [editedContent, setEditedContent] = useState('');
    const [editedHashtags, setEditedHashtags] = useState<string[]>([]);
    const [selectedBoard, setSelectedBoard] = useState<typeof BOARDS[number]>('스터디 노트');
    const [includeOriginalImage, setIncludeOriginalImage] = useState(true);

    // 미리보기 토글
    const [showPreview, setShowPreview] = useState(false);

    // 파일 선택 핸들러
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];

            if (!selectedFile.type.startsWith('image/')) {
                setAnalysisError('이미지 파일(JPG, PNG 등)만 선택 가능합니다.');
                return;
            }

            if (selectedFile.size > MAX_FILE_SIZE) {
                setAnalysisError('이미지 크기는 10MB를 초과할 수 없습니다.');
                return;
            }

            setFile(selectedFile);
            setFileName(selectedFile.name);
            setAnalysisError(null);

            // 이미지 미리보기 생성
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target?.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    }, []);

    // 드래그 앤 드롭 핸들러
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            if (!droppedFile.type.startsWith('image/')) {
                setAnalysisError('이미지 파일(JPG, PNG 등)만 선택 가능합니다.');
                return;
            }

            if (droppedFile.size > MAX_FILE_SIZE) {
                setAnalysisError('이미지 크기는 10MB를 초과할 수 없습니다.');
                return;
            }

            setFile(droppedFile);
            setFileName(droppedFile.name);
            setAnalysisError(null);

            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target?.result as string);
            };
            reader.readAsDataURL(droppedFile);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    // 이미지 분석 시작
    const handleAnalyze = async () => {
        if (!file) return;

        setIsLoading(true);
        setAnalysisError(null);

        try {
            const base64 = await fileToBase64(file);

            const response = await fetch('/api/notes/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: base64,
                    mimeType: file.type
                })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            if (!result.data) {
                setAnalysisError(result.message || "이미지에서 학습 노트 내용을 찾을 수 없습니다.");
                return;
            }

            // 추출된 데이터 설정
            setExtractedData(result.data);
            setEditedTitle(result.data.title);
            setEditedContent(result.data.content);
            setEditedHashtags(result.data.hashtags);
            setStep('preview');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "분석 중 오류가 발생했습니다.";
            setAnalysisError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // 게시글 저장
    const handleSave = async () => {
        if (!editedTitle.trim()) {
            setAnalysisError('제목을 입력해주세요.');
            return;
        }

        if (!editedContent.trim()) {
            setAnalysisError('내용을 입력해주세요.');
            return;
        }

        setStep('saving');
        setAnalysisError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("로그인이 필요합니다.");
            }

            let finalContent = editedContent;

            // 원본 이미지 포함 옵션이 켜져 있으면 이미지 업로드
            if (includeOriginalImage && file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('post-images')
                    .upload(fileName, file);

                if (uploadError) {
                    console.error('Image upload error:', uploadError);
                    // 이미지 업로드 실패해도 게시글은 진행
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('post-images')
                        .getPublicUrl(fileName);

                    // 이미지를 본문 맨 위에 추가
                    finalContent = `![원본 노트 이미지](${publicUrl})\n\n---\n\n${editedContent}`;
                }
            }

            // 게시글 생성 API 호출
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editedTitle,
                    content: finalContent,
                    board: selectedBoard,
                    tag: extractedData?.subject || '기타',
                    imageUrl: null,
                    hashtags: editedHashtags
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || '게시글 등록에 실패했습니다.');
            }

            const postResult = await res.json();

            if (onSuccess) {
                onSuccess(postResult.postId);
            }

            onClose();
            router.push(`/post/${postResult.postId}`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.';
            setAnalysisError(errorMessage);
            setStep('preview');
        }
    };

    // 뒤로가기 (업로드 단계로)
    const handleBack = () => {
        setStep('upload');
        setExtractedData(null);
        setAnalysisError(null);
        setShowPreview(false);
    };

    // 업로드 단계 렌더링
    const renderUploadStep = () => (
        <form onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }} className="p-6">
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    공부 노트 이미지
                </label>

                {/* 이미지 미리보기 */}
                {imagePreview ? (
                    <div className="mb-4">
                        <div className="relative rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                            <img
                                src={imagePreview}
                                alt="노트 미리보기"
                                className="w-full max-h-80 object-contain bg-gray-100 dark:bg-gray-700"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setFile(null);
                                    setFileName('');
                                    setImagePreview(null);
                                }}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                                <FaTimes className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                            {fileName}
                        </p>
                    </div>
                ) : (
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed dark:border-gray-600 rounded-md hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
                    >
                        <div className="space-y-1 text-center">
                            <FaCloudUploadAlt className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                            <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                                <label
                                    htmlFor="note-file-upload"
                                    className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 p-1"
                                >
                                    <span>파일을 선택하거나 드래그하세요</span>
                                    <input
                                        id="note-file-upload"
                                        name="note-file-upload"
                                        type="file"
                                        className="sr-only"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={isLoading}
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                PNG, JPG, GIF (최대 10MB)
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                손글씨 노트, 교재, 프린트물 모두 지원됩니다
                            </p>
                        </div>
                    </div>
                )}

                {/* 에러 메시지 */}
                {analysisError && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-700 dark:text-red-300 text-sm flex items-center">
                            <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                            {analysisError}
                        </p>
                    </div>
                )}
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                    disabled={isLoading}
                >
                    취소
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 flex items-center justify-center"
                    disabled={isLoading || !file}
                >
                    {isLoading ? (
                        <>
                            <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            AI 분석 중...
                        </>
                    ) : (
                        'AI로 노트 분석하기'
                    )}
                </button>
            </div>
        </form>
    );

    // 미리보기 단계 렌더링
    const renderPreviewStep = () => (
        <div className="p-6 max-h-[70vh] overflow-y-auto">
            {/* 신뢰도 낮으면 경고 */}
            {extractedData && extractedData.confidence < 0.7 && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm flex items-center">
                        <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                        AI 분석 정확도가 낮습니다. 내용을 확인하고 수정해주세요.
                    </p>
                </div>
            )}

            {/* 에러 메시지 */}
            {analysisError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-700 dark:text-red-300 text-sm flex items-center">
                        <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                        {analysisError}
                    </p>
                </div>
            )}

            {/* 게시판 선택 */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    게시판
                </label>
                <select
                    value={selectedBoard}
                    onChange={(e) => setSelectedBoard(e.target.value as typeof BOARDS[number])}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                    {BOARDS.map(board => (
                        <option key={board} value={board}>{board}</option>
                    ))}
                </select>
            </div>

            {/* 제목 입력 */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    제목
                </label>
                <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    placeholder="제목을 입력하세요"
                />
            </div>

            {/* 해시태그 */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    해시태그
                </label>
                <HashtagInput tags={editedHashtags} setTags={setEditedHashtags} />
            </div>

            {/* 본문 내용 */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        본문 내용
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                    >
                        {showPreview ? (
                            <>
                                <FaEdit className="w-3 h-3" />
                                편집
                            </>
                        ) : (
                            <>
                                <FaEye className="w-3 h-3" />
                                미리보기
                            </>
                        )}
                    </button>
                </div>

                {showPreview ? (
                    <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 min-h-[300px] max-h-[400px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                        >
                            {editedContent}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 min-h-[300px] font-mono text-sm"
                        placeholder="내용을 입력하세요"
                    />
                )}
            </div>

            {/* 원본 이미지 포함 옵션 */}
            <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={includeOriginalImage}
                        onChange={(e) => setIncludeOriginalImage(e.target.checked)}
                        className="rounded mr-3 h-4 w-4 text-blue-600"
                    />
                    <FaImage className="mr-2 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-200 text-sm">
                        원본 이미지를 게시글에 포함
                    </span>
                </label>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 ml-7">
                    체크하면 원본 노트 사진이 본문 상단에 첨부됩니다.
                </p>
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-between">
                <button
                    onClick={handleBack}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center"
                >
                    <FaArrowLeft className="mr-2 h-3 w-3" />
                    다시 분석
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        게시하기
                    </button>
                </div>
            </div>
        </div>
    );

    // 저장 중 상태 렌더링
    const renderSavingStep = () => (
        <div className="p-12 flex flex-col items-center justify-center">
            <FaSpinner className="animate-spin h-12 w-12 text-blue-600 mb-4" />
            <p className="text-gray-700 dark:text-gray-300 text-lg">게시글을 등록하는 중...</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl transition-all transform scale-100 opacity-100 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {step === 'upload' && 'AI 스터디 노트 작성'}
                        {step === 'preview' && '분석 결과 확인 및 편집'}
                        {step === 'saving' && '게시 중'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label="닫기"
                        disabled={step === 'saving'}
                    >
                        <FaTimes className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1">
                    {step === 'upload' && renderUploadStep()}
                    {step === 'preview' && renderPreviewStep()}
                    {step === 'saving' && renderSavingStep()}
                </div>
            </div>
        </div>
    );
};

export default StudyNoteUploadForm;
