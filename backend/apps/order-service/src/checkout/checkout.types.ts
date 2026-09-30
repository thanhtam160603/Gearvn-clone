import type { OrderView } from '../orders/order-view';
export type CheckoutResult =
  | { kind: 'completed'; order: OrderView }
  | { kind: 'pending'; checkoutRequestId: string };