import type { Product } from './product';

export type CartItem = {
  productId: string;
  quantity: number;
};

export type CartState ={
    items: CartItem[];
    isDrawerOpen: boolean;
    isHydrated: boolean;
}

export type DetailedCartItem = CartItem & {
    product: Product;
    totalPrice: number;
};

type ProductCartPayload = {
  productId: string;
  stockQuantity: number;
};

type SetQuantityPayload = ProductCartPayload & {
  quantity: number;
};

export type ShippingFormData = {
  fullName: string;
  phone: string;
  email: string;
  citizenId: string;

  deliveryMethod: "home" | "store";
  address: string;

  shippingMethod: "standard" | "express";

  specialRequests: {
    installation: boolean;
    otherReceiver: boolean;
    technicalSupport: boolean;
  };

  note: string;
  paymentMethod: "cod";
};