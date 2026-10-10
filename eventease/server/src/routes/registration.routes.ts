import { Router } from 'express';
import {
  getMyRegistrations,
  getTicket,
  cancelRegistration,
} from '../controllers/registration.controller';
import { getStudentPassport } from '../controllers/passport.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/my', authenticate, getMyRegistrations);
router.get('/passport', authenticate, getStudentPassport);
router.get('/:id/ticket', authenticate, getTicket);
router.delete('/:id', authenticate, cancelRegistration);

export default router;
