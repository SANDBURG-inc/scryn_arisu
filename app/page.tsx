'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAnalysis } from '@/context/AnalysisContext';
import {
  Droplets, Shield, GitBranch, AlertCircle, Upload,
  FileText, CheckCircle2, ScanLine, Server, Brain,
} from 'lucide-react';

/* ─── Step Progress (horizontal, Figma-style) ─── */
const PROC_STEPS = [
  { label: '이미지 업로드', sub: '수도 요금 고지서 이미지' },
  { label: 'OCR 추출', sub: '데이터 텍스트화' },
  { label: '아리수 API 검증', sub: '서울 아리수 API 대조' },
  { label: 'AI 분석', sub: '위변조 최종 판단' },
];

type AppStep = 'idle' | 'uploaded' | 'ocr' | 'arisu' | 'llm' | 'error';

const STEP_IDX: Record<AppStep, number> = { idle: -1, uploaded: 0, ocr: 1, arisu: 2, llm: 3, error: -1 };

function ProcessBar({ step }: { step: AppStep }) {
  const cur = STEP_IDX[step];

  return (
    <div className="card fade-in-up" style={{ padding: '36px 40px', background: 'white' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start' }}>
        {/* Connector lines — behind step circles */}
        {PROC_STEPS.map((_, i) => {
          if (i === PROC_STEPS.length - 1) return null;
          const colWidth = 100 / PROC_STEPS.length;
          const startX = colWidth * i + colWidth / 2;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: 28,
                left: `calc(${startX}% + 28px)`,
                width: `calc(${colWidth}% - 56px)`,
                height: 4,
                background: cur > i ? 'var(--success)' : 'var(--border)',
                transition: 'background 0.4s',
                zIndex: 0,
              }}
            />
          );
        })}

        {/* Step dots */}
        {PROC_STEPS.map((s, i) => {
          const done = cur > i;
          const active = cur === i;
          return (
            <div
              key={i}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `3px solid ${done ? 'var(--success)' : active ? 'var(--blue-600)' : 'var(--border)'}`,
                  background: done ? 'var(--success)' : active ? 'var(--blue-600)' : 'var(--surface)',
                  boxShadow: active ? '0 0 0 8px rgb(37 99 235 / 0.15)' : 'none',
                  transition: 'all 0.3s',
                }}
              >
                {done ? (
                  <CheckCircle2 style={{ width: 24, height: 24, color: 'white' }} />
                ) : active ? (
                  <div style={{ position: 'relative', width: 24, height: 24 }}>
                    <div style={{ 
                      position: 'absolute', inset: 0, borderRadius: '50%', 
                      border: '3px solid white', borderTopColor: 'transparent',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                  </div>
                ) : (
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: 'var(--border)',
                  }} />
                )}
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontSize: 14, fontWeight: 800,
                  fontFamily: 'var(--font-outfit)',
                  color: done ? 'var(--success-text)' : active ? 'var(--blue-800)' : 'var(--text-muted)',
                  transition: 'color 0.3s',
                }}>{s.label}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Result placeholder ─── */
function ResultPlaceholder({ step, error }: { step: AppStep; error: string | null }) {
  if (step === 'error') {
    return (
      <div
        className="fade-in"
        style={{
          border: '1px solid var(--red-100)',
          background: 'var(--red-50)',
          borderRadius: 'var(--r-xl)',
          padding: '20px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <AlertCircle style={{ width: 18, height: 18, color: 'var(--red-500)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: 600, color: 'var(--red-700)', fontSize: 14, marginBottom: 4 }}>분석 오류</p>
            <p style={{ color: 'var(--red-700)', fontSize: 13.5, lineHeight: 1.6 }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'ocr' || step === 'arisu' || step === 'llm') {
    const labels: Record<string, string> = {
      ocr: 'OCR 데이터 추출 중...', arisu: '아리수 서버 검증 중...', llm: 'AI 위변조 분석 중...',
    };
    return (
      <div
        className="card fade-in"
        style={{ padding: '32px', boxShadow: 'var(--shadow-premium)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, flexShrink: 0,
            borderRadius: '50%',
            border: '4px solid var(--blue-50)',
            borderTopColor: 'var(--blue-600)',
            animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
          }} />
          <div>
            <p style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 17, fontFamily: 'var(--font-outfit)' }}>{labels[step]}</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
              OCR 데이터 추출 → 아리수 API 검증 → AI 분석
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'OCR 추출', done: true, icon: <ScanLine style={{ width: 14, height: 14 }} /> },
            { label: '서버 검증', done: step === 'arisu' || step === 'llm', icon: <Server style={{ width: 14, height: 14 }} /> },
            { label: 'AI 분석', done: step === 'llm', icon: <Brain style={{ width: 14, height: 14 }} /> },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                borderRadius: 'var(--r-lg)',
                background: s.done ? 'var(--success-bg)' : 'var(--bg-subtle)',
                border: `1px solid ${s.done ? 'var(--success-border)' : 'var(--border)'}`,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.4s ease',
              }}
            >
              <div style={{ 
                width: 24, height: 24, borderRadius: '50%', 
                background: s.done ? 'var(--success)' : 'var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
              }}>
                {s.done ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : s.icon}
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: s.done ? 'var(--success-text)' : 'var(--text-secondary)' }}>
                {s.label}
              </span>
              {s.done && (
                <div style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, color: 'var(--success)', letterSpacing: '0.05em' }}>SUCCESS</div>
              )}
              {step === (i === 0 ? 'ocr' : i === 1 ? 'arisu' : 'llm') && !s.done && (
                <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--blue-600)', animation: 'pulse-dot 1s infinite' }} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        borderStyle: 'dashed',
        borderWidth: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        gap: 20,
        color: 'var(--text-muted)',
        minHeight: 280,
      }}
    >
      <div style={{ 
        width: 64, height: 64, borderRadius: '20px', background: 'var(--bg-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4
      }}>
        <Shield style={{ width: 28, height: 28, opacity: 0.4 }} strokeWidth={1.5} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)' }}>분석 준비 완료</p>
        <p style={{ fontSize: 13, marginTop: 6, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          수도 요금 고지서를 업로드하고<br />AI 위변조 분석을 시작하세요.
        </p>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function HomePage() {
  const { dispatch, runAnalysis } = useAnalysis();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<AppStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<File | null>(null);

  const processFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) { alert('이미지 파일만 업로드 가능합니다.'); return; }
    if (f.size > 20 * 1024 * 1024) { alert('파일 크기는 20MB 이하여야 합니다.'); return; }
    const url = URL.createObjectURL(f);
    fileRef.current = f;
    setFile(f);
    setPreview(url);
    setStep('uploaded');
    setError(null);
    dispatch({ type: 'SET_IMAGE', file: f, previewUrl: url });
  }, [dispatch]);

  const handleAnalyze = async () => {
    if (!fileRef.current) return;
    
    // 1. OCR Step
    setStep('ocr');
    setError(null);
    await new Promise(r => setTimeout(r, 1200)); // Simulating OCR work

    // 2. Arisu Step
    setStep('arisu');
    await new Promise(r => setTimeout(r, 1000)); // Simulating API call

    // 3. AI Step (Actual API call here)
    setStep('llm');

    try {
      const formData = new FormData();
      formData.append('image', fileRef.current);
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '알 수 없는 오류가 발생했습니다.');
        setStep('error');
        return;
      }

      dispatch({ type: 'SET_RESULT', result: data });
      router.push('/result');
    } catch {
      setError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
      setStep('error');
    }
  };

  const handleReset = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFile(null);
    setPreview(null);
    setStep('idle');
    setError(null);
    fileRef.current = null;
  };

  const isAnalyzing = step === 'ocr' || step === 'arisu' || step === 'llm';
  const showProgress = step !== 'idle';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ──────── HEADER ──────── */}
      <header className="site-header">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="scryn-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="scryn logo" />
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.03em', fontFamily: 'var(--font-outfit)' }}>scryn</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginTop: 4, letterSpacing: '0.12em' }}>
                Security Core v3.0
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="chip chip-blue" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield style={{ width: 13, height: 13 }} />
              서울 아리수 연동
            </div>
            <Link
              href="https://github.com"
              className="btn btn-secondary"
              style={{ padding: '9px 12px', borderRadius: 'var(--r-md)' }}
            >
              <GitBranch style={{ width: 16, height: 16 }} />
            </Link>
          </div>
        </div>
      </header>

      {/* ──────── MAIN ──────── */}
      <main className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>

        {/* Info Banner */}
        <div className="info-banner fade-in-up" style={{ 
          marginBottom: 32,
          background: 'var(--blue-50)',
          border: '1px solid var(--blue-100)',
          borderRadius: 'var(--r-xl)',
          padding: '24px'
        }}>
          <AlertCircle style={{ width: 22, height: 22, color: 'var(--blue-600)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--blue-900)', marginBottom: 6, fontFamily: 'var(--font-outfit)' }}>
              수도 요금 고지서 위변조 검증 시스템
            </p>
            <p style={{ fontSize: 14, color: 'var(--blue-700)', lineHeight: 1.7, opacity: 0.8 }}>
              업로드된 고지서 이미지에서 OCR로 데이터를 추출하고, 서울 아리수 서버의 실제 청구 데이터와
              교차 검증하여 위변조 여부를 AI가 분석합니다. Claude 또는 GPT-4를 활용한 정밀한 분석 결과를 제공합니다.
            </p>
          </div>
        </div>

        {/* Process progress bar */}
        {showProgress && (
          <div className="fade-in-up" style={{ marginBottom: 28 }}>
            <ProcessBar step={step} />
          </div>
        )}

        {/* Two-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>

          {/* ── Left: Upload ── */}
          <div className="fade-in-up d-100">
            <div className="section-header">
              <div className="section-badge">01</div>
              <div>
                <p className="section-title">고지서 업로드</p>
                <p className="section-sub">수도 요금 고지서 이미지를 업로드하세요</p>
              </div>
            </div>

            {/* Drop zone */}
            <div
              className={`upload-zone ${isDragging ? 'dragging' : file ? 'has-file' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
              onClick={() => !file && document.getElementById('file-input')?.click()}
              onKeyDown={(e) => e.key === 'Enter' && !file && document.getElementById('file-input')?.click()}
              tabIndex={0}
              role="button"
              aria-label="고지서 이미지 업로드"
              id="dropzone"
              style={{ padding: '48px 32px', borderRadius: 'var(--r-2xl)' }}
            >
              <input
                id="file-input"
                type="file"
                accept="image/*"
                className="hidden"
                style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
              />

              {file ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <div className="upload-icon-circle">
                    <Upload style={{ width: 30, height: 30, color: 'var(--blue-500)' }} strokeWidth={1.8} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <FileText style={{ width: 15, height: 15, color: 'var(--blue-600)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{file.name}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {!isAnalyzing && (
                    <p style={{ fontSize: 13, color: 'var(--blue-600)', fontWeight: 500 }}>
                      분석을 시작하려면 아래 버튼을 클릭하세요
                    </p>
                  )}
                  {!isAnalyzing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReset(); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 12, color: 'var(--text-muted)',
                        textDecoration: 'underline',
                        textDecorationStyle: 'dotted',
                        textUnderlineOffset: 3,
                        padding: 0,
                        transition: 'color 0.15s',
                      }}
                    >
                      다른 파일로 교체
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                  <div className="upload-icon-circle">
                    <Upload style={{ width: 30, height: 30, color: 'var(--text-muted)' }} strokeWidth={1.6} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                      수도 요금 고지서 업로드
                    </p>
                    <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      이미지를 드래그하거나{' '}
                      <span style={{ color: 'var(--blue-600)', fontWeight: 600, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}>
                        클릭하여 업로드
                      </span>
                      하세요
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>PNG, JPG, JPEG · 최대 20MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status strip */}
            {file && !error && (
              <div
                className="fade-in"
                style={{
                  marginTop: 12,
                  padding: '12px 18px',
                  borderRadius: 'var(--r-lg)',
                  background: 'var(--blue-50)',
                  border: '1px solid var(--blue-100)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div className="status-dot done" style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue-700)' }}>업로드 완료</p>
                  <p style={{ fontSize: 12, color: 'var(--blue-600)', marginTop: 2, opacity: 0.8 }}>
                    OCR 추출 및 아리수 서버 검증 준비 완료
                  </p>
                </div>
              </div>
            )}

            {/* Analyze button */}
            {file && (step === 'uploaded' || step === 'error') && (
              <button
                id="analyze-btn"
                onClick={handleAnalyze}
                className="btn btn-primary fade-in"
                style={{ width: '100%', marginTop: 12, padding: '14px 20px', fontSize: 15 }}
              >
                <Shield style={{ width: 18, height: 18 }} />
                위변조 분석 시작
              </button>
            )}

            {/* Analyzing in-progress — disabled button */}
            {isAnalyzing && (
              <button
                disabled
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 12, padding: '14px 20px', fontSize: 15, opacity: 0.65, cursor: 'not-allowed' }}
              >
                <svg style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }} />
                </svg>
                분석 중...
              </button>
            )}
          </div>

          {/* ── Right: Result placeholder ── */}
          <div className="fade-in-up d-200">
            <div className="section-header">
              <div className="section-badge">02</div>
              <div>
                <p className="section-title">분석 결과</p>
                <p className="section-sub">OCR 추출 → 아리수 API 검증 → AI 분석</p>
              </div>
            </div>
            <ResultPlaceholder step={step} error={error} />
          </div>
        </div>

          {/* ── Feature cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {[
            { icon: <ScanLine style={{ width: 22, height: 22 }} />, title: 'OCR 데이터 추출', desc: 'Google Cloud Vision API 또는 Claude Vision으로 고지서 텍스트 추출' },
            { icon: <Server style={{ width: 22, height: 22 }} />, title: '아리수 API 검증', desc: '서울 아리수 서버에서 실제 청구 데이터 확보 및 대조' },
            { icon: <Brain style={{ width: 22, height: 22 }} />, title: 'AI 분석', desc: 'Claude/GPT-4가 위변조 여부 및 조작 항목 정밀 분석' },
          ].map((f, i) => (
            <div key={i} className={`card fade-in-up d-${(i + 1) * 100 as 100 | 200 | 300}`} style={{ padding: '24px' }}>
              <div className="feature-icon" style={{ borderRadius: '16px', background: 'var(--blue-50)', color: 'var(--blue-600)', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                {f.icon}
              </div>
              <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', marginBottom: 10, fontFamily: 'var(--font-outfit)' }}>{f.title}</p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* ──────── FOOTER ──────── */}
      <footer className="site-footer">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            © 2026 scryn. Powered by Claude API &amp; Seoul Arisu Data
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green-50)', display: 'inline-block', border: '1px solid var(--green-500)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
            시스템 정상 작동 중
          </div>
        </div>
      </footer>

      <style>{`
        .hidden { display: none !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0   rgb(37 99 235 / 0.35); }
          70%  { box-shadow: 0 0 0 8px rgb(37 99 235 / 0); }
          100% { box-shadow: 0 0 0 0   rgb(37 99 235 / 0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
