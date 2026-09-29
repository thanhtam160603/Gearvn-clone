import { randomUUID } from "node:crypto";

import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

export type RequestWithId = Request & { requestId: string };

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: RequestWithId, response: Response, next: NextFunction): void {
    const incoming = request.headers["x-request-id"];
    const candidate = Array.isArray(incoming) ? incoming[0] : incoming;
    const requestId =
      typeof candidate === "string" &&
      candidate.trim().length > 0 &&
      candidate.length <= 128
        ? candidate
        : randomUUID();

    request.requestId = requestId;
    response.setHeader("x-request-id", requestId);
    next();
  }
}