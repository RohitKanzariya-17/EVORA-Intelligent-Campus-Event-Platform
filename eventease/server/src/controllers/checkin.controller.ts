import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Registration } from '../models/Registration';
import { Event } from '../models/Event';
import { User } from '../models/User';
import { EventSession } from '../models/EventSession';
import { SessionAttendance } from '../models/SessionAttendance';
import { hashToken } from '../utils/token';
import { checkInScanSchema, checkInSyncSchema } from '../validators/event.validator';
import { AuthRequest } from '../middleware/auth';

export const scanCheckIn = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { token, eventId, sessionId, manualOverride, overrideReason } = checkInScanSchema.parse(req.body);

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid event ID' });
      return;
    }

    // 1. Verify event and permissions
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const isOrganizer = event.organizerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOrganizer && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Only the assigned organizer or an admin can check in attendees for this event.',
      });
      return;
    }

    // 2. Hash raw token and lookup registration
    const candidateHash = hashToken(token);
    const registration = await Registration.findOne({ tokenHash: candidateHash })
      .populate('studentId', 'name email department studentIdNumber')
      .populate('checkedInBy', 'name email');

    if (!registration) {
      res.status(404).json({
        success: false,
        message: 'Invalid ticket token. No registration record exists for this QR code.',
      });
      return;
    }

    // 3. Verify event matches
    if (registration.eventId.toString() !== eventId) {
      res.status(400).json({
        success: false,
        message: 'Ticket is registered for a different event.',
      });
      return;
    }

    // 4. Verify registration status
    if (registration.registrationStatus === 'Cancelled') {
      res.status(400).json({
        success: false,
        message: 'Ticket has been cancelled and cannot be used for check-in.',
        student: registration.studentId,
      });
      return;
    }

    const now = new Date();
    const studentUser = registration.studentId as unknown as { _id: mongoose.Types.ObjectId; name: string };
    const studentId = studentUser._id;

    // IF SESSION ID IS PROVIDED (FEATURE 1 & FEATURE 3):
    if (sessionId) {
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        res.status(400).json({ success: false, message: 'Invalid session ID' });
        return;
      }

      const session = await EventSession.findById(sessionId);
      if (!session) {
        res.status(404).json({ success: false, message: 'Attendance session not found.' });
        return;
      }

      if (session.eventId.toString() !== eventId) {
        res.status(400).json({ success: false, message: 'Session does not belong to this event.' });
        return;
      }

      const isAllowedOverride = Boolean(manualOverride && (isOrganizer || isAdmin));

      // Strict Attendance Time Window Check
      if (!isAllowedOverride && session.requireStrictWindow) {
        if (now < session.startTime) {
          res.status(400).json({
            success: false,
            message: `Attendance has not started yet. Session starts at ${new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          });
          return;
        }

        if (now > session.endTime) {
          res.status(400).json({
            success: false,
            message: `The attendance window has closed for session "${session.name}".`,
          });
          return;
        }
      }

      // Prevent duplicate attendance for the same student in the same session
      const existingSessionAttendance = await SessionAttendance.findOne({
        sessionId: session._id,
        studentId,
      });

      if (existingSessionAttendance) {
        res.status(400).json({
          success: false,
          message: `Duplicate check-in detected! This attendee has already checked in for session "${session.name}" on ${new Date(existingSessionAttendance.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          alreadyCheckedIn: true,
          checkedInAt: existingSessionAttendance.checkedInAt,
          student: registration.studentId,
          sessionName: session.name,
        });
        return;
      }

      // Record session attendance
      const recorded = await SessionAttendance.create({
        sessionId: session._id,
        eventId: event._id,
        registrationId: registration._id,
        studentId,
        checkedInBy: req.user._id,
        checkedInAt: now,
        isManualOverride: Boolean(isAllowedOverride && now > session.endTime),
        overrideReason: overrideReason || (isAllowedOverride ? 'Organizer manual override' : ''),
      });

      // Also ensure parent registration is marked as Attended
      if (registration.registrationStatus !== 'Attended') {
        registration.registrationStatus = 'Attended';
        registration.checkedInAt = now;
        registration.checkedInBy = req.user._id;
        await registration.save();
      }

      res.status(200).json({
        success: true,
        message: `Check-in verified for session "${session.name}"!`,
        student: registration.studentId,
        checkedInAt: recorded.checkedInAt,
        registrationId: registration._id,
        session: {
          id: session._id,
          name: session.name,
          isManualOverride: recorded.isManualOverride,
        },
      });
      return;
    }

    // LEGACY / DEFAULT EVENT-LEVEL CHECK-IN:
    if (registration.registrationStatus === 'Attended') {
      const checkedInByName =
        registration.checkedInBy && 'name' in registration.checkedInBy
          ? (registration.checkedInBy as unknown as { name: string }).name
          : 'Staff';

      res.status(400).json({
        success: false,
        message: `Duplicate check-in detected! This ticket was already checked in on ${new Date(
          registration.checkedInAt || registration.updatedAt
        ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by ${checkedInByName}.`,
        alreadyCheckedIn: true,
        checkedInAt: registration.checkedInAt,
        student: registration.studentId,
      });
      return;
    }

    // 5. Atomic check-in operation
    const updated = await Registration.findOneAndUpdate(
      {
        _id: registration._id,
        registrationStatus: 'Registered',
      },
      {
        $set: {
          registrationStatus: 'Attended',
          checkedInAt: new Date(),
          checkedInBy: req.user._id,
        },
      },
      { new: true }
    ).populate('studentId', 'name email department studentIdNumber');

    if (!updated) {
      res.status(400).json({
        success: false,
        message: 'Ticket was just checked in concurrently by another scanner.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Check-in verified successfully! Welcome attendee.',
      student: updated.studentId,
      checkedInAt: updated.checkedInAt,
      registrationId: updated._id,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventAttendance = async (
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
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const isOrganizer = event.organizerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOrganizer && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to view attendance for this event.',
      });
      return;
    }

    const registrations = await Registration.find({ eventId })
      .populate('studentId', 'name email department studentIdNumber')
      .populate('checkedInBy', 'name email')
      .sort({ registeredAt: -1 });

    const totalRegistered = registrations.filter((r) => r.registrationStatus !== 'Cancelled').length;
    const totalAttended = registrations.filter((r) => r.registrationStatus === 'Attended').length;
    const totalCancelled = registrations.filter((r) => r.registrationStatus === 'Cancelled').length;
    const pendingCheckIn = totalRegistered - totalAttended;
    const attendancePercentage = totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0;

    res.status(200).json({
      success: true,
      summary: {
        capacity: event.capacity,
        totalRegistered,
        totalAttended,
        totalCancelled,
        pendingCheckIn,
        attendancePercentage,
      },
      registrations,
    });
  } catch (error) {
    next(error);
  }
};

export const getOfflineCheckInPack = async (
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
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const isOrganizer = event.organizerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOrganizer && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Only the organizer or admin can download offline attendance data.',
      });
      return;
    }

    // Export minimal verification records
    const registrations = await Registration.find({
      eventId,
      registrationStatus: { $in: ['Registered', 'Attended'] },
    }).populate('studentId', 'name email department studentIdNumber');

    const tickets = registrations.map((r) => {
      const student = r.studentId as unknown as {
        name: string;
        email: string;
        department?: string;
        studentIdNumber?: string;
      };
      return {
        registrationId: r._id,
        tokenHash: r.tokenHash,
        studentName: student ? student.name : 'Unknown',
        studentEmail: student ? student.email : '',
        department: student?.department || '',
        studentIdNumber: student?.studentIdNumber || '',
        registrationStatus: r.registrationStatus,
        checkedInAt: r.checkedInAt || null,
      };
    });

    res.status(200).json({
      success: true,
      event: {
        id: event._id,
        title: event.title,
        date: event.date,
        venue: event.venue,
      },
      downloadedAt: new Date().toISOString(),
      tickets,
    });
  } catch (error) {
    next(error);
  }
};

