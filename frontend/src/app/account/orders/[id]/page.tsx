import AccountOrderDetail from "@/components/account/AccountOrderDetail";
export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AccountOrderDetail id={id} />;
}
