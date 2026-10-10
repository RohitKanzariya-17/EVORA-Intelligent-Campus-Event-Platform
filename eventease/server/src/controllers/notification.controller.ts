import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Notification } from '../models/Notification';
import { EventSession } from '../models/EventSession';
import { SessionAttendance } from '../models/SessionAttendance';
import { Registration } from '../models/Registration';
import { Event } from '../models/Event';
import { AuthRequest } from '../middleware/auth';

/**
 * Smart automatic notification generator:
 * Runs when student checks notifications: inspects upcoming sessions for their registered events.
 * If session starts within 60 minutes and student has not checked in and has not received reminder,
 * safely creates in-app notification with deduplication key!
 */
export const checkAndGenerateRemindersForStudent = async (studentId: mongoose.Types.ObjectId) => {
  try {
    const registrations = await Registration.find({
      studentId,
      registrationStatus: { $ne: 'Cancelled' },
    });

    if (registrations.length === 0) return;
    const eventIds = registrations.map((r) => r.eventId);

    const now = new Date();
    const futureWindow = new Date(now.getTime() + 60 * 60 * 1000); // next 60 mins

    const upcomingSessions = await EventSession.find({
      eventId: { $in: eventIds },
      status: { $in: ['Scheduled', 'Active'] },
      startTime: { $lte: futureWindow },
      endTime: { $gte: now },
    }).populate('eventId', 'title');

    for (const session of upcomingSessions) {
      // Check if student has already checked in
      const alreadyAttended = await SessionAttendance.findOne({
        sessionId: session._id,
        studentId,
      });

      if (alreadyAttended) continue;

      const event = session.eventId as any;
      const eventTitle = event?.title || 'Event';
      const dedupKey = `remind_${studentId}_${session._id}_start`;

      // Check if already notified
      const existingNotif = await Notification.findOne({ dedupKey });
      if (!existingNotif) {
        const startStr = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endStr = new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        await Notification.create({
          recipientId: studentId,
          eventId: session.eventId,
          sessionId: session._id,
          title: `Upcoming Attendance: ${session.name}`,
          message: `Attendance session "${session.name}" for "${eventTitle}" runs from ${startStr} to ${endStr}. Please check in on time!`,
          type: 'session_reminder',
          read: false,
          dedupKey,
          data: {
            eventTitle,
            sessionName: session.name,
            startTime: session.startTime,
            endTime: session.endTime,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error generating smart reminders:', error);
  }
};

export const getMyNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Auto-check for approaching sessions if student
    if (req.user.role === 'student') {
      await checkAndGenerateRemindersForStudent(req.user._id);
    }

    const notifications = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipientId: req.user._id,
      read: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
      data: notifications,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
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
    const notif = await Notification.findOneAndUpdate(
      { _id: id, recipientId: req.user._id },
      { $set: { read: true } },
      { new: true }
    );

    if (!notif) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.status(200).json({ success: true, notification: notif });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    await Notification.updateMany(
      { recipientId: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

export const sendSessionReminders = async (
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
    const session = await EventSession.findById(sessionId).populate('eventId');
    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    const event = session.eventId as any;
    const isOrganizer = event && event.organizerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOrganizer && !isAdmin) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    // Find all registered students for this event
    const registrations = await Registration.find({
      eventId: event._id,
      registrationStatus: { $ne: 'Cancelled' },
    });

    if (registrations.length === 0) {
      res.status(200).json({ success: true, message: 'No registered students for this event', sentCount: 0 });
      return;
    }

    // Find students who already attended this session
    const attendedList = await SessionAttendance.find({ sessionId: session._id }).select('studentId');
    const attendedStudentIds = new Set(attendedList.map((a) => a.studentId.toString()));

    // Target students not yet attended
    const pendingStudentIds = registrations
      .map((r) => r.studentId.toString())
      .filter((sId) => !attendedStudentIds.has(sId));

    let sentCount = 0;
    const startStr = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endStr = new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    for (const studentId of pendingStudentIds) {
      const dedupKey = `manual_remind_${studentId}_${session._id}_${Date.now().toString().slice(0, 6)}`;
      try {
        await Notification.create({
          recipientId: new mongoose.Types.ObjectId(studentId),
          eventId: event._id,
          sessionId: session._id,
          title: `Attendance Reminder: ${session.name}`,
          message: `Organizer reminder: Attendance for "${session.name}" (${event.title}) is open from ${startStr} to ${endStr}. Please present your QR ticket!`,
          type: 'session_reminder',
          read: false,
          dedupKey,
          data: {
            eventTitle: event.title,
            sessionName: session.name,
            startTime: session.startTime,
            endTime: session.endTime,
          },
        });
        sentCount++;
      } catch (e) {
        // Ignore duplicate key collision
      }
    }

    res.status(200).json({
      success: true,
      message: `Sent reminders to ${sentCount} attendees who have not yet checked in.`,
      sentCount,
    });
  } catch (error) {
    next(error);
  }
};
