import mongoose, { Document, Schema, Model } from 'mongoose';

export type RegistrationStatus = 'Registered' | 'Cancelled' | 'Attended';

export interface IRegistration extends Document {
  studentId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  tokenHash: string;
  registrationStatus: RegistrationStatus;
  registeredAt: Date;
  checkedInAt?: Date;
  checkedInBy?: mongoose.Types.ObjectId;
  cancellationReason?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const registrationSchema = new Schema<IRegistration>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    registrationStatus: {
      type: String,
      enum: ['Registered', 'Cancelled', 'Attended'],
      default: 'Registered',
      index: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    checkedInBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: any) {
        delete ret.tokenHash; // Never expose tokenHash to client!
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound unique index ensuring 1 registration per student per event
registrationSchema.index({ studentId: 1, eventId: 1 }, { unique: true });
registrationSchema.index({ eventId: 1, registrationStatus: 1 });
registrationSchema.index({ studentId: 1, registrationStatus: 1 });

export const Registration: Model<IRegistration> = mongoose.model<IRegistration>(
  'Registration',
  registrationSchema
);
