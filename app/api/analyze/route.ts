import { NextRequest, NextResponse } from 'next/server';
import { BillImageData, ArisuServerData, AnalysisResult } from '@/types';

export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin;

  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: '이미지 파일이 없습니다.' }, { status: 400 });
    }

    // ── Step 1: OCR ──────────────────────────────────────────────
    const ocrFormData = new FormData();
    ocrFormData.append('image', imageFile);

    const ocrRes = await fetch(`${origin}/api/ocr`, {
      method: 'POST',
      body: ocrFormData,
    });

    if (!ocrRes.ok) {
      const err = await ocrRes.json();
      return NextResponse.json(
        { error: `OCR 오류: ${err.error || '알 수 없는 오류'}`, step: 'ocr' },
        { status: ocrRes.status }
      );
    }

    const { billData, imageBase64, mediaType }: {
      billData: BillImageData;
      imageBase64: string;
      mediaType: string;
    } = await ocrRes.json();

    if (!billData.customerNumber || !billData.billingPeriod || !billData.customerName) {
      return NextResponse.json(
        {
          error: '고지서에서 필수 정보(고객번호, 납부년월, 사용자명)를 추출할 수 없습니다. 선명한 이미지로 다시 시도해주세요.',
          step: 'ocr',
          billData,
        },
        { status: 422 }
      );
    }

    // ── Step 2: 아리수 서버 조회 ──────────────────────────────────
    const arisuRes = await fetch(`${origin}/api/arisu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchMkey: billData.customerNumber,
        searchNapgi: billData.billingPeriod,
        searchCsNm: billData.customerName,
        ocrBand1: billData.ocrBand1 || '',
        ocrBand2: billData.ocrBand2 || '',
        epayNo: billData.epayNo || '',
        levyYear: billData.levyYear || '',
        levyMonth: billData.levyMonth || '',
        levyDay: billData.levyDay || '',
        sujunNm: billData.sujunNm || billData.customerName,
      }),
    });

    if (!arisuRes.ok) {
      const err = await arisuRes.json();
      return NextResponse.json(
        { error: `아리수 조회 오류: ${err.error || '알 수 없는 오류'}`, step: 'arisu', billData },
        { status: arisuRes.status }
      );
    }

    const { arisuData }: { arisuData: ArisuServerData } = await arisuRes.json();

    // ── Step 3: LLM 분석 ─────────────────────────────────────────
    const llmRes = await fetch(`${origin}/api/llm-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billData, arisuData }),
    });

    if (!llmRes.ok) {
      const err = await llmRes.json();
      return NextResponse.json(
        { error: `AI 분석 오류: ${err.error || '알 수 없는 오류'}`, step: 'llm', billData, arisuData },
        { status: llmRes.status }
      );
    }

    const { analysis }: { analysis: AnalysisResult } = await llmRes.json();

    return NextResponse.json({
      billData,
      arisuData,
      analysis,
      imageBase64,
      mediaType,
    });
  } catch (err: unknown) {
    console.error('[/api/analyze] 오류:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '분석 중 알 수 없는 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
