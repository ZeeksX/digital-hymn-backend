import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long.')
    .max(100, 'Name cannot exceed 100 characters.'),
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address.')
    .max(120, 'Email address is too long.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(128, 'Password cannot exceed 128 characters.')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
    .regex(/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Password must contain at least one number or symbol.'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address.'),
  password: z
    .string()
    .min(1, 'Password is required.'),
});

export const googleAuthSchema = z.object({
  idToken: z
    .string()
    .trim()
    .min(10, 'Google ID token is required.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
