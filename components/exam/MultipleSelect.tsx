"use client";

import { ChoiceOption } from "@/types";
import { Square, CheckSquare } from "lucide-react";

interface MultipleSelectProps {
    options: ChoiceOption[];
    selectedOptionIds: string[];
    onChange: (optionIds: string[]) => void;
    disabled?: boolean;
    minSelect?: number;
    maxSelect?: number;
    fontSize?: number;
}

export default function MultipleSelect({
    options,
    selectedOptionIds = [],
    onChange,
    disabled = false,
    minSelect,
    maxSelect,
    fontSize = 16
}: MultipleSelectProps) {
    const handleToggle = (optionId: string) => {
        if (disabled) return;

        const isSelected = selectedOptionIds.includes(optionId);
        let newSelected: string[];

        if (isSelected) {
            newSelected = selectedOptionIds.filter(id => id !== optionId);
        } else {
            // Check max limit
            if (maxSelect && selectedOptionIds.length >= maxSelect) {
                return;
            }
            newSelected = [...selectedOptionIds, optionId];
        }

        onChange(newSelected);
    };

    return (
        <div className="space-y-3">
            {/* Hint */}
            <p className="text-sm text-slate-500 mb-2">
                เลือกได้มากกว่า 1 ข้อ
                {minSelect && ` (ขั้นต่ำ ${minSelect} ข้อ)`}
                {maxSelect && ` (สูงสุด ${maxSelect} ข้อ)`}
            </p>

            {options.map((option, index) => {
                const isSelected = selectedOptionIds.includes(option.id);
                const letter = String.fromCharCode(65 + index);

                return (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => handleToggle(option.id)}
                        disabled={disabled}
                        className={`
                            w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left group
                            ${isSelected
                                ? 'bg-emerald-50 border-emerald-500 shadow-md'
                                : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                            }
                            ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        {/* Checkbox */}
                        <div className="flex-shrink-0 pt-0.5">
                            {isSelected ? (
                                <CheckSquare className="w-6 h-6 text-emerald-600" />
                            ) : (
                                <Square className="w-6 h-6 text-slate-400 group-hover:text-slate-500" />
                            )}
                        </div>

                        {/* Option Letter */}
                        <div className={`
                            flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all
                            ${isSelected
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }
                        `}>
                            {letter}
                        </div>

                        {/* Option Text */}
                        <div className="flex-1">
                            <p className={`leading-relaxed ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                                {option.text}
                            </p>
                        </div>
                    </button>
                );
            })}

            {/* Selected count */}
            <div className="text-right text-sm text-slate-500">
                เลือกแล้ว {selectedOptionIds.length} ข้อ
            </div>
        </div>
    );
}
