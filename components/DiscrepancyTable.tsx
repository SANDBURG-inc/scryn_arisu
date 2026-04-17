'use client';

import { Discrepancy } from '@/types';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

function formatValue(val: string): string {
  const num = val?.replace(/[원㎥]/g, '').replace(/,/g, '');
  if (num && !isNaN(Number(num)) && Number(num) > 0) {
    return Number(num).toLocaleString('ko-KR') + (val?.includes('㎥') ? '㎥' : '원');
  }
  return val || '-';
}

const SEV = {
  high:   { label: '심각',  icon: <XCircle style={{ width: 18, height: 18, color: 'var(--danger)', flexShrink: 0 }} />,     bg: 'var(--danger-bg)',   border: 'var(--danger-border)',   badge: 'chip chip-red' },
  medium: { label: '중간',  icon: <AlertTriangle style={{ width: 18, height: 18, color: 'var(--warning)', flexShrink: 0 }} />, bg: 'var(--warning-bg)', border: 'var(--warning-border)', badge: 'chip chip-amber' },
  low:    { label: '낮음',  icon: <CheckCircle2 style={{ width: 18, height: 18, color: 'var(--success)', flexShrink: 0 }} />, bg: 'var(--success-bg)', border: 'var(--success-border)', badge: 'chip chip-green' },
};

export default function DiscrepancyTable({ discrepancies }: { discrepancies: Discrepancy[] }) {
  if (!discrepancies || discrepancies.length === 0) {
    return (
      <div
        className="card"
        style={{ padding: '32px', textAlign: 'center', background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}
      >
        <CheckCircle2 style={{ width: 32, height: 32, margin: '0 auto 12px', color: 'var(--success)' }} />
        <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--success-text)', fontFamily: 'var(--font-outfit)' }}>불일치 항목이 없습니다</p>
        <p style={{ fontSize: 13.5, marginTop: 4, color: 'var(--success-text)', opacity: 0.8 }}>고지서 데이터가 서버 원본과 완전히 일치합니다.</p>
      </div>
    );
  }

  return (
    <div className="data-table" id="discrepancy-table">
      {/* Header row */}
      <div
        className="data-table-head"
        style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto', gap: 16, alignItems: 'center' }}
      >
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>항목</div>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>고지서 추출값</div>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>서버 실제 값</div>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>위험도</div>
      </div>

      {/* Rows */}
      {discrepancies.map((d, idx) => {
        const s = SEV[d.severity] ?? SEV.medium;
        const isLast = idx === discrepancies.length - 1;
        const isCustomerNumber = d.field.includes('고객번호');

        const formatVal = (val: string): string => {
          if (!val || val === '-') return '-';
          if (isCustomerNumber) return val.replace(/,/g, '');
          const num = val.replace(/[원㎥]/g, '').replace(/,/g, '');
          if (num && !isNaN(Number(num)) && Number(num) > 0) {
            return Number(num).toLocaleString('ko-KR') + (val.includes('㎥') ? '㎥' : '원');
          }
          return val;
        };

        return (
          <div
            key={idx}
            className="data-table-row"
            style={{ 
              display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto', gap: 16, alignItems: 'center',
              borderBottom: isLast ? 'none' : '1px solid var(--border-light)'
            }}
          >
            {/* Field */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {s.icon}
              <div>
                <p style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)' }}>{d.field}</p>
                {d.note && <p style={{ fontSize: 12, marginTop: 2, color: 'var(--text-muted)', lineHeight: 1.4 }}>{d.note}</p>}
              </div>
            </div>

            {/* Image value */}
            <div className={`compare-cell compare-cell-extracted ${d.severity === 'high' ? 'mismatch' : ''}`}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>고지서</span>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: d.severity === 'high' ? 'var(--danger)' : 'var(--text-primary)' }}>
                {formatVal(d.image_value)}
              </span>
            </div>

            {/* Real value */}
            <div className="compare-cell compare-cell-original">
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>아리수</span>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: 'var(--success-text)' }}>
                {formatVal(d.real_value)}
              </span>
            </div>

            {/* Severity */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span className={s.badge} style={{ fontSize: 10 }}>{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
