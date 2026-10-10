import { Router } from 'express';
import {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  updateUserStatus,
} from '../controllers/admin.controller';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireRoles('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);

export default router;
