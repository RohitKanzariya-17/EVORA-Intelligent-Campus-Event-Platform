import mongoose, { Document, Schema, Model } from 'mongoose';

export type TeamStatus = 'Open' | 'Full' | 'Closed';
export type JoinRequestStatus = 'Pending' | 'Accepted' | 'Rejected';

export interface ITeamMember {
  userId: mongoose.Types.ObjectId;
  role: string;
  joinedAt: Date;
}

export interface IJoinRequest {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  message?: string;
  status: JoinRequestStatus;
  requestedAt: Date;
}

export interface ITeam extends Document {
  eventId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  leaderId: mongoose.Types.ObjectId;
  requiredSkills: string[];
  maxMembers: number;
  members: ITeamMember[];
  status: TeamStatus;
  joinRequests: IJoinRequest[];
  createdAt: Date;
  updatedAt: Date;
}

const teamMemberSchema = new Schema<ITeamMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      default: 'Member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const joinRequestSchema = new Schema<IJoinRequest>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    trim: true,
    maxlength: 300,
    default: '',
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending',
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
});

const teamSchema = new Schema<ITeam>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [80, 'Team name cannot exceed 80 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    leaderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    maxMembers: {
      type: Number,
      required: true,
      min: [2, 'Team size must be at least 2'],
      max: [10, 'Team size cannot exceed 10'],
      default: 4,
    },
    members: {
      type: [teamMemberSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['Open', 'Full', 'Closed'],
      default: 'Open',
      index: true,
    },
    joinRequests: {
      type: [joinRequestSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

teamSchema.index({ eventId: 1, name: 1 }, { unique: true });
teamSchema.index({ eventId: 1, 'members.userId': 1 });

export const Team: Model<ITeam> = mongoose.model<ITeam>('Team', teamSchema);
