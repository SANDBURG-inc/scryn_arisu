'use client';

import { useCallback, useRef, useState } from 'react';
import { useAnalysis } from '@/context/AnalysisContext';
import { useRouter } from 'next/navigation';

export default function FileDropzone() {
  const { dispatch } = useAnalysis();
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef<File | null>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        alert('파일 크기는 20MB 이하여야 합니다.');
        return;
      }
      const url = URL.createObjectURL(file);
      fileRef.current = file;
      setPreview(url);
      setFileName(file.name);
      setFileSize(file.size);
      dispatch({ type: 'SET_IMAGE', file, previewUrl: url });
    },
    [dispatch]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleAnalyze = () => {
    if (!fileRef.current || !preview) return;
    setIsLoading(true);
    dispatch({ type: 'SET_IMAGE', file: fileRef.current, previewUrl: preview });
    router.push('/analyze');
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setFileName(null);
    setFileSize(0);
    setIsLoading(false);
    fileRef.current = null;
  };

  return (
    <div className="w-full space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !preview && document.getElementById('file-input-home')?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl text-center transition-all duration-300 cursor-pointer group overflow-hidden
          ${isDragging
            ? 'border-cyan-400 bg-cyan-500/10 scale-[1.02]'
            : preview
              ? 'border-slate-700/60 cursor-default'
              : 'border-slate-700 hover:border-cyan-500/60 hover:bg-white/[0.02] bg-transparent'
          }
        `}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !preview && document.getElementById('file-input-home')?.click()}
        id="dropzone"
        aria-label="고지서 이미지 업로드 영역"
      >
        <input
          id="file-input-home"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileInput}
        />

        {/* Drag highlight overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none z-10" />
        )}

        {preview ? (
          <div className="p-5">
            {/* Preview with image */}
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="업로드된 고지서 미리보기"
                  className="h-32 w-auto rounded-xl shadow-2xl ring-2 ring-cyan-500/30 object-contain"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
              </div>

              <div className="flex-1 text-left space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  <span className="text-sm font-semibold text-emerald-400">업로드 완료</span>
                </div>
                <p className="text-sm text-white font-medium truncate max-w-[260px]">{fileName}</p>
                <p className="text-xs text-slate-500">
                  {(fileSize / 1024 / 1024).toFixed(2)} MB · OCR 추출 및 아리수 서버 검증 준비
                </p>
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-cyan-400 transition-colors underline decoration-dotted underline-offset-2"
                >
                  다른 파일로 교체
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-10 space-y-4">
            {/* Upload icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center ring-1 ring-cyan-500/30 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-base font-medium text-white">
                고지서 이미지를 드래그하거나{' '}
                <span className="text-cyan-400 underline decoration-dotted underline-offset-2">클릭하여 선택</span>
              </p>
              <p className="mt-1 text-sm text-slate-500">PNG, JPG, WEBP · 최대 20MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Analyze button */}
      {preview && (
        <button
          id="analyze-btn"
          onClick={handleAnalyze}
          disabled={isLoading}
          className="w-full py-4 px-6 rounded-xl font-semibold text-base tracking-wide
            bg-gradient-to-r from-cyan-500 to-blue-600
            hover:from-cyan-400 hover:to-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35
            transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
            text-white relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                분석 시작 중...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                위변조 분석 시작
              </>
            )}
          </span>
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        </button>
      )}
    </div>
  );
}
