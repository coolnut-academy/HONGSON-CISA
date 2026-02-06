"use client";

import { useState, useEffect } from "react";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, setDoc, doc } from "firebase/firestore";
import { 
  ExamLayoutConfig, 
  EXAM_PRESETS, 
  ColorScheme,
  FontSize,
  LayoutMode,
  getFontSizeValue 
} from "@/types/exam-layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { 
  Palette, 
  Layout, 
  Type, 
  Settings, 
  Save, 
  Check,
  Eye,
  Monitor
} from "lucide-react";

export default function ExamThemesPage() {
  const { isLoading: isRoleLoading } = useRoleProtection(['super_admin']);
  const { user } = useAuth();
  
  const [themes, setThemes] = useState<ExamLayoutConfig[]>(EXAM_PRESETS);
  const [selectedTheme, setSelectedTheme] = useState<ExamLayoutConfig>(EXAM_PRESETS[0]);
  const [activeTab, setActiveTab] = useState<'theme' | 'typography' | 'layout' | 'behavior'>('theme');
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Load custom themes from Firestore
  useEffect(() => {
    const loadThemes = async () => {
      try {
        const themesQuery = query(collection(db, "exam_themes"));
        const themesSnap = await getDocs(themesQuery);
        const customThemes = themesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ExamLayoutConfig));
        
        setThemes([...EXAM_PRESETS, ...customThemes]);
      } catch (error) {
        console.error("Error loading themes:", error);
      }
    };
    
    if (!isRoleLoading) {
      loadThemes();
    }
  }, [isRoleLoading]);

  const handleSaveTheme = async () => {
    setIsSaving(true);
    try {
      const docId = selectedTheme.id || `theme_${Date.now()}`;
      await setDoc(doc(db, "exam_themes", docId), {
        ...selectedTheme,
        id: docId,
        updatedAt: new Date(),
        createdAt: selectedTheme.createdAt || new Date(),
      });
      
      alert("บันทึกธีมสำเร็จ!");
    } catch (error) {
      console.error("Error saving theme:", error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (theme: ExamLayoutConfig) => {
    try {
      // Update this theme as default
      const docId = theme.id || `theme_${Date.now()}`;
      await setDoc(doc(db, "exam_themes", docId), {
        ...theme,
        id: docId,
        isDefault: true,
        updatedAt: new Date(),
      });
      
      alert("ตั้งค่าธีมเริ่มต้นสำเร็จ! นักเรียนจะเห็นธีมนี้เมื่อเข้าสอบ");
    } catch (error) {
      console.error("Error setting default:", error);
      alert("เกิดข้อผิดพลาด");
    }
  };

  const updateTheme = (updates: Partial<ExamLayoutConfig>) => {
    setSelectedTheme(prev => ({ ...prev, ...updates }));
  };

  const updateTypography = (updates: Partial<ExamLayoutConfig['typography']>) => {
    setSelectedTheme(prev => ({
      ...prev,
      typography: { ...prev.typography, ...updates }
    }));
  };

  const updateLayout = (updates: Partial<ExamLayoutConfig['layout']>) => {
    setSelectedTheme(prev => ({
      ...prev,
      layout: { ...prev.layout, ...updates }
    }));
  };

  const updateBehavior = (updates: Partial<ExamLayoutConfig['behavior']>) => {
    setSelectedTheme(prev => ({
      ...prev,
      behavior: { ...prev.behavior, ...updates }
    }));
  };

  if (isRoleLoading) {
    return <div className="p-10 text-center">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">จัดการธีมการสอบ</h1>
          <p className="text-gray-500">ปรับแต่งหน้าตาและพฤติกรรมการสอบให้เหมาะสม</p>
        </div>
        <div className="flex gap-2">
          <GlassButton
            variant="outline"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? "ซ่อนตัวอย่าง" : "ดูตัวอย่าง"}
          </GlassButton>
          <GlassButton
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            onClick={handleSaveTheme}
            loading={isSaving}
          >
            บันทึกธีม
          </GlassButton>
        </div>
      </div>

      {/* Theme Selector */}
      <GlassCard>
        <h3 className="font-semibold mb-4">เลือกธีม</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {themes.map((theme) => (
            <button
              key={theme.id || theme.name}
              onClick={() => setSelectedTheme(theme)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedTheme.name === theme.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="font-medium">{theme.name}</span>
                {theme.isDefault && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    เริ่มต้น
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {theme.description}
              </p>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Preview Section */}
      {previewMode && (
        <GlassCard className="border-2 border-dashed border-blue-300">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            ตัวอย่างหน้าสอบ
          </h3>
          <div 
            className="rounded-xl p-6 min-h-[200px] border"
            style={{
              backgroundColor: selectedTheme.theme.backgroundColor,
              color: selectedTheme.theme.textColor,
              fontSize: getFontSizeValue(selectedTheme.typography.baseSize),
              borderColor: selectedTheme.theme.secondaryColor,
            }}
          >
            <div 
              className="p-4 rounded-lg mb-4 border"
              style={{
                backgroundColor: selectedTheme.theme.surfaceColor,
                borderColor: selectedTheme.theme.secondaryColor,
              }}
            >
              <h4 style={{ 
                fontSize: getFontSizeValue(selectedTheme.typography.stimulusSize),
                color: selectedTheme.theme.textColor,
                marginBottom: '0.5rem'
              }}>
                สถานการณ์ (Stimulus)
              </h4>
              <p style={{ color: selectedTheme.theme.textMutedColor }}>
                ตัวอย่างข้อความสถานการณ์ที่นักเรียนต้องอ่าน...
              </p>
            </div>
            <div>
              <h4 style={{ 
                fontSize: getFontSizeValue(selectedTheme.typography.questionSize),
                color: selectedTheme.theme.textColor,
                marginBottom: '1rem'
              }}>
                คำถาม (Question)
              </h4>
              <div className="mt-2 space-y-2">
                <div 
                  className="p-3 rounded-lg border flex items-center gap-3"
                  style={{
                    backgroundColor: selectedTheme.theme.surfaceColor,
                    borderColor: selectedTheme.theme.primaryColor,
                  }}
                >
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: selectedTheme.theme.primaryColor }}
                  >
                    A
                  </div>
                  <span>ตัวเลือกที่เลือก</span>
                </div>
                <div 
                  className="p-3 rounded-lg border flex items-center gap-3"
                  style={{
                    backgroundColor: selectedTheme.theme.surfaceColor,
                    borderColor: selectedTheme.theme.secondaryColor,
                  }}
                >
                  <div 
                    className="w-6 h-6 rounded-full border flex items-center justify-center text-sm"
                    style={{ 
                      borderColor: selectedTheme.theme.secondaryColor,
                      color: selectedTheme.theme.textMutedColor
                    }}
                  >
                    B
                  </div>
                  <span style={{ color: selectedTheme.theme.textMutedColor }}>ตัวเลือกอื่น</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Settings Tabs */}
      <GlassCard>
        <div className="flex gap-2 border-b mb-6 overflow-x-auto">
          {[
            { id: 'theme', label: 'สี', icon: Palette },
            { id: 'typography', label: 'ตัวอักษร', icon: Type },
            { id: 'layout', label: 'เค้าโครง', icon: Layout },
            { id: 'behavior', label: 'พฤติกรรม', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Theme Settings */}
        {activeTab === 'theme' && (
          <div className="space-y-6">
            <h3 className="font-semibold">เลือกโทนสี</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { id: 'blue', name: 'ฟ้า', primary: '#2563eb', bg: '#f8fafc' },
                { id: 'green', name: 'เขียว', primary: '#10b981', bg: '#f0fdf4' },
                { id: 'purple', name: 'ม่วง', primary: '#8b5cf6', bg: '#faf5ff' },
                { id: 'orange', name: 'ส้ม', primary: '#f59e0b', bg: '#fffbeb' },
                { id: 'dark', name: 'มืด', primary: '#60a5fa', bg: '#0f172a' },
              ].map((scheme) => (
                <button
                  key={scheme.id}
                  onClick={() => updateTheme({
                    theme: {
                      ...selectedTheme.theme,
                      colorScheme: scheme.id as ColorScheme,
                      primaryColor: scheme.primary,
                      backgroundColor: scheme.bg,
                    }
                  })}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    selectedTheme.theme.colorScheme === scheme.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: scheme.bg }}
                >
                  <div 
                    className="w-8 h-8 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: scheme.primary }}
                  />
                  <span style={{ color: scheme.id === 'dark' ? '#fff' : '#000' }}>
                    {scheme.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium mb-2">สีหลัก</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={selectedTheme.theme.primaryColor}
                    onChange={(e) => updateTheme({
                      theme: { ...selectedTheme.theme, primaryColor: e.target.value }
                    })}
                    className="w-12 h-10 rounded border"
                  />
                  <input
                    type="text"
                    value={selectedTheme.theme.primaryColor}
                    onChange={(e) => updateTheme({
                      theme: { ...selectedTheme.theme, primaryColor: e.target.value }
                    })}
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">สีพื้นหลัง</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={selectedTheme.theme.backgroundColor}
                    onChange={(e) => updateTheme({
                      theme: { ...selectedTheme.theme, backgroundColor: e.target.value }
                    })}
                    className="w-12 h-10 rounded border"
                  />
                  <input
                    type="text"
                    value={selectedTheme.theme.backgroundColor}
                    onChange={(e) => updateTheme({
                      theme: { ...selectedTheme.theme, backgroundColor: e.target.value }
                    })}
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Typography Settings */}
        {activeTab === 'typography' && (
          <div className="space-y-6">
            {[
              { key: 'baseSize', label: 'ขนาดพื้นฐาน' },
              { key: 'stimulusSize', label: 'ข้อความสถานการณ์' },
              { key: 'questionSize', label: 'คำถาม' },
              { key: 'choiceSize', label: 'ตัวเลือก' },
              { key: 'answerSize', label: 'ช่องตอบ' },
            ].map((item) => (
              <div key={item.key}>
                <label className="block text-sm font-medium mb-2">{item.label}</label>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large', 'xlarge'] as FontSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => updateTypography({ [item.key]: size })}
                      className={`flex-1 py-2 rounded-lg border transition-all ${
                        selectedTheme.typography[item.key as keyof typeof selectedTheme.typography] === size
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {size === 'small' && 'เล็ก'}
                      {size === 'medium' && 'กลาง'}
                      {size === 'large' && 'ใหญ่'}
                      {size === 'xlarge' && 'ใหญ่มาก'}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium mb-2">ระยะห่างระหว่างคำถาม</label>
              <div className="flex gap-2">
                {(['compact', 'normal', 'spacious'] as const).map((spacing) => (
                  <button
                    key={spacing}
                    onClick={() => updateTypography({ questionSpacing: spacing })}
                    className={`flex-1 py-2 rounded-lg border transition-all ${
                      selectedTheme.typography.questionSpacing === spacing
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {spacing === 'compact' && 'แน่น'}
                    {spacing === 'normal' && 'ปกติ'}
                    {spacing === 'spacious' && 'ห่าง'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Layout Settings */}
        {activeTab === 'layout' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">โหมดการแสดงผล</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'split', name: 'แบ่งสองฝั่ง', desc: 'สถานการณ์ซ้าย คำถามขวา' },
                  { id: 'single', name: 'แถวเดียว', desc: 'แสดงต่อกันแนวตั้ง' },
                  { id: 'focus', name: 'โฟกัส', desc: 'ซ่อนสิ่งรบกวน' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => updateLayout({ mode: mode.id as LayoutMode })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedTheme.layout.mode === mode.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{mode.name}</div>
                    <div className="text-sm text-gray-500">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                สัดส่วนสถานการณ์: {selectedTheme.layout.stimulusRatio}%
              </label>
              <input
                type="range"
                min="30"
                max="60"
                value={selectedTheme.layout.stimulusRatio}
                onChange={(e) => updateLayout({ stimulusRatio: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>คำถามเยอะ</span>
                <span>สถานการณ์เยอะ</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'showProgressBar', label: 'แสดงแถบความคืบหน้า' },
                { key: 'showTimer', label: 'แสดงนาฬิกาจับเวลา' },
                { key: 'showQuestionNavigator', label: 'แสดงตัวนำทางคำถาม' },
                { key: 'showCompetencyBadge', label: 'แสดงชื่อสมรรถนะ' },
                { key: 'showAnswerStatus', label: 'แสดงสถานะตอบ/ไม่ตอบ' },
                { key: 'allowSkip', label: 'อนุญาตข้ามคำถาม' },
              ].map((option) => (
                <label key={option.key} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedTheme.layout[option.key as keyof typeof selectedTheme.layout] as boolean}
                    onChange={(e) => updateLayout({ [option.key]: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Behavior Settings */}
        {activeTab === 'behavior' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'fullscreenRequired', label: 'บังคับเต็มจอ', desc: 'นักเรียนต้องอยู่ในโหมดเต็มจอตลอด' },
                { key: 'preventCopyPaste', label: 'ป้องกัน Copy/Paste', desc: 'ไม่ให้คัดลอกข้อความ' },
                { key: 'allowBackNavigation', label: 'อนุญาตย้อนกลับ', desc: 'สามารถกลับไปข้อก่อนหน้าได้' },
                { key: 'showQuestionList', label: 'แสดงรายการคำถาม', desc: 'แสดงรายการทั้งหมด' },
                { key: 'jumpToUnanswered', label: 'กระโดดไปข้อที่ยังไม่ตอบ', desc: 'พาไปข้อที่เหลืออัตโนมัติ' },
              ].map((option) => (
                <label key={option.key} className="flex items-start gap-3 p-4 rounded-xl border cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedTheme.behavior[option.key as keyof typeof selectedTheme.behavior] as boolean}
                    onChange={(e) => updateBehavior({ [option.key]: e.target.checked })}
                    className="w-5 h-5 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  บันทึกอัตโนมัติทุก {selectedTheme.behavior.autoSaveInterval} วินาที
                </label>
                <input
                  type="range"
                  min="30"
                  max="300"
                  step="30"
                  value={selectedTheme.behavior.autoSaveInterval}
                  onChange={(e) => updateBehavior({ autoSaveInterval: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-sm text-gray-500 mt-1">
                  ค่าที่เหมาะสม: 60 วินาที
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  เตือนก่อนหมดเวลา {selectedTheme.behavior.warningBeforeTimeUp} นาที
                </label>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={selectedTheme.behavior.warningBeforeTimeUp}
                  onChange={(e) => updateBehavior({ warningBeforeTimeUp: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-sm text-gray-500 mt-1">
                  ค่าที่เหมาะสม: 5 นาที
                </div>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Apply Theme Button */}
      <div className="flex gap-4">
        <GlassButton
          variant="primary"
          size="lg"
          className="flex-1"
          icon={<Check className="w-5 h-5" />}
          onClick={() => handleSetDefault(selectedTheme)}
        >
          ตั้งเป็นธีมเริ่มต้นสำหรับนักเรียน
        </GlassButton>
      </div>
    </div>
  );
}
