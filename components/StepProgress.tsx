'use client';

import { AnalysisStep } from '@/types';
import { CheckCircle2, XCircle } from 'lucide-react';

const STEPS = [
  { id: 'ocr',   label: '고지서 스캔',   description: 'AI가 고지서 이미지에서 데이터를 추출하고 있습니다...', icon: '📄' },
  { id: 'arisu', label: '원본 데이터 조회', description: '서울 아리수 서버에서 실제 청구 데이터를 확인하고 있습니다...', icon: '🌐' },
  { id: 'llm',   label: 'AI 위변조 분석',  description: 'Claude AI가 두 데이터를 비교하여 위변조 여부를 판단하고 있습니다...', icon: '🤖' },
];

const ORDER: AnalysisStep[] = ['ocr', 'arisu', 'llm', 'done'];

function getStatus(stepId: AnalysisStep, cur: AnalysisStep): 'waiting' | 'active' | 'done' {
  if (cur === 'error') return 'waiting';
  const si = ORDER.indexOf(stepId);
  const ci = ORDER.indexOf(cur);
  if (cur === 'done') return 'done';
  if (ci > si) return 'done';
  if (ci === si) return 'active';
  return 'waiting';
}

export default function StepProgress({ currentStep }: { currentStep: AnalysisStep }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }} id="step-progress">
      {STEPS.map((step, idx) => {
        const status = getStatus(step.id as AnalysisStep, currentStep);
        const isLast = idx === STEPS.length - 1;

        return (
          <div
            key={step.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 20px',
              borderBottom: isLast ? 'none' : '1px solid var(--border-light)',
              background:
                status === 'active' ? 'var(--blue-50)' :
                status === 'done'   ? 'var(--green-50)' : 'var(--surface)',
              transition: 'background 0.3s',
            }}
          >
            {/* Step indicator */}
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background:
                status === 'done'   ? 'var(--green-500)' :
                status === 'active' ? 'var(--blue-600)' : 'var(--surface)',
              border: `2px solid ${
                status === 'done'   ? 'var(--green-500)' :
                status === 'active' ? 'var(--blue-600)' : 'var(--border)'
              }`,
              boxShadow: status === 'active' ? '0 0 0 4px rgb(37 99 235 / 0.12)' : 'none',
              transition: 'all 0.3s',
            }}>
              {status === 'done' && <CheckCircle2 style={{ width: 18, height: 18, color: 'white' }} />}
              {status === 'active' && (
                <svg style={{ width: 16, height: 16, color: 'white', animation: 'spin 0.9s linear infinite' }} fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }} />
                </svg>
              )}
              {status === 'waiting' && (
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{idx + 1}</span>
              )}
            </div>

            {/* Label */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15 }}>{step.icon}</span>
                <span style={{
                  fontWeight: 700, fontSize: 14.5,
                  fontFamily: 'var(--font-outfit)',
                  color:
                    status === 'active' ? 'var(--blue-700)' :
                    status === 'done'   ? 'var(--success-text)' : 'var(--text-muted)',
                  transition: 'color 0.3s',
                }}>
                  {step.label}
                </span>
                {status === 'done' && (
                  <span className="chip chip-green" style={{ padding: '2px 8px', fontSize: 10, fontWeight: 800 }}>COMPLETED</span>
                )}
              </div>
              {status === 'active' && (
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
