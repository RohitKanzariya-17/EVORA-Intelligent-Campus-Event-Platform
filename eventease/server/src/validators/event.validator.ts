import { z } from 'zod';

const eventCategoryEnum = z.enum([
  'Technical',
  'Cultural',
  'Sports',
  'Workshop',
  'Seminar',
  'Hackathon',
  'Other',
]);

const eventStatusEnum = z.enum(['Draft', 'Published', 'Cancelled', 'Completed']);

export const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150, 'Title cannot exceed 150 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: eventCategoryEnum,
  coverImage: z.string().url('Cover image must be a valid URL').optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid event date is required',
  }),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  venue: z.string().min(2, 'Venue is required'),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
  registrationDeadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid registration deadline is required',
  }),
  status: eventStatusEnum.default('Draft'),
});

export const updateEventSchema = createEventSchema.partial();

export const checkInScanSchema = z.object({
  token: z.string().min(10, 'Valid ticket token is required'),
  eventId: z.string().min(10, 'Event ID is required'),
  sessionId: z.string().optional(),
  manualOverride: z.boolean().optional(),
  overrideReason: z.string().optional(),
});

export const checkInSyncSchema = z.object({
  eventId: z.string().min(10, 'Event ID is required'),
  sessionId: z.string().optional(),
  scans: z.array(
    z.object({
      idempotencyKey: z.string().min(1, 'Idempotency key is required'),
      token: z.string().min(10, 'Ticket token is required'),
      scannedAt: z.string().optional(),
    })
  ),
});

export const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().max(1000, 'Comment cannot exceed 1000 characters').optional(),
});

export const createSessionSchema = z.object({
  name: z.string().min(2, 'Session name must be at least 2 characters').max(120),
  description: z.string().optional(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid start time is required',
  }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid end time is required',
  }),
  requireStrictWindow: z.boolean().optional().default(true),
  status: z.enum(['Scheduled', 'Active', 'Closed', 'Cancelled']).optional().default('Scheduled'),
});

export const updateSessionSchema = createSessionSchema.partial();

export const createTeamSchema = z.object({
  eventId: z.string().min(10, 'Valid event ID is required'),
  name: z.string().min(2, 'Team name must be at least 2 characters').max(80),
  description: z.string().max(1000).optional(),
  requiredSkills: z.array(z.string()).optional(),
  maxMembers: z.coerce.number().int().min(2).max(10).default(4),
});

export const joinTeamRequestSchema = z.object({
  message: z.string().max(300).optional(),
});

export const generateCertificatesSchema = z.object({
  minSessions: z.coerce.number().int().min(0).optional().default(1),
  minSessionsRequired: z.coerce.number().int().min(0).optional(),
  eligibilityCriteria: z.string().optional().default('Verified Attendance & Participation'),
});
