import mongoose, { Document, Schema, Model } from 'mongoose';

export type SessionStatus = 'Scheduled' | 'Active' | 'Closed' | 'Cancelled';

export interface IEventSession extends Document {
  eventId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: SessionStatus;
  requireStrictWindow: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventSessionSchema = new Schema<IEventSession>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Session name is required'],
      trim: true,
      maxlength: [120, 'Session name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    startTime: {
      type: Date,
      required: [true, 'Session start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, 'Session end time is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Active', 'Closed', 'Cancelled'],
      default: 'Scheduled',
      index: true,
    },
    requireStrictWindow: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

eventSessionSchema.index({ eventId: 1, startTime: 1 });

export const EventSession: Model<IEventSession> = mongoose.model<IEventSession>(
  'EventSession',
  eventSessionSchema
);
