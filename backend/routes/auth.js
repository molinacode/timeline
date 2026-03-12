import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getSupabase } from '../src/config/supabase.js'
import { sendVerificationEmail } from '../src/services/emailService.js'
import {
  createEmailVerification,
  consumeEmailVerification,
} from '../src/services/emailVerificationService.js'
import { authenticateToken } from '../middleware/auth.js'
import {
  createBlueskySession,
  createBlueskyPost,
} from '../src/services/blueskyAuthService.js'

const router = express.Router()

// Versión actual del acuerdo de uso. Si en el futuro cambian las condiciones,
// se puede actualizar este valor para forzar una nueva aceptación.
const CURRENT_TERMS_VERSION = '2026-02-v1'

// POST /api/auth/register
router.post('/auth/register', async (req, res) => {
  const supabase = getSupabase()
  const { email, password, name, region } = req.body || {}

  if (!email || !password || !name) {
    return res.status(400).json({
      error: 'Datos inválidos',
      message: 'Los campos email, password y name son obligatorios',
    })
  }

  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return res.status(409).json({
        error: 'Usuario ya existe',
        message: 'Ya existe un usuario registrado con ese email',
      })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const now = new Date().toISOString()

    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        region: region || null,
        role: 'user',
        preferences: JSON.stringify({}),
        is_active: false,
        created_at: now,
        updated_at: now,
        last_login: null,
      })
      .select('id')
      .single()

    if (insertError) throw insertError
    const userId = inserted.id

    const token = await createEmailVerification(userId)

    try {
      await sendVerificationEmail(email, token)
    } catch (emailError) {
      console.error('Error enviando email de verificación:', emailError)
    }

    res.status(201).json({
      id: userId,
      email,
      name,
      region: region || null,
      role: 'user',
      isActive: false,
      message: 'Usuario registrado. Revisa tu correo para confirmar la cuenta.',
    })
  } catch (error) {
    console.error('Error en registro:', error)
    res.status(500).json({ error: 'Error al registrar usuario' })
  }
})

// GET /api/auth/verify-email?token=...
router.get('/auth/verify-email', async (req, res) => {
  const supabase = getSupabase()
  const token = req.query.token

  if (!token || typeof token !== 'string') {
    return res.status(400).json({
      error: 'Token inválido',
      message: 'Falta el token de verificación',
    })
  }

  try {
    const userId = await consumeEmailVerification(token)
    if (!userId) {
      return res.status(400).json({
        error: 'Token inválido o expirado',
        message: 'El enlace de verificación no es válido o ha caducado',
      })
    }

    const now = new Date().toISOString()
    await supabase
      .from('users')
      .update({ is_active: true, updated_at: now })
      .eq('id', userId)

    res.json({
      message: 'Correo verificado correctamente. Ya puedes iniciar sesión.',
    })
  } catch (error) {
    console.error('Error verificando email:', error)
    res.status(500).json({ error: 'Error al verificar el correo' })
  }
})

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  const supabase = getSupabase()
  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({
      error: 'Datos inválidos',
      message: 'Los campos email y password son obligatorios',
    })
  }

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(
        'id, email, password_hash, name, region, role, is_active, terms_version, terms_accepted_at'
      )
      .eq('email', email)
      .maybeSingle()

    if (userError || !user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos',
      })
    }

    if (!user.is_active) {
      return res.status(403).json({
        error: 'Cuenta no verificada',
        message: 'Debes verificar tu correo antes de iniciar sesión',
      })
    }

    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos',
      })
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'timeline-secret-key',
      { expiresIn: '8h' }
    )

    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
    const now = new Date().toISOString()

    await supabase.from('sessions').insert({
      user_id: user.id,
      token,
      expires_at: expiresAt,
      created_at: now,
    })

    await supabase
      .from('users')
      .update({ last_login: now, updated_at: now })
      .eq('id', user.id)

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        region: user.region,
        role: user.role,
        hasAcceptedTerms: !!user.terms_accepted_at,
        termsVersion: user.terms_version || null,
      },
    })
  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
})

