import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { apiUrl } from '@/config/api'

type Role = 'user' | 'admin'

type DemoUser = {
  id: string
  email: string
  name: string
  region: string
  role: Role
  hasAcceptedTerms?: boolean
  termsVersion?: string | null
}

type AuthContextValue = {
  user: DemoUser | null
  token: string | null
  login: (email: string, password: string) => Promise<DemoUser>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (updates: Partial<DemoUser>) => void
  hydrated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'timeline-demo-user'
const TOKEN_KEY = 'timeline-auth-token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as DemoUser
        setUser(parsed)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    if (storedToken) {
      setToken(storedToken)
    }
    setHydrated(true)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      hydrated,
      async login(email, password) {
        const res = await fetch(apiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        if (!res.ok) {
          const error = await res.json().catch(() => ({}))
          throw new Error(error.message || 'Error al iniciar sesión')
        }

        const data = await res.json()
        const userData: DemoUser = {
          id: String(data.user.id),
          email: data.user.email,
          name: data.user.name,
          region: data.user.region || 'Sin región',
          role: data.user.role as Role,
          hasAcceptedTerms: !!data.user.hasAcceptedTerms,
          termsVersion: data.user.termsVersion ?? null,
        }

        setUser(userData)
        setToken(data.token)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
        localStorage.setItem(TOKEN_KEY, data.token)
        return userData
      },
      async register(name, email, _password) {
        const res = await fetch(apiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password: _password }),
        })

        if (!res.ok) {
          const error = await res.json().catch(() => ({}))
          throw new Error(error.message || 'Error al registrar usuario')
        }

        // No iniciamos sesión automáticamente hasta que confirme el correo
      },
      logout() {
        setUser(null)
        setToken(null)
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(TOKEN_KEY)
      },
      updateUser(updates) {
        if (!user) return
        const next: DemoUser = { ...user, ...updates }
        setUser(next)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      },
    }),
    [user, token, hydrated]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
