"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  ExamLayoutConfig, 
  ExamTheme, 
  ExamTypography, 
  ExamLayout, 
  ExamBehavior,
  EXAM_PRESETS,
  getFontSizeValue,
  getLineHeightValue,
  getSpacingValue 
} from "@/types/exam-layout";

interface ExamThemeContextType {
  // Current active theme
  currentTheme: ExamLayoutConfig | null;
  loading: boolean;
  
  // All available themes
  availableThemes: ExamLayoutConfig[];
  
  // Actions
  loadTheme: (themeId?: string) => Promise<void>;
  saveTheme: (theme: ExamLayoutConfig) => Promise<void>;
  applyTheme: (theme: ExamLayoutConfig) => void;
  
  // CSS Variables for current theme
  cssVariables: Record<string, string>;
}

const defaultTheme = EXAM_PRESETS[0];

const ExamThemeContext = createContext<ExamThemeContextType>({
  currentTheme: null,
  loading: true,
  availableThemes: EXAM_PRESETS,
  loadTheme: async () => {},
  saveTheme: async () => {},
  applyTheme: () => {},
  cssVariables: {},
});

export const ExamThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ExamLayoutConfig | null>(null);
  const [availableThemes, setAvailableThemes] = useState<ExamLayoutConfig[]>(EXAM_PRESETS);
  const [loading, setLoading] = useState(true);
  const [cssVariables, setCssVariables] = useState<Record<string, string>>({});

  // Generate CSS variables from theme
  const generateCSSVariables = (theme: ExamLayoutConfig): Record<string, string> => {
    const { theme: t, typography: tp, layout: l } = theme;
    
    return {
      // Colors
      '--exam-primary': t.primaryColor,
      '--exam-secondary': t.secondaryColor,
      '--exam-background': t.backgroundColor,
      '--exam-surface': t.surfaceColor,
      '--exam-text': t.textColor,
      '--exam-text-muted': t.textMutedColor,
      '--exam-accent': t.accentColor,
      '--exam-success': t.successColor,
      '--exam-warning': t.warningColor,
      '--exam-error': t.errorColor,
      
      // Typography
      '--exam-font-base': getFontSizeValue(tp.baseSize),
      '--exam-font-stimulus': getFontSizeValue(tp.stimulusSize),
      '--exam-font-question': getFontSizeValue(tp.questionSize),
      '--exam-font-choice': getFontSizeValue(tp.choiceSize),
      '--exam-font-answer': getFontSizeValue(tp.answerSize),
      '--exam-line-height': getLineHeightValue(tp.lineHeight),
      '--exam-spacing': getSpacingValue(tp.questionSpacing),
      
      // Layout
      '--exam-stimulus-ratio': `${l.stimulusRatio}%`,
      '--exam-question-ratio': `${100 - l.stimulusRatio}%`,
    };
  };

  // Apply CSS variables to document
  const applyCSSVariables = (variables: Record<string, string>) => {
    const root = document.documentElement;
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  };

  // Load theme from Firestore
  const loadTheme = async (themeId?: string) => {
    setLoading(true);
    try {
      let theme: ExamLayoutConfig | null = null;

      if (themeId) {
        // Load specific theme
        const themeDoc = await getDoc(doc(db, "exam_themes", themeId));
        if (themeDoc.exists()) {
          theme = { id: themeDoc.id, ...themeDoc.data() } as ExamLayoutConfig;
        }
      } else {
        // Load default active theme
        const themesQuery = query(
          collection(db, "exam_themes"),
          where("isActive", "==", true),
          where("isDefault", "==", true)
        );
        const themesSnap = await getDocs(themesQuery);
        if (!themesSnap.empty) {
          const doc = themesSnap.docs[0];
          theme = { id: doc.id, ...doc.data() } as ExamLayoutConfig;
        }
      }

      // Fallback to first preset if no theme found
      if (!theme) {
        theme = EXAM_PRESETS[0];
      }

      setCurrentTheme(theme);
      const vars = generateCSSVariables(theme);
      setCssVariables(vars);
      applyCSSVariables(vars);

    } catch (error) {
      console.error("Error loading theme:", error);
      // Fallback to default
      setCurrentTheme(EXAM_PRESETS[0]);
      const vars = generateCSSVariables(EXAM_PRESETS[0]);
      setCssVariables(vars);
      applyCSSVariables(vars);
    } finally {
      setLoading(false);
    }
  };

  // Save theme to Firestore
  const saveTheme = async (theme: ExamLayoutConfig) => {
    try {
      const themeData = {
        ...theme,
        updatedAt: new Date(),
      };
      
      if (theme.id) {
        await setDoc(doc(db, "exam_themes", theme.id), themeData, { merge: true });
      } else {
        const newDoc = doc(collection(db, "exam_themes"));
        await setDoc(newDoc, {
          ...themeData,
          id: newDoc.id,
          createdAt: new Date(),
        });
      }
      
      // Reload available themes
      await loadAvailableThemes();
    } catch (error) {
      console.error("Error saving theme:", error);
      throw error;
    }
  };

  // Apply theme immediately (without saving)
  const applyTheme = (theme: ExamLayoutConfig) => {
    setCurrentTheme(theme);
    const vars = generateCSSVariables(theme);
    setCssVariables(vars);
    applyCSSVariables(vars);
  };

  // Load all available themes
  const loadAvailableThemes = async () => {
    try {
      const themesQuery = query(
        collection(db, "exam_themes"),
        where("isActive", "==", true)
      );
      const themesSnap = await getDocs(themesQuery);
      const customThemes = themesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ExamLayoutConfig));
      
      // Merge with presets (presets first, then custom)
      setAvailableThemes([...EXAM_PRESETS, ...customThemes]);
    } catch (error) {
      console.error("Error loading themes:", error);
    }
  };

  // Load default theme on mount
  useEffect(() => {
    loadTheme();
    loadAvailableThemes();
  }, []);

  return (
    <ExamThemeContext.Provider value={{
      currentTheme,
      loading,
      availableThemes,
      loadTheme,
      saveTheme,
      applyTheme,
      cssVariables,
    }}>
      {children}
    </ExamThemeContext.Provider>
  );
};

export const useExamTheme = () => useContext(ExamThemeContext);
