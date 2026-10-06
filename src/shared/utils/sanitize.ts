/**
 * Safely escapes regular expression special characters to prevent ReDoS
 * and query injection when querying MongoDB with regex.
 */
export function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Trims and normalizes an email address.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
