// In production (Railway), API calls are proxied through Next.js rewrites
// In development, use NEXT_PUBLIC_BACKEND_URL from .env
export const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? '' // Use relative URLs in production (proxied by Next.js)
    : (process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ?? "http://localhost:8000");

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
