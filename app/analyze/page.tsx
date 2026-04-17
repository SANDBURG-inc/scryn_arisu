'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalysis } from '@/context/AnalysisContext';
import StepProgress from '@/components/StepProgress';
import { Droplets, AlertCircle } from 'lucide-react';

export default function AnalyzePage() {
  const { state, runAnalysis } = useAnalysis();
  const router = useRouter();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!state.imageFile && !hasStarted.current) { router.replace('/'); return; }
    if (state.imageFile && !hasStarted.current) { hasStarted.current = true; runAnalysis(state.imageFile); }
  }, [state.imageFile, runAnalysis, router]);

  useEffect(() => {
    if (state.step === 'done') router.push('/result');
  }, [state.step, router]);

  const isError = state.step === 'error';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <header className="site-header">
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64, gap: 10 }}>
          <div className="scryn-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="scryn logo" />
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.03em', fontFamily: 'var(--font-outfit)' }}>scryn</p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginTop: 4, letterSpacing: '0.12em' }}>Security Core</p>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          {/* Title */}
          <div className="fade-in-up" style={{ textAlign: 'center', marginBottom: 32 }}>
            {isError ? (
              <>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>분석 중 오류 발생</p>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>아래 오류를 확인하고 다시 시도해주세요.</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>고지서 분석 중...</p>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>잠시만 기다려주세요. AI가 열심히 분석하고 있습니다.</p>
              </>
            )}
          </div>

          {/* Bill preview */}
          {state.imagePreviewUrl && (
            <div className="fade-in-up d-50" style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
              <div style={{ position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={state.imagePreviewUrl}
                  alt="분석 중인 고지서"
                  style={{
                    height: 140, width: 'auto', objectFit: 'contain',
                    borderRadius: 'var(--r-lg)', border: '2px solid var(--blue-100)',
                    boxShadow: 'var(--shadow-md)', opacity: isError ? 0.5 : 1,
                  }}
                />
                {!isError && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 'calc(var(--r-lg) - 2px)',
                    border: '2px solid var(--blue-100)',
                    animation: 'pulse-ring 1.8s ease-out infinite',
                    pointerEvents: 'none',
                  }} />
                )}
              </div>
            </div>
          )}

          {/* Step progress */}
          {!isError && (
            <div className="fade-in-up d-100" style={{ marginBottom: 28 }}>
              <StepProgress currentStep={state.step} />
            </div>
          )}

          {/* Error */}
          {isError && (
            <div
              className="fade-in-up d-100"
              style={{
                padding: '20px 24px',
                borderRadius: 'var(--r-xl)',
                background: 'var(--red-50)',
                border: '1px solid var(--red-100)',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                <AlertCircle style={{ width: 18, height: 18, color: 'var(--red-500)', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--red-700)', marginBottom: 4 }}>오류 내용</p>
                  <p style={{ fontSize: 13.5, color: 'var(--red-700)', lineHeight: 1.6 }}>{state.error}</p>
                </div>
              </div>
              <button
                id="retry-btn"
                onClick={() => router.push('/')}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '11px 20px' }}
              >
                ← 처음으로 돌아가기
              </button>
            </div>
          )}

          {/* Loading dots */}
          {!isError && (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 5, height: 28 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  width: 5, borderRadius: 3, background: 'var(--blue-600)',
                  height: `${10 + (i % 3) * 7}px`,
                  animation: `bounce-bar 1.2s ease-in-out ${i * 0.14}s infinite`,
                  opacity: 0.6,
                }} />
              ))}
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes bounce-bar {
          0%, 100% { transform: scaleY(0.4); opacity: 0.4; }
          50%       { transform: scaleY(1); opacity: 0.9; }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0   rgb(37 99 235 / 0.3); }
          70%  { box-shadow: 0 0 0 10px rgb(37 99 235 / 0); }
          100% { box-shadow: 0 0 0 0   rgb(37 99 235 / 0); }
        }
      `}</style>
    </div>
  );
}
