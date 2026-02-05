"use client";

import { useState } from "react";
import { MatchItem, MatchPair } from "@/types";
import { Link2, X, Check } from "lucide-react";

interface MatchingProps {
    leftColumn: MatchItem[];
    rightColumn: MatchPair[];
    matchingPairs: Record<string, string>; // leftItemId -> rightItemId
    onChange: (pairs: Record<string, string>) => void;
    disabled?: boolean;
}

export default function Matching({
    leftColumn,
    rightColumn,
    matchingPairs,
    onChange,
    disabled = false
}: MatchingProps) {
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

    // Get which right items are already matched
    const matchedRightIds = new Set(Object.values(matchingPairs));

    const handleLeftClick = (leftId: string) => {
        if (disabled) return;

        // If already matched, remove the match
        if (matchingPairs[leftId]) {
            const newPairs = { ...matchingPairs };
            delete newPairs[leftId];
            onChange(newPairs);
            return;
        }

        setSelectedLeft(leftId);
    };

    const handleRightClick = (rightId: string) => {
        if (disabled || !selectedLeft) return;

        // Check if this right item is already matched
        if (matchedRightIds.has(rightId)) {
            // Remove previous match to this right item
            const newPairs = { ...matchingPairs };
            Object.keys(newPairs).forEach(key => {
                if (newPairs[key] === rightId) {
                    delete newPairs[key];
                }
            });
            // Add new match
            newPairs[selectedLeft] = rightId;
            onChange(newPairs);
        } else {
            // Create new match
            const newPairs = { ...matchingPairs };
            newPairs[selectedLeft] = rightId;
            onChange(newPairs);
        }

        setSelectedLeft(null);
    };

    const getMatchedRight = (leftId: string) => {
        const rightId = matchingPairs[leftId];
        return rightColumn.find(r => r.id === rightId);
    };

    const getMatchedLeft = (rightId: string) => {
        const leftId = Object.keys(matchingPairs).find(key => matchingPairs[key] === rightId);
        return leftColumn.find(l => l.id === leftId);
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-400">
                คลิกที่รายการด้านซ้าย แล้วคลิกรายการด้านขวาเพื่อจับคู่
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">รายการ</h4>
                    {leftColumn.map((item, index) => {
                        const isMatched = !!matchingPairs[item.id];
                        const isSelected = selectedLeft === item.id;
                        const matchedRight = getMatchedRight(item.id);

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleLeftClick(item.id)}
                                disabled={disabled}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all group ${isSelected
                                    ? 'bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/20'
                                    : isMatched
                                        ? 'bg-emerald-500/5 border-emerald-500/50'
                                        : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                    } ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                            >
                                <div className="flex items-start gap-4">
                                    <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${isSelected || isMatched
                                            ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-indigo-400'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                        }`}>
                                        {index + 1}
                                    </span>

                                    <div className="flex-1 min-w-0">
                                        {item.imageUrl && (
                                            <div className="mb-3 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 bg-white dark:bg-black/20">
                                                <img
                                                    src={item.imageUrl}
                                                    alt="Item visual"
                                                    className="w-full h-32 object-contain"
                                                />
                                            </div>
                                        )}

                                        <p className="text-slate-700 dark:text-slate-200 text-sm font-medium pr-2">
                                            {item.text}
                                        </p>

                                        {matchedRight && (
                                            <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in zoom-in duration-200">
                                                <Link2 className="w-3.5 h-3.5" />
                                                <span className="font-medium truncate">คู่กับ: {matchedRight.text || 'รูปภาพ'}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-6 flex justify-center pt-1">
                                        {isMatched && (
                                            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">คำตอบ</h4>
                    {rightColumn.map((item, index) => {
                        const isMatched = matchedRightIds.has(item.id);
                        const matchedLeft = getMatchedLeft(item.id);
                        const canSelect = selectedLeft !== null;
                        const isTargetForSelected = canSelect && matchedLeft?.id === selectedLeft;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleRightClick(item.id)}
                                disabled={disabled || (!canSelect && !isMatched)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all relative overflow-hidden ${isMatched
                                    ? 'bg-emerald-500/5 border-emerald-500/50'
                                    : canSelect
                                        ? 'bg-white dark:bg-slate-800/50 border-indigo-300 dark:border-indigo-500/30 hover:border-indigo-500 hover:shadow-md cursor-pointer'
                                        : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-60'
                                    } ${(disabled) ? 'cursor-not-allowed opacity-70' : ''}`}
                            >
                                {canSelect && !isMatched && (
                                    <div className="absolute inset-0 bg-indigo-500/5 animate-pulse pointer-events-none" />
                                )}

                                <div className="flex items-start gap-4 relative z-10">
                                    <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${isMatched
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : canSelect
                                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                        }`}>
                                        {String.fromCharCode(65 + index)}
                                    </span>

                                    <div className="flex-1 min-w-0">
                                        {item.imageUrl && (
                                            <div className="mb-3 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 bg-white dark:bg-black/20">
                                                <img
                                                    src={item.imageUrl}
                                                    alt="Answer visual"
                                                    className="w-full h-32 object-contain"
                                                />
                                            </div>
                                        )}

                                        <p className="text-slate-700 dark:text-slate-200 text-sm font-medium pr-2">
                                            {item.text}
                                        </p>

                                        {matchedLeft && (
                                            <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400">
                                                <Link2 className="w-3.5 h-3.5" />
                                                <span className="font-medium">รายการที่ {leftColumn.findIndex(l => l.id === matchedLeft.id) + 1}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-6 flex justify-center pt-1">
                                        {isMatched && (
                                            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected indicator */}
            {selectedLeft && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                    <span className="text-sm text-indigo-300">
                        กำลังเลือก: {leftColumn.find(l => l.id === selectedLeft)?.text}
                    </span>
                    <button
                        type="button"
                        onClick={() => setSelectedLeft(null)}
                        className="p-1 rounded hover:bg-indigo-500/20"
                    >
                        <X className="w-4 h-4 text-indigo-400" />
                    </button>
                </div>
            )}

            {/* Progress */}
            <div className="text-right text-sm text-slate-500">
                จับคู่แล้ว {Object.keys(matchingPairs).length} / {leftColumn.length} รายการ
            </div>
        </div>
    );
}
