import { z } from 'zod';

export const hymnIdParamSchema = z.object({
  hymnId: z.string().trim().min(1, 'Hymn ID or number is required.'),
});