// POST /api/auth/login-bluesky
// Iniciar sesión / registrarse usando cuenta Bluesky (AT Protocol) con app password.
router.post('/auth/login-bluesky', async (req, res) => {
  const supabase = getSupabase()
  const { identifier, appPassword, email, name } = req.body || {}

  if (!identifier || !appPassword) {
    return res.status(400).json({
      error: 'Datos inválidos',
      message: 'Los campos identifier y appPassword son obligatorios',
    })
  }

  try {
    // 1) Validar credenciales contra Bluesky y obtener DID/handle/email
    const session = await createBlueskySession(identifier, appPassword)
    const did = session.did
    const handle = session.handle
    const bskyEmail = session.email

    // 2) Buscar usuario existente por DID
    let user = null
    let userError = null
    const { data: byDid, error: byDidError } = await supabase
      .from('users')
      .select(
        'id, email, name, region, role, is_active, terms_version, terms_accepted_at, atproto_did, atproto_handle'
      )
      .eq('atproto_did', did)
      .maybeSingle()

    if (byDidError) userError = byDidError
    if (byDid) user = byDid

    // 3) Si no hay usuario por DID, intentar por email (el de Bluesky o el proporcionado)
    if (!user && (bskyEmail || email)) {
      const emailToUse = bskyEmail || email
      const { data: byEmail, error: byEmailError } = await supabase
        .from('users')
        .select(
          'id, email, name, region, role, is_active, terms_version, terms_accepted_at, atproto_did, atproto_handle'
        )
        .eq('email', emailToUse)
        .maybeSingle()
      if (byEmailError) userError = byEmailError
      if (byEmail) user = byEmail
    }

    const nowIso = new Date().toISOString()

    // 4) Si no existe usuario, crear uno nuevo "sin contraseña" ligado a Bluesky
    if (!user) {
      const finalEmail =
        bskyEmail ||
        email ||
        `${did.replace(/^did:/, '').slice(0, 16)}@bluesky.local`
      const displayName =
        (name && String(name).trim()) || handle || finalEmail.split('@')[0]

      // Usamos un hash de contraseña aleatorio porque este usuario no entra por email+password
      const randomPasswordHash = await bcrypt.hash(
        `bsky-${did}-${Date.now()}`,
        10
      )

      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert({
          email: finalEmail,
          password_hash: randomPasswordHash,
          name: displayName,
          region: null,
          role: 'user',
          preferences: JSON.stringify({}),
          is_active: true,
          created_at: nowIso,
          updated_at: nowIso,
          last_login: nowIso,
          atproto_did: did,
          atproto_handle: handle,
          atproto_connected_at: nowIso,
        })
        .select(
          'id, email, name, region, role, is_active, terms_version, terms_accepted_at, atproto_did, atproto_handle'
        )
        .single()

      if (insertError) {
        throw insertError
      }
      user = inserted
    } else {
      // 5) Actualizar usuario existente con DID/handle si aún no estaban guardados
      const updates = {}
      if (!user.atproto_did) updates.atproto_did = did
      if (!user.atproto_handle) updates.atproto_handle = handle
      if (Object.keys(updates).length > 0) {
        updates.atproto_connected_at = nowIso
        updates.updated_at = nowIso
        const { data: updated, error: updateError } = await supabase
          .from('users')
          .update(updates)
          .eq('id', user.id)
          .select(
            'id, email, name, region, role, is_active, terms_version, terms_accepted_at, atproto_did, atproto_handle'
          )
          .single()
        if (updateError) throw updateError
        user = updated
      }
    }

    if (!user.is_active) {
      // Si el usuario estaba creado pero inactivo, lo activamos al confirmar Bluesky
      const { data: activated, error: activateError } = await supabase
        .from('users')
        .update({ is_active: true, updated_at: nowIso })
        .eq('id', user.id)
        .select(
          'id, email, name, region, role, is_active, terms_version, terms_accepted_at, atproto_did, atproto_handle'
        )
        .single()
      if (activateError) throw activateError
      user = activated
    }

    // 6) Emitir nuestro JWT igual que en /auth/login
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'timeline-secret-key',
      { expiresIn: '8h' }
    )

    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()

    await supabase.from('sessions').insert({
      user_id: user.id,
      token,
      expires_at: expiresAt,
      created_at: nowIso,
    })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        region: user.region,
        role: user.role,
        hasAcceptedTerms: !!user.terms_accepted_at,
        termsVersion: user.terms_version || null,
        atprotoDid: user.atproto_did || null,
        atprotoHandle: user.atproto_handle || null,
      },
    })
  } catch (error) {
    console.error('Error en login-bluesky:', error)
    const status = error.statusCode || 500
    res.status(status).json({
      error: 'Error en login Bluesky',
      message:
        status === 401
          ? 'Credenciales de Bluesky inválidas'
          : error.message || 'No se pudo iniciar sesión con Bluesky',
    })
  }
})

// GET /api/auth/profile
router.get('/auth/profile', authenticateToken, async (req, res) => {
  const supabase = getSupabase()
  const { data: user, error } = await supabase
    .from('users')
    .select(
      'id, email, name, region, role, created_at, last_login, terms_version, terms_accepted_at, atproto_did, atproto_handle, atproto_connected_at'
    )
    .eq('id', req.user.id)
    .maybeSingle()

  if (error || !user) {
    return res.status(404).json({ error: 'Usuario no encontrado' })
  }
  res.json({
    ...user,
    atprotoDid: user.atproto_did || null,
    atprotoHandle: user.atproto_handle || null,
    atprotoConnectedAt: user.atproto_connected_at || null,
  })
})

// PUT /api/auth/profile
router.put('/auth/profile', authenticateToken, async (req, res) => {
  const supabase = getSupabase()
  const { name, region } = req.body || {}

  try {
    if (name != null && typeof name === 'string' && name.trim().length === 0) {
      return res.status(400).json({
        error: 'Nombre inválido',
        message: 'El nombre no puede estar vacío',
      })
    }

    const updates = {}
    if (name != null && typeof name === 'string') {
      updates.name = name.trim()
    }
    if (region != null) {
      updates.region = typeof region === 'string' ? region.trim() || null : null
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Sin cambios',
        message: 'No hay datos para actualizar',
      })
    }

    updates.updated_at = new Date().toISOString()

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select(
        'id, email, name, region, role, created_at, last_login, terms_version, terms_accepted_at'
      )
      .single()

    if (error) throw error
    res.json(user)
  } catch (error) {
    console.error('Error actualizando perfil:', error)
    res.status(500).json({ error: 'Error al actualizar perfil' })
  }
})

