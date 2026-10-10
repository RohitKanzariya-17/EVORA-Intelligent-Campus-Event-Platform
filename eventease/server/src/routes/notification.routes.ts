import { Router } from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  sendSessionReminders,
} from '../controllers/notification.controller';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getMyNotifications);
router.patch('/:id/read', authenticate, markAsRead);
router.patch('/read-all', authenticate, markAllAsRead);
router.post('/session/:sessionId/remind', authenticate, requireRoles('organizer', 'admin'), sendSessionReminders);
router.post('/sessions/:sessionId/reminders', authenticate, requireRoles('organizer', 'admin'), sendSessionReminders);

export default router;
