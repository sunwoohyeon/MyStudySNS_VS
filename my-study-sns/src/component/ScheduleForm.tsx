// src/component/ScheduleForm.tsx
"use client";

import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ScheduleItem } from './ScheduleWidget';

interface ScheduleFormProps {
  onClose: () => void;
  onSuccess: () => void;
  setGlobalModal: React.Dispatch<React.SetStateAction<{
    type: 'none' | 'message' | 'confirmDelete';
    title: string;
    message: string;
    onConfirm?: () => void;
    isError?: boolean;
  }>>;
}

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function ScheduleForm({ onClose, onSuccess, setGlobalModal }: ScheduleFormProps) {
  const supabase = createClientComponentClient();

  const [formData, setFormData] = useState<Omit<ScheduleItem, 'id' | 'user_id'>>({
    day_of_week: '월',
    start_time: '09:00',
    end_time: '10:00',
    title: '',
    location: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.title.trim()) {
      setGlobalModal({
        type: 'message',
        title: '입력 오류',
        message: '수업 제목을 입력해주세요.',
        isError: true,
      });
      return;
    }

    if (formData.start_time >= formData.end_time) {
      setGlobalModal({
        type: 'message',
        title: '입력 오류',
        message: '종료 시간은 시작 시간보다 늦어야 합니다.',
        isError: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      // 현재 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setGlobalModal({
          type: 'message',
          title: '인증 오류',
          message: '로그인이 필요합니다.',
          isError: true,
        });
        return;
      }

      // DB에 시간표 등록
      const { error } = await supabase
        .from('schedules')
        .insert({
          user_id: user.id,
          day_of_week: formData.day_of_week,
          start_time: formData.start_time,
          end_time: formData.end_time,
          title: formData.title.trim(),
          location: formData.location?.trim() || null,
        });

      if (error) throw error;

      onClose();
      onSuccess();

      setGlobalModal({
        type: 'message',
        title: '등록 완료',
        message: '새로운 시간표가 등록되었습니다.',
      });

    } catch (err: unknown) {
      console.error('시간표 등록 에러:', err);
      setGlobalModal({
        type: 'message',
        title: '등록 실패',
        message: '시간표 등록 중 오류가 발생했습니다.',
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">시간표 등록</h3>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 수업 제목 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              수업 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="예: 자료구조론"
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm p-2"
            />
          </div>

          {/* 요일 선택 */}
          <div>
            <label htmlFor="day_of_week" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              요일 <span className="text-red-500">*</span>
            </label>
            <select
              name="day_of_week"
              id="day_of_week"
              value={formData.day_of_week as string}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm p-2"
            >
              {DAYS.map(day => (
                <option key={day} value={day}>{day}요일</option>
              ))}
            </select>
          </div>

          {/* 시간 입력 */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                시작 시간 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="start_time"
                id="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm p-2"
              />
            </div>

            <div className="flex-1">
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                종료 시간 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="end_time"
                id="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm p-2"
              />
            </div>
          </div>

          {/* 장소 입력 */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              장소 (선택)
            </label>
            <input
              type="text"
              name="location"
              id="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="예: 공학관 301호"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm p-2"
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
              {isLoading ? '등록 중...' : '시간표 등록'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
