import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InternalHttpClient } from './internal-http.client';
import { cartResponseSchema, cleanupSchema, type CartSnapshot } from '../checkout/checkout-contracts';

@Injectable()
export class CartClientService {
    private readonly base: string;
    constructor(config: ConfigService, private readonly http: InternalHttpClient) {
        this.base = config.getOrThrow<string>('CART_SERVICE_URL');
    }
    getSelectedSnapshot(userId: string, requestId?: string) {
        return this.http.request(this.base, '/internal/cart/checkout-snapshot', 'GET',
        undefined, cartResponseSchema, requestId, { 'x-user-id': userId });
    }
    cleanup(userId: string, orderId: string, snapshot: CartSnapshot, requestId?: string) {
        return this.http.request(this.base, '/internal/cart/checkout-cleanup', 'POST',
        { userId, orderId, cartId: snapshot.cartId, lines: snapshot.lines },
        cleanupSchema, requestId);
    }
}