/**
 * Builds standardized pagination metadata from query results.
 *
 * Used by paginated list endpoints (secrets, secret-requests, users)
 * to return consistent pagination info.
 */
export function buildPaginationMeta(total: number, skip: number, take: number) {
    return {
        total,
        skip,
        take,
        page: Math.floor(skip / take) + 1,
        totalPages: Math.ceil(total / take),
    };
}
