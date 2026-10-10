import axios from 'axios';
import {
  User,
  Event,
  Registration,
  TicketData,
  OrganizerDashboardData,
  AdminStats,
  OfflineTicketRecord,
  OfflineScanItem,
  EventSession,
  SessionAttendance,
  Notification,
  PassportData,
  LiveCrowdData,
  Team,
  Certificate,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eventease_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired or invalid
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('eventease_token');
        localStorage.removeItem('eventease_user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    department?: string;
    studentIdNumber?: string;
  }) => {
    const res = await api.post<{ success: boolean; token: string; user: User; message: string }>(
      '/auth/register',
      data
    );
    return res.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post<{ success: boolean; token: string; user: User; message: string }>(
      '/auth/login',
      credentials
    );
    return res.data;
  },

  getMe: async () => {
    const res = await api.get<{ success: boolean; user: User }>('/auth/me');
    return res.data.user;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('eventease_token');
      localStorage.removeItem('eventease_user');
    }
  },
};

// Event Services
export const eventService = {
  getEvents: async (params?: {
    search?: string;
    category?: string;
    status?: string;
    organizerId?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) => {
    const res = await api.get<{
      success: boolean;
      data: Event[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>('/events', { params });
    return res.data;
  },

  getEventById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Event }>(`/events/${id}`);
    return res.data.data;
  },

  createEvent: async (data: Partial<Event>) => {
    const res = await api.post<{ success: boolean; message: string; data: Event }>('/events', data);
    return res.data.data;
  },

  updateEvent: async (id: string, data: Partial<Event>) => {
    const res = await api.put<{ success: boolean; message: string; data: Event }>(`/events/${id}`, data);
    return res.data.data;
  },

  deleteEvent: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/events/${id}`);
    return res.data;
  },
};

// Registration & Ticket Services
export const registrationService = {
  registerForEvent: async (eventId: string) => {
    const res = await api.post<{
      success: boolean;
      message: string;
      data: { registration: Registration; ticketToken: string; qrCodeDataUrl: string };
    }>(`/events/${eventId}/register`);
    return res.data;
  },

  getMyRegistrations: async () => {
    const res = await api.get<{ success: boolean; data: Registration[] }>('/registrations/my');
    return res.data.data;
  },

  getTicket: async (registrationId: string) => {
    const res = await api.get<{ success: boolean; data: TicketData }>(
      `/registrations/${registrationId}/ticket`
    );
    return res.data.data;
  },

  cancelRegistration: async (registrationId: string, reason?: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(
      `/registrations/${registrationId}`,
      { data: { reason } }
    );
    return res.data;
  },
};

// Check-in Services
export const checkInService = {
  scanCheckIn: async (
    tokenOrParams: string | { token: string; eventId: string; sessionId?: string; manualOverride?: boolean; overrideReason?: string },
    legacyEventId?: string
  ) => {
    const payload =
      typeof tokenOrParams === 'string'
        ? { token: tokenOrParams, eventId: legacyEventId! }
        : tokenOrParams;

    const res = await api.post<{
      success: boolean;
      message: string;
      student: User;
      checkedInAt: string;
      registrationId: string;
      sessionAttendanceId?: string;
      sessionName?: string;
      isManualOverride?: boolean;
    }>('/checkin/scan', payload);
    return res.data;
  },

  getAttendance: async (eventId: string) => {
    const res = await api.get<{
      success: boolean;
      summary: {
        capacity: number;
        totalRegistered: number;
        totalAttended: number;
        totalCancelled: number;
        pendingCheckIn: number;
        attendancePercentage: number;
      };
      registrations: Registration[];
    }>(`/events/${eventId}/attendance`);
    return res.data;
  },

  getOfflinePack: async (eventId: string) => {
    const res = await api.get<{
      success: boolean;
      event: { id: string; title: string; date: string; venue: string };
      downloadedAt: string;
      tickets: OfflineTicketRecord[];
    }>(`/checkin/event/${eventId}/offline-pack`);
    return res.data;
  },

  syncOfflineScans: async (eventId: string, scans: OfflineScanItem[]) => {
    const res = await api.post<{
      success: boolean;
      summary: {
        total: number;
        syncedCount: number;
        conflictsCount: number;
        invalidCount: number;
      };
      results: Array<{
        idempotencyKey: string;
        status: 'synced' | 'conflict' | 'invalid';
        message: string;
        studentName?: string;
      }>;
    }>('/checkin/sync', { eventId, scans });
    return res.data;
  },
};

// Organizer Dashboard & Reports
export const reportService = {
  getOrganizerDashboard: async () => {
    const res = await api.get<{ success: boolean; data: OrganizerDashboardData }>(
      '/organizer/dashboard'
    );
    return res.data.data;
  },

  exportCsv: async (eventId: string, eventTitle: string) => {
    const res = await api.get(`/events/${eventId}/export`, {
      responseType: 'blob',
    });
    // Create download trigger in browser
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = eventTitle.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    link.setAttribute('download', `attendance_${safeTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

// Admin Services
export const adminService = {
  getStats: async () => {
    const res = await api.get<{ success: boolean; stats: AdminStats }>('/admin/stats');
    return res.data.stats;
  },

  getUsers: async (params?: { search?: string; role?: string; status?: string; page?: number; limit?: number }) => {
    const res = await api.get<{
      success: boolean;
      data: User[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>('/admin/users', { params });
    return res.data;
  },

  updateRole: async (userId: string, role: string) => {
    const res = await api.patch<{ success: boolean; message: string; user: User }>(
      `/admin/users/${userId}/role`,
      { role }
    );
    return res.data;
  },

  updateStatus: async (userId: string, status: string) => {
    const res = await api.patch<{ success: boolean; message: string; user: User }>(
      `/admin/users/${userId}/status`,
      { status }
    );
    return res.data;
  },
};

// Feedback Services
export const feedbackService = {
  submitFeedback: async (eventId: string, rating: number, comment?: string) => {
    const res = await api.post<{ success: boolean; message: string }>(`/events/${eventId}/feedback`, {
      rating,
      comment,
    });
    return res.data;
  },

  getEventFeedback: async (eventId: string) => {
    const res = await api.get<{
      success: boolean;
      data: {
        averageRating: number;
        totalReviews: number;
        feedbacks: Array<{
          _id: string;
          studentId: { name: string; department?: string };
          rating: number;
          comment?: string;
          createdAt: string;
        }>;
      };
    }>(`/events/${eventId}/feedback`);
    return res.data.data;
  },
};

// FEATURE 1 & 3: Session Services
export const sessionService = {
  getEventSessions: async (eventId: string) => {
    const res = await api.get<any>(`/events/${eventId}/sessions`);
    const sessions = res.data?.data || res.data?.sessions || [];
    return Array.isArray(sessions) ? sessions : [];
  },

  createSession: async (eventId: string, data: Partial<EventSession>) => {
    const res = await api.post<any>(`/events/${eventId}/sessions`, data);
    return res.data?.data || res.data?.session || res.data;
  },

  updateSession: async (sessionId: string, data: Partial<EventSession>) => {
    const res = await api.put<any>(`/sessions/${sessionId}`, data);
    return res.data?.data || res.data?.session || res.data;
  },

  deleteSession: async (sessionId: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/sessions/${sessionId}`);
    return res.data;
  },

  getSessionAttendance: async (sessionId: string) => {
    const res = await api.get<{
      success: boolean;
      session: EventSession;
      summary: { totalAttended: number; manualOverrides: number };
      attendance: SessionAttendance[];
    }>(`/sessions/${sessionId}/attendance`);
    return res.data;
  },
};

// FEATURE 2: Notification Services
export const notificationService = {
  getMyNotifications: async () => {
    const res = await api.get<any>('/notifications');
    const notifs = res.data?.data || res.data?.notifications || [];
    const list = Array.isArray(notifs) ? notifs : [];
    return {
      success: res.data?.success ?? true,
      data: list,
      notifications: list,
      unreadCount:
        res.data?.unreadCount !== undefined
          ? res.data.unreadCount
          : list.filter((n: any) => !n.read).length,
    };
  },

  markAsRead: async (id: string) => {
    const res = await api.patch<{ success: boolean; message: string }>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await api.patch<{ success: boolean; message: string }>('/notifications/read-all');
    return res.data;
  },

  sendSessionReminders: async (sessionId: string) => {
    const res = await api.post<{ success: boolean; message: string; notificationsCreated: number }>(
      `/notifications/sessions/${sessionId}/reminders`
    );
    return res.data;
  },
};

// FEATURE 4: Digital Event Passport Services
export const passportService = {
  getStudentPassport: async () => {
    const res = await api.get<{ success: boolean; data: PassportData }>('/registrations/passport');
    return res.data.data;
  },
};

// FEATURE 5: Live Crowd & Entry Monitor Services
export const liveMonitorService = {
  getLiveStats: async (eventId: string) => {
    const res = await api.get<{ success: boolean; data: LiveCrowdData }>(
      `/checkin/event/${eventId}/live-monitor`
    );
    return res.data.data;
  },
};

// FEATURE 6: Hackathon Team Finder Services
export const teamService = {
  getEventTeams: async (eventId: string, skill?: string) => {
    const res = await api.get<any>(`/teams/event/${eventId}`, {
      params: { skill },
    });
    const teams = res.data?.data || res.data?.teams || [];
    return Array.isArray(teams) ? teams : [];
  },

  createTeam: async (data: {
    eventId: string;
    name: string;
    description: string;
    requiredSkills: string[];
    maxMembers?: number;
  }) => {
    const res = await api.post<any>('/teams', data);
    return res.data?.data || res.data?.team || res.data;
  },

  getTeamById: async (teamId: string) => {
    const res = await api.get<any>(`/teams/${teamId}`);
    return res.data?.data || res.data?.team || res.data;
  },

  sendJoinRequest: async (teamId: string, message?: string) => {
    const res = await api.post<any>(`/teams/${teamId}/join`, { message });
    return res.data?.data || res.data?.team || res.data;
  },

  respondJoinRequest: async (teamId: string, requestId: string, action: 'accept' | 'reject') => {
    const res = await api.patch<any>(`/teams/${teamId}/requests/${requestId}`, { action });
    return res.data?.data || res.data?.team || res.data;
  },

  leaveOrRemoveTeam: async (teamId: string, memberId?: string) => {
    const res = await api.delete<any>(`/teams/${teamId}/members`, { params: { memberId } });
    return res.data?.data || res.data?.team || res.data;
  },

  getMyTeams: async () => {
    const res = await api.get<any>('/teams/user/my-teams');
    const teams = res.data?.data || res.data?.teams || [];
    return Array.isArray(teams) ? teams : [];
  },

  updateSkills: async (skills: string[]) => {
    const res = await api.put<any>('/teams/user/skills', { skills });
    return res.data;
  },
};

// FEATURE 7: Verified Digital Certificate Services
export const certificateService = {
  verifyCertificate: async (certificateId: string) => {
    const res = await api.get<any>(`/certificates/verify/${certificateId}`);
    return {
      success: res.data?.success ?? true,
      valid: res.data?.valid ?? false,
      data: res.data?.data || res.data?.certificate,
      certificate: res.data?.certificate || res.data?.data,
      message: res.data?.message,
    };
  },

  getMyCertificates: async () => {
    const res = await api.get<any>('/certificates/my');
    const certs = res.data?.data || res.data?.certificates || [];
    return Array.isArray(certs) ? certs : [];
  },

  getEventCertificates: async (eventId: string) => {
    const res = await api.get<any>(`/certificates/event/${eventId}`);
    const certs = res.data?.data || res.data?.certificates || [];
    return Array.isArray(certs) ? certs : [];
  },

  generateCertificates: async (eventId: string, minSessionsRequired?: number) => {
    const res = await api.post<{
      success: boolean;
      message: string;
      count: number;
      certificates: Certificate[];
      data?: Certificate[];
    }>(`/certificates/event/${eventId}/generate`, { minSessionsRequired });
    return res.data;
  },

  revokeCertificate: async (certificateId: string, reason?: string) => {
    const res = await api.patch<any>(`/certificates/${certificateId}/revoke`, { reason });
    return res.data?.data || res.data?.certificate || res.data;
  },
};

export default api;
