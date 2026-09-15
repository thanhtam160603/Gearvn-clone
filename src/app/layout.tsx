import type { Metadata } from "next";
import "./globals.css";
import StoreProvider from "@/components/common/StoreProvider";
import CartDrawer from "@/components/cart/CartDrawer";
import CartPersistence from "@/components/cart/CartPersistence";
import AuthBootstrap from "@/components/auth/AuthBootstrap";
import GlobalLoginDialog from "@/components/auth/GlobalLoginDialog";

export const metadata: Metadata = {
  title: "GEARVN - Thiết bị Gaming & Công nghệ",
  description: "Máy tính, laptop và thiết bị gaming chính hãng.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased scroll-smooth" data-scroll-behavior="smooth">
      <body className="flex min-h-full flex-col">
        <StoreProvider>
          <CartPersistence />
          <AuthBootstrap />
          {children}
          <GlobalLoginDialog />
          <CartDrawer />
        </StoreProvider>
      </body>
    </html>
  );
}
