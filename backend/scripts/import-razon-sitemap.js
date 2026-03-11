import 'dotenv/config'
import { importLaRazonFromSitemap } from '../src/services/razonServices.js'

async function main() {
  try {
    const inserted = await importLaRazonFromSitemap(100)
    console.log('La Razón sitemap ->', inserted, 'nuevas noticias')
    process.exit(0)
  } catch (e) {
    console.error('Error importando La Razón desde sitemap:', e)
    process.exit(1)
  }
}

main()