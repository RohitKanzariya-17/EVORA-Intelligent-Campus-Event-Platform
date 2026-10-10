import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISessionAttendance extends Document {
  sessionId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  registrationId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  checkedInAt: Date;
  checkedInBy: mongoose.Types.ObjectId;
  isManualOverride: boolean;
  overrideReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionAttendanceSchema = new Schema<ISessionAttendance>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'EventSession',
      required: [true, 'Session ID is required'],
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    registrationId: {
      type: Schema.Types.ObjectId,
      ref: 'Registration',
      required: [true, 'Registration ID is required'],
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    checkedInAt: {
      type: Date,
      default: Date.now,
    },
    checkedInBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isManualOverride: {
      type: Boolean,
      default: false,
    },
    overrideReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring 1 attendance record per student per session!
sessionAttendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });
sessionAttendanceSchema.index({ eventId: 1, sessionId: 1 });
sessionAttendanceSchema.index({ studentId: 1, eventId: 1 });

export const SessionAttendance: Model<ISessionAttendance> = mongoose.model<ISessionAttendance>(
  'SessionAttendance',
  sessionAttendanceSchema
);
