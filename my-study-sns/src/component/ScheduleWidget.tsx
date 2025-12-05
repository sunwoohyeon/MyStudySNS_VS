// src/component/ScheduleWidget.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ScheduleForm from './ScheduleForm';
import WeeklyScheduleGrid from './WeeklyScheduleGrid';
import ImageScheduleForm from './ImageScheduleForm'; // 👈 새 컴포넌트 import
import { FaPlus, FaTrashAlt, FaChevronDown } from 'react-icons/fa';

// --- Custom Modal Component (생략, 기존과 동일) ---
interface ModalProps {
    title: string;
    message: string;
    onConfirm?: () => void;
    onClose: () => void;
    confirmText?: string;
    isError?: boolean;
}

const SimpleModal: React.FC<ModalProps> = ({ title, message, onConfirm, onClose, confirmText = "확인", isError = false }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-sm">
                <h3 className={`text-xl font-bold mb-4 ${isError ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
                    {title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">{message}</p>

                <div className="flex justify-end gap-3">
                    {onConfirm && (
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 text-sm font-medium rounded-md ${isError ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        >
                            {confirmText}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                        {onConfirm ? '취소' : '닫기'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ScheduleItem 타입 정의 (기존과 동일)
export interface ScheduleItem {
  id: number;
  user_id: string;
  day_of_week: '월' | '화' | '수' | '목' | '금' | '토' | '일';
  start_time: string;
  end_time: string;
  title: string;
  location?: string;
}

// 요일 매핑 및 상수 (기존과 동일)
const DAY_MAP: { [key: number]: string } = { 0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토' };
const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function ScheduleWidget() {
    const supabase = createClientComponentClient();

    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'current' | 'all'>('current');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImageFormOpen, setIsImageFormOpen] = useState(false); // 이미지 등록 폼 상태
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [modal, setModal] = useState<{ type: 'none' | 'message' | 'confirmDelete', title: string, message: string, onConfirm?: () => void, isError?: boolean }>({ type: 'none', message: '', title: '' });

    // 1. 사용자 확인 및 데이터 Fetching (기존과 동일)
    const fetchSchedules = useCallback(async () => {
        // ... (기존 fetchSchedules 로직)
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setCurrentUserId(null);
                setSchedules([]);
                setIsLoading(false);
                return;
            }

            setCurrentUserId(user.id);

            // DB에서 시간표 조회
            const { data, error } = await supabase
                .from('schedules')
                .select('*')
                .eq('user_id', user.id)
                .order('day_of_week', { ascending: true });

            if (error) throw error;

            // 요일 순서로 정렬
            const sortedData = (data || []).sort((a, b) => {
                const dayA = DAYS.indexOf(a.day_of_week);
                const dayB = DAYS.indexOf(b.day_of_week);
                if (dayA !== dayB) return dayA - dayB;
                return a.start_time.localeCompare(b.start_time);
            });

            setSchedules(sortedData);
        } catch (e: unknown) {
            console.error('시간표 로딩 에러:', e);
            setModal({
                type: 'message',
                title: '오류',
                message: '시간표를 불러오는 중 오류가 발생했습니다.',
                isError: true
            });
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    // 초기 로딩 (기존과 동일)
    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    // 2. 삭제 함수 (기존과 동일)
    const handleDeleteSchedule = async (item: ScheduleItem) => {
        try {
            const { error } = await supabase
                .from('schedules')
                .delete()
                .eq('id', item.id);

            if (error) throw error;

            // 로컬 상태 업데이트
            setSchedules(prev => prev.filter(s => s.id !== item.id));
            setModal({
                type: 'message',
                title: '삭제 완료',
                message: '시간표가 삭제되었습니다.'
            });
        } catch (e) {
            console.error('삭제 에러:', e);
            setModal({
                type: 'message',
                title: '오류',
                message: '시간표 삭제 중 오류가 발생했습니다.',
                isError: true
            });
        }
    };

    // 3. ScheduleItemRow 컴포넌트 (기존과 동일)
    const ScheduleItemRow: React.FC<{ item: ScheduleItem }> = ({ item }) => {
        const handleDeleteModal = () => {
            setModal({
                type: 'confirmDelete',
                title: '삭제 확인',
                message: `[${item.title}] 시간표를 삭제하시겠습니까?`,
                onConfirm: () => handleDeleteSchedule(item),
            });
        };

        return (
            <li className="flex justify-between items-center p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 bg-white dark:bg-gray-800 transition-colors">
                <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 mr-2">{item.day_of_week}</span>
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        {item.start_time.slice(0, 5)} ~ {item.end_time.slice(0, 5)}
                    </span>
                    <p className="text-base font-bold truncate text-gray-800 dark:text-gray-200">{item.title}</p>
                    {item.location && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.location}</p>}
                </div>
                <button onClick={handleDeleteModal} className="text-red-500 hover:text-red-700 p-2 rounded-full transition-colors flex-shrink-0" aria-label="삭제">
                    <FaTrashAlt className="w-4 h-4" />
                </button>
            </li>
        );
    };

    // 4. 필터링 함수 (기존과 동일)
    const getFilteredSchedules = () => {
        if (viewMode === 'all') return schedules;

        const now = new Date();
        const currentDayIndex = now.getDay();
        const currentHourMinute = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const currentDay = DAY_MAP[currentDayIndex];

        const todaySchedules = schedules.filter(item => item.day_of_week === currentDay);
        const currentSchedules = todaySchedules.filter(item => currentHourMinute < item.end_time);

        return currentSchedules.slice(0, 5);
    };

    const filteredSchedules = getFilteredSchedules();
    const isCurrentView = viewMode === 'current';

    // 비로그인 상태 UI (기존과 동일)
    if (!isLoading && !currentUserId) {
        return (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                    로그인하면 나만의 시간표를 관리할 수 있습니다.
                </p>
            </div>
        );
    }

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300">
            {/* 헤더: 제목 및 버튼 (Dropdown 내용 수정) */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-bold text-gray-800 dark:text-gray-100 flex-shrink-0">
                    {isCurrentView ? '🔔 오늘의 수업 시간표' : '📚 전체 시간표'}
                </h2>
                <div className="flex items-center gap-3 relative z-20">
                    <button
                        onClick={() => setViewMode(isCurrentView ? 'all' : 'current')}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:underline flex-shrink-0 font-medium"
                    >
                        {isCurrentView ? '+ 전체 보기' : '- 현재 수업만'}
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(prev => !prev)}
                            className="p-1.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition flex items-center gap-1"
                            aria-label="시간표 등록"
                        >
                            <FaPlus className="w-4 h-4" />
                            <FaChevronDown className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-30">
                                <button
                                    onClick={() => { setIsFormOpen(true); setDropdownOpen(false); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                    시간표 직접 등록
                                </button>
                                <button
                                    onClick={() => { setIsImageFormOpen(true); setDropdownOpen(false); }} // 👈 이미지 폼 열기
                                    className="w-full text-left px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                    이미지 파일 등록
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 시간표 목록/그리드 (기존과 동일) */}
            {isLoading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex justify-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <p className="mt-2">시간표를 불러오는 중...</p>
                </div>
            ) : isCurrentView ? (
                filteredSchedules.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredSchedules.map(item => (
                            <ScheduleItemRow key={item.id} item={item} />
                        ))}
                    </ul>
                ) : (
                    <div className="py-8 px-4 text-sm text-gray-400 italic text-center dark:text-gray-500">
                        {schedules.length === 0
                            ? '등록된 시간표가 없습니다. + 버튼을 눌러 추가해보세요!'
                            : '오늘은 남은 수업이 없습니다.'
                        }
                    </div>
                )
            ) : (
                <div className="p-0">
                    <WeeklyScheduleGrid schedules={schedules} />
                </div>
            )}

            {/* 시간표 직접 등록 모달 (기존과 동일) */}
            {isFormOpen && (
                <ScheduleForm
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={fetchSchedules}
                    setGlobalModal={setModal}
                />
            )}

            {/* 이미지 등록 모달 (ImageScheduleForm 사용) */}
            {isImageFormOpen && (
                <ImageScheduleForm // 👈 이미지 등록 컴포넌트 사용
                    onClose={() => setIsImageFormOpen(false)}
                    onSuccess={fetchSchedules}
                    setGlobalModal={setModal}
                />
            )}

            {/* Modal Rendering (기존과 동일) */}
            {modal.type !== 'none' && (
                <SimpleModal
                    title={modal.title}
                    message={modal.message}
                    onConfirm={modal.onConfirm}
                    onClose={() => setModal({ type: 'none', message: '', title: '' })}
                    confirmText={modal.type === 'confirmDelete' ? '삭제' : '확인'}
                    isError={modal.isError}
                />
            )}
        </div>
    );
}