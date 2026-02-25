import { useEffect, useState } from 'react'

const INTERVAL_MS = 60_000

export function useDate() {
  const [date, setDate] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setDate(new Date()), INTERVAL_MS)
    return () => clearInterval(id)
  }, [])
  return date
}
