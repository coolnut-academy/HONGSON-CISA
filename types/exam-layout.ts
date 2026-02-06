// ระบบ Theme และ Layout สำหรับหน้าสอบ
// ออกแบบให้ Super Admin ปรับแต่งได้

export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'dark';
export type LayoutMode = 'split' | 'single' | 'focus';
export type StimulusPosition = 'left' | 'top' | 'floating';

export interface ExamTheme {
  // สีหลัก
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  textMutedColor: string;
  accentColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  
  // โทนสีที่เลือกได้
  colorScheme: ColorScheme;
}

export interface ExamTypography {
  // ขนาดตัวอักษร (consistent ทั้งระบบ)
  baseSize: FontSize;
  stimulusSize: FontSize;      // ข้อความสถานการณ์
  questionSize: FontSize;      // คำถาม
  choiceSize: FontSize;        // ตัวเลือก
  answerSize: FontSize;        // ช่องตอบ
  
  // การจัดวาง
  lineHeight: 'compact' | 'normal' | 'relaxed';
  questionSpacing: 'compact' | 'normal' | 'spacious';
}

export interface ExamLayout {
  // โหมดการแสดงผล
  mode: LayoutMode;
  
  // ตำแหน่ง Stimulus
  stimulusPosition: StimulusPosition;
  
  // สัดส่วนหน้าจอ (สำหรับ split mode)
  stimulusRatio: number;  // 30-50%
  
  // การแสดงผล
  showProgressBar: boolean;
  showTimer: boolean;
  showQuestionNavigator: boolean;
  showCompetencyBadge: boolean;
  
  // การตอบคำถาม
  autoAdvance: boolean;        // ตอบเสร็จ auto ไปข้อต่อไป
  allowSkip: boolean;          // อนุญาตข้ามข้อ
  showAnswerStatus: boolean;   // แสดงสถานะตอบ/ไม่ตอบ
}

export interface ExamBehavior {
  // พฤติกรรมการสอบ
  fullscreenRequired: boolean;
  preventCopyPaste: boolean;
  autoSaveInterval: number;    // วินาที
  warningBeforeTimeUp: number; // นาที
  
  // การนำทาง
  allowBackNavigation: boolean;
  showQuestionList: boolean;
  jumpToUnanswered: boolean;   // กระโดดไปข้อที่ยังไม่ตอบ
}

export interface ExamLayoutConfig {
  id?: string;
  name: string;                    // ชื่อ theme เช่น "PISA Standard", "Minimal", "High Contrast"
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  
  theme: ExamTheme;
  typography: ExamTypography;
  layout: ExamLayout;
  behavior: ExamBehavior;
  
  createdBy: string;
  createdAt: any;
  updatedAt?: any;
}

