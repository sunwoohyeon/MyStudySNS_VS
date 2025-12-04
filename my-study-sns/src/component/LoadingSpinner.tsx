// src/component/LoadingSpinner.tsx
"use client";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = 'md',
  text = '로딩 중...',
  fullScreen = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center'
    : 'flex flex-col items-center justify-center py-12';

  return (
    <div className={containerClasses}>
      <div className="flex gap-1.5">
        <div
          className={`${sizeClasses[size]} bg-blue-500 rounded-full animate-bounce`}
          style={{ animationDelay: '0s' }}
        />
        <div
          className={`${sizeClasses[size]} bg-blue-500 rounded-full animate-bounce`}
          style={{ animationDelay: '0.1s' }}
        />
        <div
          className={`${sizeClasses[size]} bg-blue-500 rounded-full animate-bounce`}
          style={{ animationDelay: '0.2s' }}
        />
      </div>
      {text && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{text}</p>
      )}
    </div>
  );
}
