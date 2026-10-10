import { Router } from 'express';
import {
  getEventTeams,
  createTeam,
  getTeamById,
  sendJoinRequest,
  respondJoinRequest,
  leaveOrRemoveTeam,
  getMyTeams,
  updateStudentSkills,
} from '../controllers/team.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/event/:eventId', authenticate, getEventTeams);
router.post('/', authenticate, createTeam);
router.get('/my', authenticate, getMyTeams);
router.get('/user/my-teams', authenticate, getMyTeams);
router.put('/skills', authenticate, updateStudentSkills);
router.put('/user/skills', authenticate, updateStudentSkills);
router.get('/:id', authenticate, getTeamById);
router.post('/:id/request', authenticate, sendJoinRequest);
router.post('/:id/join', authenticate, sendJoinRequest);
router.patch('/:id/requests/:requestId', authenticate, respondJoinRequest);
router.post('/:id/leave', authenticate, leaveOrRemoveTeam);
router.delete('/:id/members', authenticate, leaveOrRemoveTeam);

export default router;
