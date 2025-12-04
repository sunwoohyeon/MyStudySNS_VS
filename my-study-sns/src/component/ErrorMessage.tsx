// src/component/ErrorMessage.tsx
"use client";

import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export default function ErrorMessage({
  title = '오류가 발생했습니다',
  message,
  onRetry,
  fullScreen = false
}: ErrorMessageProps) {
  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center'
    : 'flex flex-col items-center justify-center py-12';

  return (
    <div className={containerClasses}>
      <div className="text-center px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
          <FiAlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <FiRefreshCw className="w-4 h-4" />
            다시 시도
          </button>
        )}
      </div>
    </div>
  );
}
