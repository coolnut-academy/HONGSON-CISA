"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useExamTheme } from "@/context/ExamThemeContext";
import { Exam, ExamItem, QuestionAnswer } from "@/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Menu,
  Flag,
  Save
} from "lucide-react";

interface ProfessionalExamLayoutProps {
  exam: Exam;
  answers: Record<string, QuestionAnswer>;
  currentItemIndex: number;
  examStartTime: Date | null;
  isSaving: boolean;
  isSubmitting: boolean;
  onAnswerChange: (itemId: string, answer: Partial<QuestionAnswer>) => void;
  onNavigate: (index: number) => void;
  onSubmit: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  children: React.ReactNode; // Question content
}

export const ProfessionalExamLayout: React.FC<ProfessionalExamLayoutProps> = ({
  exam,
  answers,
  currentItemIndex,
  examStartTime,
  isSaving,
  isSubmitting,
  onNavigate,
  onSubmit,
  onToggleFullscreen,
  isFullscreen,
  children,
}) => {
  const { currentTheme } = useExamTheme();
  const [showNavigator, setShowNavigator] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isWarning, setIsWarning] = useState(false);
  
  const theme = currentTheme;
  const items = exam.items || [];
  const currentItem = items[currentItemIndex];
  const totalItems = items.length;
  const progress = ((currentItemIndex + 1) / totalItems) * 100;
  
  // Calculate time remaining
  useEffect(() => {
    if (!examStartTime || !exam.timeLimit) return;
    
    const timeLimit = exam.timeLimit; // Store in local variable
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - examStartTime.getTime();
      const total = timeLimit * 60 * 1000;
      const remaining = Math.max(0, total - elapsed);
      
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      
      // Warning when 5 minutes left
      if (minutes <= 5 && !isWarning) {
        setIsWarning(true);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [examStartTime, exam.timeLimit, isWarning]);
  
  // Check if item is answered
  const isAnswered = useCallback((item: ExamItem) => {
    const answer = answers[item.id];
    if (!answer) return false;
    
    switch (item.questionType) {
      case 'multiple_choice':
        return !!answer.selectedOptionId;
      case 'multiple_select':
      case 'checklist':
        return (answer.selectedOptionIds?.length || 0) > 0;
      case 'drag_drop':
        return Object.keys(answer.dragDropPlacements || {}).length > 0;
      case 'matching':
        return Object.keys(answer.matchingPairs || {}).length > 0;
      default:
        return (answer.textAnswer?.trim().length || 0) > 0;
    }
  }, [answers]);
  
  // Count answered items
  const answeredCount = items.filter(isAnswered).length;
  
  // Theme-based classes
  const containerClass = `min-h-screen transition-all duration-300`;
  const headerClass = `sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-300`;
  
  return (
    <div 
      className={containerClass}
      style={{
        backgroundColor: 'var(--exam-background)',
        color: 'var(--exam-text)',
        fontSize: 'var(--exam-font-base)',
      }}
    >
      {/* Header */}
      <header 
        className={headerClass}
        style={{
          backgroundColor: 'var(--exam-surface)',
          borderColor: 'var(--exam-secondary)',
        }}
      >
        <div className="max-w-[1920px] mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Left: Logo & Exam Info */}
            <div className="flex items-center gap-4">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'var(--exam-primary)' }}
              >
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-semibold text-sm lg:text-base line-clamp-1">
                  {exam.title}
                </h1>
                <p className="text-xs opacity-70">
                  {exam.competency}
                </p>
              </div>
            </div>
            
            {/* Center: Progress & Timer */}
            <div className="flex items-center gap-4 lg:gap-6">
              {/* Progress */}
              <div className="hidden md:flex items-center gap-3">
                <div className="text-sm">
                  <span className="font-semibold" style={{ color: 'var(--exam-primary)' }}>
                    {currentItemIndex + 1}
                  </span>
                  <span className="opacity-50"> / {totalItems}</span>
                </div>
                <div className="w-32 lg:w-48 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${progress}%`,
                      backgroundColor: 'var(--exam-primary)'
                    }}
                  />
                </div>
              </div>
              
              {/* Timer */}
              {exam.timeLimit && (
                <div 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm lg:text-base ${
                    isWarning ? 'animate-pulse' : ''
                  }`}
                  style={{
                    backgroundColor: isWarning ? 'var(--exam-error)' : 'var(--exam-surface)',
                    color: isWarning ? 'white' : 'var(--exam-text)',
                    border: `1px solid ${isWarning ? 'var(--exam-error)' : 'var(--exam-secondary)'}`,
                  }}
                >
                  <Clock className="w-4 h-4" />
                  <span>{timeRemaining}</span>
                </div>
              )}
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Auto-save indicator */}
              {isSaving && (
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-xs opacity-70">
                  <Save className="w-3 h-3 animate-pulse" />
                  <span>กำลังบันทึก...</span>
                </div>
              )}
              
              {/* Question Navigator Toggle */}
              <button
                onClick={() => setShowNavigator(!showNavigator)}
                className="p-2 rounded-lg transition-colors hover:opacity-80"
                style={{ 
                  backgroundColor: showNavigator ? 'var(--exam-primary)' : 'transparent',
                  color: showNavigator ? 'white' : 'var(--exam-text)'
                }}
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Fullscreen */}
              <button
                onClick={onToggleFullscreen}
                className="p-2 rounded-lg transition-colors hover:opacity-80"
                style={{ color: 'var(--exam-text)' }}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress Bar (Mobile) */}
        <div className="md:hidden h-1 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full transition-all duration-300"
            style={{ 
              width: `${progress}%`,
              backgroundColor: 'var(--exam-primary)'
            }}
          />
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex max-w-[1920px] mx-auto">
        {/* Question Navigator Sidebar */}
        {showNavigator && (
          <aside 
            className="w-64 lg:w-72 flex-shrink-0 border-r overflow-y-auto"
            style={{
              backgroundColor: 'var(--exam-surface)',
              borderColor: 'var(--exam-secondary)',
              height: 'calc(100vh - 64px)',
            }}
          >
            <div className="p-4">
              <h3 className="font-semibold mb-3 text-sm opacity-70 uppercase tracking-wider">
                รายการคำถาม
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {items.map((item, index) => {
                  const answered = isAnswered(item);
                  const isCurrent = index === currentItemIndex;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(index)}
                      className={`
                        aspect-square rounded-lg flex items-center justify-center text-sm font-medium
                        transition-all duration-200
                        ${isCurrent ? 'ring-2 ring-[var(--exam-primary)]' : ''}
                        ${answered ? 'text-white' : ''}
                      `}
                      style={{
                        backgroundColor: isCurrent 
                          ? 'var(--exam-primary)'
                          : answered 
                            ? 'var(--exam-success)'
                            : 'var(--exam-background)',
                        color: isCurrent || answered ? 'white' : 'var(--exam-text)',
                      }}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              
              {/* Summary */}
              <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--exam-secondary)' }}>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="opacity-70">ตอบแล้ว</span>
                    <span className="font-semibold" style={{ color: 'var(--exam-success)' }}>
                      {answeredCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">ยังไม่ตอบ</span>
                    <span className="font-semibold" style={{ color: 'var(--exam-warning)' }}>
                      {totalItems - answeredCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
        
        {/* Question Content */}
        <main className="flex-1 overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
          {children}
        </main>
      </div>
      
      {/* Floating Navigation (Mobile) */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4 border-t md:hidden"
        style={{
          backgroundColor: 'var(--exam-surface)',
          borderColor: 'var(--exam-secondary)',
        }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate(Math.max(0, currentItemIndex - 1))}
            disabled={currentItemIndex === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-lg disabled:opacity-50"
            style={{ backgroundColor: 'var(--exam-background)' }}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>ก่อนหน้า</span>
          </button>
          
          <span className="text-sm font-medium">
            {currentItemIndex + 1} / {totalItems}
          </span>
          
          <button
            onClick={() => onNavigate(Math.min(totalItems - 1, currentItemIndex + 1))}
            disabled={currentItemIndex === totalItems - 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg disabled:opacity-50"
            style={{ 
              backgroundColor: currentItemIndex === totalItems - 1 
                ? 'var(--exam-success)' 
                : 'var(--exam-background)',
              color: currentItemIndex === totalItems - 1 ? 'white' : 'inherit'
            }}
          >
            <span>{currentItemIndex === totalItems - 1 ? 'ส่ง' : 'ถัดไป'}</span>
            {currentItemIndex === totalItems - 1 ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
