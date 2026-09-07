import { createSelector } from '@reduxjs/toolkit';
import { products } from '../data/products';
import type { RootState } from '@/lib/store';
import type { DetailedCartItem  } from '@/types/cart';

export const selectCartItems = (state: RootState) => state.cart.items;

export const selectCartHydrated = (state: RootState) => state.cart.isHydrated;

export const selectCartDrawerOpen = (state: RootState) => state.cart.isDrawerOpen;

export const selectDetailedCartItems = createSelector(
    [selectCartItems],
    (items) : DetailedCartItem[] => 
        items.flatMap((item) => {
            const product = products.find((product) => product.id === item.productId);
            if (!product) return [];

            return [
                {
                    ...item,
                    product,
                    totalPrice: product.salePrice * item.quantity
                }
            ]
        }
    )
);

export const selectCartTotalQuantity = createSelector(
    [selectCartItems],
    (items) => 
        items.reduce(
            (total, item) => total + item.quantity,
            0,
        )
);

export const selectCartSubtotal = createSelector(
  [selectDetailedCartItems],
  (items) =>
    items.reduce(
      (total, item) => total + item.totalPrice,
      0,
    ),
);