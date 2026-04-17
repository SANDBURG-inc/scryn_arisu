import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { BillImageData } from '@/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: '이미지 파일이 없습니다.' }, { status: 400 });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mediaType = (imageFile.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

    const systemPrompt = `당신은 수도 요금 고지서 전문 분석가입니다. 제공된 고지서 이미지에서 다음 항목들을 정확하게 추출하세요. 
반드시 다음 JSON 형식으로만 응답하세요. 확인 불가한 항목은 빈 문자열로 두세요:
{
  "customerNumber": "고객번호 (숫자 9자리, 예: 038636616)",
  "billingPeriod": "납부년월 YYYY-MM 형식, 예: 2024-09",
  "customerName": "사용자명/회사명",
  "totalAmount": "납부금액 (숫자만, 예: 1753420)",
  "waterUsage": "상하수도 사용량 (숫자만, 예: 290)",
  "groundwaterUsage": "지하수 사용량 (숫자만, 없으면 빈 값)",
  "waterFee": "상수도요금 합계 (숫자만)",
  "sewageFee": "하수도요금 합계 (숫자만)",
  "waterUsageFee": "물이용부담금 합계 (숫자만)",
  "waterBasicFee": "기본요금 (숫자만)",
  "dueDate": "납부기한 (예: 2024년 9월 30일)",
  "usagePeriod": "사용기간 (예: 2024년 8월 2일 ~ 2024년 9월 1일)",
  "ocrBand1": "고지서 하단 바코드 첫번째 줄 숫자 (있는 경우)",
  "ocrBand2": "고지서 하단 바코드 두번째 줄 숫자 (있는 경우)",
  "epayNo": "전자납부번호 (있는 경우, 숫자만)",
  "levyYear": "부과년도 (예: 2026)",
  "levyMonth": "부과월 (예: 4)",
  "levyDay": "부과일 (예: 15)",
  "sujunNm": "수준명(사용자명과 동일한 경우 많음)"
}`;

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: '위 수도 요금 고지서 이미지에서 모든 항목을 추출하여 JSON으로 응답하세요.',
            },
          ],
        },
      ],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

    // JSON 파싱
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Claude OCR 응답에서 JSON을 파싱할 수 없습니다.');
    }

    const billData: BillImageData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ billData, imageBase64: base64, mediaType });
  } catch (err: unknown) {
    console.error('[/api/ocr] 오류:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'OCR 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
