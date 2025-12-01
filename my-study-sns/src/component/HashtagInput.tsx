import React, { useState, KeyboardEvent } from 'react';
import { FiX } from 'react-icons/fi';

interface Props {
    tags: string[];
    setTags: (tags: string[]) => void;
}

export default function HashtagInput({ tags, setTags }: Props) {
    const [input, setInput] = useState('');

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            addTag();
        } else if (e.key === 'Backspace' && !input && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    const addTag = () => {
        const trimmedInput = input.trim().replace(/^#/, ''); // # 제거
        if (trimmedInput && !tags.includes(trimmedInput)) {
            setTags([...tags, trimmedInput]);
            setInput('');
        }
    };

    const removeTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    return (
        <div className="flex flex-wrap items-center gap-2 p-2 border rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500">
            {tags.map((tag, index) => (
                <span key={index} className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 bg-blue-100 rounded-lg dark:bg-blue-900/30 dark:text-blue-300">
                    #{tag}
                    <button onClick={() => removeTag(index)} className="hover:text-blue-800 dark:hover:text-blue-100">
                        <FiX size={14} />
                    </button>
                </span>
            ))}
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={addTag}
                placeholder={tags.length === 0 ? "태그 입력 (Enter로 추가)" : ""}
                className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400"
            />
        </div>
    );
}
