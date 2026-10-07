export type CartItem = {
  productId: string;
  quantity: number;
  selected: boolean;
  name: string | null;
  slug: string | null;
  image: string | null;
  salePrice: number | null;
  available: number;
  status: string;
  canCheckout: boolean;
  lineTotal: number;
};

export type CartView = {
  cartId: string;
  version: number;
  items: CartItem[];
  subtotal: number;
  selectedSubtotal: number;
};

export type CartState ={
    view: CartView | null;
    isDrawerOpen: boolean;
    isHydrated: boolean;
    status: "idle" | "loading" | "ready" | "error";
    error: string | null;
    warning: string | null;
}

export type DetailedCartItem = CartItem;

export type ShippingFormData = {
  fullName: string;
  phone: string;
  addressLine: string;
  ward: string;
  district: string;
  city: string;
  note: string;
  paymentMethod: "COD";
};
