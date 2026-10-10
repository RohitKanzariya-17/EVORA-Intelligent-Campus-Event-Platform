import { Response, NextFunction } from 'express';
import { Event, IEvent } from '../models/Event';
import { createEventSchema, updateEventSchema } from '../validators/event.validator';
import { AuthRequest } from '../middleware/auth';

export const getEvents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      search,
      category,
      status,
      organizerId,
      page = '1',
      limit = '12',
      sort = 'date',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {};

    // Role-based visibility
    const isUserAdmin = req.user?.role === 'admin';
    const isUserOrganizer = req.user?.role === 'organizer';

    if (status) {
      if (isUserAdmin) {
        query.status = status;
      } else if (isUserOrganizer && organizerId === req.user?._id.toString()) {
        query.status = status;
      } else {
        query.status = status === 'Published' ? 'Published' : 'Published';
      }
    } else {
      if (!isUserAdmin && !(isUserOrganizer && organizerId === req.user?._id.toString())) {
        query.status = 'Published';
      }
    }

    if (organizerId) {
      query.organizerId = organizerId;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { venue: searchRegex },
      ];
    }

    const sortOptions: Record<string, 1 | -1> =
      sort === 'soonest'
        ? { date: 1 }
        : sort === 'latest'
        ? { date: -1 }
        : sort === 'popular'
        ? { registeredCount: -1 }
        : { date: 1 };

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('organizerId', 'name email department')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Event.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: events,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).populate('organizerId', 'name email department');

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
      return;
    }

    // If event is not published, only event organizer or admin can see it
    if (event.status !== 'Published') {
      const isOwner = req.user?._id.toString() === event.organizerId._id.toString();
      const isAdmin = req.user?.role === 'admin';
      if (!isOwner && !isAdmin) {
        res.status(403).json({
          success: false,
          message: 'This event is currently not published or unavailable.',
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const validatedData = createEventSchema.parse(req.body);

    const deadline = new Date(validatedData.registrationDeadline);
    const eventDate = new Date(validatedData.date);

    if (deadline > eventDate) {
      res.status(400).json({
        success: false,
        message: 'Registration deadline cannot be after the event date.',
      });
      return;
    }

    const event = await Event.create({
      ...validatedData,
      date: eventDate,
      registrationDeadline: deadline,
      organizerId: req.user._id,
      registeredCount: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (
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
    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    // Role check: Only owner organizer or admin can update
    const isOwner = event.organizerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. You can only edit your own events.',
      });
      return;
    }

    const validatedData = updateEventSchema.parse(req.body);

    if (validatedData.capacity !== undefined && validatedData.capacity < event.registeredCount) {
      res.status(400).json({
        success: false,
        message: `Capacity cannot be reduced below current registered attendees (${event.registeredCount}).`,
      });
      return;
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $set: validatedData },
      { new: true, runValidators: true }
    ).populate('organizerId', 'name email department');

    res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      data: updatedEvent,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (
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
    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const isOwner = event.organizerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. You can only delete your own events.',
      });
      return;
    }

    // If event has attendees registered, set status to Cancelled instead of hard deleting to preserve integrity
    if (event.registeredCount > 0) {
      event.status = 'Cancelled';
      await event.save();
      res.status(200).json({
        success: true,
        message: 'Event has active registrations. Status marked as Cancelled.',
      });
      return;
    }

    await Event.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
