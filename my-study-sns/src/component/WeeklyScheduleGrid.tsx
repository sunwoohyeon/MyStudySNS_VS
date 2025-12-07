// src/component/WeeklyScheduleGrid.tsx
"use client";

import React from 'react';
import { FaTrashAlt, FaEdit } from 'react-icons/fa';
import { ScheduleItem } from './ScheduleWidget';

interface WeeklyScheduleGridProps {
    schedules: ScheduleItem[];
    onDeleteSchedule?: (item: ScheduleItem) => void;
    onEditSchedule?: (item: ScheduleItem) => void;
}

// 토, 일요일을 제외한 주중 요일
const WEEKDAYS = ['월', '화', '수', '목', '금']; 
const START_HOUR = 9; // 시작 시간 (9시)
const END_HOUR = 20; // 종료 시간 (20시)
const HOUR_HEIGHT = 80; // 1시간당 픽셀 높이

const WeeklyScheduleGrid: React.FC<WeeklyScheduleGridProps> = ({ schedules, onDeleteSchedule, onEditSchedule }) => {
    // 9, 10, ..., 20
    const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

    // start_time 문자열 "HH:MM" -> 시간 숫자
    const getHour = (time: string) => parseInt(time.split(':')[0], 10);
    // start_time 문자열 "HH:MM" -> 분 숫자
    const getMinute = (time: string) => parseInt(time.split(':')[1], 10);

    // 일정의 높이와 시작 위치(top)를 계산하는 함수 (분 단위)
    const calculateEventStyle = (start: string, end: string) => {
        const startHour = getHour(start);
        const startMinute = getMinute(start);
        const endHour = getHour(end);
        const endMinute = getMinute(end);

        // 그리드 시작 시간 (START_HOUR) 대비 시작 분
        const offsetMinutes = (startHour * 60 + startMinute) - (START_HOUR * 60);

        // 해당 hour div 내부에서 top 위치 계산
        // hour가 일치할 때만 이벤트가 렌더링되므로, startHour 대신 현재 hour를 사용해야 함
        const topOffset = startMinute / 60 * HOUR_HEIGHT; 
        
        // 이벤트 길이 (분)
        const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
        const height = durationMinutes / 60 * HOUR_HEIGHT;

        return {
            top: `${topOffset}px`,
            height: `${height}px`,
        };
    };

    return (
        // ********** [수정] 전체 배경 및 경계선 **********
        <div className="relative border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-6 border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <div className="p-1"></div> {/* 왼쪽 상단 빈칸 */}
                {WEEKDAYS.map(day => (
                    // ********** [수정] 헤더 텍스트 색상 **********
                    <div 
                        key={day} 
                        className="p-2 text-center font-semibold text-gray-800 dark:text-gray-200 border-l border-gray-300 dark:border-gray-700"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* 시간 칸 + 일정 */}
            <div className="relative">
                {hours.map(hour => (
                    <div
                        key={hour}
                        // ********** [수정] 행 경계선 및 배경 **********
                        className="grid grid-cols-6 border-b border-gray-300 dark:border-gray-700 relative last:border-b-0"
                        style={{ height: `${HOUR_HEIGHT}px` }}
                    >
                        {/* 시간 라벨 (첫 번째 컬럼) */}
                        <div className="relative bg-gray-50 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700">
                            {/* ********** [수정] 시간 텍스트 색상 ********** */}
                            <span className="absolute top-1 right-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {hour}시
                            </span>
                        </div>

                        {/* 요일별 칸 (빈 셀) */}
                        {WEEKDAYS.map(day => (
                            // ********** [수정] 셀 경계선 **********
                            <div key={day} className="border-l border-gray-300 dark:border-gray-700 relative bg-white dark:bg-gray-900">
                                {/* 해당 시간대에 시작하는 일정 렌더링 */}
                                {schedules
                                    // 해당 요일 및 해당 시간(정시)에 시작하는 일정 필터링
                                    .filter(s => s.day_of_week === day && getHour(s.start_time) === hour)
                                    .map(s => {
                                        const eventStyle = calculateEventStyle(s.start_time, s.end_time);
                                        // 요일 인덱스를 기반으로 Z-index를 설정하여 겹침 방지 (선택 사항)
                                        const zIndex = WEEKDAYS.indexOf(s.day_of_week) + 10; 
                                        
                                        return (
                                            <div
                                                key={s.id}
                                                className="absolute left-0 right-0 rounded-md p-1.5 text-xs text-white shadow-md group cursor-pointer hover:brightness-110 transition-all"
                                                style={{
                                                    ...eventStyle,
                                                    backgroundColor: '#10B981',
                                                    zIndex: zIndex,
                                                    margin: '0 2px',
                                                    overflow: 'hidden',
                                                }}
                                                title={`${s.title}${s.location ? ` (${s.location})` : ''}\n${s.start_time} ~ ${s.end_time}\n클릭하여 수정`}
                                                onClick={() => onEditSchedule?.(s)}
                                            >
                                                {/* 수정/삭제 버튼 */}
                                                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {onEditSchedule && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onEditSchedule(s);
                                                            }}
                                                            className="p-1 rounded bg-blue-500 hover:bg-blue-600 text-white"
                                                            aria-label="수정"
                                                        >
                                                            <FaEdit className="w-2.5 h-2.5" />
                                                        </button>
                                                    )}
                                                    {onDeleteSchedule && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteSchedule(s);
                                                            }}
                                                            className="p-1 rounded bg-red-500 hover:bg-red-600 text-white"
                                                            aria-label="삭제"
                                                        >
                                                            <FaTrashAlt className="w-2.5 h-2.5" />
                                                        </button>
                                                    )}
                                                </div>
                                                <span className="font-semibold block leading-tight" style={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    wordBreak: 'break-all',
                                                    fontSize: '11px',
                                                }}>{s.title}</span>
                                                <span className="text-white text-opacity-90 block text-[10px] mt-0.5">
                                                    {s.start_time.slice(0, 5)} ~ {s.end_time.slice(0, 5)}
                                                </span>
                                                {s.location && (
                                                    <span className="text-white text-opacity-70 block text-[9px] leading-tight" style={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 1,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                    }}>{s.location}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeeklyScheduleGrid;