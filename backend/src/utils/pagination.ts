import type { PaginationMeta } from './ApiResponse.js';

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

const MAX_LIMIT = 100;

/**
 * Normalises pagination + sort query params into safe values.
 * `sort` accepts a comma list like `-createdAt,price` (leading `-` = descending).
 */
export function parsePagination(query: {
  page?: unknown;
  limit?: unknown;
  sort?: unknown;
}): PaginationOptions {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || 20));

  const sort: Record<string, 1 | -1> = {};
  if (typeof query.sort === 'string' && query.sort.length > 0) {
    for (const field of query.sort.split(',')) {
      const trimmed = field.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('-')) sort[trimmed.slice(1)] = -1;
      else sort[trimmed] = 1;
    }
  }
  if (Object.keys(sort).length === 0) sort.createdAt = -1;

  return { page, limit, skip: (page - 1) * limit, sort };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
