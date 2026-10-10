import { Response, NextFunction } from 'express';
import { Feedback } from '../models/Feedback';
import { Registration } from '../models/Registration';
import { feedbackSchema } from '../validators/event.validator';
import { AuthRequest } from '../middleware/auth';

export const submitFeedback = async (
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
    const { rating, comment } = feedbackSchema.parse(req.body);

    // Rule: Student must have attended the event to give feedback
    const attendance = await Registration.findOne({
      studentId: req.user._id,
      eventId,
      registrationStatus: 'Attended',
    });

    if (!attendance) {
      res.status(403).json({
        success: false,
        message: 'Feedback can only be submitted after attending and checking in to the event.',
      });
      return;
    }

    const feedback = await Feedback.findOneAndUpdate(
      {
        studentId: req.user._id,
        eventId,
      },
      {
        $set: {
          rating,
          comment: comment || '',
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Thank you! Your feedback has been recorded.',
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventFeedback = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: eventId } = req.params;

    const feedbacks = await Feedback.find({ eventId })
      .populate('studentId', 'name department')
      .sort({ createdAt: -1 });

    const totalRatings = feedbacks.length;
    const averageRating =
      totalRatings > 0
        ? Number((feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalRatings).toFixed(1))
        : 0;

    res.status(200).json({
      success: true,
      data: {
        averageRating,
        totalReviews: totalRatings,
        feedbacks,
      },
    });
  } catch (error) {
    next(error);
  }
};
