import { z } from 'zod';
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '../../config/constants';

export const hymnQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, 'Page must be greater than or equal to 1.')),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : DEFAULT_PAGE_LIMIT))
    .pipe(
      z
        .number()
        .int()
        .min(1, 'Limit must be at least 1.')
        .max(MAX_PAGE_LIMIT, `Limit cannot exceed ${MAX_PAGE_LIMIT}.`)
    ),
  search: z.string().trim().max(100, 'Search term too long.').optional(),
  category: z.string().trim().max(100).optional(),
  sort: z
    .enum(['number', '-number', 'title', '-title', 'createdAt', '-createdAt'])
    .optional()
    .default('number'),
});

export const hymnIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Hymn ID or number is required.'),
});

export type HymnQueryInput = z.infer<typeof hymnQuerySchema>;
