'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AnalysisResponse, AnalysisStep } from '@/types';

interface AnalysisState {
  step: AnalysisStep;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  result: AnalysisResponse | null;
  error: string | null;
}

type Action =
  | { type: 'SET_IMAGE'; file: File; previewUrl: string }
  | { type: 'START_ANALYSIS' }
  | { type: 'SET_STEP'; step: AnalysisStep }
  | { type: 'SET_RESULT'; result: AnalysisResponse }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'RESET' };

const initialState: AnalysisState = {
  step: 'idle',
  imageFile: null,
  imagePreviewUrl: null,
  result: null,
  error: null,
};

function reducer(state: AnalysisState, action: Action): AnalysisState {
  switch (action.type) {
    case 'SET_IMAGE':
      return { ...state, imageFile: action.file, imagePreviewUrl: action.previewUrl, error: null };
    case 'START_ANALYSIS':
      return { ...state, step: 'ocr', error: null, result: null };
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'SET_RESULT':
      return { ...state, step: 'done', result: action.result };
    case 'SET_ERROR':
      return { ...state, step: 'error', error: action.error };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface AnalysisContextType {
  state: AnalysisState;
  dispatch: React.Dispatch<Action>;
  runAnalysis: (file: File) => Promise<void>;
}

const AnalysisContext = createContext<AnalysisContextType | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const runAnalysis = async (file: File) => {
    dispatch({ type: 'START_ANALYSIS' });

    // Step indicator updates happen via SSE-like polling; here we just call the unified endpoint
    const formData = new FormData();
    formData.append('image', file);

    dispatch({ type: 'SET_STEP', step: 'ocr' });

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        const stepMap: Record<string, AnalysisStep> = {
          ocr: 'ocr',
          arisu: 'arisu',
          llm: 'llm',
        };
        if (data.step) {
          dispatch({ type: 'SET_STEP', step: stepMap[data.step] || 'error' });
          await new Promise((r) => setTimeout(r, 300));
        }
        dispatch({ type: 'SET_ERROR', error: data.error || '알 수 없는 오류가 발생했습니다.' });
        return;
      }

      dispatch({ type: 'SET_RESULT', result: data });
    } catch {
      dispatch({ type: 'SET_ERROR', error: '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.' });
    }
  };

  return (
    <AnalysisContext.Provider value={{ state, dispatch, runAnalysis }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysis must be used within AnalysisProvider');
  return ctx;
}
