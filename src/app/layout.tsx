import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MISO 구매요청서 처리 대시보드",
  description: "구매요청서를 업로드하여 이메일을 자동 생성하는 워크플로우 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
