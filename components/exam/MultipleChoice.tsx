"use client";

import { useState } from "react";
import { ChoiceOption } from "@/types";
import { Check } from "lucide-react";

interface MultipleChoiceProps {
    options: ChoiceOption[];
    selectedOptionId?: string;
    onChange: (optionId: string) => void;
    disabled?: boolean;
    fontSize?: number;
}

export default function MultipleChoice({
    options,
    selectedOptionId,
    onChange,
    disabled = false,
    fontSize = 16
}: MultipleChoiceProps) {
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

    const handleImageError = (optionId: string) => {
        setImageErrors(prev => new Set(prev).add(optionId));
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
                            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            ${isSelected 
                                ? 'bg-indigo-50 border-indigo-500 shadow-md ring-1 ring-indigo-500' 
                                : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                            }
                        `}
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        {/* Selection Circle */}
                        <div
                            className={`
                                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                                border-2 transition-all duration-200
                                ${isSelected 
                                    ? 'border-indigo-600 bg-indigo-600 text-white' 
                                    : 'border-slate-300 bg-white'
                                }
                            `}
                        >
                            {isSelected ? (
                                <Check className="w-5 h-5" />
                            ) : (
                                <span className="text-sm font-semibold text-slate-500">
                                    {letter}
                                </span>
                            )}
                        </div>

                        {/* Content - Image or Text */}
                        {hasImage ? (
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200">
                                    <img
                                        src={option.imageUrl}
                                        alt={option.text}
                                        className="w-full h-full object-contain"
                                        onError={() => handleImageError(option.id)}
                                    />
                                </div>
                                <span className="flex-1 text-slate-800">
                                    {option.text}
                                </span>
                            </div>
                        ) : (
                            <span className="flex-1 text-slate-800 leading-relaxed">
                                {option.text}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
