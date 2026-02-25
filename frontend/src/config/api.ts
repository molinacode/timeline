/**
 * URL base del API. En desarrollo queda vacía y Vite hace proxy de /api al backend.
 * En producción (Vercel) definir VITE_API_URL con la URL del backend (ej. https://tu-app.onrender.com).
 */
const API_BASE = import.meta.env.VITE_API_URL ?? ''

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
}
