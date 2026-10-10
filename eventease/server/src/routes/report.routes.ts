import { Router } from 'express';
import { getOrganizerDashboard } from '../controllers/report.controller';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authenticate, requireRoles('organizer', 'admin'), getOrganizerDashboard);

export default router;
