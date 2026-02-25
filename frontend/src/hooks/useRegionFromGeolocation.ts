import { useEffect, useState } from 'react'
import { getRegionIdFromNominatim } from '../utils/regionFromGeolocation'

type Result = {
  regionId: string | null
  locationLabel: string | null
  loading: boolean
  error: boolean
}

/**
 * Hook que obtiene la región del usuario a partir de su geolocalización.
 * Usa Nominatim para invertir lat/lon a dirección y mapear a región española.
 */
export function useRegionFromGeolocation(): Result {
  const [regionId, setRegionId] = useState<string | null>(null)
  const [locationLabel, setLocationLabel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false)
      setError(true)
      return
    }

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

          const regionIdFound = getRegionIdFromNominatim(a)
          if (regionIdFound) setRegionId(regionIdFound)

          const city =
            a.city ?? a.town ?? a.village ?? a.municipality ?? a.state
          const country = a.country
          if (city && country) setLocationLabel(`${city}, ${country}`)
          else if (country) setLocationLabel(country)
        } catch {
          setError(true)
        } finally {
          setLoading(false)
        }
      },
      () => {
        setError(true)
        setLoading(false)
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  return { regionId, locationLabel, loading, error }
}
