// src/component/ScheduleWidget.tsx (최종)
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ScheduleForm from './ScheduleForm';
import WeeklyScheduleGrid from './WeeklyScheduleGrid'; 
import { FaPlus, FaTrashAlt, FaChevronDown } from 'react-icons/fa';

// --- Custom Modal Component (규정 준수) ---
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
// --- Custom Modal Component End ---


// ★ ScheduleItem 타입을 이 파일에 정의하고 export 합니다.
export interface ScheduleItem {
  id: number;           
  user_id: string;      
  day_of_week: '월' | '화' | '수' | '목' | '금' | '토' | '일'; 
  start_time: string;   
  end_time: string;     
  title: string;        
  location?: string;    
}

// 요일 매핑 및 상수
const DAY_MAP: { [key: number]: string } = { 0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토' };
const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

const DUMMY_SCHEDULES: ScheduleItem[] = [
    { id: 1, user_id: 'dummy', day_of_week: '월', start_time: '10:00', end_time: '12:00', title: 'React 기초 스터디', location: '온라인' },
    { id: 2, user_id: 'dummy', day_of_week: '화', start_time: '14:00', end_time: '16:00', title: 'Supabase DB 설계', location: '강의실 A' },
    { id: 3, user_id: 'dummy', day_of_week: '수', start_time: '17:00', end_time: '18:00', title: '기술 면접 대비', location: '오픈채팅' },
    { id: 4, user_id: 'dummy', day_of_week: '목', start_time: '09:00', end_time: '10:30', title: 'Next.js 라우팅', location: 'Zoom' },
    { id: 5, user_id: 'dummy', day_of_week: '금', start_time: '13:00', end_time: '15:00', title: '알고리즘 풀이', location: '스터디 룸' },
    { id: 6, user_id: 'dummy', day_of_week: '금', start_time: '15:00', end_time: '17:00', title: '협업 프로젝트 회의', location: 'Zoom' },
];

export default function ScheduleWidget() {
    const [schedules, setSchedules] = useState<ScheduleItem[]>(DUMMY_SCHEDULES); 
    const [isLoading, setIsLoading] = useState(false); 
    const [viewMode, setViewMode] = useState<'current' | 'all'>('current');
    const [isFormOpen, setIsFormOpen] = useState(false);
    // ★ 수정: 이미지 등록 폼 상태 추가 (시뮬레이션 용)
    const [isImageFormOpen, setIsImageFormOpen] = useState(false); 
    const [dropdownOpen, setDropdownOpen] = useState(false); // 드롭다운 상태
    const [modal, setModal] = useState<{ type: 'none' | 'message' | 'confirmDelete', title: string, message: string, onConfirm?: () => void, isError?: boolean }>({ type: 'none', message: '', title: '' });

    // 1. 데이터 Fetching 함수 (API 통신 대신 더미 데이터 사용)
    const fetchSchedules = useCallback(async () => {
        setIsLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 300)); 
            
            let data = DUMMY_SCHEDULES; 
            
            data.sort((a, b) => {
                const dayA = DAYS.indexOf(a.day_of_week);
                const dayB = DAYS.indexOf(b.day_of_week);
                if (dayA !== dayB) return dayA - dayB;
                return a.start_time.localeCompare(b.start_time);
            });

            setSchedules(data);
        } catch (e: any) {
            console.error('시간표 로딩 에러:', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 2. ScheduleItemRow (오류 해결 및 삭제 로직 포함)
    const ScheduleItemRow: React.FC<{ item: ScheduleItem, onDeleted: () => void, setModal: React.Dispatch<any> }> = ({ item, onDeleted, setModal }) => {
    
        const handleDelete = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 300));
                
                setSchedules(prev => prev.filter(s => s.id !== item.id));

                onDeleted(); 
                setModal({ type: 'message', title: '성공 (시뮬레이션)', message: '시간표가 삭제되었습니다. (백엔드 통신은 비활성화)', confirmText: '확인' });
            } catch (e) {
                setModal({ type: 'message', title: '오류', message: '시간표 삭제 중 오류가 발생했습니다.', isError: true });
            }
        };
        
        const handleDeleteModal = () => {
            setModal({
                type: 'confirmDelete',
                title: '삭제 확인',
                message: `[${item.title}] 시간표를 삭제하시겠습니까?`,
                onConfirm: handleDelete,
                confirmText: '삭제',
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

    const getFilteredSchedules = () => {
        if (viewMode === 'all') return schedules;

        const now = new Date();
        const currentDayIndex = now.getDay();
        const currentHourMinute = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const currentDay = DAY_MAP[currentDayIndex];
        
        const todaySchedules = schedules.filter(item => item.day_of_week === currentDay);

        const currentSchedules = todaySchedules.filter(item => {
            return currentHourMinute < item.end_time;
        });

        return currentSchedules.slice(0, 5);
    };

    const filteredSchedules = getFilteredSchedules();
    const isCurrentView = viewMode === 'current';


    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300">
            {/* 헤더: 제목 및 버튼 */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-bold text-gray-800 dark:text-gray-100 flex-shrink-0">
                    {isCurrentView ? '🔔 오늘의 수업 시간표' : '📚 전체 시간표'}
                </h2>
                {/* 드롭다운 컨테이너에 높은 z-index (z-20)를 줍니다. */}
                <div className="flex items-center gap-3 relative z-20"> 
                    
                    {/* 전체 보기/현재 수업만 버튼 (왼쪽) */}
                    <button 
                        onClick={() => setViewMode(isCurrentView ? 'all' : 'current')}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:underline flex-shrink-0 font-medium"
                    >
                        {isCurrentView ? '+ 전체 보기' : '- 현재 수업만'}
                    </button>

                    {/* + 버튼 (드롭다운 트리거) */}
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
                            // 드롭다운 메뉴
                            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-30">
                                <button
                                    onClick={() => { setIsFormOpen(true); setDropdownOpen(false); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                    시간표 직접 등록
                                </button>
                                <button
                                    onClick={() => { setIsImageFormOpen(true); setDropdownOpen(false); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                    이미지 파일 등록
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 시간표 목록/그리드 */}
            {isLoading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">시간표를 불러오는 중...</div>
            ) : isCurrentView ? ( // 현재 수업 목록
                filteredSchedules.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredSchedules.map(item => (
                            <ScheduleItemRow key={item.id} item={item} onDeleted={fetchSchedules} setModal={setModal} />
                        ))}
                    </ul>
                ) : (
                    <div className="py-8 px-4 text-sm text-gray-400 italic text-center dark:text-gray-500">
                        {isCurrentView ? '오늘은 남은 수업이 없거나 시간표가 등록되지 않았습니다.' : '등록된 시간표가 없습니다.'}
                    </div>
                )
            ) : ( // 전체 시간표 그리드
                <div className="p-0">
                    <WeeklyScheduleGrid schedules={schedules} />
                </div>
            )}
            
            {/* 시간표 직접 등록 모달 */}
            {isFormOpen && (
                <ScheduleForm 
                    onClose={() => setIsFormOpen(false)} 
                    onSuccess={fetchSchedules} 
                    setGlobalModal={setModal} 
                />
            )}

            {/* 이미지 등록 모달 (임시 컴포넌트) */}
            {isImageFormOpen && (
                <SimpleModal
                    title="이미지 등록 (시뮬레이션)"
                    message="이미지 파일을 통한 시간표 등록 기능입니다. 현재는 시뮬레이션 모드입니다."
                    onClose={() => setIsImageFormOpen(false)}
                />
            )}

            {/* Modal Rendering (SimpleModal) */}
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