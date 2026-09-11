/** Ambient Nitro / h3 helpers used by public API routes. */
declare function defineEventHandler<T>(
  handler: (event: unknown) => T | Promise<T>,
): (event: unknown) => T | Promise<T>;
declare function getMethod(event: unknown): string;
declare function getQuery(event: unknown): Record<string, unknown>;
declare function getRouterParam(event: unknown, name: string): string | undefined;
declare function getHeader(event: unknown, name: string): string | undefined;
declare function readBody<T = unknown>(event: unknown): Promise<T>;
