import { Router } from 'express';
import {
  createSession,
  getEventSessions,
  updateSession,
  deleteSession,
  getSessionAttendanceList,
} from '../controllers/session.controller';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

// Sessions by event
router.get('/event/:id', authenticate, getEventSessions);
router.post('/event/:id', authenticate, requireRoles('organizer', 'admin'), createSession);

// Individual session actions
router.put('/:sessionId', authenticate, requireRoles('organizer', 'admin'), updateSession);
router.delete('/:sessionId', authenticate, requireRoles('organizer', 'admin'), deleteSession);
router.get('/:sessionId/attendance', authenticate, requireRoles('organizer', 'admin'), getSessionAttendanceList);

export default router;
