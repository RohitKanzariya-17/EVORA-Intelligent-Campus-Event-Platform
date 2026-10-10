import { Response, NextFunction } from 'express';
import { User, UserRole, UserStatus } from '../models/User';
import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { AuthRequest } from '../middleware/auth';

export const getAdminStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalUsers,
      studentsCount,
      organizersCount,
      adminsCount,
      activeUsersCount,
      suspendedUsersCount,
      totalEvents,
      draftEvents,
      publishedEvents,
      completedEvents,
      cancelledEvents,
      totalRegistrations,
      attendedRegistrations,
      cancelledRegistrations,
      popularEvents,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'organizer' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' }),
      Event.countDocuments(),
      Event.countDocuments({ status: 'Draft' }),
      Event.countDocuments({ status: 'Published' }),
      Event.countDocuments({ status: 'Completed' }),
      Event.countDocuments({ status: 'Cancelled' }),
      Registration.countDocuments({ registrationStatus: { $ne: 'Cancelled' } }),
      Registration.countDocuments({ registrationStatus: 'Attended' }),
      Registration.countDocuments({ registrationStatus: 'Cancelled' }),
      Event.find({ status: { $in: ['Published', 'Completed'] } })
        .sort({ registeredCount: -1 })
        .limit(5)
        .select('title category capacity registeredCount date venue')
        .lean(),
    ]);

    const platformAttendanceRate =
      totalRegistrations > 0
        ? Math.round((attendedRegistrations / totalRegistrations) * 100)
        : 0;

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          students: studentsCount,
          organizers: organizersCount,
          admins: adminsCount,
          active: activeUsersCount,
          suspended: suspendedUsersCount,
        },
        events: {
          total: totalEvents,
          draft: draftEvents,
          published: publishedEvents,
          completed: completedEvents,
          cancelled: cancelledEvents,
        },
        registrations: {
          total: totalRegistrations,
          attended: attendedRegistrations,
          cancelled: cancelledRegistrations,
          pending: totalRegistrations - attendedRegistrations,
          attendanceRate: platformAttendanceRate,
        },
        popularEvents,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, role, status, page = '1', limit = '15' } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {};

    if (role && ['student', 'organizer', 'admin'].includes(role)) {
      query.role = role;
    }

    if (status && ['active', 'suspended'].includes(status)) {
      query.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { department: searchRegex },
        { studentIdNumber: searchRegex },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: users,
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

export const updateUserRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body as { role: UserRole };

    if (!['student', 'organizer', 'admin'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role specified.' });
      return;
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Safety rule: Prevent demoting the last active administrator
    if (targetUser.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', status: 'active' });
      if (adminCount <= 1) {
        res.status(400).json({
          success: false,
          message: 'Cannot demote the only remaining active administrator on the platform.',
        });
        return;
      }
    }

    targetUser.role = role;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully.`,
      user: targetUser,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: UserStatus };

    if (!['active', 'suspended'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status specified.' });
      return;
    }

    if (id === req.user?._id.toString() && status === 'suspended') {
      res.status(400).json({
        success: false,
        message: 'Security safeguard: You cannot suspend your own administrative account.',
      });
      return;
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    targetUser.status = status;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `User status updated to ${status}.`,
      user: targetUser,
    });
  } catch (error) {
    next(error);
  }
};
