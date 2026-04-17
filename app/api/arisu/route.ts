import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { ArisuServerData } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      searchMkey: string;
      searchNapgi: string;
      searchCsNm: string;
      ocrBand1?: string;
      ocrBand2?: string;
      epayNo?: string;
      levyYear?: string;
      levyMonth?: string;
      levyDay?: string;
      sujunNm?: string;
    };

    const {
      searchMkey,
      searchNapgi,
      searchCsNm,
      ocrBand1 = '',
      ocrBand2 = '',
      epayNo = '',
      levyYear = '',
      levyMonth = '',
      levyDay = '',
      sujunNm = searchCsNm,
    } = body;

    if (!searchMkey || !searchNapgi || !searchCsNm) {
      return NextResponse.json(
        { error: '고객번호, 납부년월, 사용자명은 필수 항목입니다.' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams();
    params.append('searchMkey', searchMkey.padStart(9, '0'));
    params.append('searchNapgi', searchNapgi);
    params.append('searchCsNm', searchCsNm);
    params.append('_m', 'm1_1');
    params.append('levyYear', levyYear);
    params.append('levyMonth', levyMonth);
    params.append('levyDay', levyDay);
    params.append('epayNo', epayNo);
    params.append('sujunNm', sujunNm);
    params.append('ocrBand1', ocrBand1);
    params.append('ocrBand2', ocrBand2);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let html: string;
    try {
      const response = await fetch(
        'https://i121.seoul.go.kr/cs/cyber/front/cgcalc/NR_cgJungInfo.do',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': 'https://i121.seoul.go.kr/cs/cyber/front/cgcalc/NR_cgJungInfo.do',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9',
          },
          body: params.toString(),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`아리수 서버 응답 오류: ${response.status}`);
      }

      html = await response.text();
    } finally {
      clearTimeout(timeout);
    }

    const arisuData = parseArisuHtml(html, searchMkey, searchNapgi);

    return NextResponse.json({ arisuData });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { error: '아리수 서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.' },
        { status: 504 }
      );
    }
    console.error('[/api/arisu] 오류:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '아리수 서버 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function parseArisuHtml(html: string, customerNumber: string, billingPeriod: string): ArisuServerData {
  const $ = cheerio.load(html);

  const clean = (text: string) => text.replace(/\s+/g, '').replace(/,/g, '').trim();
  const cleanDisplay = (text: string) => text.replace(/\s+/g, ' ').trim();

  // 납부금액 (totAmt hidden input)
  const totalPayment = clean($('#totAmt').attr('value') || '');

  // 총 사용금액 / 차감 / 납부 테이블 (table-type1 첫 번째)
  let totalUsageAmount = '';
  let discountAmount = '';
  let paymentAmount = '';
  $('table.table-type1').first().find('tbody tr td').each((i, el) => {
    const val = clean($(el).text());
    if (i === 0) totalUsageAmount = val;
    else if (i === 1) discountAmount = val;
    else if (i === 2) paymentAmount = val;
  });

  // 상수도 / 하수도 / 물이용부담금 테이블
  let waterBasicFee = '';
  let waterUsageRateFee = '';
  let waterLateFee = '';
  let sewageUsageRateFee = '';
  let sewageLateFee = '';
  let waterUsageFeeRate = '';
  let waterUsageFeeLateFee = '';
  let waterFeeTotal = '';
  let sewageFeeTotal = '';
  let waterUsageFeeTotal = '';

  // 두 번째 table-type1 = 내역|상수도|하수도|물이용부담금
  const feeTable = $('table.table-type1').eq(1);
  feeTable.find('tbody tr').each((rowIdx, row) => {
    const cells = $(row).find('td');
    const label = clean($(cells[0]).text());
    const water = clean($(cells[1]).text());
    const sewage = clean($(cells[2]).text());
    const usage = clean($(cells[3]).text());

    if (label === '기본요금') {
      waterBasicFee = water;
    } else if (label === '사용요금') {
      waterUsageRateFee = water;
      sewageUsageRateFee = sewage;
      waterUsageFeeRate = usage;
    } else if (label === '연체금') {
      waterLateFee = water;
      sewageLateFee = sewage;
      waterUsageFeeLateFee = usage;
    }
  });
  feeTable.find('tfoot tr td').each((i, el) => {
    const val = clean($(el).text());
    if (i === 1) waterFeeTotal = val;
    else if (i === 2) sewageFeeTotal = val;
    else if (i === 3) waterUsageFeeTotal = val;
  });

  // 사용량 테이블 (검침 정보)
  let waterUsage = '';
  let groundwaterUsage = '';
  let prevMeterWater = '';
  let currMeterWater = '';

  $('table.table-type1').each((_, table) => {
    const header = cleanDisplay($(table).find('thead th').first().text());
    if (header.includes('정기검침일')) {
      $(table).find('tbody tr').each((_, row) => {
        const cells = $(row).find('td');
        const label = cleanDisplay($(cells.eq(0)).text() + $(cells.eq(1)).text());
        if (label.includes('사용량')) {
          waterUsage = clean($(cells.eq(2)).text());
          groundwaterUsage = clean($(cells.eq(3)).text());
        } else if (label.includes('9월지침') || label.includes('지침')) {
          const th = cleanDisplay($(cells.eq(1)).text());
          if (th.includes('지침') && !th.includes('이전')) {
            currMeterWater = clean($(cells.eq(2)).text());
          } else {
            prevMeterWater = clean($(cells.eq(2)).text());
          }
        }
      });
    }
  });

  // 체납 / 미납
  let arrears = '0';
  let unpaid = '0';
  $('table.table-type1.pink tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    const label = clean($(cells.eq(0)).text());
    const val = clean($(cells.eq(1)).text());
    if (label === '체납금액') arrears = val || '0';
    else if (label === '미납금액') unpaid = val || '0';
  });

  // 전자납부번호
  const epayNoFromHtml = clean($('#epayNo').attr('value') || '');
  // 납부기한 (고지서 텍스트)
  const dueDateText = cleanDisplay($('.yt').eq(1).text()).replace(/납부기한[:：\s]*/g, '');
  // 주소
  const addressText = cleanDisplay($('.t-b label').next().text());

  // 고객명 마스킹 해제 없이 그대로 사용
  const maskedName = cleanDisplay($('.t-b').text().match(/성명[:：\s]*([\S]+)/)?.[1] || '');

  return {
    totalAmount: totalUsageAmount || totalPayment,
    discountAmount: discountAmount || '0',
    paymentAmount: paymentAmount || totalPayment,
    waterFee: waterFeeTotal,
    sewageFee: sewageFeeTotal,
    waterUsageFee: waterUsageFeeTotal,
    waterBasicFee,
    waterUsageRateFee,
    waterLateFee,
    sewageUsageRateFee,
    sewageLateFee,
    waterUsageFeeLateFee,
    waterUsage,
    groundwaterUsage,
    prevMeterWater,
    currMeterWater,
    arrears,
    unpaid,
    customerNumber: customerNumber.padStart(9, '0'),
    epayNo: epayNoFromHtml,
    billingPeriod,
    customerName: maskedName,
    dueDate: dueDateText,
    address: addressText || '',
  };
}
