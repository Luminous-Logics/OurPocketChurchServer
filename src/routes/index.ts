import { Router } from 'express';
import authRoutes from './auth.routes';
import parishRoutes from './parish.routes';
import wardRoutes from './ward.routes';
import familyRoutes from './family.routes';
import parishionerRoutes from './parishioner.routes';
import audiobookRoutes from './audiobook.routes';
import prayerRequestRoutes from './prayerRequest.routes';
import accountRoutes from './account.routes';
import bibleRoutes from './bible.routes';
import roleRoutes from './role.routes';
import otpRoutes from './otp.routes';
// Import other route modules here as they are created
// etc.

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: API health check
 *     tags: [Health]
 *     description: Check if the API is running and healthy
 *     responses:
 *       200:
 *         description: API is running successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Parish Nexus Flow API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/parishes', parishRoutes);
router.use('/wards', wardRoutes);
router.use('/families', familyRoutes);
router.use('/parishioners', parishionerRoutes);
router.use('/audiobooks', audiobookRoutes);
router.use('/prayer-requests', prayerRequestRoutes);
router.use('/accounts', accountRoutes);
router.use('/bible', bibleRoutes);
router.use('/roles', roleRoutes);
router.use('/otp', otpRoutes);
// Add more routes as needed

export default router;
