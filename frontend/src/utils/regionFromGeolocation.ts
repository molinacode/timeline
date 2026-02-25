/**
 * Mapeo de nombres de región/estado de Nominatim (OpenStreetMap) a los ids
 * usados en fuentes-regionales (demoSourcesByRegion.json).
 */
const NOMINATIM_STATE_TO_REGION_ID: Record<string, string> = {
  Andalucía: 'andalucia',
  Aragón: 'aragon',
  Asturias: 'asturias',
  'Islas Baleares': 'baleares',
  'Illes Balears': 'baleares',
  Canarias: 'canarias',
  'Castilla-La Mancha': 'castilla-la-mancha',
  'Castilla y León': 'castilla-y-leon',
  Cataluña: 'cataluna',
  Catalunya: 'cataluna',
  Cantabria: 'cantabria',
  'País Vasco': 'pais-vasco',
  'Euskadi': 'pais-vasco',
  Navarra: 'navarra',
  'Nafarroa': 'navarra',
  'Región de Murcia': 'murcia',
  Murcia: 'murcia',
  'Comunidad de Madrid': 'madrid',
  Madrid: 'madrid',
  'La Rioja': 'la-rioja',
  'Rioja': 'la-rioja',
  Galicia: 'galicia',
  Extremadura: 'extremadura',
  'Ceuta': 'ceuta-melilla',
  'Melilla': 'ceuta-melilla',
  'Comunidad Valenciana': 'valenciana',
  'Comunitat Valenciana': 'valenciana',
  Valencia: 'valenciana',
}

/**
 * Obtiene el id de región a partir de la respuesta de Nominatim.
 * Busca en state, region y state_district.
 */
export function getRegionIdFromNominatim(address: {
  state?: string
  region?: string
  state_district?: string
  county?: string
}): string | null {
  const candidates = [
    address.state,
    address.region,
    address.state_district,
    address.county,
  ].filter(Boolean) as string[]

  for (const c of candidates) {
    const normalized = c.trim()
    if (NOMINATIM_STATE_TO_REGION_ID[normalized]) {
      return NOMINATIM_STATE_TO_REGION_ID[normalized]
    }
    // Búsqueda case-insensitive
    const key = Object.keys(NOMINATIM_STATE_TO_REGION_ID).find(
      (k) => k.toLowerCase() === normalized.toLowerCase()
    )
    if (key) return NOMINATIM_STATE_TO_REGION_ID[key]
  }
  return null
}
