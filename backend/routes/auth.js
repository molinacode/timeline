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

// GET /api/auth/profile
router.get('/auth/profile', authenticateToken, async (req, res) => {
  const supabase = getSupabase()
  const { data: user, error } = await supabase
    .from('users')
    .select(
      'id, email, name, region, role, created_at, last_login, terms_version, terms_accepted_at'
    )
    .eq('id', req.user.id)
    .maybeSingle()

  if (error || !user) {
    return res.status(404).json({ error: 'Usuario no encontrado' })
  }
  res.json(user)
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

export default router
