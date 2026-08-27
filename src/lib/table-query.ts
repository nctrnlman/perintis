export function parsePageParam(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return 1;
  return parsed;
}

export function parseSortParam<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T
): T {
  return (allowed as readonly string[]).includes(value ?? "") ? (value as T) : fallback;
}

export function parseDirParam(value: string | undefined): "asc" | "desc" {
  return value === "asc" ? "asc" : "desc";
}
