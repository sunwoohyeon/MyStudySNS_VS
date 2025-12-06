// src/component/ImageScheduleForm.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { FaTimes, FaCloudUploadAlt, FaSpinner, FaEdit, FaTrash, FaExclamationTriangle, FaArrowLeft, FaCheck } from 'react-icons/fa';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// 타입 정의
interface ScheduleItem {
    id: number;
    user_id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    title: string;
    location?: string;
}

interface ExtractedScheduleItem {
    id: string;
    title: string;
    day_of_week: '월' | '화' | '수' | '목' | '금' | '토' | '일';
    start_time: string;
    end_time: string;
    location?: string;
    confidence?: number;
    isSelected: boolean;
    hasConflict: boolean;
}

interface ConflictInfo {
    newScheduleId: string;
    existingSchedule: ScheduleItem;
    overlapType: 'full' | 'partial';
}

interface ImageScheduleFormProps {
    onClose: () => void;
    onSuccess: () => void;
    setGlobalModal: (modal: { type: 'none' | 'message' | 'confirmDelete'; title: string; message: string; onConfirm?: () => void; isError?: boolean }) => void;
}

type Step = 'upload' | 'preview' | 'saving';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 1교시 시작 시간 옵션
const FIRST_PERIOD_OPTIONS = [
    { value: '08:00', label: '08:00 (8시)' },
    { value: '08:30', label: '08:30 (8시 30분)' },
    { value: '09:00', label: '09:00 (9시)' },
    { value: '09:30', label: '09:30 (9시 30분)' },
    { value: '10:00', label: '10:00 (10시)' },
];

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

// 시간 겹침 검사 유틸리티 함수
function checkTimeOverlap(
    start1: string, end1: string,
    start2: string, end2: string
): 'full' | 'partial' | null {
    const toMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const s1 = toMinutes(start1), e1 = toMinutes(end1);
    const s2 = toMinutes(start2), e2 = toMinutes(end2);

    if (e1 <= s2 || e2 <= s1) return null;
    if ((s1 >= s2 && e1 <= e2) || (s2 >= s1 && e2 <= e1)) return 'full';
    return 'partial';
}

