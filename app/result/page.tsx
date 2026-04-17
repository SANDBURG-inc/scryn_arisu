'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalysis } from '@/context/AnalysisContext';
import {
  Droplets, Shield, CheckCircle2, XCircle, AlertTriangle,
  AlertCircle, TrendingUp, TrendingDown, FileText,
  ArrowRight, Printer, RotateCcw, ChevronRight,
  BarChart3, Info,
} from 'lucide-react';
import { AnalysisResult, ArisuServerData, BillImageData } from '@/types';

/* ─── Helpers ─── */
function fmt(val = '') {
  const n = Number(val.replace(/,/g, '').replace(/[^0-9.-]/g, ''));
  return isNaN(n) || val === '' ? val || '–' : n.toLocaleString('ko-KR') + '원';
}
function fmtRaw(val = '') { return val || '–'; }

type Sev = 'high' | 'medium' | 'low';
const SEV = {
  high: { cls: 'sev-badge sev-high', label: '심각', icon: <XCircle style={{ width: 15, height: 15, color: 'currentColor', flexShrink: 0 }} strokeWidth={2.5} /> },
  medium: { cls: 'sev-badge sev-medium', label: '중간', icon: <AlertTriangle style={{ width: 15, height: 15, color: 'currentColor', flexShrink: 0 }} strokeWidth={2.5} /> },
  low: { cls: 'sev-badge sev-low', label: '낮음', icon: <CheckCircle2 style={{ width: 15, height: 15, color: 'currentColor', flexShrink: 0 }} strokeWidth={2.5} /> },
};

