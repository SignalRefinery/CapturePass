import { clsx } from "clsx";
export function cn(...inputs: Array<string | false | null | undefined>) { return clsx(inputs); }
export function normalizeUrl(input: string) {
  if (!input) return "";
  if (input.startsWith("http://") || input.startsWith("https://") || input.startsWith("tel:") || input.startsWith("sms:") || input.startsWith("/")) return input;
  return `https://${input}`;
}
export function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9-\s]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
export function isValidSlug(slug: string) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug); }
