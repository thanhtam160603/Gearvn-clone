import { createSlice } from '@reduxjs/toolkit';
import type { CartState } from '../types/cart';

const initialState : CartState = {
    items: [],
    isDrawerOpen: false,
    isHydrated: false,
};

function clampQuantity(quantity: number, stockQuantity: number) {
    if (!Number.isInteger(quantity) || stockQuantity <= 0) return 0;

    return Math.min(
        stockQuantity,
        Math.max(1, quantity)
    )
}

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addItem: (state, action: { payload: { productId: string; stockQuantity: number } }) => {
            const { productId, stockQuantity } = action.payload;
            if (stockQuantity <= 0) return;
            const existingItem = state.items.find(item => item.productId === productId);
            if (existingItem) {
                existingItem.quantity = clampQuantity(existingItem.quantity + 1, stockQuantity);
            } else {
                state.items.push({ productId, quantity: clampQuantity(1, stockQuantity) });
            }
        },
        increaseQuantity: (state, action: { payload: { productId: string; stockQuantity: number } }) => {
            const { productId, stockQuantity } = action.payload;
            const existingItem = state.items.find(item => item.productId === productId);
            if (existingItem) {
                existingItem.quantity = clampQuantity(existingItem.quantity + 1, stockQuantity);
            }
        },
        decreaseQuantity: (state, action: { payload: { productId: string; stockQuantity: number } }) => {
            const { productId, stockQuantity } = action.payload;
            const existingItem = state.items.find(item => item.productId === productId);
            if (existingItem) {
                existingItem.quantity = clampQuantity(existingItem.quantity - 1, stockQuantity);
            }
        },
        setQuantity: (state, action: { payload: { productId: string; stockQuantity: number; quantity: number } }) => {
            const { productId, stockQuantity, quantity } = action.payload;
            const existingItem = state.items.find(item => item.productId === productId);
            if (existingItem) {
                existingItem.quantity = clampQuantity(quantity, stockQuantity);
            }
        },
        removeItem: (state, action: { payload: { productId: string } }) => {
            state.items = state.items.filter(item => item.productId !== action.payload.productId);
        },
        clearCart: (state) => {
            state.items = [];
        },
        openDrawer: (state) => {
            state.isDrawerOpen = true;
        },

        closeDrawer: (state) => {
            state.isDrawerOpen = false;
        },
        setHydrated: (state, action: { payload: boolean }) => {
            state.isHydrated = action.payload;
        }

    },
});

export const { addItem, increaseQuantity, decreaseQuantity, setQuantity, removeItem, clearCart, openDrawer, closeDrawer, setHydrated } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;