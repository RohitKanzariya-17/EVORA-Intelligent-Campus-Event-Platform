import mongoose, { Document, Schema, Model } from 'mongoose';

export type CertificateStatus = 'Valid' | 'Revoked';

export interface ICertificate extends Document {
  certificateId: string;
  eventId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  studentEmail: string;
  eventTitle: string;
  eventCategory: string;
  issueDate: Date;
  issuedBy: mongoose.Types.ObjectId;
  eligibilityCriteria: string;
  sessionsAttended: number;
  verificationUrl: string;
  status: CertificateStatus;
  revokedReason?: string;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    eventTitle: {
      type: String,
      required: true,
      trim: true,
    },
    eventCategory: {
      type: String,
      required: true,
      default: 'Technical',
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eligibilityCriteria: {
      type: String,
      default: 'Verified Attendance & Participation',
    },
    sessionsAttended: {
      type: Number,
      default: 1,
    },
    verificationUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Valid', 'Revoked'],
      default: 'Valid',
      index: true,
    },
    revokedReason: {
      type: String,
      default: '',
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring 1 certificate per student per event
certificateSchema.index({ eventId: 1, studentId: 1 }, { unique: true });

export const Certificate: Model<ICertificate> = mongoose.model<ICertificate>(
  'Certificate',
  certificateSchema
);
