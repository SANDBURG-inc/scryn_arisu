export interface BillImageData {
  customerNumber: string;       // 고객번호 (searchMkey)
  billingPeriod: string;        // 납부년월 (searchNapgi) e.g. "2024-09"
  customerName: string;         // 사용자명 (searchCsNm)
  totalAmount: string;          // 총 납부금액
  waterUsage: string;           // 상·하수도 사용량
  groundwaterUsage?: string;    // 지하수 사용량
  waterFee: string;             // 상수도요금 계
  sewageFee: string;            // 하수도요금 계
  waterUsageFee?: string;       // 물이용부담금 계
  waterBasicFee?: string;       // 기본요금
  dueDate?: string;             // 납부기한
  usagePeriod?: string;         // 사용기간
  // 아리수 API 추가 파라미터 (고지서 바코드에서 추출 or 직접 입력)
  ocrBand1?: string;
  ocrBand2?: string;
  epayNo?: string;
  levyYear?: string;
  levyMonth?: string;
  levyDay?: string;
  sujunNm?: string;
  rawOcrText?: string;
}

export interface ArisuServerData {
  totalAmount: string;
  discountAmount: string;
  paymentAmount: string;
  waterFee: string;
  sewageFee: string;
  waterUsageFee: string;
  waterBasicFee: string;
  waterUsageRateFee: string;
  waterLateFee: string;
  sewageUsageRateFee: string;
  sewageLateFee: string;
  waterUsageFeeLateFee: string;
  waterUsage: string;
  groundwaterUsage: string;
  prevMeterWater: string;
  currMeterWater: string;
  arrears: string;
  unpaid: string;
  customerNumber: string;
  epayNo: string;
  billingPeriod: string;
  customerName: string;
  dueDate: string;
  address: string;
}

export interface Discrepancy {
  field: string;
  image_value: string;
  real_value: string;
  severity: 'high' | 'medium' | 'low';
  note?: string;
}

export interface AnalysisResult {
  is_forged: boolean;
  summary_text: string;
  discrepancies: Discrepancy[];
  confidence: 'high' | 'medium' | 'low';
}

export interface AnalysisResponse {
  billData: BillImageData;
  arisuData: ArisuServerData;
  analysis: AnalysisResult;
  imageBase64?: string;
}

export type AnalysisStep =
  | 'idle'
  | 'ocr'
  | 'arisu'
  | 'llm'
  | 'done'
  | 'error';
