export type AccountOrderStatus =
  | "all"
  | "processing"
  | "shipping"
  | "completed"
  | "cancelled"
  | "returned";

export type AccountOrder = {
  id: string;
  code: string;
  productNames: string[];
  status: Exclude<AccountOrderStatus, "all">;
  total: number;
  createdAt: string;
};

export type WarrantyRequest = {
  id: string;
  code: string;
  productName: string;
  status: "received" | "processing" | "completed";
  createdAt: string;
};
