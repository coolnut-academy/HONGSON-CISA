"use client";

import { ChoiceOption } from "@/types";
import { CheckCircle2, Circle } from "lucide-react";

interface ChecklistProps {
    options: ChoiceOption[];
    selectedOptionIds: string[];
    onChange: (optionIds: string[]) => void;
    disabled?: boolean;
    fontSize?: number;
}

export default function Checklist({
    options,
    selectedOptionIds = [],
    onChange,
    disabled = false,
    fontSize = 16
}: ChecklistProps) {
    const handleToggle = (optionId: string) => {
        if (disabled) return;

        const isSelected = selectedOptionIds.includes(optionId);
        if (isSelected) {
            onChange(selectedOptionIds.filter(id => id !== optionId));
        } else {
            onChange([...selectedOptionIds, optionId]);
        }
    };

    return (
        <div className="space-y-3">
            <p className="text-sm text-slate-500 mb-3">
                เลือกรายการที่ถูกต้องทั้งหมด:
            </p>

            {options.map((option) => {
                const isSelected = selectedOptionIds.includes(option.id);

                return (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => handleToggle(option.id)}
                        disabled={disabled}
                        className={`
                            w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                            ${isSelected
                                ? 'bg-teal-50 border-teal-500 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                            }
                            ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        {/* Checkbox */}
                        <div className="flex-shrink-0">
                            {isSelected ? (
                                <CheckCircle2 className="w-6 h-6 text-teal-600" />
                            ) : (
                                <Circle className="w-6 h-6 text-slate-400" />
                            )}
                        </div>

                        {/* Text */}
                        <p className={`flex-1 leading-relaxed ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                            {option.text}
                        </p>
                    </button>
                );
            })}

            {/* Selected count */}
            <div className="text-right text-sm text-slate-500 mt-3">
                เลือกแล้ว {selectedOptionIds.length} รายการ
            </div>
        </div>
    );
}