export const syncOfflineScans = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { eventId, scans } = checkInSyncSchema.parse(req.body);

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const isOrganizer = event.organizerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOrganizer && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to sync scans for this event.',
      });
      return;
    }

    const results: Array<{
      idempotencyKey: string;
      status: 'synced' | 'conflict' | 'invalid';
      message: string;
      studentName?: string;
    }> = [];

    let syncedCount = 0;
    let conflictsCount = 0;
    let invalidCount = 0;

    for (const item of scans) {
      const candidateHash = hashToken(item.token);
      const reg = await Registration.findOne({ tokenHash: candidateHash })
        .populate('studentId', 'name email department studentIdNumber');

      if (!reg || reg.eventId.toString() !== eventId) {
        invalidCount++;
        results.push({
          idempotencyKey: item.idempotencyKey,
          status: 'invalid',
          message: 'Invalid ticket token or mismatched event.',
        });
        continue;
      }

      if (reg.registrationStatus === 'Cancelled') {
        invalidCount++;
        results.push({
          idempotencyKey: item.idempotencyKey,
          status: 'invalid',
          message: 'Ticket is marked as cancelled.',
        });
        continue;
      }

      if (reg.registrationStatus === 'Attended') {
        conflictsCount++;
        const student = reg.studentId as unknown as { name: string };
        results.push({
          idempotencyKey: item.idempotencyKey,
          status: 'conflict',
          message: 'Ticket already recorded as checked-in.',
          studentName: student?.name,
        });
        continue;
      }

      // Perform atomic update
      const checkInDate = item.scannedAt ? new Date(item.scannedAt) : new Date();
      const updated = await Registration.findOneAndUpdate(
        {
          _id: reg._id,
          registrationStatus: 'Registered',
        },
        {
          $set: {
            registrationStatus: 'Attended',
            checkedInAt: checkInDate,
            checkedInBy: req.user._id,
          },
        },
        { new: true }
      ).populate('studentId', 'name');

      if (updated) {
        syncedCount++;
        const student = updated.studentId as unknown as { name: string };
        results.push({
          idempotencyKey: item.idempotencyKey,
          status: 'synced',
          message: 'Check-in successfully synchronized.',
          studentName: student?.name,
        });
      } else {
        conflictsCount++;
        results.push({
          idempotencyKey: item.idempotencyKey,
          status: 'conflict',
          message: 'Concurrent check-in collision detected.',
        });
      }
    }

    res.status(200).json({
      success: true,
      summary: {
        total: scans.length,
        syncedCount,
        conflictsCount,
        invalidCount,
      },
      results,
    });
  } catch (error) {
    next(error);
  }
};