// Preset themes ที่เตรียมไว้ให้เลือก
export const EXAM_PRESETS: ExamLayoutConfig[] = [
  {
    name: "PISA Standard",
    description: "ธีมมาตรฐานสำหรับการสอบ PISA - สบายตา เน้นการอ่าน",
    isDefault: true,
    isActive: true,
    theme: {
      colorScheme: 'blue',
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      backgroundColor: '#f8fafc',
      surfaceColor: '#ffffff',
      textColor: '#1e293b',
      textMutedColor: '#64748b',
      accentColor: '#3b82f6',
      successColor: '#10b981',
      warningColor: '#f59e0b',
      errorColor: '#ef4444',
    },
    typography: {
      baseSize: 'medium',
      stimulusSize: 'large',
      questionSize: 'medium',
      choiceSize: 'medium',
      answerSize: 'medium',
      lineHeight: 'relaxed',
      questionSpacing: 'normal',
    },
    layout: {
      mode: 'split',
      stimulusPosition: 'left',
      stimulusRatio: 45,
      showProgressBar: true,
      showTimer: true,
      showQuestionNavigator: true,
      showCompetencyBadge: true,
      autoAdvance: false,
      allowSkip: true,
      showAnswerStatus: true,
    },
    behavior: {
      fullscreenRequired: false,
      preventCopyPaste: false,
      autoSaveInterval: 60,
      warningBeforeTimeUp: 5,
      allowBackNavigation: true,
      showQuestionList: true,
      jumpToUnanswered: false,
    },
    createdBy: 'system',
    createdAt: null,
  },
  {
    name: "Focus Mode",
    description: "โฟกัสที่คำถาม - ไม่มีสิ่งรบกวน",
    isDefault: false,
    isActive: true,
    theme: {
      colorScheme: 'dark',
      primaryColor: '#60a5fa',
      secondaryColor: '#94a3b8',
      backgroundColor: '#0f172a',
      surfaceColor: '#1e293b',
      textColor: '#f1f5f9',
      textMutedColor: '#94a3b8',
      accentColor: '#60a5fa',
      successColor: '#34d399',
      warningColor: '#fbbf24',
      errorColor: '#f87171',
    },
    typography: {
      baseSize: 'large',
      stimulusSize: 'large',
      questionSize: 'large',
      choiceSize: 'large',
      answerSize: 'large',
      lineHeight: 'relaxed',
      questionSpacing: 'spacious',
    },
    layout: {
      mode: 'focus',
      stimulusPosition: 'floating',
      stimulusRatio: 40,
      showProgressBar: false,
      showTimer: true,
      showQuestionNavigator: false,
      showCompetencyBadge: false,
      autoAdvance: false,
      allowSkip: true,
      showAnswerStatus: false,
    },
    behavior: {
      fullscreenRequired: true,
      preventCopyPaste: true,
      autoSaveInterval: 30,
      warningBeforeTimeUp: 10,
      allowBackNavigation: true,
      showQuestionList: false,
      jumpToUnanswered: true,
    },
    createdBy: 'system',
    createdAt: null,
  },
  {
    name: "High Contrast",
    description: "สำหรับผู้มีปัญหาทางสายตา - คอนทราสต์สูง",
    isDefault: false,
    isActive: true,
    theme: {
      colorScheme: 'dark',
      primaryColor: '#ffff00',
      secondaryColor: '#ffffff',
      backgroundColor: '#000000',
      surfaceColor: '#1a1a1a',
      textColor: '#ffffff',
      textMutedColor: '#cccccc',
      accentColor: '#ffff00',
      successColor: '#00ff00',
      warningColor: '#ffaa00',
      errorColor: '#ff0000',
    },
    typography: {
      baseSize: 'xlarge',
      stimulusSize: 'xlarge',
      questionSize: 'xlarge',
      choiceSize: 'xlarge',
      answerSize: 'xlarge',
      lineHeight: 'relaxed',
      questionSpacing: 'spacious',
    },
    layout: {
      mode: 'single',
      stimulusPosition: 'top',
      stimulusRatio: 100,
      showProgressBar: true,
      showTimer: true,
      showQuestionNavigator: true,
      showCompetencyBadge: false,
      autoAdvance: false,
      allowSkip: true,
      showAnswerStatus: true,
    },
    behavior: {
      fullscreenRequired: false,
      preventCopyPaste: false,
      autoSaveInterval: 60,
      warningBeforeTimeUp: 5,
      allowBackNavigation: true,
      showQuestionList: true,
      jumpToUnanswered: false,
    },
    createdBy: 'system',
    createdAt: null,
  },
];

// Helper functions
export function getFontSizeValue(size: FontSize): string {
  const sizes = {
    small: '0.875rem',    // 14px
    medium: '1rem',       // 16px
    large: '1.125rem',    // 18px
    xlarge: '1.25rem',    // 20px
  };
  return sizes[size];
}

export function getLineHeightValue(lineHeight: ExamTypography['lineHeight']): string {
  const heights = {
    compact: '1.4',
    normal: '1.6',
    relaxed: '1.8',
  };
  return heights[lineHeight];
}

export function getSpacingValue(spacing: ExamTypography['questionSpacing']): string {
  const spacings = {
    compact: '0.75rem',
    normal: '1rem',
    spacious: '1.5rem',
  };
  return spacings[spacing];
}
