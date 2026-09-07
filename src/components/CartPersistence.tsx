"use client";

import { useEffect } from "react";
import { products } from "@/data/products";
import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
import { hydrateCart } from "@/store/cart-slice";
import {
  selectCartHydrated,
  selectCartItems,
} from "@/store/cart-selectors";
import type { CartItem } from "@/types/cart";

const CART_STORAGE_KEY = "gearvn-cart";

function parseStoredCart(value: string | null): CartItem[] {
  if (!value) return [];

  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) return [];

  return parsed.flatMap((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      !("productId" in item) ||
      !("quantity" in item) ||
      typeof item.productId !== "string" ||
      typeof item.quantity !== "number" ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return [];
    }

    const product = products.find(({ id }) => id === item.productId);
    if (!product || product.stockQuantity <= 0) return [];

    return [{
      productId: item.productId,
      quantity: Math.min(item.quantity, product.stockQuantity),
    }];
  });
}

export default function CartPersistence() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const isHydrated = useAppSelector(selectCartHydrated);

  useEffect(() => {
    try {
      dispatch(hydrateCart(parseStoredCart(localStorage.getItem(CART_STORAGE_KEY))));
    } catch {
      dispatch(hydrateCart([]));
    }
  }, [dispatch]);

  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // The cart still works in Redux when browser storage is unavailable.
    }
  }, [isHydrated, items]);

  return null;
}