// POST /api/auth/accept-terms
// Marca que el usuario ha aceptado el acuerdo de uso actual.
router.post('/auth/accept-terms', authenticateToken, async (req, res) => {
  const supabase = getSupabase()

  try {
    const now = new Date().toISOString()

    const { data: user, error } = await supabase
      .from('users')
      .update({
        terms_version: CURRENT_TERMS_VERSION,
        terms_accepted_at: now,
        updated_at: now,
      })
      .eq('id', req.user.id)
      .select(
        'id, email, name, region, role, terms_version, terms_accepted_at, created_at, last_login'
      )
      .single()

    if (error) {
      throw error
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      region: user.region,
      role: user.role,
      hasAcceptedTerms: !!user.terms_accepted_at,
      termsVersion: user.terms_version || null,
      created_at: user.created_at,
      last_login: user.last_login,
    })
  } catch (error) {
    console.error('Error registrando aceptación de términos:', error)
    res
      .status(500)
      .json({ error: 'Error al registrar aceptación de términos' })
  }
})

// PUT /api/auth/password
router.put('/auth/password', authenticateToken, async (req, res) => {
  const supabase = getSupabase()
  const { current_password, new_password } = req.body || {}

  if (!current_password || !new_password) {
    return res.status(400).json({
      error: 'Datos inválidos',
      message: 'Debes indicar contraseña actual y nueva',
    })
  }

  if (new_password.length < 6) {
    return res.status(400).json({
      error: 'Contraseña débil',
      message: 'La nueva contraseña debe tener al menos 6 caracteres',
    })
  }

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', req.user.id)
      .maybeSingle()

    if (userError || !user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const valid = await bcrypt.compare(current_password, user.password_hash)
    if (!valid) {
      return res.status(401).json({
        error: 'Contraseña incorrecta',
        message: 'La contraseña actual no es correcta',
      })
    }

    const passwordHash = await bcrypt.hash(new_password, 10)
    const now = new Date().toISOString()
    await supabase
      .from('users')
      .update({ password_hash: passwordHash, updated_at: now })
      .eq('id', req.user.id)

    res.json({ message: 'Contraseña actualizada correctamente' })
  } catch (error) {
    console.error('Error cambiando contraseña:', error)
    res.status(500).json({ error: 'Error al cambiar contraseña' })
  }
})

// GET /api/auth/connections - estado de conexiones externas (Bluesky, etc.)
router.get('/auth/connections', authenticateToken, async (req, res) => {
  const supabase = getSupabase()
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, atproto_did, atproto_handle, atproto_connected_at')
      .eq('id', req.user.id)
      .maybeSingle()

    if (error || !user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.json({
      bluesky: {
        connected: !!user.atproto_did,
        did: user.atproto_did || null,
        handle: user.atproto_handle || null,
        connectedAt: user.atproto_connected_at || null,
      },
    })
  } catch (err) {
    console.error('Error en /auth/connections:', err)
    res.status(500).json({ error: 'Error al obtener conexiones' })
  }
})

// POST /api/share/bluesky - compartir una noticia en Bluesky
router.post('/share/bluesky', authenticateToken, async (req, res) => {
  const supabase = getSupabase()
  const { text, url, identifier, appPassword } = req.body || {}

  if (!appPassword) {
    return res.status(400).json({
      error: 'Datos inválidos',
      message: 'Es necesario appPassword para publicar en Bluesky',
    })
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, atproto_did, atproto_handle')
      .eq('id', req.user.id)
      .maybeSingle()

    if (error || !user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const handleOrEmail =
      identifier ||
      user.atproto_handle ||
      user.email ||
      undefined

    if (!handleOrEmail) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message:
          'Falta identifier y no hay handle/email asociado para usar con Bluesky',
      })
    }

    const session = await createBlueskySession(handleOrEmail, appPassword)
    const did = session.did
    const accessJwt = session.accessJwt

    if (!accessJwt) {
      throw new Error('Sesión Bluesky sin accessJwt')
    }

    const baseText = text && String(text).trim().length > 0 ? text.trim() : ''
    const finalText =
      url && url.trim()
        ? `${baseText ? baseText + ' ' : ''}${url.trim()}`
        : baseText

    if (!finalText) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Debes enviar al menos texto o url para compartir',
      })
    }

    const result = await createBlueskyPost(accessJwt, did, finalText)

    res.status(201).json({
      ok: true,
      uri: result.uri || null,
      cid: result.cid || null,
    })
  } catch (error) {
    console.error('Error en /share/bluesky:', error)
    const status = error.statusCode || 500
    res.status(status).json({
      error: 'Error al compartir en Bluesky',
      message: error.message || 'No se pudo compartir en Bluesky',
    })
  }
})

export default router
