import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Team } from '../models/Team';
import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { createTeamSchema, joinTeamRequestSchema } from '../validators/event.validator';
import { AuthRequest } from '../middleware/auth';

export const getEventTeams = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid event ID' });
      return;
    }

    const teams = await Team.find({ eventId })
      .populate('leaderId', 'name email department skills')
      .populate('members.userId', 'name email department studentIdNumber skills')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: teams, teams });
  } catch (error) {
    next(error);
  }
};

export const createTeam = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const data = createTeamSchema.parse(req.body);

    if (!mongoose.Types.ObjectId.isValid(data.eventId)) {
      res.status(400).json({ success: false, message: 'Invalid event ID' });
      return;
    }

    const event = await Event.findById(data.eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    // Verify student is registered for this event
    const registration = await Registration.findOne({
      eventId: data.eventId,
      studentId: req.user._id,
      registrationStatus: { $ne: 'Cancelled' },
    });

    if (!registration) {
      res.status(403).json({
        success: false,
        message: 'You must be registered for this event before creating or joining a team.',
      });
      return;
    }

    // Verify student is not already in another team for this event
    const existingTeam = await Team.findOne({
      eventId: data.eventId,
      'members.userId': req.user._id,
    });

    if (existingTeam) {
      res.status(400).json({
        success: false,
        message: `You are already a member of team "${existingTeam.name}" for this event.`,
      });
      return;
    }

    // Check team name uniqueness for this event
    const nameTaken = await Team.findOne({
      eventId: data.eventId,
      name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
    });

    if (nameTaken) {
      res.status(400).json({
        success: false,
        message: 'A team with this name already exists for this event.',
      });
      return;
    }

    const team = await Team.create({
      eventId: data.eventId,
      name: data.name.trim(),
      description: data.description || '',
      leaderId: req.user._id,
      requiredSkills: data.requiredSkills || [],
      maxMembers: data.maxMembers || 4,
      members: [
        {
          userId: req.user._id,
          role: 'Leader',
          joinedAt: new Date(),
        },
      ],
      status: 'Open',
      joinRequests: [],
    });

    const populated = await Team.findById(team._id)
      .populate('leaderId', 'name email department skills')
      .populate('members.userId', 'name email department skills');

    res.status(201).json({
      success: true,
      message: 'Hackathon team created successfully!',
      data: populated,
      team: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeamById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid team ID' });
      return;
    }

    const team = await Team.findById(id)
      .populate('eventId', 'title category date venue')
      .populate('leaderId', 'name email department skills')
      .populate('members.userId', 'name email department studentIdNumber skills')
      .populate('joinRequests.userId', 'name email department skills');

    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' });
      return;
    }

    res.status(200).json({ success: true, team });
  } catch (error) {
    next(error);
  }
};

export const sendJoinRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid team ID' });
      return;
    }

    const team = await Team.findById(id);
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' });
      return;
    }

    if (team.status === 'Full' || team.members.length >= team.maxMembers) {
      res.status(400).json({ success: false, message: 'This team has already reached maximum capacity.' });
      return;
    }

    if (team.status === 'Closed') {
      res.status(400).json({ success: false, message: 'This team is closed to new members.' });
      return;
    }

    // Verify registration
    const registration = await Registration.findOne({
      eventId: team.eventId,
      studentId: req.user._id,
      registrationStatus: { $ne: 'Cancelled' },
    });

    if (!registration) {
      res.status(403).json({
        success: false,
        message: 'You must be registered for this event to join a team.',
      });
      return;
    }

    // Verify student is not already member of any team in this event
    const existingTeam = await Team.findOne({
      eventId: team.eventId,
      'members.userId': req.user._id,
    });

    if (existingTeam) {
      res.status(400).json({
        success: false,
        message: `You are already a member of team "${existingTeam.name}".`,
      });
      return;
    }

    // Check duplicate request
    const existingReq = team.joinRequests.find(
      (r) => r.userId.toString() === req.user!._id.toString() && r.status === 'Pending'
    );

    if (existingReq) {
      res.status(400).json({
        success: false,
        message: 'You have already sent a pending join request to this team.',
      });
      return;
    }

    const { message } = joinTeamRequestSchema.parse(req.body);

    team.joinRequests.push({
      _id: new mongoose.Types.ObjectId(),
      userId: req.user._id,
      message: message || '',
      status: 'Pending',
      requestedAt: new Date(),
    });

    await team.save();

    // Create notification for team leader
    await Notification.create({
      recipientId: team.leaderId,
      eventId: team.eventId,
      title: 'New Team Join Request',
      message: `${req.user.name} requested to join your team "${team.name}".`,
      type: 'team_request',
      read: false,
      data: {
        teamId: team._id,
        teamName: team.name,
        requesterName: req.user.name,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Join request sent to team leader!',
      data: team,
      team,
    });
  } catch (error) {
    next(error);
  }
};

