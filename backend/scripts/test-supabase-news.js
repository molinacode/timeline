import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

// Sin join
const r1 = await supabase.from('news_items').select('id, title').limit(2)
console.log('Sin join - error:', r1.error?.message || 'ok', 'rows:', r1.data?.length ?? 0)

// Con join (como en la ruta)
const r2 = await supabase.from('news_items').select('id, title, news_sources(name)').limit(2)
console.log('Con join - error:', r2.error?.message || 'ok', 'rows:', r2.data?.length ?? 0)
if (r2.error) console.log('Detalle:', r2.error)
