import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { BillImageData, ArisuServerData, AnalysisResult } from '@/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { billData, arisuData }: { billData: BillImageData; arisuData: ArisuServerData } =
      await req.json();

    const formatAmount = (val: string) =>
      val ? `${Number(val).toLocaleString('ko-KR')}원` : '정보없음';

    const systemPrompt = `당신은 금융/공문서 위변조 탐지 전문가입니다. 
제공된 '고지서 이미지에서 추출한 데이터'와 '아리수 서버 실제 데이터'를 비교 분석하세요.

분석 원칙:
1. 금액 차이가 있으면 반드시 위변조로 판단하고 정확한 차액을 계산하세요.
2. 수치가 없거나 비교 불가한 항목은 무시하세요.
3. severity 기준: high = 금액/사용량 불일치, medium = 날짜/기간 불일치, low = 미미한 차이

반드시 다음 JSON 형식으로만 응답하세요 (Markdown 코드블록 없이 순수 JSON):
{
  "is_forged": true 또는 false,
  "confidence": "high" 또는 "medium" 또는 "low",
  "summary_text": "한국어로 작성된 종합 분석 결론 (2-4문장, 구체적인 금액 차이 포함)",
  "discrepancies": [
    {
      "field": "항목명",
      "image_value": "고지서 이미지 값",
      "real_value": "서버 실제 값",
      "severity": "high",
      "note": "추가 설명 (선택)"
    }
  ]
}`;

    const userContent = `## 고지서 이미지에서 추출한 데이터 (조작 의심)
- 고객번호: ${billData.customerNumber}
- 납부년월: ${billData.billingPeriod}
- 사용자명: ${billData.customerName}
- 총 납부금액: ${formatAmount(billData.totalAmount)}
- 상·하수도 사용량: ${billData.waterUsage}㎥
- 상수도요금 합계: ${formatAmount(billData.waterFee)}
- 하수도요금 합계: ${formatAmount(billData.sewageFee)}
- 물이용부담금 합계: ${formatAmount(billData.waterUsageFee || '')}
- 기본요금: ${formatAmount(billData.waterBasicFee || '')}
- 납부기한: ${billData.dueDate || '알 수 없음'}
- 사용기간: ${billData.usagePeriod || '알 수 없음'}

## 아리수 서버 실제 데이터 (Ground Truth)
- 고객번호: ${arisuData.customerNumber}
- 납부년월: ${arisuData.billingPeriod}
- 총 사용금액: ${formatAmount(arisuData.totalAmount)}
- 차감금액: ${formatAmount(arisuData.discountAmount)}
- 실제 납부금액: ${formatAmount(arisuData.paymentAmount)}
- 상수도요금 합계: ${formatAmount(arisuData.waterFee)}
  - 기본요금: ${formatAmount(arisuData.waterBasicFee)}
  - 사용요금: ${formatAmount(arisuData.waterUsageRateFee)}
  - 연체금: ${formatAmount(arisuData.waterLateFee)}
- 하수도요금 합계: ${formatAmount(arisuData.sewageFee)}
  - 사용요금: ${formatAmount(arisuData.sewageUsageRateFee)}
  - 연체금: ${formatAmount(arisuData.sewageLateFee)}
- 물이용부담금 합계: ${formatAmount(arisuData.waterUsageFee)}
- 사용량(상·하수도): ${arisuData.waterUsage}㎥
- 사용량(지하수): ${arisuData.groundwaterUsage}㎥
- 납부기한: ${arisuData.dueDate}
- 체납금액: ${formatAmount(arisuData.arrears)}
- 미납금액: ${formatAmount(arisuData.unpaid)}

위 두 데이터를 비교하여 위변조 여부와 불일치 항목을 분석하세요.`;

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('LLM 응답에서 JSON을 파싱할 수 없습니다.');
    }

    const analysisResult: AnalysisResult = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(analysisResult.discrepancies)) {
      analysisResult.discrepancies = [];
    }

    return NextResponse.json({ analysis: analysisResult });
  } catch (err: unknown) {
    console.error('[/api/llm-analyze] 오류:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
