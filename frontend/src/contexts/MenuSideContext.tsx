import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

const STORAGE_KEY = 'timeline_menu_side'

export type MenuSide = 'left' | 'right'

type MenuSideContextValue = {
  menuSide: MenuSide
  setMenuSide: (side: MenuSide) => void
}

const defaultSide: MenuSide = 'left'

function readStored(): MenuSide {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'left' || v === 'right') return v
  } catch {
    /* ignore */
  }
  return defaultSide
}

const MenuSideContext = createContext<MenuSideContextValue | null>(null)

export function MenuSideProvider({ children }: { children: ReactNode }) {
  const [menuSide, setMenuSideState] = useState<MenuSide>(readStored)

  const setMenuSide = useCallback((side: MenuSide) => {
    setMenuSideState(side)
    try {
      localStorage.setItem(STORAGE_KEY, side)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const handler = () => setMenuSideState(readStored())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  return (
    <MenuSideContext.Provider value={{ menuSide, setMenuSide }}>
      {children}
    </MenuSideContext.Provider>
  )
}

export function useMenuSide(): MenuSideContextValue {
  const ctx = useContext(MenuSideContext)
  if (!ctx) {
    return {
      menuSide: defaultSide,
      setMenuSide: () => {},
    }
  }
  return ctx
}
