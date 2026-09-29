import {
  BadGatewayException, GatewayTimeoutException, Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";

@Injectable()
export class CatalogProxyService {
    private readonly baseUrl: URL;

    constructor(config: ConfigService) {
        this.baseUrl = new URL(config.getOrThrow<string>("CATALOG_SERVICE_URL"));
        if (!["http:", "https:"].includes(this.baseUrl.protocol)) {
        throw new Error("CATALOG_SERVICE_URL phải dùng HTTP hoặc HTTPS");
        }
    }

    async get(path: string, request: Request, response: Response): Promise<void> {
        const target = new URL(path, this.baseUrl);
        target.search = new URL(request.originalUrl, "http://gateway.local").search;
        const requestId = response.getHeader("X-Request-Id");
        const headers: Record<string, string> = {
            accept: "application/json",
        }
        if (typeof requestId === "string") headers["x-request-id"] = requestId;

        let upstream: globalThis.Response;
        let body: string;
        try {
            upstream = await fetch(target, {
                method: "GET", headers,
                signal: AbortSignal.timeout(5000),
                redirect: "error",
            });
            body = await upstream.text();
            } catch (error: unknown) {
            if (error instanceof Error && error.name === "TimeoutError") {
                throw new GatewayTimeoutException("Catalog phản hồi quá chậm");
            }
            throw new BadGatewayException("Không thể kết nối Catalog");
        }
        response.status(upstream.status);
        response.type(upstream.headers.get("content-type") ?? "application/json");
        response.send(body);
    }
}