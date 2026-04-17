'use client';

import { AnalysisResult } from '@/types';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function ResultBanner({ analysis }: { analysis: AnalysisResult }) {
  const isForged = analysis.is_forged;
  const confLabel =
    analysis.confidence === 'high' ? '높음' :
    analysis.confidence === 'medium' ? '보통' : '낮음';

  return (
    <div
      className={isForged ? 'verdict-forgery' : 'verdict-normal'}
      id="result-banner"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5"
          style={{ background: isForged ? '#fecaca' : '#bbf7d0' }}
        >
          {isForged
            ? <XCircle className="w-5 h-5" style={{ color: 'var(--danger)' }} />
            : <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--success)' }} />
          }
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h3 className="text-xl font-bold" style={{ color: isForged ? 'var(--danger)' : 'var(--success)' }}>
              {isForged ? '위변조 감지됨' : '정상 고지서'}
            </h3>
            <span className={isForged ? 'badge-danger' : 'badge-success'}>
              신뢰도: {confLabel}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: isForged ? '#991b1b' : '#166534' }}>
            {analysis.summary_text}
          </p>
        </div>
      </div>
    </div>
  );
}
