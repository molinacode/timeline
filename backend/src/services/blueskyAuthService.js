import axios from 'axios'

const DEFAULT_PDS_URL = 'https://bsky.social'

function getPdsUrl() {
  const base = process.env.BSKY_PDS_URL || DEFAULT_PDS_URL
  return base.replace(/\/+$/, '')
}

/**
 * Crea una sesión en Bluesky (AT Protocol) usando handle/email + app password.
 * Devuelve al menos { did, handle, email? }.
 */
export async function createBlueskySession(identifier, appPassword) {
  if (!identifier || !appPassword) {
    throw new Error('identifier y appPassword son obligatorios')
  }

  const url = `${getPdsUrl()}/xrpc/com.atproto.server.createSession`

  try {
    const res = await axios.post(
      url,
      {
        identifier,
        password: appPassword,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'TimeLineNews/1.0 (+https://timelinenews.es; auth via AT Protocol)',
        },
        timeout: 8000,
      }
    )

    const { did, handle, email, accessJwt, refreshJwt } = res.data || {}
    if (!did || !handle) {
      throw new Error('Respuesta de Bluesky sin did/handle')
    }

    return {
      did,
      handle,
      email: email || null,
      accessJwt: accessJwt || null,
      refreshJwt: refreshJwt || null,
    }
  } catch (err) {
    const status = err.response?.status
    const msg =
      status === 401 || status === 400
        ? 'Credenciales de Bluesky inválidas'
        : err.message || 'Error llamando a Bluesky'
    const error = new Error(msg)
    error.statusCode = status === 401 || status === 400 ? 401 : 502
    throw error
  }
}

/**
 * Publica un post sencillo en Bluesky (app.bsky.feed.post) con texto.
 * El texto puede contener la URL del artículo; Bluesky la auto-linkea.
 */
export async function createBlueskyPost(accessJwt, did, text) {
  if (!accessJwt || !did) {
    throw new Error('accessJwt y did son obligatorios para publicar')
  }

  const url = `${getPdsUrl()}/xrpc/com.atproto.repo.createRecord`
  const nowIso = new Date().toISOString()

  const record = {
    $type: 'app.bsky.feed.post',
    text,
    createdAt: nowIso,
  }

  try {
    const res = await axios.post(
      url,
      {
        repo: did,
        collection: 'app.bsky.feed.post',
        record,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessJwt}`,
          'User-Agent':
            'TimeLineNews/1.0 (+https://timelinenews.es; share via AT Protocol)',
        },
        timeout: 8000,
      }
    )

    return res.data
  } catch (err) {
    const status = err.response?.status
    const msg =
      status === 401 || status === 400
        ? 'No se pudo publicar en Bluesky (no autorizado)'
        : err.message || 'Error publicando en Bluesky'
    const error = new Error(msg)
    error.statusCode = status === 401 || status === 400 ? 401 : 502
    throw error
  }
}

