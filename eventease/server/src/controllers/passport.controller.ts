import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Registration } from '../models/Registration';
import { SessionAttendance } from '../models/SessionAttendance';
import { EventSession } from '../models/EventSession';
import { Certificate } from '../models/Certificate';
import { Event } from '../models/Event';
import { AuthRequest } from '../middleware/auth';

export const getStudentPassport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const studentId = req.user._id;

    // 1. Fetch all registrations for this student
    const registrations = await Registration.find({ studentId })
      .populate('eventId')
      .sort({ registeredAt: -1 });

    // 2. Fetch all session attendances for this student
    const sessionAttendances = await SessionAttendance.find({ studentId })
      .populate('sessionId')
      .populate('eventId', 'title category date venue');

    // 3. Fetch all certificates earned by this student
    const certificates = await Certificate.find({
      studentId,
      status: 'Valid',
    }).sort({ issueDate: -1 });

    // Map attended sessions by eventId
    const attendedSessionsByEvent = new Map<string, Array<{ sessionId: string; sessionName: string; checkedInAt: Date }>>();
    sessionAttendances.forEach((sa) => {
      const eId = sa.eventId ? (sa.eventId as any)._id?.toString() || sa.eventId.toString() : '';
      if (!eId) return;
      const sess = sa.sessionId as any;
      if (!attendedSessionsByEvent.has(eId)) {
        attendedSessionsByEvent.set(eId, []);
      }
      attendedSessionsByEvent.get(eId)!.push({
        sessionId: sess?._id?.toString() || '',
        sessionName: sess?.name || 'General Entry',
        checkedInAt: sa.checkedInAt,
      });
    });

    // 4. Build per-event passport record
    let totalRegistered = 0;
    let totalCompleted = 0;
    let totalPartiallyAttended = 0;
    let totalAttendedAny = 0;

    const eventRecords = await Promise.all(
      registrations.map(async (reg) => {
        if (!reg.eventId) return null;
        const ev = reg.eventId as any;
        const eId = ev._id.toString();

        if (reg.registrationStatus !== 'Cancelled') {
          totalRegistered++;
        }

        // Fetch all sessions defined for this event
        const eventSessions = await EventSession.find({ eventId: ev._id }).sort({ startTime: 1 });
        const attendedThisEvent = attendedSessionsByEvent.get(eId) || [];

        let participationStatus: 'Registered' | 'Partially Attended' | 'Completed' | 'Cancelled' = 'Registered';

        if (reg.registrationStatus === 'Cancelled') {
          participationStatus = 'Cancelled';
        } else if (eventSessions.length > 0) {
          // Multi-session event
          if (attendedThisEvent.length >= eventSessions.length) {
            participationStatus = 'Completed';
            totalCompleted++;
            totalAttendedAny++;
          } else if (attendedThisEvent.length > 0) {
            participationStatus = 'Partially Attended';
            totalPartiallyAttended++;
            totalAttendedAny++;
          } else {
            participationStatus = 'Registered';
          }
        } else {
          // Single-session / legacy event without multiple sessions
          if (reg.registrationStatus === 'Attended') {
            participationStatus = 'Completed';
            totalCompleted++;
            totalAttendedAny++;
          } else {
            participationStatus = 'Registered';
          }
        }

        // Match certificate if exists
        const cert = certificates.find((c) => c.eventId.toString() === eId);

        return {
          eventId: ev._id,
          title: ev.title,
          category: ev.category,
          date: ev.date,
          venue: ev.venue,
          coverImage: ev.coverImage,
          status: ev.status,
          registeredAt: reg.registeredAt,
          registrationStatus: reg.registrationStatus,
          participationStatus,
          totalSessionsCount: eventSessions.length,
          attendedSessionsCount: attendedThisEvent.length,
          sessionsBreakdown: eventSessions.map((s) => ({
            sessionId: s._id,
            name: s.name,
            startTime: s.startTime,
            endTime: s.endTime,
            isAttended: attendedThisEvent.some((a) => a.sessionId === s._id.toString()),
          })),
          certificate: cert
            ? {
                certificateId: cert.certificateId,
                issueDate: cert.issueDate,
                verificationUrl: cert.verificationUrl,
              }
            : null,
        };
      })
    );

    const validRecords = eventRecords.filter(Boolean);

    // 5. Compute dynamic achievements based on real data
    const achievements = [];

    if (totalAttendedAny >= 1) {
      achievements.push({
        id: 'first_event',
        title: 'Campus Pioneer',
        description: 'Successfully checked in and attended your first college event.',
        icon: 'Sparkles',
        earnedAt: validRecords.find((r) => r?.participationStatus === 'Completed')?.date || new Date(),
      });
    }

    if (totalCompleted >= 3) {
      achievements.push({
        id: 'active_participant',
        title: 'Event Enthusiast',
        description: 'Completed 3 or more campus events with verified participation.',
        icon: 'Award',
        earnedAt: new Date(),
      });
    }

    const hasHackathon = validRecords.some(
      (r) => r?.category === 'Hackathon' && (r?.participationStatus === 'Completed' || r?.participationStatus === 'Partially Attended')
    );
    if (hasHackathon) {
      achievements.push({
        id: 'hackathon_hacker',
        title: 'Hackathon Hacker',
        description: 'Participated in a competitive college hackathon event.',
        icon: 'Code',
        earnedAt: new Date(),
      });
    }

    const hasMultiSession = validRecords.some((r) => (r?.totalSessionsCount || 0) > 1 && r?.participationStatus === 'Completed');
    if (hasMultiSession) {
      achievements.push({
        id: 'full_session_hero',
        title: 'Perfect Attendance',
        description: 'Attended every single session of a multi-session workshop/symposium.',
        icon: 'CheckCircle2',
        earnedAt: new Date(),
      });
    }

    if (certificates.length >= 1) {
      achievements.push({
        id: 'certified_scholar',
        title: 'Certified Scholar',
        description: 'Earned official digital certificate credentials verified by faculty.',
        icon: 'ShieldCheck',
        earnedAt: certificates[0].issueDate,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          department: req.user.department,
          studentIdNumber: req.user.studentIdNumber,
          skills: (req.user as any).skills || [],
        },
        metrics: {
          totalRegistered,
          totalAttendedAny,
          totalCompleted,
          totalPartiallyAttended,
          certificatesEarned: certificates.length,
          achievementsUnlocked: achievements.length,
          attendanceRate: totalRegistered > 0 ? Math.round((totalAttendedAny / totalRegistered) * 100) : 0,
        },
        events: validRecords,
        certificates: certificates.map((c) => ({
          id: c._id,
          certificateId: c.certificateId,
          eventTitle: c.eventTitle,
          eventCategory: c.eventCategory,
          issueDate: c.issueDate,
          verificationUrl: c.verificationUrl,
          eligibilityCriteria: c.eligibilityCriteria,
        })),
        achievements,
      },
    });
  } catch (error) {
    next(error);
  }
};
