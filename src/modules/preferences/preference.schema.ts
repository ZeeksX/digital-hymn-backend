import { z } from 'zod';

export const updatePreferencesSchema = z
  .object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    defaultTextSize: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
    rememberRecentlyViewed: z.boolean().optional(),
    keepScreenAwake: z.boolean().optional(),
    serifLyrics: z.boolean().optional(),
    showVerseNumbers: z.boolean().optional(),
  })
  .strict();

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
