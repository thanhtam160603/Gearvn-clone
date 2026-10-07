"use client";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
import { initializeCart, resetCart } from "@/store/cart-slice";
export default function CartPersistence() {
  const dispatch = useAppDispatch();
  const authInitialized = useAppSelector((state) => state.auth.initialized);
  const userId = useAppSelector((state) => state.auth.user?.id ?? null);
  useEffect(() => {
    if (!authInitialized) return;
    dispatch(resetCart());
    void dispatch(initializeCart());
  }, [dispatch, authInitialized, userId]);
  return null;
}
