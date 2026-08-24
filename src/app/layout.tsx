import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GEARVN - Thiết bị Gaming & Công nghệ",
  description: "Máy tính, laptop và thiết bị gaming chính hãng.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
