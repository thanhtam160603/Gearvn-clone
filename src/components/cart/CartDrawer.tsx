"use client";

import Link from "next/link";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { FiShoppingCart, FiX } from "react-icons/fi";

import { useAppSelector, useAppDispatch } from "@/hooks/redux-hooks";
import {
    selectCartDrawerOpen,
    selectDetailedCartItems,
    selectCartSubtotal,
} from "@/store/cart-selectors";
import { closeDrawer } from "@/store/cart-slice";
import CartItemRow from "./CartItemRow";
import { formatPrice } from "@/lib/format-price";

export default function CartDrawer() {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector(selectCartDrawerOpen);
    const cartItems = useAppSelector(selectDetailedCartItems);
    const subtotal = useAppSelector(selectCartSubtotal);
    const handleClose = () => {
        dispatch(closeDrawer());
    }

    return (
        <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/50 transition-opacity" aria-hidden="true" />
            <div className="fixed inset-0 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-8 sm:pl-16">
                        <DialogPanel className="pointer-events-auto flex h-full w-screen max-w-[450px] flex-col bg-neutral-50 shadow-2xl">
                            <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4">
                                <DialogTitle className="text-lg font-semibold text-neutral-900">
                                    Giỏ hàng của bạn
                                </DialogTitle>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="rounded p-1 text-neutral-400 transition hover:text-red-600"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>
                            {cartItems.length === 0 ? (
                                <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                                    <FiShoppingCart size={48} className="mb-4 text-neutral-400" />
                                    <h2 className="text-lg font-semibold text-neutral-900">Giỏ hàng của bạn đang trống</h2>
                                    <p className="mt-2 text-sm text-neutral-500">
                                        Hãy thêm sản phẩm vào giỏ hàng!
                                    </p>

                                    <Link
                                        href="/"
                                        onClick={handleClose}
                                        className="mt-6 rounded bg-[var(--gearvn-red)] px-4 py-2 text-sm font-semibold text-white transition "
                                    >
                                        Tiếp tục mua sắm
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                                        {cartItems.map((item) => (
                                            <CartItemRow key={item.productId} item={item} variant="drawer"/>
                                        ))}
                                    </div>
                                     <div className="shrink-0 border-t border-neutral-200 bg-white p-4">
                                        <div className="mb-3 flex items-center justify-between text-sm">
                                            <span className="text-neutral-600">Tạm tính</span>
                                            <strong className="text-base text-neutral-900">
                                                {formatPrice(subtotal)}
                                            </strong>
                                        </div>

                                        <Link
                                            href="/cart"
                                            onClick={handleClose}
                                            className="flex h-12 items-center justify-center rounded-lg bg-[var(--gearvn-red)] text-sm font-bold text-white transition hover:bg-red-700"
                                        >
                                            Xem giỏ hàng — {formatPrice(subtotal)}
                                        </Link>
                                    </div>
                                </>
                            )}
                        </DialogPanel>
                    </div>
                </div>
            </div>
        </Dialog>
    )
}