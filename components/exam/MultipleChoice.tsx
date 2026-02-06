"use client";

import { useState } from "react";
import { ChoiceOption } from "@/types";
import { Check, Image as ImageIcon } from "lucide-react";

interface MultipleChoiceProps {
    options: ChoiceOption[];
    selectedOptionId?: string;
    onChange: (optionId: string) => void;
    disabled?: boolean;
}

export default function MultipleChoice({
    options,
    selectedOptionId,
    onChange,
    disabled = false
}: MultipleChoiceProps) {
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

    const handleImageError = (optionId: string) => {
        setImageErrors(prev => new Set(prev).add(optionId));
    };

    const getOptionStyle = (optionId: string, hasImage: boolean) => {
        const isSelected = selectedOptionId === optionId;
        
        if (isSelected) {
            return {
                borderColor: 'var(--exam-primary)',
                backgroundColor: 'rgba(37, 99, 235, 0.05)',
                boxShadow: '0 0 0 1px var(--exam-primary)',
            };
        }
        
        return {
            borderColor: 'var(--exam-secondary)',
            backgroundColor: 'var(--exam-surface)',
        };
    };

    return (
        <div className="space-y-3">
            {options.map((option, index) => {
                const isSelected = selectedOptionId === option.id;
                const hasImage = !!option.imageUrl && !imageErrors.has(option.id);
                const letter = String.fromCharCode(65 + index); // A, B, C, D...

                return (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => !disabled && onChange(option.id)}
                        disabled={disabled}
                        className={`
                            w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left
                            hover:shadow-md
                            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[var(--exam-primary)]'}
                            ${isSelected ? 'ring-1 ring-[var(--exam-primary)]' : ''}
                        `}
                        style={getOptionStyle(option.id, hasImage)}
                    >
                        {/* Selection Circle */}
                        <div
                            className={`
                                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                                border-2 transition-all duration-200
                                ${isSelected 
                                    ? 'border-[var(--exam-primary)] bg-[var(--exam-primary)] text-white' 
                                    : 'border-[var(--exam-secondary)]'
                                }
                            `}
                        >
                            {isSelected ? (
                                <Check className="w-5 h-5" />
                            ) : (
                                <span 
                                    className="text-sm font-semibold"
                                    style={{ color: 'var(--exam-text-muted)' }}
                                >
                                    {letter}
                                </span>
                            )}
                        </div>

                        {/* Content - Image or Text */}
                        {hasImage ? (
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <img
                                        src={option.imageUrl}
                                        alt={option.text}
                                        className="w-full h-full object-contain"
                                        onError={() => handleImageError(option.id)}
                                    />
                                </div>
                                <span 
                                    className="flex-1"
                                    style={{ color: 'var(--exam-text)' }}
                                >
                                    {option.text}
                                </span>
                            </div>
                        ) : (
                            <span 
                                className="flex-1 text-base"
                                style={{ 
                                    color: 'var(--exam-text)',
                                    fontSize: 'var(--exam-font-choice)'
                                }}
                            >
                                {option.text}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
