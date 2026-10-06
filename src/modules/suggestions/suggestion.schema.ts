import { z } from 'zod';

export const hymnSuggestionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters long.')
    .max(150, 'Title cannot exceed 150 characters.'),
  author: z
    .string()
    .trim()
    .min(2, 'Author must be at least 2 characters long.')
    .max(100, 'Author cannot exceed 100 characters.'),
  category: z
    .string()
    .trim()
    .min(2, 'Category must be at least 2 characters long.')
    .max(100, 'Category cannot exceed 100 characters.'),
  lyrics: z
    .string()
    .trim()
    .min(10, 'Lyrics must be at least 10 characters long.')
    .max(10000, 'Lyrics cannot exceed 10,000 characters.'),
  submittedBy: z
    .string()
    .trim()
    .min(2, 'Submitter name must be at least 2 characters long.')
    .max(100, 'Submitter name cannot exceed 100 characters.'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address.')
    .max(120, 'Email cannot exceed 120 characters.'),
});

export type HymnSuggestionInput = z.infer<typeof hymnSuggestionSchema>;
