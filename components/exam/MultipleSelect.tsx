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
}

export default function MultipleSelect({
    options,
    selectedOptionIds = [],
    onChange,
    disabled = false,
    minSelect,
    maxSelect
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
                        className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left group ${isSelected
                                ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/20'
                                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                            } ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        {/* Checkbox */}
                        <div className="flex-shrink-0 pt-0.5">
                            {isSelected ? (
                                <CheckSquare className="w-6 h-6 text-emerald-400" />
                            ) : (
                                <Square className="w-6 h-6 text-slate-600 group-hover:text-slate-500" />
                            )}
                        </div>

                        {/* Option Letter */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${isSelected
                                ? 'bg-emerald-500/30 text-emerald-400'
                                : 'bg-slate-700/50 text-slate-500'
                            }`}>
                            {letter}
                        </div>

                        {/* Option Text */}
                        <div className="flex-1">
                            <p className={`text-base leading-relaxed ${isSelected ? 'text-white' : 'text-slate-300'
                                }`}>
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
