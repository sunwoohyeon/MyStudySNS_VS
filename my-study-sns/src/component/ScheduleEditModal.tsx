"use client";

import React, { useState } from 'react';
import { ScheduleItem } from './ScheduleWidget';

interface ScheduleEditModalProps {
  schedule: ScheduleItem;
  onClose: () => void;
  onSave: (updated: ScheduleItem) => void;
}

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function ScheduleEditModal({ schedule, onClose, onSave }: ScheduleEditModalProps) {
  // HH:MM:SS 형식을 HH:MM으로 변환하는 함수
const formatTimeToHHMM = (time: string) => time.slice(0, 5);

const [formData, setFormData] = useState({
    title: schedule.title,
    day_of_week: schedule.day_of_week,
    start_time: formatTimeToHHMM(schedule.start_time),
    end_time: formatTimeToHHMM(schedule.end_time),
    location: schedule.location || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 유효성 검사
    if (!formData.title.trim()) {
      setError('수업 제목을 입력해주세요.');
      return;
    }

    if (formData.start_time >= formData.end_time) {
      setError('종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/schedule/${schedule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          day_of_week: formData.day_of_week,
          start_time: formData.start_time,
          end_time: formData.end_time,
          location: formData.location?.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '수정에 실패했습니다.');
      }

      onSave(data.schedule);
      onClose();
    } catch (err: unknown) {
      console.error('시간표 수정 에러:', err);
      setError(err instanceof Error ? err.message : '시간표 수정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">시간표 수정</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 수업 제목 */}
          <div>
            <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              수업 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              id="edit-title"
              value={formData.title}
              onChange={handleChange}
              placeholder="예: 자료구조론"
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm p-2 border"
            />
          </div>

          {/* 요일 선택 */}
          <div>
            <label htmlFor="edit-day_of_week" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              요일 <span className="text-red-500">*</span>
            </label>
            <select
              name="day_of_week"
              id="edit-day_of_week"
              value={formData.day_of_week}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm p-2 border"
            >
              {DAYS.map(day => (
                <option key={day} value={day}>{day}요일</option>
              ))}
            </select>
          </div>

          {/* 시간 입력 */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="edit-start_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                시작 시간 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="start_time"
                id="edit-start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm p-2 border"
              />
            </div>

            <div className="flex-1">
              <label htmlFor="edit-end_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                종료 시간 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="end_time"
                id="edit-end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm p-2 border"
              />
            </div>
          </div>

          {/* 장소 입력 */}
          <div>
            <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              장소 (선택)
            </label>
            <input
              type="text"
              name="location"
              id="edit-location"
              value={formData.location}
              onChange={handleChange}
              placeholder="예: 공학관 301호"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm p-2 border"
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-10 px-4 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition flex items-center justify-center leading-none disabled:opacity-50"
            >
              취소
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="h-10 px-4 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center leading-none"
            >
              {isLoading ? '저장 중...' : '저장'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
