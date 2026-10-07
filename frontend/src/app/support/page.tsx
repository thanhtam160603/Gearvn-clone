import AppHeader from "@/components/common/AppHeader";
import AppFooter from "@/components/common/AppFooter";
import SupportChat from "@/components/chat/SupportChat";

export default function SupportPage() {
  return (
    <>
      <AppHeader />
      <main className="container-shell flex-1 py-6">
        <SupportChat />
      </main>
      <AppFooter />
    </>
  );
}
