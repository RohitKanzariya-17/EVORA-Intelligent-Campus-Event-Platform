import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Registration } from '../models/Registration';
import { Event } from '../models/Event';
import { deriveRegistrationToken, hashToken, generateQRCodeDataUrl } from '../utils/token';
import { AuthRequest } from '../middleware/auth';

export const registerForEvent = async (
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

    // 1. Initial event validation
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    if (event.status !== 'Published') {
      res.status(400).json({
        success: false,
        message: 'Registrations are currently closed. Event is not published.',
      });
      return;
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      res.status(400).json({
        success: false,
        message: 'Registration deadline for this event has passed.',
      });
      return;
    }

    if (event.registeredCount >= event.capacity) {
      res.status(400).json({
        success: false,
        message: 'Event is fully booked. Maximum capacity reached.',
      });
      return;
    }

    // 2. Check existing registration
    const existingReg = await Registration.findOne({
      studentId: req.user._id,
      eventId,
    });

    if (existingReg && existingReg.registrationStatus === 'Registered') {
      res.status(409).json({
        success: false,
        message: 'You have already registered for this event.',
      });
      return;
    }

    if (existingReg && existingReg.registrationStatus === 'Attended') {
      res.status(409).json({
        success: false,
        message: 'You have already attended this event.',
      });
      return;
    }

    // 3. Atomic capacity reservation
    const reservedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        status: 'Published',
        registrationDeadline: { $gt: new Date() },
        $expr: { $lt: ['$registeredCount', '$capacity'] },
      },
      { $inc: { registeredCount: 1 } },
      { new: true }
    );

    if (!reservedEvent) {
      res.status(400).json({
        success: false,
        message: 'Unable to register: event capacity has just reached limit or deadline passed.',
      });
      return;
    }

    // 4. Create or reinstate registration
    const now = new Date();

    if (existingReg && existingReg.registrationStatus === 'Cancelled') {
      existingReg.registrationStatus = 'Registered';
      existingReg.registeredAt = now;
      existingReg.cancellationReason = undefined;
      existingReg.cancelledAt = undefined;
      existingReg.checkedInAt = undefined;
      existingReg.checkedInBy = undefined;

      const rawToken = deriveRegistrationToken(
        existingReg._id.toString(),
        req.user._id.toString(),
        now
      );
      existingReg.tokenHash = hashToken(rawToken);
      await existingReg.save();

      const qrCodeDataUrl = await generateQRCodeDataUrl(rawToken);

      res.status(200).json({
        success: true,
        message: 'Registration re-activated successfully!',
        data: {
          registration: existingReg,
          ticketToken: rawToken,
          qrCodeDataUrl,
        },
      });
      return;
    }

    const regId = new mongoose.Types.ObjectId();
    const rawToken = deriveRegistrationToken(
      regId.toString(),
      req.user._id.toString(),
      now
    );
    const tokenHash = hashToken(rawToken);

    try {
      const registration = await Registration.create({
        _id: regId,
        studentId: req.user._id,
        eventId,
        tokenHash,
        registrationStatus: 'Registered',
        registeredAt: now,
      });

      const qrCodeDataUrl = await generateQRCodeDataUrl(rawToken);

      res.status(201).json({
        success: true,
        message: 'Successfully registered for event! Your QR ticket is ready.',
        data: {
          registration,
          ticketToken: rawToken,
          qrCodeDataUrl,
        },
      });
    } catch (err: unknown) {
      // Rollback atomic counter if duplicate registration triggered DB constraint
      await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -1 } });
      const errorObj = err as { code?: number };
      if (errorObj?.code === 11000) {
        res.status(409).json({
          success: false,
          message: 'You are already registered for this event.',
        });
        return;
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

export const getMyRegistrations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const registrations = await Registration.find({ studentId: req.user._id })
      .populate({
        path: 'eventId',
        select: 'title description date startTime endTime venue category coverImage status',
        populate: {
          path: 'organizerId',
          select: 'name email',
        },
      })
      .sort({ registeredAt: -1 });

    res.status(200).json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    next(error);
  }
};

export const getTicket = async (
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
    const registration = await Registration.findById(id)
      .populate('eventId')
      .populate('studentId', 'name email department studentIdNumber');

    if (!registration) {
      res.status(404).json({ success: false, message: 'Ticket registration not found.' });
      return;
    }

    const studentIdStr = (registration.studentId as unknown as { _id: mongoose.Types.ObjectId })._id.toString();
    const eventObj = registration.eventId as unknown as { organizerId: mongoose.Types.ObjectId };
    const organizerIdStr = eventObj.organizerId ? eventObj.organizerId.toString() : '';

    const isStudentOwner = studentIdStr === req.user._id.toString();
    const isEventOrganizer = organizerIdStr === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isStudentOwner && !isEventOrganizer && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to view this ticket.',
      });
      return;
    }

    if (registration.registrationStatus === 'Cancelled') {
      res.status(400).json({
        success: false,
        message: 'This registration has been cancelled. Ticket is inactive.',
      });
      return;
    }

    // Reconstruct raw token for authorized viewer
    const rawToken = deriveRegistrationToken(
      registration._id.toString(),
      studentIdStr,
      registration.registeredAt
    );

    const qrCodeDataUrl = await generateQRCodeDataUrl(rawToken);

    res.status(200).json({
      success: true,
      data: {
        registrationId: registration._id,
        ticketToken: rawToken,
        qrCodeDataUrl,
        registrationStatus: registration.registrationStatus,
        registeredAt: registration.registeredAt,
        checkedInAt: registration.checkedInAt,
        event: registration.eventId,
        student: registration.studentId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelRegistration = async (
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
    const registration = await Registration.findById(id);

    if (!registration) {
      res.status(404).json({ success: false, message: 'Registration not found.' });
      return;
    }

    const isOwner = registration.studentId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. You can only cancel your own registration.',
      });
      return;
    }

    if (registration.registrationStatus === 'Cancelled') {
      res.status(400).json({
        success: false,
        message: 'This registration has already been cancelled.',
      });
      return;
    }

    if (registration.registrationStatus === 'Attended') {
      res.status(400).json({
        success: false,
        message: 'Cannot cancel registration after attending the event.',
      });
      return;
    }

    registration.registrationStatus = 'Cancelled';
    registration.cancelledAt = new Date();
    registration.cancellationReason = req.body.reason || 'Cancelled by attendee';
    await registration.save();

    // Atomically decrement event registeredCount
    await Event.findByIdAndUpdate(registration.eventId, {
      $inc: { registeredCount: -1 },
    });

    res.status(200).json({
      success: true,
      message: 'Registration has been successfully cancelled.',
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};
