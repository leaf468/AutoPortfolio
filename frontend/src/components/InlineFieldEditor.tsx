import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ExclamationCircleIcon,
    CheckCircleIcon,
    PencilIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

interface InlineFieldEditorProps {
    fieldName: string;
    placeholder: string;
    value?: string;
    required?: boolean;
    onSave: (value: string) => void;
    onCancel?: () => void;
    className?: string;
}

const InlineFieldEditor: React.FC<InlineFieldEditorProps> = ({
    fieldName,
    placeholder,
    value: initialValue = '',
    required = false,
    onSave,
    onCancel,
    className = ''
}) => {
    const [isEditing, setIsEditing] = useState(!initialValue);
    const [value, setValue] = useState(initialValue);
    const [error, setError] = useState('');

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const handleSave = () => {
        if (required && !value.trim()) {
            setError('이 필드는 필수입니다');
            return;
        }
        
        onSave(value);
        setIsEditing(false);
        setError('');
    };

    const handleCancel = () => {
        setValue(initialValue);
        setIsEditing(false);
        setError('');
        onCancel?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    return (
        <div className={`inline-field-editor ${className}`}>
            <AnimatePresence mode="wait">
                {isEditing ? (
                    <motion.div
                        key="editing"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="inline-block"
                    >
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => {
                                        setValue(e.target.value);
                                        setError('');
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder={placeholder}
                                    className={`px-3 py-1 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                        error ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    autoFocus
                                />
                                {error && (
                                    <p className="absolute top-full mt-1 text-xs text-red-500 whitespace-nowrap">
                                        {error}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={handleSave}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="저장"
                            >
                                <CheckCircleIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleCancel}
                                className="p-1 text-gray-500 hover:bg-gray-50 rounded"
                                title="취소"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="display"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="inline-flex items-center gap-1"
                    >
                        {value ? (
                            <>
                                <span className="text-sm font-medium text-gray-900 underline decoration-dotted">
                                    {value}
                                </span>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-0.5 text-gray-500 hover:text-purple-600"
                                    title="편집"
                                >
                                    <PencilIcon className="w-3 h-3" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition-colors"
                            >
                                <ExclamationCircleIcon className="w-3 h-3" />
                                {fieldName}
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// 텍스트 내 플레이스홀더를 인라인 에디터로 대체하는 컴포넌트
interface SmartTextWithFieldsProps {
    text: string;
    requiredFields: string[];
    onFieldUpdate: (field: string, value: string) => void;
    fieldValues?: Record<string, string>;
}

export const SmartTextWithFields: React.FC<SmartTextWithFieldsProps> = ({
    text,
    requiredFields,
    onFieldUpdate,
    fieldValues = {}
}) => {
    // 텍스트에서 {placeholder} 패턴 찾기
    const renderTextWithFields = () => {
        const placeholderPattern = /\{([^}]+)\}/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = placeholderPattern.exec(text)) !== null) {
            // 플레이스홀더 이전 텍스트
            if (match.index > lastIndex) {
                parts.push(
                    <span key={`text-${lastIndex}`}>
                        {text.substring(lastIndex, match.index)}
                    </span>
                );
            }

            // 플레이스홀더를 인라인 에디터로 대체
            const fieldName = match[1];
            parts.push(
                <InlineFieldEditor
                    key={`field-${match.index}`}
                    fieldName={fieldName}
                    placeholder={fieldName}
                    value={fieldValues[fieldName]}
                    required={requiredFields.includes(fieldName)}
                    onSave={(value) => onFieldUpdate(fieldName, value)}
                    className="mx-1"
                />
            );

            lastIndex = match.index + match[0].length;
        }

        // 마지막 남은 텍스트
        if (lastIndex < text.length) {
            parts.push(
                <span key={`text-${lastIndex}`}>
                    {text.substring(lastIndex)}
                </span>
            );
        }

        return parts;
    };

    return <div className="smart-text-with-fields">{renderTextWithFields()}</div>;
};

export default InlineFieldEditor;