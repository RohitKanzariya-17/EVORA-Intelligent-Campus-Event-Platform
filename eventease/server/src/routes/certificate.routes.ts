import { Router } from 'express';
import {
  verifyCertificate,
  getMyCertificates,
  getEventCertificates,
  generateEventCertificates,
  revokeCertificate,
} from '../controllers/certificate.controller';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

// Public verification route (no auth required)
router.get('/verify/:certificateId', verifyCertificate);

// Authenticated student routes
router.get('/my', authenticate, getMyCertificates);

// Organizer / Admin routes
router.get('/event/:eventId', authenticate, requireRoles('organizer', 'admin'), getEventCertificates);
router.post('/event/:eventId/generate', authenticate, requireRoles('organizer', 'admin'), generateEventCertificates);
router.patch('/:id/revoke', authenticate, requireRoles('organizer', 'admin'), revokeCertificate);

export default router;