/* ─── DataRow (Boxed Design) ─── */
function DataRow({
  label, imageVal, serverVal, isMatch, unit = '', noFormat = false,
}: { label: string; imageVal: string; serverVal: string; isMatch: boolean; unit?: string; noFormat?: boolean }) {
  const formatNum = (v: string) => {
    if (!v || v === '–') return '–';
    if (noFormat) return v;
    const n = Number(v.replace(/,/g, '').replace(/[^0-9.-]/g, ''));
    if (isNaN(n)) return v;
    return n.toLocaleString('ko-KR') + unit;
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, fontFamily: 'var(--font-outfit)' }}>{label}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Extracted Box */}
        <div style={{
          borderRadius: 'var(--r-lg)',
          padding: '16px 20px',
          background: isMatch ? 'var(--bg-subtle)' : 'var(--danger-bg)',
          border: `1px solid ${isMatch ? 'var(--border)' : 'var(--danger-border)'}`,
          position: 'relative',
        }}>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>고지서 추출값</p>
          <p style={{ fontSize: 16, fontWeight: 800, color: isMatch ? 'var(--text-primary)' : 'var(--danger)', fontFamily: 'monospace' }}>
            {formatNum(imageVal)}
          </p>
        </div>

        {/* Server Box */}
        <div style={{
          borderRadius: 'var(--r-lg)',
          padding: '16px 20px',
          background: 'var(--success-bg)',
          border: '1px solid var(--success-border)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div style={{ position: 'absolute', right: 16, top: 16 }}>
             <CheckCircle2 style={{ width: 14, height: 14, color: 'var(--success)' }} />
          </div>
          <p style={{ fontSize: 10, color: 'var(--success-text)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em', opacity: 0.7 }}>아리수 원본값</p>
          <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--success-text)', fontFamily: 'monospace' }}>
            {formatNum(serverVal)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── ResultPage ─── */
export default function ResultPage() {
  const { state, dispatch } = useAnalysis();
  const router = useRouter();
  const printed = useRef(false);

  useEffect(() => {
    if (!state.result) router.replace('/');
  }, [state.result, router]);

  if (!state.result) return null;

  const { analysis, billData, arisuData, imageBase64, mediaType } = state.result as {
    analysis: AnalysisResult;
    billData: BillImageData;
    arisuData: ArisuServerData;
    imageBase64?: string;
    mediaType?: string;
  };

  const isForged = analysis.is_forged;
  const highCount = analysis.discrepancies.filter(d => d.severity === 'high').length;
  const medCount = analysis.discrepancies.filter(d => d.severity === 'medium').length;
  const confLabel = { high: '높음 (95%+)', medium: '보통 (75–95%)', low: '낮음 (<75%)' }[analysis.confidence];
  const confColor = { high: 'var(--green-700)', medium: 'var(--amber-700)', low: 'var(--red-700)' }[analysis.confidence];

  const handleReset = () => { dispatch({ type: 'RESET' }); router.push('/'); };
  const handlePrint = () => { if (!printed.current) { printed.current = true; window.print(); } };

  /* Quick comparison items (main data pairs) */
  const quickComparisons = [
    { label: '고객번호', img: fmtRaw(billData.customerNumber), srv: fmtRaw(arisuData.customerNumber), isNum: false, noFormat: true },
    { label: '납부년월', img: fmtRaw(billData.billingPeriod), srv: fmtRaw(arisuData.billingPeriod), isNum: false },
    { label: '총 납부금액', img: billData.totalAmount, srv: arisuData.paymentAmount, isNum: true },
    { label: '상수도요금', img: billData.waterFee, srv: arisuData.waterFee, isNum: true },
    { label: '하수도요금', img: billData.sewageFee, srv: arisuData.sewageFee, isNum: true },
    { label: '물이용부담금', img: billData.waterUsageFee || '0', srv: arisuData.waterUsageFee, isNum: true },
    { label: '사용량', img: `${billData.waterUsage}㎥`, srv: `${arisuData.waterUsage}㎥`, isNum: false },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ──────── HEADER ──────── */}
      <header className="site-header">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="scryn-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="scryn logo" />
            </div>
            <div style={{ marginLeft: 4 }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.03em', fontFamily: 'var(--font-outfit)' }}>scryn</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginTop: 4, letterSpacing: '0.12em' }}>Security Core</p>
            </div>
            <ChevronRight style={{ width: 15, height: 15, color: 'var(--text-muted)', margin: '0 8px' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-outfit)' }}>분석 리포트</span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handlePrint} className="btn btn-secondary" style={{ gap: 6, padding: '9px 16px', fontSize: 13.5 }} id="print-btn">
              <Printer style={{ width: 15, height: 15 }} />
              인쇄
            </button>
            <button onClick={handleReset} className="btn btn-primary" style={{ gap: 6, padding: '9px 18px', fontSize: 13.5 }} id="new-analysis-btn">
              <RotateCcw style={{ width: 15, height: 15 }} />
              새 분석
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>

        {/* ──────── ① VERDICT BANNER ──────── */}
        <section 
          className="fade-in-up" 
          style={{ 
            marginBottom: 24,
            padding: '32px 40px',
            borderRadius: 'var(--r-2xl)',
            background: isForged ? 'var(--danger-bg)' : 'var(--success-bg)',
            border: `1px solid ${isForged ? 'var(--danger-border)' : 'var(--success-border)'}`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Subtle background pattern */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.03,
            backgroundImage: `radial-gradient(var(--text-primary) 0.5px, transparent 0.5px)`,
            backgroundSize: '16px 16px'
          }} />

          {/* Watermark effect */}
          <div style={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', opacity: 0.04, pointerEvents: 'none' }}>
            {isForged
              ? <XCircle style={{ width: 140, height: 140 }} />
              : <CheckCircle2 style={{ width: 140, height: 140 }} />
            }
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, position: 'relative' }}>
            {/* Status icon badge */}
            <div style={{
              width: 72, height: 72, flexShrink: 0, borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'white',
              boxShadow: 'var(--shadow-lg)',
              border: `1px solid ${isForged ? 'var(--danger-border)' : 'var(--success-border)'}`,
            }}>
              {isForged
                ? <XCircle style={{ width: 36, height: 36, color: 'var(--danger)' }} strokeWidth={2.5} />
                : <CheckCircle2 style={{ width: 36, height: 36, color: 'var(--success)' }} strokeWidth={2.5} />
              }
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <h1 style={{
                  fontSize: 32, fontWeight: 900, letterSpacing: '-0.04em',
                  fontFamily: 'var(--font-outfit)',
                  color: isForged ? 'var(--danger-text)' : 'var(--success-text)',
                }}>
                  {isForged ? '위변조 감지됨' : '정상 고지서'}
                </h1>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className={isForged ? 'chip chip-red' : 'chip chip-green'} style={{ padding: '4px 12px', fontSize: 12 }}>
                    신뢰도: {confLabel}
                  </span>
                  {highCount > 0 && (
                    <span className="chip chip-red" style={{ padding: '4px 12px', fontSize: 12 }}>{highCount}건 심각 불일치</span>
                  )}
                </div>
              </div>
              <p style={{ 
                fontSize: 16.5, 
                lineHeight: 1.8, 
                color: isForged ? 'var(--danger-text)' : 'var(--success-text)', 
                opacity: 0.85,
                maxWidth: 900,
                fontWeight: 500,
                wordBreak: 'keep-all'
              }}>
                {analysis.summary_text}
              </p>
            </div>
          </div>
        </section>

        {/* ──────── ② STATS ROW ──────── */}
        <div className="fade-in-up d-50" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          {[
            {
              value: analysis.discrepancies.length > 0 ? `${analysis.discrepancies.length}건` : '없음',
              label: '불일치 항목',
              color: analysis.discrepancies.length > 0 ? 'var(--danger-text)' : 'var(--success-text)',
            },
            {
              value: highCount > 0 ? `${highCount}건` : '없음',
              label: '심각 불일치',
              color: highCount > 0 ? 'var(--danger-text)' : 'var(--success-text)',
            },
            {
              value: confLabel.split(' ')[0],
              label: '신뢰도',
              color: 'var(--success-text)',
            },
            {
              value: isForged ? '위변조' : '정상',
              label: '최종 판정',
              color: isForged ? 'var(--danger-text)' : 'var(--success-text)',
            },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '24px 28px', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 900, color: s.color, fontFamily: 'var(--font-outfit)', marginBottom: 2 }}>{s.value}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ──────── ③ BILL IMAGE + META ──────── */}
        <div className="fade-in-up d-100" style={{ display: 'grid', gridTemplateColumns: imageBase64 ? '380px 1fr' : '1fr', gap: 24, marginBottom: 32 }}>
          {/* Bill image Sidebar */}
          {imageBase64 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden', alignSelf: 'start' }}>
              <div style={{ padding: '20px 24px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText style={{ width: 18, height: 18, color: 'var(--blue-600)' }} />
                <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)' }}>업로드된 고지서</span>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ position: 'relative', marginBottom: 20 }}>
                  <img
                    src={`data:${mediaType || 'image/jpeg'};base64,${imageBase64}`}
                    alt="분석된 고지서"
                    style={{
                      width: '100%', maxHeight: 520, objectFit: 'contain',
                      borderRadius: 'var(--r-lg)', border: '1px solid var(--border)',
                      background: 'white',
                    }}
                  />
                  {isForged && (
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'var(--danger)', color: 'white',
                      padding: '6px 12px', borderRadius: 'var(--r-full)',
                      fontSize: 12, fontWeight: 800,
                      boxShadow: 'var(--shadow-lg)',
                    }}>
                      <XCircle style={{ width: 14, height: 14 }} />
                      위변조 감지
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { label: '고객번호', value: fmtRaw(billData.customerNumber) },
                    { label: '사용자명', value: fmtRaw(billData.customerName) },
                  ].map((r) => (
                    <div key={r.label} style={{
                      display: 'flex', justifyContent: 'space-between', padding: '12px 0',
                      borderBottom: '1px solid var(--border-light)',
                      fontSize: 14,
                    }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{r.label}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontFamily: 'monospace' }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Comparison table — core fields */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '18px 24px',
              background: 'var(--bg)',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <BarChart3 style={{ width: 17, height: 17, color: 'var(--blue-600)' }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>데이터 비교 분석</p>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  추출된 데이터와 서울 아리수 서버 원본 데이터 대조
                </p>
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {quickComparisons.map((c, i) => {
                const imgClean = c.img.replace(/[원㎥,]/g, '').trim();
                const srvClean = c.srv.replace(/[원㎥,]/g, '').trim();
                const match = imgClean === srvClean;
                return (
                  <DataRow
                    key={i}
                    label={c.label}
                    imageVal={c.img}
                    serverVal={c.srv}
                    isMatch={match}
                    unit={(c as any).isNum ? '원' : ''}
                    noFormat={(c as any).noFormat}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* ──────── ④ DISCREPANCY ANALYSIS ──────── */}
        <section className="fade-in-up d-150" style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div>
              <p className="section-title" style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-outfit)' }}>
                <Shield style={{ width: 22, height: 22, color: 'var(--blue-600)', marginRight: 10, verticalAlign: 'bottom' }} />
                불일치 항목 상세 분석
              </p>
              <p className="section-sub" style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>AI가 감지한 위변조 의심 항목과 상세 내용</p>
            </div>
            {analysis.discrepancies.length > 0 && (
              <span className="chip chip-red" style={{ marginLeft: 'auto', padding: '6px 14px', fontSize: 13, fontWeight: 800 }}>
                {analysis.discrepancies.length}건 감지
              </span>
            )}
          </div>

          {analysis.discrepancies.length === 0 ? (
            <div className="card" style={{
              padding: '60px 24px', textAlign: 'center',
              background: 'linear-gradient(135deg, var(--success-bg) 0%, white 100%)',
              border: '1px solid var(--success-border)',
            }}>
              <CheckCircle2 style={{ width: 44, height: 44, color: 'var(--success)', margin: '0 auto 16px' }} />
              <p style={{ fontWeight: 800, fontSize: 18, color: 'var(--success-text)', marginBottom: 8, fontFamily: 'var(--font-outfit)' }}>
                불일치 항목 없음
              </p>
              <p style={{ fontSize: 14, color: 'var(--success-text)', opacity: 0.7, fontWeight: 500 }}>
                고지서 데이터가 서버 원본과 완전히 일치합니다.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* Header row (optional but cleaner as a list) */}
              <div style={{ 
                display: 'grid', gridTemplateColumns: 'minmax(220px, 1.8fr) 2fr 2fr 100px', 
                gap: 24, padding: '14px 28px', background: 'var(--bg-subtle)',
                borderBottom: '1px solid var(--border)', borderTopLeftRadius: 'var(--r-xl)', borderTopRightRadius: 'var(--r-xl)',
                fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                <div>분석 항목</div>
                <div>고지서 추출값</div>
                <div>아리수 원본값</div>
                <div style={{ textAlign: 'center' }}>위험도</div>
              </div>

              {analysis.discrepancies.map((d, i) => {
                const s = SEV[d.severity as Sev] ?? SEV.medium;
                const isCustomerNumber = d.field.includes('고객번호');
                const cleanImageVal = isCustomerNumber ? d.image_value?.replace(/,/g, '') : d.image_value;
                const cleanRealVal = isCustomerNumber ? d.real_value?.replace(/,/g, '') : d.real_value;
                const isFirst = i === 0;
                const isLast = i === analysis.discrepancies.length - 1;

                return (
                  <div key={i} style={{ 
                    display: 'grid', gridTemplateColumns: 'minmax(220px, 1.8fr) 2fr 2fr 100px', 
                    gap: 24, padding: '28px', background: 'white',
                    borderBottom: isLast ? 'none' : '1px solid var(--border-light)',
                    borderBottomLeftRadius: isLast ? 'var(--r-xl)' : 0,
                    borderBottomRightRadius: isLast ? 'var(--r-xl)' : 0,
                    alignItems: 'center'
                  }}>
                    {/* Field & Note */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{ 
                        marginTop: 2, width: 32, height: 32, borderRadius: '10px', 
                        background: d.severity === 'high' ? 'var(--danger-bg)' : 'white',
                        border: `1px solid ${d.severity === 'high' ? 'var(--danger-border)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {s.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)' }}>{d.field}</p>
                        {d.note && (
                          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5, wordBreak: 'keep-all' }}>{d.note}</p>
                        )}
                      </div>
                    </div>

                    {/* Extracted Box */}
                    <div style={{ padding: '14px 18px', borderRadius: 'var(--r-md)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', position: 'relative' }}>
                       <p style={{ fontSize: 10, color: 'var(--danger-text)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6, opacity: 0.7 }}>고지서 추출값</p>
                       <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--danger)', fontFamily: 'monospace' }}>{cleanImageVal || '–'}</p>
                    </div>

                    {/* Server Box */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <ArrowRight style={{ width: 16, height: 16, color: 'var(--text-muted)', flexShrink: 0 }} />
                      <div style={{ flex: 1, padding: '14px 18px', borderRadius: 'var(--r-md)', background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                        <p style={{ fontSize: 10, color: 'var(--success-text)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6, opacity: 0.7 }}>아리수 원본값</p>
                        <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--success)', fontFamily: 'monospace' }}>{cleanRealVal || '–'}</p>
                      </div>
                    </div>

                    {/* Severity chip */}
                    <div style={{ textAlign: 'right' }}>
                       <span className={s.cls}>
                         {s.icon}
                         {s.label}
                       </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ──────── ⑤ ARISU SERVER DETAIL ──────── */}
        <section className="fade-in-up d-200" style={{ marginBottom: 28 }}>
          <div style={{ marginBottom: 20 }}>
            <p className="section-title" style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-outfit)' }}>
              <Info style={{ width: 22, height: 22, color: 'var(--blue-600)', marginRight: 10, verticalAlign: 'bottom' }} />
              아리수 서버 상세 청구 내역
            </p>
            <p className="section-sub" style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>서울 아리수 사이버고객센터 원본 데이터</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {/* 상수도 */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--blue-600)' }} />
                <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)' }}>상수도</p>
              </div>
              {[
                { k: '기본요금', v: fmt(arisuData.waterBasicFee) },
                { k: '사용요금', v: fmt(arisuData.waterUsageRateFee) },
                { k: '연체금', v: fmt(arisuData.waterLateFee) },
              ].map(r => (
                <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{r.k}</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{r.v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', fontSize: 15 }}>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>합계</span>
                <span style={{ fontWeight: 900, color: 'var(--blue-700)', fontFamily: 'monospace' }}>{fmt(arisuData.waterFee)}</span>
              </div>
            </div>

            {/* 하수도 */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--cyan-600)' }} />
                <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)' }}>하수도</p>
              </div>
              {[
                { k: '사용요금', v: fmt(arisuData.sewageUsageRateFee) },
                { k: '연체금', v: fmt(arisuData.sewageLateFee) },
              ].map(r => (
                <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{r.k}</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{r.v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', fontSize: 15 }}>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>합계</span>
                <span style={{ fontWeight: 900, color: 'var(--cyan-600)', fontFamily: 'monospace' }}>{fmt(arisuData.sewageFee)}</span>
              </div>
            </div>

            {/* 기타 */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--text-muted)' }} />
                <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)' }}>기타 / 합계</p>
              </div>
              {[
                { k: '물이용부담금', v: fmt(arisuData.waterUsageFee) },
                { k: '차감금액', v: fmt(arisuData.discountAmount) },
                { k: '체납금액', v: fmt(arisuData.arrears) },
                { k: '미납금액', v: fmt(arisuData.unpaid) },
                { k: '납부기한', v: fmtRaw(arisuData.dueDate) },
                { k: '총 사용량', v: `${arisuData.waterUsage}㎥` },
              ].map(r => (
                <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{r.k}</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{r.v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', fontSize: 16 }}>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>납부금액</span>
                <span style={{ fontWeight: 900, color: 'var(--danger)', fontSize: 22, fontFamily: 'var(--font-outfit)' }}>
                  {fmt(arisuData.paymentAmount)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ──────── ⑥ RAW OCR ──────── */}
        {billData.rawOcrText && (
          <section className="fade-in-up d-300" style={{ marginBottom: 24 }}>
            <p className="section-title" style={{ marginBottom: 4 }}>
              <FileText style={{ width: 18, height: 18, color: 'var(--blue-600)' }} />
              OCR 원문 텍스트
            </p>
            <p className="section-sub" style={{ marginBottom: 16 }}>AI가 고지서 이미지에서 추출한 원본 텍스트</p>
            <div className="card" style={{ padding: '20px 24px' }}>
              <pre style={{
                fontFamily: 'monospace', fontSize: 12.5, color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.8, margin: 0,
              }}>
                {billData.rawOcrText}
              </pre>
            </div>
          </section>
        )}

        {/* ──────── ⑦ ACTION BUTTONS ──────── */}
        <div className="fade-in-up d-300" style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleReset}
            className="btn btn-primary"
            style={{ flex: 1, padding: '15px 24px', fontSize: 15 }}
            id="analyze-again-btn"
          >
            <RotateCcw style={{ width: 17, height: 17 }} />
            새 고지서 분석
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{ padding: '15px 22px', fontSize: 15 }}
            id="print-btn-2"
          >
            <Printer style={{ width: 17, height: 17 }} />
            리포트 인쇄
          </button>
        </div>
      </main>

      {/* ──────── FOOTER ──────── */}
      <footer className="site-footer">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            © 2026 scryn. Powered by Claude API &amp; Seoul Arisu Data
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green-500)', display: 'inline-block' }} />
            시스템 정상 작동 중
          </div>
        </div>
      </footer>
    </div>
  );
}