export const respondJoinRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { id, requestId } = req.params;
    const { action } = req.body; // 'Accepted' | 'Rejected'

    if (!['Accepted', 'Rejected'].includes(action)) {
      res.status(400).json({ success: false, message: 'Action must be "Accepted" or "Rejected"' });
      return;
    }

    const team = await Team.findById(id);
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' });
      return;
    }

    // Only leader can manage requests
    if (team.leaderId.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: 'Only team leader can manage join requests.' });
      return;
    }

    const reqItem = team.joinRequests.find((r) => r._id.toString() === requestId);
    if (!reqItem) {
      res.status(404).json({ success: false, message: 'Join request not found.' });
      return;
    }

    if (reqItem.status !== 'Pending') {
      res.status(400).json({ success: false, message: `Request was already ${reqItem.status.toLowerCase()}.` });
      return;
    }

    if (action === 'Accepted') {
      if (team.members.length >= team.maxMembers) {
        res.status(400).json({ success: false, message: 'Team is already at maximum capacity.' });
        return;
      }

      reqItem.status = 'Accepted';
      team.members.push({
        userId: reqItem.userId,
        role: 'Member',
        joinedAt: new Date(),
      });

      if (team.members.length >= team.maxMembers) {
        team.status = 'Full';
      }

      // Notify the accepted student
      await Notification.create({
        recipientId: reqItem.userId,
        eventId: team.eventId,
        title: 'Team Join Request Accepted!',
        message: `Your request to join team "${team.name}" has been accepted. Welcome to the squad!`,
        type: 'team_request',
        read: false,
        data: { teamId: team._id, teamName: team.name },
      });
    } else {
      reqItem.status = 'Rejected';
    }

    await team.save();

    res.status(200).json({
      success: true,
      message: `Join request ${action.toLowerCase()} successfully.`,
      data: team,
      team,
    });
  } catch (error) {
    next(error);
  }
};

export const leaveOrRemoveTeam = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { targetUserId } = req.body;

    const team = await Team.findById(id);
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' });
      return;
    }

    const isLeader = team.leaderId.toString() === req.user._id.toString();
    const userIdToRemove = targetUserId || req.user._id.toString();

    if (!isLeader && userIdToRemove !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    // Leader cannot leave if there are other members unless transferring leadership
    if (isLeader && userIdToRemove === req.user._id.toString() && team.members.length > 1) {
      res.status(400).json({
        success: false,
        message: 'Team leader cannot leave active team with members. Please disband or transfer leadership.',
      });
      return;
    }

    team.members = team.members.filter((m) => m.userId.toString() !== userIdToRemove);
    if (team.members.length < team.maxMembers && team.status === 'Full') {
      team.status = 'Open';
    }

    // If no members left, delete team
    if (team.members.length === 0) {
      await Team.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: 'Team disbanded successfully.' });
      return;
    }

    await team.save();

    res.status(200).json({ success: true, message: 'Member removed from team.', data: team, team });
  } catch (error) {
    next(error);
  }
};

export const getMyTeams = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const teams = await Team.find({ 'members.userId': req.user._id })
      .populate('eventId', 'title category date venue')
      .populate('leaderId', 'name email department skills')
      .populate('members.userId', 'name email department skills');

    const pendingRequests = await Team.find({
      'joinRequests.userId': req.user._id,
      'joinRequests.status': 'Pending',
    }).populate('eventId', 'title date');

    res.status(200).json({
      success: true,
      data: teams,
      teams,
      pendingRequests,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStudentSkills = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { skills } = req.body;
    if (!Array.isArray(skills)) {
      res.status(400).json({ success: false, message: 'Skills must be an array of strings' });
      return;
    }

    const cleanedSkills = skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 20);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { skills: cleanedSkills } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Skills updated successfully',
      data: updatedUser?.skills || [],
      skills: updatedUser?.skills || [],
    });
  } catch (error) {
    next(error);
  }
};
