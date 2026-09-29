import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Request, Response } from "express";
import type { CartEnv } from "../config/cart-env";
import type { CartOwner } from "./cart-owner.types";

const COOKIE_NAME = "gearvn_guest_cart";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class CartOwnerService {
    constructor(
        private readonly config: ConfigService<CartEnv, true>,
        private readonly jwt: JwtService
    ) {}

    private publickey(): string {
        return this.config.get("JWT_PUBLIC_KEY", { infer: true }).replace(/\\n/g, "\n");
    }

    async requiredUser(request: Request): Promise<CartOwner> {
        const header = request.headers.authorization;
        const match = typeof header === "string" ? /^Bearer (\S+)$/.exec(header) : null;
        if (!match) {
            throw new UnauthorizedException("Missing or invalid Authorization header");
        }
        let payload: Record<string, unknown>;
        try{
            payload = await this.jwt.verifyAsync<Record<string, unknown>>(match[1], { publicKey: this.publickey(), algorithms: ["RS256"] });
        } catch (error) {
            throw new UnauthorizedException("Invalid token");
        }
        if (typeof payload.sub !== "string" || !payload.sub || (payload.role !== "CUSTOMER" && payload.role !== "SUPPORT")){
            throw new UnauthorizedException("Invalid token payload");
        }
        return { type: "USER", id: payload.sub };
    }
    private signature(id: string): Buffer {
        return createHmac("sha256", this.config.get("CART_COOKIE_SECRET", { infer: true }))
        .update(id).digest();
    }

    private cookieValue(request: Request): string | undefined {
        return request.headers.cookie?.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
    }

    verifiedGuestId(request: Request): string | null {
        const value = this.cookieValue(request);
        if (!value) return null;
        const parts = value.split(".");
        if (parts.length !== 2) return null;
        const [id, mac] = parts;
        if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[A-Za-z0-9_-]{43}$/.test(mac)) return null;
        const expected = this.signature(id);
        const received = Buffer.from(mac, "base64url");
        return received.length === expected.length && timingSafeEqual(received, expected)
        ? id : null;
    }

    private cookieOptions() {
    return {
      httpOnly: true, sameSite: "lax" as const, path: "/api/cart",
      secure: this.config.get("NODE_ENV", { infer: true }) === "production",
    };
    }

    clearGuest(response: Response): void {
        response.clearCookie(COOKIE_NAME, this.cookieOptions());
    }

    async resolve(request: Request, response: Response): Promise<CartOwner> {
        // Có header Authorization thì phải verify; sai token không được rơi về guest.
        if (request.headers.authorization !== undefined) return this.requiredUser(request);
        const existing = this.verifiedGuestId(request);
        if (existing) return { type: "GUEST", id: existing };
        const id = randomUUID();
        const signed = id + "." + this.signature(id).toString("base64url");
        response.cookie(COOKIE_NAME, signed, { ...this.cookieOptions(), maxAge: THIRTY_DAYS });
        return { type: "GUEST", id };
    }
}

