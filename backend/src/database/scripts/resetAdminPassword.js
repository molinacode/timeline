/**
 * Resetea la contraseña del usuario administrador en la base de datos.
 * Solo para desarrollo/recuperación. En producción requiere ALLOW_RESET_ADMIN=true.
 *
 * Uso (desde la carpeta backend):
 *   npm run reset-admin-password
 *
 * Variables de entorno (mismo .env que el backend):
 *   ADMIN_EMAIL     - email del admin a actualizar
 *   ADMIN_PASSWORD  - NUEVA contraseña que quieres usar para entrar
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * En producción: definir además ALLOW_RESET_ADMIN=true para permitir ejecución.
 */
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { getSupabase } from '../../config/supabase.js'

dotenv.config()

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@timeline.es'
const NEW_PASSWORD = process.env.ADMIN_PASSWORD

if (!NEW_PASSWORD || NEW_PASSWORD.length < 6) {
  console.error('❌ Define ADMIN_PASSWORD en .env con la nueva contraseña (mínimo 6 caracteres).')
  process.exit(1)
}

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_RESET_ADMIN !== 'true') {
  console.error('❌ En producción debes definir ALLOW_RESET_ADMIN=true para ejecutar este script.')
  process.exit(1)
}

async function main() {
  const supabase = getSupabase()

  const { data: user, error: findError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('email', ADMIN_EMAIL)
    .maybeSingle()

  if (findError) {
    console.error('❌ Error buscando usuario:', findError.message)
    process.exit(1)
  }

  if (!user) {
    console.error(`❌ No existe ningún usuario con email "${ADMIN_EMAIL}". Crea uno con: npm run create-admin`)
    process.exit(1)
  }

  const passwordHash = bcrypt.hashSync(NEW_PASSWORD, 10)
  const now = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: passwordHash, updated_at: now })
    .eq('id', user.id)

  if (updateError) {
    console.error('❌ Error actualizando contraseña:', updateError.message)
    process.exit(1)
  }

  console.log(`✅ Contraseña del admin "${ADMIN_EMAIL}" actualizada correctamente.`)
  console.log('   Puedes iniciar sesión con ese email y la contraseña que pusiste en ADMIN_PASSWORD.')
  process.exit(0)
}

main()
