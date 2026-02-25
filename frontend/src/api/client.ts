/** Cliente API con soporte para autenticación */

export function authHeaders(token: string | null): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export async function fetchApi<T>(
  url: string,
  options: { token?: string | null; method?: string; body?: unknown } = {}
): Promise<T> {
  const { token, method = 'GET', body } = options
  const res = await fetch(url, {
    method,
    headers: authHeaders(token ?? null),
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || data.error || `Error ${res.status}`)
  }
  return res.json()
}
