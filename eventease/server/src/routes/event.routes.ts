import { Router } from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/event.controller';
import { registerForEvent } from '../controllers/registration.controller';
import { getEventAttendance, getOfflineCheckInPack, getLiveCrowdStats } from '../controllers/checkin.controller';
import { exportEventAttendanceCsv } from '../controllers/report.controller';
import { submitFeedback, getEventFeedback } from '../controllers/feedback.controller';
import { createSession, getEventSessions } from '../controllers/session.controller';
import { authenticate, optionalAuth, requireRoles } from '../middleware/auth';

const router = Router();

// Public / optional auth
router.get('/', optionalAuth, getEvents);
router.get('/:id', optionalAuth, getEventById);

// Organizer / Admin event management
router.post('/', authenticate, requireRoles('organizer', 'admin'), createEvent);
router.put('/:id', authenticate, requireRoles('organizer', 'admin'), updateEvent);
router.delete('/:id', authenticate, requireRoles('organizer', 'admin'), deleteEvent);

// Registration
router.post('/:id/register', authenticate, registerForEvent);

// Sessions
router.get('/:id/sessions', authenticate, getEventSessions);
router.post('/:id/sessions', authenticate, requireRoles('organizer', 'admin'), createSession);

// Attendance & Reports
router.get('/:id/attendance', authenticate, requireRoles('organizer', 'admin'), getEventAttendance);
router.get('/:id/live-stats', authenticate, requireRoles('organizer', 'admin'), getLiveCrowdStats);
router.get('/:id/export', authenticate, requireRoles('organizer', 'admin'), exportEventAttendanceCsv);
router.get('/:id/offline-pack', authenticate, requireRoles('organizer', 'admin'), getOfflineCheckInPack);

// Feedback
router.post('/:id/feedback', authenticate, submitFeedback);
router.get('/:id/feedback', optionalAuth, getEventFeedback);

export default router;
