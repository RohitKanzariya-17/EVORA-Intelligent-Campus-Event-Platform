export type UserRole = 'student' | 'organizer' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  studentIdNumber?: string;
  skills?: string[];
  createdAt: string;
}

export type EventCategory =
  | 'Technical'
  | 'Cultural'
  | 'Sports'
  | 'Workshop'
  | 'Seminar'
  | 'Hackathon'
  | 'Other';

export type EventStatus = 'Draft' | 'Published' | 'Cancelled' | 'Completed';

export interface Event {
  _id: string;
  title: string;
  description: string;
  category: EventCategory;
  coverImage: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  capacity: number;
  registeredCount: number;
  registrationDeadline: string;
  status: EventStatus;
  organizerId: {
    _id: string;
    name: string;
    email: string;
    department?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type RegistrationStatus = 'Registered' | 'Cancelled' | 'Attended';

export interface Registration {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    department?: string;
    studentIdNumber?: string;
  };
  eventId: Event;
  registrationStatus: RegistrationStatus;
  registeredAt: string;
  checkedInAt?: string;
  checkedInBy?: {
    _id: string;
    name: string;
    email?: string;
  };
  cancellationReason?: string;
  cancelledAt?: string;
}

export interface TicketData {
  registrationId: string;
  ticketToken: string;
  qrCodeDataUrl: string;
  registrationStatus: RegistrationStatus;
  registeredAt: string;
  checkedInAt?: string;
  event: Event;
  student: {
    _id: string;
    name: string;
    email: string;
    department?: string;
    studentIdNumber?: string;
  };
}

export interface OrganizerDashboardData {
  metrics: {
    totalEvents: number;
    totalRegistrations: number;
    totalCheckIns: number;
    notYetCheckedIn: number;
    totalCapacity: number;
    remainingSeats: number;
    attendancePercentage: number;
  };
  upcomingEvents: Event[];
  recentActivity: Registration[];
  charts: {
    registrationsByEvent: Array<{
      name: string;
      fullTitle: string;
      registered: number;
      capacity: number;
    }>;
    attendanceBreakdown: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    categoryDistribution: Array<{
      name: string;
      count: number;
    }>;
    registrationTrend: Array<{
      date: string;
      registrations: number;
    }>;
  };
}

export interface AdminStats {
  users: {
    total: number;
    students: number;
    organizers: number;
    admins: number;
    active: number;
    suspended: number;
  };
  events: {
    total: number;
    draft: number;
    published: number;
    completed: number;
    cancelled: number;
  };
  registrations: {
    total: number;
    attended: number;
    cancelled: number;
    pending: number;
    attendanceRate: number;
  };
  popularEvents: Event[];
}

export interface OfflineTicketRecord {
  registrationId: string;
  tokenHash: string;
  studentName: string;
  studentEmail: string;
  department?: string;
  studentIdNumber?: string;
  registrationStatus: RegistrationStatus;
  checkedInAt?: string | null;
}

export interface OfflineScanItem {
  idempotencyKey: string;
  token: string;
  eventId: string;
  registrationId?: string;
  studentName?: string;
  scannedAt: string;
}

// FEATURE 1 & 3: Sessions
export type SessionStatus = 'Scheduled' | 'Active' | 'Closed' | 'Cancelled';

export interface EventSession {
  _id: string;
  eventId: string;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  requireStrictWindow: boolean;
  attendanceCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionAttendance {
  _id: string;
  sessionId: string;
  eventId: string;
  registrationId: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    department?: string;
    studentIdNumber?: string;
  };
  checkedInAt: string;
  checkedInBy: {
    _id: string;
    name: string;
    email?: string;
  };
  isManualOverride: boolean;
  overrideReason?: string;
}

// FEATURE 2: Notifications
export type NotificationType =
  | 'session_reminder'
  | 'event_reminder'
  | 'certificate_issued'
  | 'team_request'
  | 'general';

export interface Notification {
  _id: string;
  recipientId: string;
  eventId?: string;
  sessionId?: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

// FEATURE 4: Digital Event Passport
export interface PassportSessionRecord {
  sessionId: string;
  name: string;
  startTime: string;
  endTime: string;
  isAttended: boolean;
}

export interface PassportEventRecord {
  eventId: string;
  title: string;
  category: EventCategory;
  date: string;
  venue: string;
  coverImage: string;
  status: EventStatus;
  registeredAt: string;
  registrationStatus: RegistrationStatus;
  participationStatus: 'Registered' | 'Partially Attended' | 'Completed' | 'Cancelled';
  totalSessionsCount: number;
  attendedSessionsCount: number;
  sessionsBreakdown: PassportSessionRecord[];
  certificate: {
    certificateId: string;
    issueDate: string;
    verificationUrl: string;
  } | null;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface PassportData {
  student: {
    id: string;
    name: string;
    email: string;
    department?: string;
    studentIdNumber?: string;
    skills?: string[];
  };
  metrics: {
    totalRegistered: number;
    totalAttendedAny: number;
    totalCompleted: number;
    totalPartiallyAttended: number;
    certificatesEarned: number;
    achievementsUnlocked: number;
    attendanceRate: number;
  };
  events: PassportEventRecord[];
  certificates: Array<{
    id: string;
    certificateId: string;
    eventTitle: string;
    eventCategory: string;
    issueDate: string;
    verificationUrl: string;
    eligibilityCriteria: string;
  }>;
  achievements: Achievement[];
}

// FEATURE 5: Live Crowd & Entry Monitor
export interface LiveSessionStat {
  id: string;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  attendanceCount: number;
  attendanceRate: number;
  isActive: boolean;
}

export interface LiveActivityItem {
  id: string;
  studentName: string;
  studentEmail: string;
  department: string;
  studentIdNumber: string;
  sessionName: string;
  checkedInAt: string;
  isManualOverride: boolean;
}

export interface LiveCrowdData {
  event: {
    id: string;
    title: string;
    capacity: number;
    venue: string;
    date: string;
    status: EventStatus;
  };
  metrics: {
    totalRegistered: number;
    uniqueCheckedIn: number;
    pendingCheckIn: number;
    remainingCapacity: number;
    attendancePercentage: number;
  };
  sessions: LiveSessionStat[];
  recentActivity: LiveActivityItem[];
  timestamp: string;
}

// FEATURE 6: Hackathon Team Finder
export interface TeamMember {
  userId: {
    _id: string;
    name: string;
    email: string;
    department?: string;
    studentIdNumber?: string;
    skills?: string[];
  };
  role: string;
  joinedAt: string;
}

export interface JoinRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    department?: string;
    skills?: string[];
  };
  message?: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  requestedAt: string;
}

export interface Team {
  _id: string;
  eventId: string | { _id: string; title: string; category?: string; date?: string; venue?: string };
  name: string;
  description: string;
  leaderId: {
    _id: string;
    name: string;
    email: string;
    department?: string;
    skills?: string[];
  };
  requiredSkills: string[];
  maxMembers: number;
  members: TeamMember[];
  status: 'Open' | 'Full' | 'Closed';
  joinRequests: JoinRequest[];
  createdAt: string;
  updatedAt: string;
}

// FEATURE 7: Verified Digital Certificates
export interface Certificate {
  _id: string;
  certificateId: string;
  eventId: string | { _id: string; title: string; date?: string; venue?: string; coverImage?: string; category?: string };
  studentId: string | { _id: string; name: string; email: string; department?: string; studentIdNumber?: string };
  studentName: string;
  studentEmail: string;
  eventTitle: string;
  eventCategory: string;
  issueDate: string;
  issuedBy?: {
    _id: string;
    name: string;
    department?: string;
  };
  eligibilityCriteria: string;
  sessionsAttended: number;
  verificationUrl: string;
  status: 'Valid' | 'Revoked';
  revokedReason?: string;
  revokedAt?: string;
}

