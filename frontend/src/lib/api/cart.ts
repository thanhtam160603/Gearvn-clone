import { apiClient, authClient } from "./client";
import type { CartView } from "@/types/cart";

const path = "/api/cart";
const cartClient = (authenticated: boolean) => authenticated ? authClient : apiClient;

export async function getCart(authenticated: boolean): Promise<CartView> {
  const { data } = await cartClient(authenticated).get<CartView>(path);
  return data;
}

export async function addCartItem(
  productId: string,
  quantity: number,
  authenticated: boolean,
): Promise<void> {
  await cartClient(authenticated).post(`${path}/items`, { productId, quantity });
}

export async function setCartQuantity(
  productId: string,
  quantity: number,
  authenticated: boolean,
): Promise<void> {
  await cartClient(authenticated).patch(`${path}/items/${encodeURIComponent(productId)}`, { quantity });
}

export async function setCartSelection(
  productId: string,
  selected: boolean,
  authenticated: boolean,
): Promise<void> {
  await cartClient(authenticated).patch(`${path}/items/${encodeURIComponent(productId)}/selection`, { selected });
}

export async function removeCartItem(productId: string, authenticated: boolean): Promise<void> {
  await cartClient(authenticated).delete(`${path}/items/${encodeURIComponent(productId)}`);
}

export async function clearServerCart(authenticated: boolean): Promise<void> {
  await cartClient(authenticated).delete(path);
}

export async function mergeGuestCart(): Promise<{ clampedProductIds: string[] }> {
  const { data } = await authClient.post<{ clampedProductIds: string[] }>(`${path}/merge`);
  return data;
}
