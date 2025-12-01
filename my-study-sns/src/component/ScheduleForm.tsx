// src/component/ScheduleForm.tsx (최종 수정)
"use client";

import React, { useState } from 'react';
import { ScheduleItem } from './ScheduleWidget';

interface ScheduleFormProps {
  onClose: () => void;
  onSuccess: () => void; 
  setGlobalModal: React.Dispatch<any>;
}

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function ScheduleForm({ onClose, onSuccess, setGlobalModal }: ScheduleFormProps) {
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
    setIsLoading(true);

    try {
      // 등록 성공 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 500));

      onSuccess();
      onClose();

      setGlobalModal({
        type: 'message',
        title: '등록 성공 (시뮬레이션)',
        message: '새로운 시간표가 등록되었습니다. (백엔드 통신은 비활성화)',
      });

    } catch (err: any) {
      console.error(err);
      setGlobalModal({
        type: 'message',
        title: '등록 실패',
        message: '등록 중 오류가 발생했습니다. (시뮬레이션)',
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">시간표 등록</h3>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 수업 제목 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              수업 제목
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm p-2"
            />
          </div>

          {/* 요일 선택 */}
          <div>
            <label htmlFor="day_of_week" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              요일
            </label>
            <select
              name="day_of_week"
              id="day_of_week"
              value={formData.day_of_week as string}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm p-2"
            >
              {DAYS.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          {/* 시간 입력 */}
          <div className="flex gap-4">
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                시작 시간
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

            <div>
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                종료 시간
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
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm p-2"
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition flex items-center justify-center leading-none"
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
