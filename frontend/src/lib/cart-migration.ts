export type LegacyCartLine = { productId: string; quantity: number };
export type CartTransferOperation = LegacyCartLine & { kind: "add" | "set" };

export function parseLegacyCart(raw: string | null): LegacyCartLine[] {
  if (!raw) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];
  const lines = new Map<string, number>();
  for (const item of value) {
    if (
      typeof item !== "object" || item === null ||
      typeof item.productId !== "string" || !item.productId.trim() ||
      !Number.isInteger(item.quantity) || item.quantity <= 0
    ) continue;
    lines.set(item.productId, Math.max(
      lines.get(item.productId) ?? 0,
      Math.min(item.quantity, 99),
    ));
  }
  return [...lines].map(([productId, quantity]) => ({ productId, quantity }));
}

export function planLegacyCartTransfer(
  legacy: LegacyCartLine[],
  server: LegacyCartLine[],
): CartTransferOperation[] {
  const quantities = new Map(server.map(({ productId, quantity }) => [productId, quantity]));
  return legacy.flatMap(({ productId, quantity }): CartTransferOperation[] => {
    const current = quantities.get(productId);
    if (current === undefined) return [{ kind: "add" as const, productId, quantity }];
    if (current < quantity) return [{ kind: "set" as const, productId, quantity }];
    return [];
  });
}
