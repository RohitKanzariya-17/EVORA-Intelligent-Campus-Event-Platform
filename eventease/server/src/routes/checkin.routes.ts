import { Router } from 'express';
import {
  scanCheckIn,
  syncOfflineScans,
  getOfflineCheckInPack,
  getLiveCrowdStats,
} from '../controllers/checkin.controller';
import { authenticate, requireRoles } from '../middleware/auth';
import { checkInLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/scan', authenticate, requireRoles('organizer', 'admin'), checkInLimiter, scanCheckIn);
router.post('/sync', authenticate, requireRoles('organizer', 'admin'), syncOfflineScans);
router.get('/event/:id/offline-pack', authenticate, requireRoles('organizer', 'admin'), getOfflineCheckInPack);
router.get('/event/:id/live-stats', authenticate, requireRoles('organizer', 'admin'), getLiveCrowdStats);
router.get('/event/:id/live-monitor', authenticate, requireRoles('organizer', 'admin'), getLiveCrowdStats);

export default router;
