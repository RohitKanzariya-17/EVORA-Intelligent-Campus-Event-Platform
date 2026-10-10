import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { EventSession } from '../models/EventSession';
import { SessionAttendance } from '../models/SessionAttendance';
import { Event } from '../models/Event';
import { createSessionSchema, updateSessionSchema } from '../validators/event.validator';
import { AuthRequest } from '../middleware/auth';

export const createSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { id: eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid event ID' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    const isOrganizer = event.organizerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOrganizer && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Only event organizer or admin can create sessions.',
      });
      return;
    }

    const data = createSessionSchema.parse(req.body);
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end <= start) {
      res.status(400).json({
        success: false,
        message: 'Session end time must be after start time.',
      });
      return;
    }

    const session = await EventSession.create({
      eventId,
      name: data.name,
      description: data.description || '',
      startTime: start,
      endTime: end,
      requireStrictWindow: data.requireStrictWindow ?? true,
      status: data.status || 'Scheduled',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Attendance session created successfully!',
      data: session,
      session,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventSessions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid event ID' });
      return;
    }

    const sessions = await EventSession.find({ eventId }).sort({ startTime: 1 });

    // Compute attendance count per session
    const sessionsWithStats = await Promise.all(
      sessions.map(async (sess) => {
        const attendanceCount = await SessionAttendance.countDocuments({ sessionId: sess._id });
        return {
          ...sess.toObject(),
          attendanceCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: sessionsWithStats,
      sessions: sessionsWithStats,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      res.status(400).json({ success: false, message: 'Invalid session ID' });
      return;
    }

    const session = await EventSession.findById(sessionId);
    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    const event = await Event.findById(session.eventId);
    const isOrganizer = event && event.organizerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOrganizer && !isAdmin) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const data = updateSessionSchema.parse(req.body);

    if (data.name) session.name = data.name;
    if (data.description !== undefined) session.description = data.description;
    if (data.startTime) session.startTime = new Date(data.startTime);
    if (data.endTime) session.endTime = new Date(data.endTime);
    if (data.status) session.status = data.status;
    if (data.requireStrictWindow !== undefined) session.requireStrictWindow = data.requireStrictWindow;

    if (session.endTime <= session.startTime) {
      res.status(400).json({
        success: false,
        message: 'Session end time must be after start time.',
      });
      return;
    }

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Session updated successfully',
      data: session,
      session,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      res.status(400).json({ success: false, message: 'Invalid session ID' });
      return;
    }

    const session = await EventSession.findById(sessionId);
    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    const event = await Event.findById(session.eventId);
    const isOrganizer = event && event.organizerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOrganizer && !isAdmin) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    // Delete session and its attendances
    await SessionAttendance.deleteMany({ sessionId: session._id });
    await EventSession.findByIdAndDelete(sessionId);

    res.status(200).json({
      success: true,
      message: 'Session and its attendance records deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionAttendanceList = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      res.status(400).json({ success: false, message: 'Invalid session ID' });
      return;
    }

    const session = await EventSession.findById(sessionId).populate('eventId', 'title organizerId');
    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    const event = session.eventId as unknown as { organizerId: mongoose.Types.ObjectId; title: string };
    const isOrganizer = event && event.organizerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOrganizer && !isAdmin) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const attendances = await SessionAttendance.find({ sessionId })
      .populate('studentId', 'name email department studentIdNumber')
      .populate('checkedInBy', 'name email')
      .sort({ checkedInAt: -1 });

    const manualOverridesCount = attendances.filter((a) => a.isManualOverride).length;

    res.status(200).json({
      success: true,
      session,
      totalCount: attendances.length,
      summary: {
        totalAttended: attendances.length,
        manualOverrides: manualOverridesCount,
      },
      attendance: attendances,
      attendances,
      data: attendances,
    });
  } catch (error) {
    next(error);
  }
};
