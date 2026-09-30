import type { RequestWithId } from '@app/common';
export type OrderUser = { id: string; role: 'CUSTOMER' | 'SUPPORT' };
export type OrderRequest = RequestWithId & { user: OrderUser };