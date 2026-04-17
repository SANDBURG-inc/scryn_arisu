import type { Metadata } from 'next';
import { Geist, Geist_Mono, Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AnalysisProvider } from '@/context/AnalysisContext';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'scryn | AI 수도요금 고지서 위변조 탐지',
  description: '업로드된 수도 요금 고지서의 데이터를 AI로 추출하고, 서울 아리수 서버의 실제 청구 데이터와 교차 검증하여 위변조 여부를 탐지합니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} ${jakarta.variable} antialiased`}>
        <AnalysisProvider>
          {children}
        </AnalysisProvider>
      </body>
    </html>
  );
}