const ImageScheduleForm: React.FC<ImageScheduleFormProps> = ({ onClose, onSuccess, setGlobalModal }) => {
    const supabase = createClientComponentClient();

    // 기본 상태
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // 1교시 시작 시간 설정
    const [firstPeriodStart, setFirstPeriodStart] = useState('09:00');

    // 3단계 UX 상태
    const [step, setStep] = useState<Step>('upload');
    const [extractedSchedules, setExtractedSchedules] = useState<ExtractedScheduleItem[]>([]);
    const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    // 인라인 편집 상태
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<ExtractedScheduleItem | null>(null);

    // 기존 시간표 삭제 옵션
    const [deleteExisting, setDeleteExisting] = useState(true);
    const [existingCount, setExistingCount] = useState(0);

    // 파일 선택 핸들러
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];

            if (!selectedFile.type.startsWith('image/')) {
                setGlobalModal({
                    type: 'message',
                    title: '오류',
                    message: '이미지 파일(jpg, png 등)만 선택 가능합니다.',
                    isError: true
                });
                return;
            }

            if (selectedFile.size > MAX_FILE_SIZE) {
                setGlobalModal({
                    type: 'message',
                    title: '파일 크기 초과',
                    message: '이미지 크기는 10MB를 초과할 수 없습니다.',
                    isError: true
                });
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
    }, [setGlobalModal]);

    // 충돌 검사 및 기존 시간표 개수 확인
    const checkConflicts = useCallback(async (newSchedules: ExtractedScheduleItem[]) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: existingSchedules } = await supabase
            .from('schedules')
            .select('*')
            .eq('user_id', user.id);

        if (!existingSchedules) {
            setExistingCount(0);
            return;
        }

        // 기존 시간표 개수 저장
        setExistingCount(existingSchedules.length);

        const conflictList: ConflictInfo[] = [];

        newSchedules.forEach(newItem => {
            existingSchedules.forEach((existing: ScheduleItem) => {
                if (newItem.day_of_week === existing.day_of_week) {
                    const overlap = checkTimeOverlap(
                        newItem.start_time, newItem.end_time,
                        existing.start_time, existing.end_time
                    );

                    if (overlap) {
                        conflictList.push({
                            newScheduleId: newItem.id,
                            existingSchedule: existing,
                            overlapType: overlap
                        });
                        newItem.hasConflict = true;
                    }
                }
            });
        });

        setConflicts(conflictList);
    }, [supabase]);

    // 이미지 분석 시작
    const handleAnalyze = async () => {
        if (!file) return;

        setIsLoading(true);
        setAnalysisError(null);

        try {
            const base64 = await fileToBase64(file);

            const response = await fetch('/api/schedule/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: base64,
                    mimeType: file.type,
                    firstPeriodStart: firstPeriodStart
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            if (data.schedules.length === 0) {
                setAnalysisError(data.message || "이미지에서 시간표 정보를 찾을 수 없습니다.");
                return;
            }

            // 추출된 데이터에 클라이언트 ID 부여
            const schedulesWithId: ExtractedScheduleItem[] = data.schedules.map((s: Omit<ExtractedScheduleItem, 'id' | 'isSelected' | 'hasConflict'>) => ({
                ...s,
                id: crypto.randomUUID(),
                isSelected: true,
                hasConflict: false
            }));

            // 충돌 검사 수행
            await checkConflicts(schedulesWithId);

            setExtractedSchedules(schedulesWithId);
            setStep('preview');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "분석 중 오류가 발생했습니다.";
            setAnalysisError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // 선택 토글
    const handleToggleSelect = (id: string) => {
        setExtractedSchedules(prev =>
            prev.map(item =>
                item.id === id ? { ...item, isSelected: !item.isSelected } : item
            )
        );
    };

    // 항목 삭제
    const handleDelete = (id: string) => {
        setExtractedSchedules(prev => prev.filter(item => item.id !== id));
        setConflicts(prev => prev.filter(c => c.newScheduleId !== id));
    };

    // 인라인 편집 시작
    const handleStartEdit = (item: ExtractedScheduleItem) => {
        setEditingId(item.id);
        setEditData({ ...item });
    };

    // 인라인 편집 저장
    const handleSaveEdit = () => {
        if (!editData || !editingId) return;

        setExtractedSchedules(prev =>
            prev.map(item =>
                item.id === editingId ? { ...editData } : item
            )
        );
        setEditingId(null);
        setEditData(null);
    };

    // 인라인 편집 취소
    const handleCancelEdit = () => {
        setEditingId(null);
        setEditData(null);
    };

    // 일괄 저장
    const handleSaveAll = async () => {
        const selectedSchedules = extractedSchedules.filter(s => s.isSelected);

        if (selectedSchedules.length === 0) {
            setGlobalModal({
                type: 'message',
                title: '알림',
                message: '저장할 시간표를 선택해주세요.'
            });
            return;
        }

        setStep('saving');

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("로그인이 필요합니다.");
            }

            // 기존 시간표 삭제 옵션이 켜져 있으면 먼저 삭제
            if (deleteExisting && existingCount > 0) {
                const { error: deleteError } = await supabase
                    .from('schedules')
                    .delete()
                    .eq('user_id', user.id);

                if (deleteError) throw deleteError;
            }

            const insertData = selectedSchedules.map(s => ({
                user_id: user.id,
                day_of_week: s.day_of_week,
                start_time: s.start_time,
                end_time: s.end_time,
                title: s.title,
                location: s.location || null
            }));

            const { error } = await supabase
                .from('schedules')
                .insert(insertData);

            if (error) throw error;

            const message = deleteExisting && existingCount > 0
                ? `기존 시간표를 삭제하고 ${selectedSchedules.length}개의 새 시간표가 등록되었습니다.`
                : `${selectedSchedules.length}개의 시간표가 등록되었습니다.`;

            setGlobalModal({
                type: 'message',
                title: '등록 완료',
                message
            });

            onSuccess();
            onClose();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.';
            setGlobalModal({
                type: 'message',
                title: '오류',
                message: errorMessage,
                isError: true
            });
            setStep('preview');
        }
    };

    // 뒤로가기 (업로드 단계로)
    const handleBack = () => {
        setStep('upload');
        setExtractedSchedules([]);
        setConflicts([]);
    };

    // 업로드 단계 렌더링
    const renderUploadStep = () => (
        <form onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }} className="p-6">
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    시간표 이미지 파일
                </label>

                {/* 이미지 미리보기 */}
                {imagePreview ? (
                    <div className="mb-4">
                        <div className="relative rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                            <img
                                src={imagePreview}
                                alt="시간표 미리보기"
                                className="w-full max-h-64 object-contain bg-gray-100 dark:bg-gray-700"
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
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed dark:border-gray-600 rounded-md hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                        <div className="space-y-1 text-center">
                            <FaCloudUploadAlt className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                            <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                                <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 p-1"
                                >
                                    <span>파일을 선택하거나 드래그하세요</span>
                                    <input
                                        id="file-upload"
                                        name="file-upload"
                                        type="file"
                                        className="sr-only"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={isLoading}
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF (최대 10MB)</p>
                        </div>
                    </div>
                )}

                {/* 에러 메시지 */}
                {analysisError && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-700 dark:text-red-300 text-sm flex items-center">
                            <FaExclamationTriangle className="mr-2" />
                            {analysisError}
                        </p>
                    </div>
                )}
            </div>

            {/* 1교시 시작 시간 설정 */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    1교시 시작 시간
                </label>
                <select
                    value={firstPeriodStart}
                    onChange={(e) => setFirstPeriodStart(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                >
                    {FIRST_PERIOD_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    학교의 1교시 시작 시간에 맞게 설정하세요. (교시 표기가 있는 시간표 분석 시 사용됩니다)
                </p>
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
                    className="px-4 py-2 text-sm font-medium rounded-md bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 flex items-center justify-center"
                    disabled={isLoading || !file}
                >
                    {isLoading ? (
                        <>
                            <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            분석 중...
                        </>
                    ) : (
                        '이미지 분석 시작'
                    )}
                </button>
            </div>
        </form>
    );

    // 미리보기 단계 렌더링
    const renderPreviewStep = () => {
        const selectedCount = extractedSchedules.filter(s => s.isSelected).length;
        const conflictCount = conflicts.length;

        return (
            <div className="p-6">
                {/* 헤더 정보 */}
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        분석 결과 확인
                    </h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedCount}/{extractedSchedules.length}개 선택됨
                    </span>
                </div>

                {/* 기존 시간표 삭제 옵션 */}
                {existingCount > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={deleteExisting}
                                onChange={(e) => setDeleteExisting(e.target.checked)}
                                className="rounded mr-3 h-4 w-4 text-blue-600"
                            />
                            <span className="text-blue-800 dark:text-blue-200 text-sm">
                                기존 시간표 <strong>{existingCount}개</strong>를 삭제하고 새로 등록
                            </span>
                        </label>
                        <p className="text-blue-600 dark:text-blue-300 text-xs mt-1 ml-7">
                            체크 해제 시 기존 시간표에 추가됩니다.
                        </p>
                    </div>
                )}

                {/* 충돌 경고 (기존 삭제 안할 때만 표시) */}
                {!deleteExisting && conflictCount > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-yellow-800 dark:text-yellow-200 text-sm flex items-center">
                            <FaExclamationTriangle className="mr-2" />
                            <strong>{conflictCount}개</strong>의 항목이 기존 시간표와 겹칩니다.
                        </p>
                    </div>
                )}

                {/* 시간표 목록 테이블 */}
                <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                            <tr>
                                <th className="p-2 text-left w-10">
                                    <input
                                        type="checkbox"
                                        checked={extractedSchedules.every(s => s.isSelected)}
                                        onChange={() => {
                                            const allSelected = extractedSchedules.every(s => s.isSelected);
                                            setExtractedSchedules(prev =>
                                                prev.map(item => ({ ...item, isSelected: !allSelected }))
                                            );
                                        }}
                                        className="rounded"
                                    />
                                </th>
                                <th className="p-2 text-left text-gray-700 dark:text-gray-300">과목명</th>
                                <th className="p-2 text-left text-gray-700 dark:text-gray-300 w-16">요일</th>
                                <th className="p-2 text-left text-gray-700 dark:text-gray-300">시간</th>
                                <th className="p-2 text-left text-gray-700 dark:text-gray-300">강의실</th>
                                <th className="p-2 text-left text-gray-700 dark:text-gray-300 w-16">상태</th>
                                <th className="p-2 w-20"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {extractedSchedules.map(item => (
                                editingId === item.id ? (
                                    // 편집 모드
                                    <tr key={item.id} className="bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                                        <td className="p-2">
                                            <input type="checkbox" checked={item.isSelected} disabled className="rounded" />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={editData?.title || ''}
                                                onChange={e => setEditData(prev => prev ? { ...prev, title: e.target.value } : null)}
                                                className="w-full p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <select
                                                value={editData?.day_of_week || '월'}
                                                onChange={e => setEditData(prev => prev ? { ...prev, day_of_week: e.target.value as typeof DAYS[number] } : null)}
                                                className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            >
                                                {DAYS.map(day => (
                                                    <option key={day} value={day}>{day}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <div className="flex gap-1 items-center">
                                                <input
                                                    type="time"
                                                    value={editData?.start_time || ''}
                                                    onChange={e => setEditData(prev => prev ? { ...prev, start_time: e.target.value } : null)}
                                                    className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                                <span className="text-gray-500">~</span>
                                                <input
                                                    type="time"
                                                    value={editData?.end_time || ''}
                                                    onChange={e => setEditData(prev => prev ? { ...prev, end_time: e.target.value } : null)}
                                                    className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                            </div>
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={editData?.location || ''}
                                                onChange={e => setEditData(prev => prev ? { ...prev, location: e.target.value } : null)}
                                                className="w-full p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                placeholder="(선택)"
                                            />
                                        </td>
                                        <td className="p-2"></td>
                                        <td className="p-2">
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={handleSaveEdit}
                                                    className="p-1 text-green-600 hover:text-green-700"
                                                    title="저장"
                                                >
                                                    <FaCheck className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="p-1 text-gray-500 hover:text-gray-600"
                                                    title="취소"
                                                >
                                                    <FaTimes className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    // 일반 모드
                                    <tr
                                        key={item.id}
                                        className={`border-b border-gray-200 dark:border-gray-700 ${item.hasConflict ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                                            }`}
                                    >
                                        <td className="p-2">
                                            <input
                                                type="checkbox"
                                                checked={item.isSelected}
                                                onChange={() => handleToggleSelect(item.id)}
                                                className="rounded"
                                            />
                                        </td>
                                        <td className="p-2 font-medium text-gray-900 dark:text-gray-100">
                                            {item.title}
                                        </td>
                                        <td className="p-2 text-gray-600 dark:text-gray-400">
                                            {item.day_of_week}
                                        </td>
                                        <td className="p-2 text-gray-600 dark:text-gray-400">
                                            {item.start_time} ~ {item.end_time}
                                        </td>
                                        <td className="p-2 text-gray-500 dark:text-gray-400">
                                            {item.location || '-'}
                                        </td>
                                        <td className="p-2">
                                            {item.hasConflict && (
                                                <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded">
                                                    충돌
                                                </span>
                                            )}
                                            {item.confidence && item.confidence < 0.8 && !item.hasConflict && (
                                                <span className="px-2 py-0.5 text-xs bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded">
                                                    불확실
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-2">
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleStartEdit(item)}
                                                    className="p-1 text-blue-600 hover:text-blue-700"
                                                    title="수정"
                                                >
                                                    <FaEdit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1 text-red-500 hover:text-red-600"
                                                    title="삭제"
                                                >
                                                    <FaTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 버튼 영역 */}
                <div className="flex justify-between mt-6">
                    <button
                        onClick={handleBack}
                        className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center"
                    >
                        <FaArrowLeft className="mr-2 h-3 w-3" />
                        다른 이미지
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSaveAll}
                            disabled={selectedCount === 0}
                            className="px-4 py-2 text-sm font-medium rounded-md bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                        >
                            {selectedCount}개 항목 저장
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // 저장 중 상태 렌더링
    const renderSavingStep = () => (
        <div className="p-12 flex flex-col items-center justify-center">
            <FaSpinner className="animate-spin h-12 w-12 text-green-600 mb-4" />
            <p className="text-gray-700 dark:text-gray-300 text-lg">시간표를 저장하는 중...</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl transition-all transform scale-100 opacity-100 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {step === 'upload' && '이미지로 시간표 등록'}
                        {step === 'preview' && '분석 결과 확인'}
                        {step === 'saving' && '저장 중'}
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

export default ImageScheduleForm;
