import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { extractArticleFromUrl } from '../src/services/readerService.js'

const router = express.Router()

router.use(authenticateToken)

// GET /api/reader?url=...
router.get('/reader', async (req, res) => {
  const { url } = req.query

  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      error: 'Parámetro url obligatorio',
      message: 'Debes proporcionar una URL válida para el lector',
    })
  }

  try {
    const result = await extractArticleFromUrl(url)
    res.json(result)
  } catch (error) {
    console.error('Error extrayendo contenido para lector:', error.message)
    res.status(500).json({
      error: 'Error al extraer contenido',
      message: 'No se pudo extraer el contenido del artículo',
    })
  }
})

export default router

