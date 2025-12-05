// src/component/ImageScheduleForm.tsx (Mock Version)

import React, { useState } from 'react';
import { FaTimes, FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';

interface ImageScheduleFormProps {
    onClose: () => void;
    onSuccess: () => void;
    setGlobalModal: (modal: any) => void;
}

const ImageScheduleForm: React.FC<ImageScheduleFormProps> = ({ onClose, onSuccess, setGlobalModal }) => {
    // Supabase client 제거 (프론트엔드 단독 처리)

    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // 파일 선택 핸들러
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type.startsWith('image/')) {
                setFile(selectedFile);
                setFileName(selectedFile.name);
            } else {
                setGlobalModal({
                    type: 'message',
                    title: '오류',
                    message: '이미지 파일(jpg, png 등)만 선택 가능합니다.',
                    isError: true
                });
                setFile(null);
                setFileName('');
            }
        }
    };

    // 시간표 등록 처리 (Mock 로직)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setGlobalModal({ type: 'message', title: '알림', message: '파일을 선택해주세요.' });
            return;
        }

        setIsLoading(true);

        try {
            // 1. 파일 업로드 및 OCR 시뮬레이션 (Mock)
            // 2초간 로딩 상태 유지 후 성공 처리
            await new Promise(resolve => setTimeout(resolve, 2000)); 
            
            // 2. Mock 데이터로 DB 저장 시뮬레이션
            // 실제 데이터는 아니지만, 성공 메시지를 띄우고 목록을 새로고침합니다.
            
            setGlobalModal({ 
                type: 'message', 
                title: '등록 완료', 
                message: '이미지 분석 과정이 완료되어 시간표가 등록되었습니다.',
                isError: false
            });
            
            onSuccess(); // ScheduleWidget의 fetchSchedules를 호출 (Mock 성공이므로 기존 데이터만 다시 불러옴)
            onClose();

        } catch (error: any) {
            console.error('이미지 시간표 등록 에러:', error);
            setGlobalModal({
                type: 'message',
                title: '오류',
                message: `시간표 등록 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`,
                isError: true
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg transition-all transform scale-100 opacity-100">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">이미지 파일로 등록</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="닫기">
                        <FaTimes className="w-6 h-6" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">시간표 이미지 파일</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed dark:border-gray-600 rounded-md">
                            <div className="space-y-1 text-center">
                                <FaCloudUploadAlt className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                                <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                                    <label
                                        htmlFor="file-upload"
                                        className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 p-1"
                                    >
                                        <span>파일을 선택하거나 드래그하세요</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} disabled={isLoading} />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF 파일</p>
                                {fileName && (
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-2">
                                        선택된 파일: **{fileName}**
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer / Actions */}
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
                                    분석 및 등록 중...
                                </>
                            ) : (
                                '분석 및 등록 시작'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ImageScheduleForm;