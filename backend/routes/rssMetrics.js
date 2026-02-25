import express from 'express';
import { getRtveFeedMetrics } from '../src/services/rtveRssService.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/rss/rtve-metrics (solo admin)
router.get(
  '/rss/rtve-metrics',
  authenticateToken,
  requireAdmin,
  (req, res) => {
    try {
      const metrics = getRtveFeedMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error obteniendo métricas RTVE:', error);
      res
        .status(500)
        .json({ error: 'Error al obtener métricas de feeds RTVE' });
    }
  }
);

export default router;

