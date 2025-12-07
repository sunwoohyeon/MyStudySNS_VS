// src/component/StudyNoteUploadForm.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaTimes, FaCloudUploadAlt, FaSpinner, FaExclamationTriangle, FaArrowLeft, FaEye, FaEdit, FaImage, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import HashtagInput from './HashtagInput';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// 타입 정의
interface CorrectionItem {
    original: string;
    corrected: string;
    reason: string;
}

interface RefinementInfo {
    applied: boolean;
    corrections: CorrectionItem[];
    refinedConfidence: number;
}

interface ExtractedNoteData {
    title: string;
    content: string;
    rawContent?: string;
    summary: string;
    hashtags: string[];
    subject: string;
    confidence: number;
    refinement?: RefinementInfo;
}

// 다중 이미지 아이템 인터페이스
interface ImageItem {
    id: string;
    file: File;
    preview: string;
    status: 'pending' | 'analyzing' | 'done' | 'error';
    result?: ExtractedNoteData;
    error?: string;
}

interface StudyNoteUploadFormProps {
    onClose: () => void;
    onSuccess?: (postId: number) => void;
}

type Step = 'upload' | 'analyzing' | 'preview' | 'saving';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGES = 10; // 최대 이미지 수
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

    // 다중 이미지 상태
    const [images, setImages] = useState<ImageItem[]>([]);
    const [currentAnalyzingIndex, setCurrentAnalyzingIndex] = useState<number>(-1);
    const [isLoading, setIsLoading] = useState(false);

    // 3단계 UX 상태
    const [step, setStep] = useState<Step>('upload');
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    // 편집 가능한 필드
    const [editedTitle, setEditedTitle] = useState('');
    const [editedContent, setEditedContent] = useState('');
    const [editedHashtags, setEditedHashtags] = useState<string[]>([]);
    const [selectedBoard, setSelectedBoard] = useState<typeof BOARDS[number]>('스터디 노트');
    const [includeOriginalImage, setIncludeOriginalImage] = useState(true);

    // 미리보기 토글
    const [showPreview, setShowPreview] = useState(false);

    // 통합된 교정 정보 (다중 이미지용)
    const [mergedRefinement, setMergedRefinement] = useState<{
        applied: boolean;
        corrections: CorrectionItem[];
        avgConfidence: number;
    } | null>(null);

    // 파일 선택 핸들러 (다중 이미지 지원)
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            setAnalysisError(null);

            // 최대 이미지 수 체크
            const remainingSlots = MAX_IMAGES - images.length;
            if (files.length > remainingSlots) {
                setAnalysisError(`최대 ${MAX_IMAGES}장까지 업로드 가능합니다. (현재 ${images.length}장)`);
                return;
            }

            // 각 파일 검증 및 추가
            const validFiles: { file: File; preview: string }[] = [];
            let hasError = false;

            const processFiles = async () => {
                for (const file of files) {
                    if (!file.type.startsWith('image/')) {
                        setAnalysisError('이미지 파일(JPG, PNG 등)만 선택 가능합니다.');
                        hasError = true;
                        break;
                    }

                    if (file.size > MAX_FILE_SIZE) {
                        setAnalysisError(`${file.name}: 이미지 크기는 10MB를 초과할 수 없습니다.`);
                        hasError = true;
                        break;
                    }

                    // 미리보기 생성
                    const preview = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (event) => resolve(event.target?.result as string);
                        reader.readAsDataURL(file);
                    });

                    validFiles.push({ file, preview });
                }

                if (!hasError && validFiles.length > 0) {
                    const newImages: ImageItem[] = validFiles.map((vf, idx) => ({
                        id: `${Date.now()}-${idx}`,
                        file: vf.file,
                        preview: vf.preview,
                        status: 'pending' as const
                    }));

                    setImages(prev => [...prev, ...newImages]);
                }
            };

            processFiles();
        }
    }, [images.length]);

    // 드래그 앤 드롭 핸들러
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        setAnalysisError(null);

        const remainingSlots = MAX_IMAGES - images.length;
        if (files.length > remainingSlots) {
            setAnalysisError(`최대 ${MAX_IMAGES}장까지 업로드 가능합니다. (현재 ${images.length}장)`);
            return;
        }

        const processFiles = async () => {
            const validFiles: { file: File; preview: string }[] = [];
            let hasError = false;

            for (const file of files) {
                if (!file.type.startsWith('image/')) {
                    setAnalysisError('이미지 파일(JPG, PNG 등)만 선택 가능합니다.');
                    hasError = true;
                    break;
                }

                if (file.size > MAX_FILE_SIZE) {
                    setAnalysisError(`${file.name}: 이미지 크기는 10MB를 초과할 수 없습니다.`);
                    hasError = true;
                    break;
                }

                const preview = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (event) => resolve(event.target?.result as string);
                    reader.readAsDataURL(file);
                });

                validFiles.push({ file, preview });
            }

            if (!hasError && validFiles.length > 0) {
                const newImages: ImageItem[] = validFiles.map((vf, idx) => ({
                    id: `${Date.now()}-${idx}`,
                    file: vf.file,
                    preview: vf.preview,
                    status: 'pending' as const
                }));

                setImages(prev => [...prev, ...newImages]);
            }
        };

        processFiles();
    }, [images.length]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    // 이미지 삭제
    const removeImage = useCallback((id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
    }, []);

    // 순차적 이미지 분석
    const handleAnalyze = async () => {
        if (images.length === 0) return;

        setIsLoading(true);
        setAnalysisError(null);
        setStep('analyzing');

        // 모든 이미지를 pending 상태로 초기화
        setImages(prev => prev.map(img => ({ ...img, status: 'pending' as const })));

        for (let i = 0; i < images.length; i++) {
            setCurrentAnalyzingIndex(i);

            // 현재 이미지를 analyzing 상태로
            setImages(prev => prev.map((img, idx) =>
                idx === i ? { ...img, status: 'analyzing' as const } : img
            ));

            try {
                const base64 = await fileToBase64(images[i].file);

                const response = await fetch('/api/notes/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image: base64,
                        mimeType: images[i].file.type
                    })
                });

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.error);
                }

                if (!result.data) {
                    throw new Error(result.message || "이미지에서 학습 노트 내용을 찾을 수 없습니다.");
                }

                // 성공: done 상태로
                setImages(prev => prev.map((img, idx) =>
                    idx === i ? { ...img, status: 'done' as const, result: result.data } : img
                ));

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "분석 중 오류가 발생했습니다.";

                // 실패: error 상태로
                setImages(prev => prev.map((img, idx) =>
                    idx === i ? { ...img, status: 'error' as const, error: errorMessage } : img
                ));
            }
        }

        // 모든 분석 완료 후 결과 통합
        setCurrentAnalyzingIndex(-1);
        mergeResults();
        setIsLoading(false);
        setStep('preview');
    };

    // 결과 통합 로직
    const mergeResults = () => {
        setImages(currentImages => {
            const successResults = currentImages
                .filter(img => img.status === 'done' && img.result)
                .map(img => img.result!);

            if (successResults.length === 0) {
                setAnalysisError('분석에 성공한 이미지가 없습니다. 다시 시도해주세요.');
                return currentImages;
            }

            // 제목: 첫 번째 결과 사용
            setEditedTitle(successResults[0].title);

            // 본문: 모든 결과 통합 (여러 장일 경우 페이지 구분)
            const mergedContent = successResults
                .map((result, idx) => {
                    if (successResults.length === 1) return result.content;
                    return `## 📄 페이지 ${idx + 1}\n\n${result.content}`;
                })
                .join('\n\n---\n\n');
            setEditedContent(mergedContent);

            // 해시태그: 합집합 (중복 제거)
            const allHashtags = successResults.flatMap(r => r.hashtags);
            const uniqueHashtags = Array.from(new Set(allHashtags)).slice(0, 10);
            setEditedHashtags(uniqueHashtags);

            // 교정 정보 통합
            const allCorrections: CorrectionItem[] = [];
            let totalConfidence = 0;
            let refinedCount = 0;

            successResults.forEach(result => {
                if (result.refinement?.applied) {
                    allCorrections.push(...result.refinement.corrections);
                    totalConfidence += result.refinement.refinedConfidence;
                    refinedCount++;
                } else {
                    totalConfidence += result.confidence;
                }
            });

            if (allCorrections.length > 0) {
                setMergedRefinement({
                    applied: true,
                    corrections: allCorrections.slice(0, 15), // 최대 15개
                    avgConfidence: totalConfidence / successResults.length
                });
            } else {
                setMergedRefinement({
                    applied: false,
                    corrections: [],
                    avgConfidence: totalConfidence / successResults.length
                });
            }

            return currentImages;
        });
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
            if (includeOriginalImage && images.length > 0) {
                const uploadedUrls: string[] = [];

                for (const img of images) {
                    const fileExt = img.file.name.split('.').pop();
                    const fileName = `${user.id}/${Date.now()}-${img.id}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('post-images')
                        .upload(fileName, img.file);

                    if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage
                            .from('post-images')
                            .getPublicUrl(fileName);
                        uploadedUrls.push(publicUrl);
                    }
                }

                // 이미지를 본문 맨 위에 추가
                if (uploadedUrls.length > 0) {
                    const imageMarkdown = uploadedUrls
                        .map((url, idx) => `![원본 노트 이미지 ${idx + 1}](${url})`)
                        .join('\n\n');
                    finalContent = `${imageMarkdown}\n\n---\n\n${editedContent}`;
                }
            }

            // 게시글 생성 API 호출
            const successResults = images.filter(img => img.status === 'done' && img.result);
            const firstResult = successResults[0]?.result;

            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editedTitle,
                    content: finalContent,
                    board: selectedBoard,
                    tag: firstResult?.subject || '기타',
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
        setAnalysisError(null);
        setShowPreview(false);
        setMergedRefinement(null);
        // 이미지 상태 초기화
        setImages(prev => prev.map(img => ({ ...img, status: 'pending' as const, result: undefined, error: undefined })));
    };

    // 업로드 단계 렌더링
    const renderUploadStep = () => (
        <form onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }} className="p-6">
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    공부 노트 이미지 <span className="text-gray-500">(최대 {MAX_IMAGES}장)</span>
                </label>

                {/* 이미지 그리드 미리보기 */}
                {images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                        {images.map((img, idx) => (
                            <div key={img.id} className="relative group">
                                <img
                                    src={img.preview}
                                    alt={`노트 ${idx + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                                />
                                <span className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                                    {idx + 1}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeImage(img.id)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <FaTimes className="w-3 h-3" />
                                </button>
                            </div>
                        ))}

                        {/* 추가 업로드 버튼 */}
                        {images.length < MAX_IMAGES && (
                            <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                                <FaCloudUploadAlt className="w-6 h-6 text-gray-400" />
                                <span className="text-xs text-gray-500 mt-1">추가</span>
                                <input
                                    type="file"
                                    className="sr-only"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileChange}
                                    disabled={isLoading}
                                />
                            </label>
                        )}
                    </div>
                )}

                {/* 드래그 앤 드롭 영역 (이미지가 없을 때) */}
                {images.length === 0 && (
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
                                        multiple
                                        onChange={handleFileChange}
                                        disabled={isLoading}
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                PNG, JPG, GIF (최대 10MB, {MAX_IMAGES}장까지)
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
                    disabled={isLoading || images.length === 0}
                >
                    {isLoading ? (
                        <>
                            <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            AI 분석 중...
                        </>
                    ) : (
                        `AI로 노트 분석하기 (${images.length}장)`
                    )}
                </button>
            </div>
        </form>
    );

    // 분석 중 단계 렌더링
    const renderAnalyzingStep = () => (
        <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                AI 분석 중...
            </h3>
            <div className="space-y-3">
                {images.map((img, idx) => (
                    <div key={img.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <img
                            src={img.preview}
                            alt={`노트 ${idx + 1}`}
                            className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                이미지 {idx + 1}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                {img.status === 'pending' && (
                                    <span className="text-gray-400 text-xs">대기 중</span>
                                )}
                                {img.status === 'analyzing' && (
                                    <>
                                        <FaSpinner className="animate-spin text-blue-500 w-3 h-3" />
                                        <span className="text-blue-500 text-xs">분석 중...</span>
                                    </>
                                )}
                                {img.status === 'done' && (
                                    <>
                                        <FaCheckCircle className="text-green-500 w-3 h-3" />
                                        <span className="text-green-500 text-xs">완료</span>
                                    </>
                                )}
                                {img.status === 'error' && (
                                    <>
                                        <FaTimesCircle className="text-red-500 w-3 h-3" />
                                        <span className="text-red-500 text-xs">{img.error || '실패'}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentAnalyzingIndex >= 0
                        ? `${currentAnalyzingIndex + 1} / ${images.length} 분석 중`
                        : '분석 완료 중...'
                    }
                </p>
            </div>
        </div>
    );

    // 미리보기 단계 렌더링
    const renderPreviewStep = () => (
        <div className="p-6 max-h-[70vh] overflow-y-auto">
            {/* AI 교정 완료 알림 */}
            {mergedRefinement?.applied && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-green-800 dark:text-green-200 text-sm flex items-center">
                        <span className="mr-2">✨</span>
                        AI가 내용을 교정했습니다. (평균 신뢰도: {Math.round((mergedRefinement.avgConfidence || 0) * 100)}%)
                    </p>
                </div>
            )}

            {/* 교정 내역 표시 (접을 수 있는 섹션) */}
            {mergedRefinement?.applied && mergedRefinement.corrections.length > 0 && (
                <details className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <summary className="cursor-pointer font-medium text-yellow-700 dark:text-yellow-400 flex items-center">
                        <span className="mr-2">📝</span>
                        AI 교정 내역 ({mergedRefinement.corrections.length}건)
                    </summary>
                    <ul className="mt-3 space-y-2 text-sm">
                        {mergedRefinement.corrections.map((c, i) => (
                            <li key={i} className="p-2 bg-white dark:bg-gray-800 rounded border border-yellow-100 dark:border-yellow-900">
                                <div className="flex items-start gap-2">
                                    <span className="text-red-500 line-through flex-shrink-0">{c.original}</span>
                                    <span className="text-gray-400">→</span>
                                    <span className="text-green-600 dark:text-green-400 flex-shrink-0">{c.corrected}</span>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 italic">
                                    {c.reason}
                                </p>
                            </li>
                        ))}
                    </ul>
                </details>
            )}

            {/* 분석 결과 요약 */}
            {images.length > 1 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                        📚 {images.length}장의 이미지 중 {images.filter(img => img.status === 'done').length}장 분석 성공
                        {images.some(img => img.status === 'error') && (
                            <span className="text-red-500 ml-2">
                                ({images.filter(img => img.status === 'error').length}장 실패)
                            </span>
                        )}
                    </p>
                </div>
            )}

            {/* 신뢰도 낮으면 경고 */}
            {mergedRefinement && mergedRefinement.avgConfidence < 0.7 && !mergedRefinement.applied && (
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
                        원본 이미지를 게시글에 포함 ({images.length}장)
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
                        {step === 'analyzing' && 'AI 분석 중'}
                        {step === 'preview' && '분석 결과 확인 및 편집'}
                        {step === 'saving' && '게시 중'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label="닫기"
                        disabled={step === 'saving' || step === 'analyzing'}
                    >
                        <FaTimes className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1">
                    {step === 'upload' && renderUploadStep()}
                    {step === 'analyzing' && renderAnalyzingStep()}
                    {step === 'preview' && renderPreviewStep()}
                    {step === 'saving' && renderSavingStep()}
                </div>
            </div>
        </div>
    );
};

export default StudyNoteUploadForm;
