import { useEffect, useState } from 'react'

const OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 300_000,
}

export function useGeolocationLabel() {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return

    let cancelled = false
    const controller = new AbortController()

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (cancelled) return
        const { latitude, longitude } = position.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: {
                'Accept-Language': 'es',
                'User-Agent': 'TimeLineApp/1.0',
              },
              signal: controller.signal,
            }
          )
          const data = await res.json()
          const a = data?.address
          if (cancelled || !a) return
          const city =
            a.city ?? a.town ?? a.village ?? a.municipality ?? a.state
          const country = a.country
          if (city && country) setLabel(`${city}, ${country}`)
          else if (country) setLabel(country)
        } catch {
          // Ignora errores de red o cancelación
        }
      },
      () => {},
      OPTIONS
    )

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  return label
}