export const getLiveCrowdStats = async (
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

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const isOrganizer = event.organizerId.toString() === req.user?._id.toString();
    const isAdmin = req.user?.role === 'admin';
    if (!isOrganizer && !isAdmin) {
      res.status(403).json({ success: false, message: 'Forbidden. Permission required to view live monitor.' });
      return;
    }

    const totalRegistered = await Registration.countDocuments({
      eventId,
      registrationStatus: { $ne: 'Cancelled' },
    });

    const uniqueCheckedIn = await Registration.countDocuments({
      eventId,
      registrationStatus: 'Attended',
    });

    const pendingCheckIn = Math.max(0, totalRegistered - uniqueCheckedIn);
    const remainingCapacity = Math.max(0, event.capacity - totalRegistered);
    const attendancePercentage = totalRegistered > 0 ? Math.round((uniqueCheckedIn / totalRegistered) * 100) : 0;

    // Session breakdown
    const now = new Date();
    const sessions = await EventSession.find({ eventId }).sort({ startTime: 1 });
    const sessionStats = await Promise.all(
      sessions.map(async (sess) => {
        const count = await SessionAttendance.countDocuments({ sessionId: sess._id });
        const isActive = now >= sess.startTime && now <= sess.endTime;
        const rate = totalRegistered > 0 ? Math.round((count / totalRegistered) * 100) : 0;
        return {
          id: sess._id,
          name: sess.name,
          description: sess.description,
          startTime: sess.startTime,
          endTime: sess.endTime,
          status: sess.status,
          attendanceCount: count,
          attendanceRate: rate,
          isActive,
        };
      })
    );

    // Recent check-in activity (last 10)
    const recentSessionAttendances = await SessionAttendance.find({ eventId })
      .populate('studentId', 'name email department studentIdNumber')
      .populate('sessionId', 'name')
      .sort({ checkedInAt: -1 })
      .limit(10);

    const recentActivity = recentSessionAttendances.map((sa) => {
      const student = sa.studentId as any;
      const session = sa.sessionId as any;
      return {
        id: sa._id,
        studentName: student?.name || 'Attendee',
        studentEmail: student?.email || '',
        department: student?.department || 'General',
        studentIdNumber: student?.studentIdNumber || '',
        sessionName: session?.name || 'General Entry',
        checkedInAt: sa.checkedInAt,
        isManualOverride: sa.isManualOverride,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        event: {
          id: event._id,
          title: event.title,
          capacity: event.capacity,
          venue: event.venue,
          date: event.date,
          status: event.status,
        },
        metrics: {
          totalRegistered,
          uniqueCheckedIn,
          pendingCheckIn,
          remainingCapacity,
          attendancePercentage,
        },
        sessions: sessionStats,
        recentActivity,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
