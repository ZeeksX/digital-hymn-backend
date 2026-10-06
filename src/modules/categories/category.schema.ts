import { z } from 'zod';
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '../../config/constants';

export const categorySlugParamSchema = z.object({
  slug: z.string().trim().min(1, 'Category slug is required.'),
});

export const categoryHymnsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : DEFAULT_PAGE_LIMIT))
    .pipe(z.number().int().min(1).max(MAX_PAGE_LIMIT)),
  sort: z
    .enum(['number', '-number', 'title', '-title', 'createdAt', '-createdAt'])
    .optional()
    .default('number'),
});
