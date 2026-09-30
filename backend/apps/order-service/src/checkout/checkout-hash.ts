import { createHash } from 'node:crypto';
import type { CheckoutDto } from './dto/checkout.dto';

export function checkoutInput(dto: CheckoutDto) {
    const address = {
        recipientName: dto.recipientName.trim(),
        phone: dto.phone.trim(),
        addressLine: dto.addressLine.trim(),
        ward: dto.ward.trim(),
        district: dto.district.trim(),
        city: dto.city.trim(),
        note: dto.note?.trim() ?? null,
    };
    const hash = createHash('sha256').update(JSON.stringify({ ...address, paymentMethod: 'COD'})).digest('hex');
    return { hash, address };
}