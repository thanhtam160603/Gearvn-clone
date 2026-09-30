import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InternalHttpClient, UpstreamError } from './internal-http.client';
import {
  productResolveSchema, reservationSchema, stockReturnSchema, type ReservationLine,
} from '../checkout/checkout-contracts';

@Injectable()
export class CatalogClientService {
    private readonly base: string;
    constructor(config: ConfigService, private readonly http: InternalHttpClient) {
        this.base = config.getOrThrow<string>('CATALOG_SERVICE_URL');
    }
    resolveProducts(productIds: string[], requestId?: string) {
        return this.http.request(this.base, '/internal/catalog/products/resolve',
        'POST', { productIds }, productResolveSchema, requestId);
    }
    reserve(lines: ReservationLine[], key: string, expiresAt: string, requestId?: string) {
        return this.http.request(this.base, '/internal/inventory/reservations', 'POST',
        { lines, expiresAt }, reservationSchema, requestId, { 'idempotency-key': key });
    }
    async findReservationByKey(key: string, requestId?: string) {
        try {
        return await this.http.request(this.base,
            '/internal/inventory/reservations/by-key/' + encodeURIComponent(key),
            'GET', undefined, reservationSchema, requestId);
        } catch (error) {
        if (error instanceof UpstreamError && error.upstreamStatus === 404 &&
            error.code === 'RESERVATION_NOT_FOUND') return null;
        throw error;
        }
    }
    confirm(id: string, requestId?: string) {
        return this.http.request(this.base,
        '/internal/inventory/reservations/' + encodeURIComponent(id) + '/confirm',
        'POST', {}, reservationSchema, requestId);
    }
    release(id: string, requestId?: string) {
        return this.http.request(this.base,
        '/internal/inventory/reservations/' + encodeURIComponent(id) + '/release',
        'POST', {}, reservationSchema, requestId);
    }
    returnStock(orderId: string, reservationId: string, requestId?: string) {
        return this.http.request(this.base, '/internal/inventory/returns', 'POST',
        { orderId, reservationId }, stockReturnSchema, requestId,
        { 'idempotency-key': 'cancel:' + orderId });
    }
}