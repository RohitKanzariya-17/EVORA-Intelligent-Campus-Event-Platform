import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { Certificate } from '../models/Certificate';
import { Event } from '../models/Event';
import { EventSession } from '../models/EventSession';
import { Registration } from '../models/Registration';
import { SessionAttendance } from '../models/SessionAttendance';
import { Notification } from '../models/Notification';
import { config } from '../config/env';
import { generateCertificatesSchema } from '../validators/event.validator';
import { AuthRequest } from '../middleware/auth';

/**
 * Public certificate verification endpoint (No auth required)
 */
export const verifyCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { certificateId } = req.params;
    if (!certificateId || typeof certificateId !== 'string') {
      res.status(400).json({ success: false, message: 'Certificate ID is required' });
      return;
    }

    const certificate = await Certificate.findOne({ certificateId: certificateId.trim() })
      .populate('issuedBy', 'name department');

    if (!certificate) {
      res.status(404).json({
        success: false,
        message: 'Certificate not found. No credential exists with this identification code.',
      });
      return;
    }

    const issuer = certificate.issuedBy as any;
    const certDetails = {
      certificateId: certificate.certificateId,
      studentName: certificate.studentName,
      studentEmail: certificate.studentEmail,
      eventTitle: certificate.eventTitle,
      eventCategory: certificate.eventCategory,
      issueDate: certificate.issueDate,
      status: certificate.status,
      eligibilityCriteria: certificate.eligibilityCriteria,
      sessionsAttended: certificate.sessionsAttended,
      verificationUrl: certificate.verificationUrl,
      issuedBy: issuer?.name ? `${issuer.name} (${issuer.department || 'Faculty Coordinator'})` : 'Academic Event Directorate',
      isRevoked: certificate.status === 'Revoked',
      revokedReason: certificate.revokedReason || null,
      revokedAt: certificate.revokedAt || null,
    };

    res.status(200).json({
      success: true,
      valid: certificate.status === 'Valid',
      data: certDetails,
      certificate: certDetails,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyCertificates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const certificates = await Certificate.find({
      studentId: req.user._id,
      status: 'Valid',
    })
      .populate('eventId', 'title date venue coverImage category')
      .sort({ issueDate: -1 });

    res.status(200).json({ success: true, data: certificates, certificates });
  } catch (error) {
    next(error);
  }
};

export const getEventCertificates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid event ID' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    const isOwner = event.organizerId ? event.organizerId.toString() === req.user._id.toString() : true;
    const isAuthorized = req.user.role === 'admin' || req.user.role === 'organizer' || isOwner;
    if (!isAuthorized) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const certificates = await Certificate.find({ eventId })
      .populate('studentId', 'name email department studentIdNumber')
      .sort({ issueDate: -1 });

    res.status(200).json({ success: true, data: certificates, certificates });
  } catch (error) {
    next(error);
  }
};

export const generateEventCertificates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid event ID' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    const isOwner = event.organizerId ? event.organizerId.toString() === req.user._id.toString() : true;
    const isAuthorized = req.user.role === 'admin' || req.user.role === 'organizer' || isOwner;
    if (!isAuthorized) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const body = generateCertificatesSchema.parse(req.body);
    const minSessions = body.minSessionsRequired !== undefined ? body.minSessionsRequired : (body.minSessions ?? 1);
    const eligibilityCriteria = body.eligibilityCriteria || 'Verified Event Participation & Check-In';
    const totalEventSessions = await EventSession.countDocuments({ eventId: event._id });

    // Find all attended registrations
    const registrations = await Registration.find({
      eventId,
      registrationStatus: 'Attended',
    }).populate('studentId', 'name email department');

    if (registrations.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No verified attendees found for this event to issue certificates.',
      });
      return;
    }

    let issuedCount = 0;
    let skippedCount = 0;
    const clientBase = config.CLIENT_URL || 'http://localhost:5173';

    for (const reg of registrations) {
      const student = reg.studentId as any;
      if (!student) continue;

      // Check if certificate already exists
      const existing = await Certificate.findOne({
        eventId: event._id,
        studentId: student._id,
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // Check sessions attended count if event has sessions
      const sessionCount = await SessionAttendance.countDocuments({
        eventId: event._id,
        studentId: student._id,
      });

      if (totalEventSessions > 0 && minSessions > 0 && sessionCount < minSessions) {
        skippedCount++;
        continue;
      }

      // Generate non-guessable cryptographic certificate ID
      const randToken = crypto.randomBytes(3).toString('hex').toUpperCase();
      const certId = `EE-${new Date().getFullYear()}-${event._id.toString().slice(-4).toUpperCase()}-${randToken}`;
      const verificationUrl = `${clientBase}/verify-certificate/${certId}`;

      const cert = await Certificate.create({
        certificateId: certId,
        eventId: event._id,
        studentId: student._id,
        studentName: student.name,
        studentEmail: student.email,
        eventTitle: event.title,
        eventCategory: event.category,
        issueDate: new Date(),
        issuedBy: req.user._id,
        eligibilityCriteria,
        sessionsAttended: sessionCount > 0 ? sessionCount : 1,
        verificationUrl,
        status: 'Valid',
      });

      issuedCount++;

      // Create in-app notification for the recipient
      await Notification.create({
        recipientId: student._id,
        eventId: event._id,
        title: 'Digital Certificate Issued!',
        message: `Congratulations! Your official certificate of participation for "${event.title}" has been issued. Identifier: ${cert.certificateId}.`,
        type: 'certificate_issued',
        read: false,
        data: {
          certificateId: cert.certificateId,
          eventTitle: event.title,
          verificationUrl: cert.verificationUrl,
        },
      });
    }

    const updatedCerts = await Certificate.find({ eventId: event._id })
      .populate('studentId', 'name email department studentIdNumber')
      .sort({ issueDate: -1 });

    res.status(200).json({
      success: true,
      message: `Successfully issued ${issuedCount} certificates (${skippedCount} already issued or skipped).`,
      count: issuedCount,
      issuedCount,
      skippedCount,
      data: updatedCerts,
      certificates: updatedCerts,
    });
  } catch (error) {
    next(error);
  }
};

export const revokeCertificate = async (
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
    const { reason } = req.body;

    const cert = mongoose.Types.ObjectId.isValid(id)
      ? await Certificate.findById(id).populate('eventId')
      : await Certificate.findOne({ certificateId: id }).populate('eventId');

    if (!cert) {
      res.status(404).json({ success: false, message: 'Certificate not found' });
      return;
    }

    const event = cert.eventId as any;
    const isOwner = event && event.organizerId ? event.organizerId.toString() === req.user._id.toString() : true;
    const isAuthorized = req.user.role === 'admin' || req.user.role === 'organizer' || isOwner;
    if (!isAuthorized) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    cert.status = 'Revoked';
    cert.revokedReason = reason || 'Revoked by event authority';
    cert.revokedAt = new Date();
    await cert.save();

    res.status(200).json({
      success: true,
      message: 'Certificate revoked successfully.',
      data: cert,
      certificate: cert,
    });
  } catch (error) {
    next(error);
  }
};
