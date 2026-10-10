import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { buildCsvString } from '../utils/csv';
import { AuthRequest } from '../middleware/auth';

export const getOrganizerDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const organizerFilter =
      req.user.role === 'admin'
        ? {} // Admin can view platform-wide organizer overview
        : { organizerId: req.user._id };

    // 1. Fetch organizer's events
    const events = await Event.find(organizerFilter).sort({ date: 1 }).lean();
    const eventIds = events.map((e) => e._id);

    // 2. Compute aggregate numbers strictly from DB
    const totalEvents = events.length;
    const totalCapacity = events.reduce((sum, e) => sum + (e.capacity || 0), 0);

    const [
      activeRegistrations,
      attendedCount,
      recentRegistrations,
    ] = await Promise.all([
      Registration.countDocuments({
        eventId: { $in: eventIds },
        registrationStatus: { $ne: 'Cancelled' },
      }),
      Registration.countDocuments({
        eventId: { $in: eventIds },
        registrationStatus: 'Attended',
      }),
      Registration.find({
        eventId: { $in: eventIds },
      })
        .populate('studentId', 'name email department studentIdNumber')
        .populate('eventId', 'title date venue')
        .populate('checkedInBy', 'name email')
        .sort({ updatedAt: -1 })
        .limit(15)
        .lean(),
    ]);

    const notCheckedIn = Math.max(0, activeRegistrations - attendedCount);
    const remainingSeats = Math.max(0, totalCapacity - activeRegistrations);
    const attendancePercentage =
      activeRegistrations > 0 ? Math.round((attendedCount / activeRegistrations) * 100) : 0;

    // 3. Upcoming events (next 5)
    const now = new Date();
    const upcomingEvents = events
      .filter((e) => new Date(e.date) >= now && e.status === 'Published')
      .slice(0, 5);

    // 4. Chart data computations
    // Chart 1: Registrations & capacity by event (top 6 events)
    const registrationsByEvent = events.slice(0, 7).map((e) => ({
      name: e.title.length > 20 ? `${e.title.slice(0, 18)}...` : e.title,
      fullTitle: e.title,
      registered: e.registeredCount,
      capacity: e.capacity,
    }));

    // Chart 2: Attendance breakdown
    const attendanceBreakdown = [
      { name: 'Checked In', value: attendedCount, color: '#10b981' }, // emerald
      { name: 'Not Checked In', value: notCheckedIn, color: '#6366f1' }, // indigo
    ];

    // Chart 3: Category distribution
    const categoryMap: Record<string, number> = {};
    for (const e of events) {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + 1;
    }
    const categoryDistribution = Object.entries(categoryMap).map(([category, count]) => ({
      name: category,
      count,
    }));

    // Chart 4: Registration trend (by registration date)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendRegistrations = await Registration.aggregate([
      {
        $match: {
          eventId: { $in: eventIds },
          registeredAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$registeredAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const registrationTrend = trendRegistrations.map((t) => ({
      date: t._id,
      registrations: t.count,
    }));

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalEvents,
          totalRegistrations: activeRegistrations,
          totalCheckIns: attendedCount,
          notYetCheckedIn: notCheckedIn,
          totalCapacity,
          remainingSeats,
          attendancePercentage,
        },
        upcomingEvents,
        recentActivity: recentRegistrations,
        charts: {
          registrationsByEvent,
          attendanceBreakdown,
          categoryDistribution,
          registrationTrend,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportEventAttendanceCsv = async (
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
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const isOrganizer = event.organizerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOrganizer && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to export attendance for this event.',
      });
      return;
    }

    const registrations = await Registration.find({ eventId })
      .populate('studentId', 'name email department studentIdNumber')
      .populate('checkedInBy', 'name email')
      .sort({ registeredAt: 1 });

    const headers = [
      'Student Name',
      'Student Email',
      'Department',
      'Student Roll / ID',
      'Registration Status',
      'Registered At',
      'Checked In At',
      'Checked In By',
      'Cancellation Reason',
    ];

    const rows = registrations.map((r) => {
      const student = r.studentId as unknown as {
        name?: string;
        email?: string;
        department?: string;
        studentIdNumber?: string;
      };
      const checkedBy = r.checkedInBy as unknown as { name?: string; email?: string };

      return [
        student?.name || 'Unknown',
        student?.email || '',
        student?.department || '',
        student?.studentIdNumber || '',
        r.registrationStatus,
        r.registeredAt ? new Date(r.registeredAt).toISOString() : '',
        r.checkedInAt ? new Date(r.checkedInAt).toISOString() : '',
        checkedBy?.name || '',
        r.cancellationReason || '',
      ];
    });

    const csvContent = buildCsvString(headers, rows);

    const safeTitle = event.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const filename = `attendance_${safeTitle}_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
