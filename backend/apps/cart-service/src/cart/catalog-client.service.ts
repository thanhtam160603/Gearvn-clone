import { BadGatewayException, GatewayTimeoutException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { z } from "zod";
import type { CartEnv } from "../config/cart-env";

const productSchema = z.object({
  id: z.string(), 
  slug: z.string(), 
  name: z.string(), 
  image: z.string().nullable(),
  salePrice: z.number().int().nonnegative(),
  available: z.number().int().nonnegative(), 
  status: z.string(),
});
const resolveSchema = z.object({
  items: z.array(productSchema), missingProductIds: z.array(z.string()),
});
export type ResolvedProduct = z.infer<typeof productSchema>;

@Injectable()
export class CatalogClientService {
    private readonly url: URL;
    constructor(
        private readonly config: ConfigService<CartEnv, true>
    ) {
        this.url = new URL("/internal/catalog/products/resolve", this.config.get("CATALOG_SERVICE_URL", { infer: true }));
    }

    async resolve(productIds: string[], requestId?: string) {
        if (productIds.length === 0) return { items: [], missingProductIds: [] };
        let response: globalThis.Response;
        try{
                response = await fetch(this.url, {
                method: "POST",
                signal: AbortSignal.timeout(5000),
                headers: {
                    "Content-Type": "application/json",
                    ...(requestId ? { "X-Request-Id": requestId } : {}),
                    'x-internal-service-key': this.config.get('INTERNAL_SERVICE_KEY', { infer: true }),
                },
                body: JSON.stringify({ productIds }),
            });

        } catch (error: unknown) {
            if (error instanceof Error && error.name === "TimeoutError") {
                throw new GatewayTimeoutException("Catalog phản hồi quá chậm");
            }
            throw new BadGatewayException("Không kết nối được Catalog");
        }
        if (!response.ok) throw new BadGatewayException(`Catalog service returned ${response.status}`);
        try {
            return resolveSchema.parse(await response.json());
        } catch {
            throw new BadGatewayException("Catalog trả dữ liệu không đúng contract");
        }
    }

}