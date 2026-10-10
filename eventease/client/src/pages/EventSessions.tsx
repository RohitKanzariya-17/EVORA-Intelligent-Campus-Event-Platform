import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Users,
  Bell,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Activity,
  ShieldAlert,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventService, sessionService, notificationService } from '../services/api';
import { Event, EventSession, SessionAttendance, SessionStatus } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { TableSkeleton } from '../components/SkeletonLoader';

export const EventSessions: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId');

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventIdParam || '');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create / Edit Session Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<EventSession | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    status: 'Scheduled' as SessionStatus,
    requireStrictWindow: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<EventSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Roster Modal
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [activeRosterSession, setActiveRosterSession] = useState<EventSession | null>(null);
  const [rosterAttendance, setRosterAttendance] = useState<SessionAttendance[]>([]);
  const [rosterSummary, setRosterSummary] = useState<{ totalAttended: number; manualOverrides: number }>({
    totalAttended: 0,
    manualOverrides: 0,
  });
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');

  // Sending reminders
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

  // Load events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventService.getEvents({ limit: 100 });
        setEvents(res.data);
        if (res.data.length > 0) {
          const initialId = eventIdParam || res.data[0]._id;
          setSelectedEventId(initialId);
          const ev = res.data.find((e) => e._id === initialId) || res.data[0];
          setSelectedEvent(ev);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
        toast.error('Failed to load events.');
      }
    };
    fetchEvents();
  }, []);

  // Load sessions when selected event changes
  const fetchSessions = async (eventId: string) => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const data = await sessionService.getEventSessions(eventId);
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      toast.error('Failed to load sessions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      const ev = events.find((e) => e._id === selectedEventId);
      setSelectedEvent(ev || null);
      setSearchParams({ eventId: selectedEventId });
      fetchSessions(selectedEventId);
    }
  }, [selectedEventId]);

  const handleOpenCreateModal = () => {
    setEditingSession(null);
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    // Format to datetime-local (YYYY-MM-DDTHH:mm)
    const formatLocal = (d: Date) => {
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - offset * 60 * 1000);
      return local.toISOString().slice(0, 16);
    };

    setFormData({
      name: '',
      description: '',
      startTime: formatLocal(now),
      endTime: formatLocal(oneHourLater),
      status: 'Scheduled',
      requireStrictWindow: true,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (session: EventSession) => {
    setEditingSession(session);
    const formatLocal = (dStr: string) => {
      const d = new Date(dStr);
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - offset * 60 * 1000);
      return local.toISOString().slice(0, 16);
    };

    setFormData({
      name: session.name,
      description: session.description || '',
      startTime: formatLocal(session.startTime),
      endTime: formatLocal(session.endTime),
      status: session.status,
      requireStrictWindow: session.requireStrictWindow ?? true,
    });
    setModalOpen(true);
  };

  const handleSubmitSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Session name is required');
      return;
    }
    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      toast.error('End time must be after start time');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSession) {
        await sessionService.updateSession(editingSession._id, {
          name: formData.name,
          description: formData.description,
          startTime: new Date(formData.startTime).toISOString(),
          endTime: new Date(formData.endTime).toISOString(),
          status: formData.status,
          requireStrictWindow: formData.requireStrictWindow,
        });
        toast.success('Session updated successfully!');
      } else {
        await sessionService.createSession(selectedEventId, {
          name: formData.name,
          description: formData.description,
          startTime: new Date(formData.startTime).toISOString(),
          endTime: new Date(formData.endTime).toISOString(),
          status: formData.status,
          requireStrictWindow: formData.requireStrictWindow,
        });
        toast.success('Attendance session created!');
      }
      setModalOpen(false);
      fetchSessions(selectedEventId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await sessionService.deleteSession(sessionToDelete._id);
      toast.success('Session removed.');
      setDeleteModalOpen(false);
      setSessionToDelete(null);
      fetchSessions(selectedEventId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete session');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewRoster = async (session: EventSession) => {
    setActiveRosterSession(session);
    setRosterSearch('');
    setRosterModalOpen(true);
    setRosterLoading(true);
    try {
      const data = await sessionService.getSessionAttendance(session._id);
      setRosterAttendance(data.attendance);
      setRosterSummary(data.summary);
    } catch (err) {
      console.error('Failed to load session roster:', err);
      toast.error('Failed to load attendance roster.');
    } finally {
      setRosterLoading(false);
    }
  };

  const handleSendReminder = async (session: EventSession) => {
    setSendingReminderId(session._id);
    try {
      const res = await notificationService.sendSessionReminders(session._id);
      toast.success(
        res.message || `Sent reminders to ${res.notificationsCreated} un-checked-in students!`,
        { icon: '🔔' }
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch reminders.');
    } finally {
      setSendingReminderId(null);
    }
  };

  const filteredRoster = rosterAttendance.filter((att) => {
    const q = rosterSearch.toLowerCase();
    const name = att.studentId?.name?.toLowerCase() || '';
    const email = att.studentId?.email?.toLowerCase() || '';
    const sid = att.studentId?.studentIdNumber?.toLowerCase() || '';
    return name.includes(q) || email.includes(q) || sid.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
            Multi-Stage Attendance Checkpoints
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
            Attendance Sessions
          </h1>
          <p className="text-sm text-[#334155] mt-1">
            Organize multi-stage event attendance, enforce strict check-in windows, and dispatch smart student reminders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Event Selector */}
          <div className="w-full md:w-64">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/20 text-[#0F172A]"
            >
              {events.map((evt) => (
                <option key={evt._id} value={evt._id}>
                  {evt.title} ({evt.status})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenCreateModal}
            disabled={!selectedEventId}
            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>New Session</span>
          </button>

          {selectedEventId && (
            <Link
              to={`/organizer/scanner?eventId=${selectedEventId}`}
              className="btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold"
            >
              <QrCode className="w-4 h-4 text-[#64748B]" />
              <span>Launch Scanner</span>
            </Link>
          )}
        </div>
      </div>

      {/* Sessions Grid */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center shadow-xs">
          <Clock className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#0F172A]">No attendance sessions created yet</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
            Break this event down into multiple sessions (e.g. Morning Check-In, Keynote, Lunch Return, Certificate Roll Call) for granular attendance tracking.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Session</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sessions.map((session) => {
            const isStrict = session.requireStrictWindow;
            const now = new Date();
            const start = new Date(session.startTime);
            const end = new Date(session.endTime);
            const isCurrentlyOpen = now >= start && now <= end && session.status === 'Active';

            return (
              <div
                key={session._id}
                className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between hover:border-[#CBD5E1] transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border inline-flex items-center gap-1 ${
                        session.status === 'Active'
                          ? 'bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]'
                          : session.status === 'Closed'
                          ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]'
                          : 'bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          session.status === 'Active'
                            ? 'bg-[#22C55E]'
                            : session.status === 'Closed'
                            ? 'bg-[#EF4444]'
                            : 'bg-[#F59E0B]'
                        }`}
                      />
                      {session.status}
                    </span>

                    {isCurrentlyOpen && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#16A34A] bg-[#F0FDF4] border border-[#DCFCE7] px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                        Window Active Now
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
                    {session.name}
                  </h3>

                  {session.description && (
                    <p className="text-xs text-[#64748B] mt-1 line-clamp-2">
                      {session.description}
                    </p>
                  )}

                  <div className="mt-4 space-y-2 bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] text-xs text-[#334155]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] font-medium">Start:</span>
                      <span className="font-semibold text-[#0F172A]">
                        {new Date(session.startTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] font-medium">End:</span>
                      <span className="font-semibold text-[#0F172A]">
                        {new Date(session.endTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#E2E8F0]">
                      <span className="text-[#64748B] font-medium">Window Mode:</span>
                      <span className="font-semibold text-[#0F172A] text-[11px]">
                        {isStrict ? 'Strict Server Clock' : 'Flexible'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] font-medium">Attended So Far:</span>
                      <span className="font-bold text-[#2563EB] text-sm">
                        {session.attendanceCount ?? 0} Students
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleViewRoster(session)}
                      className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold"
                      title="View attendee roster"
                    >
                      <Users className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>Roster</span>
                    </button>

                    <button
                      onClick={() => handleSendReminder(session)}
                      disabled={sendingReminderId === session._id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] border border-[#FEF3C7] rounded-lg text-xs font-semibold transition disabled:opacity-50"
                      title="Dispatch in-app reminder to registered students who haven't checked in"
                    >
                      <Bell className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>{sendingReminderId === session._id ? 'Sending...' : 'Remind'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(session)}
                      className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded-lg transition"
                      title="Edit session"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setSessionToDelete(session);
                        setDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition"
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Session */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 max-w-lg w-full shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-[#0F172A] mb-1">
              {editingSession ? 'Edit Attendance Session' : 'Create New Attendance Session'}
            </h2>
            <p className="text-xs text-[#64748B] mb-5">
              Set exact check-in hours and status for this session.
            </p>

            <form onSubmit={handleSubmitSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Session Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morning Check-In, Post-Lunch Session, Closing Ceremony"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional instructions or notes for this session..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">End Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as SessionStatus })
                    }
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#0F172A] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/20"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Active">Active (Accepting Scans)</option>
                    <option value="Closed">Closed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#334155] select-none">
                    <input
                      type="checkbox"
                      checked={formData.requireStrictWindow}
                      onChange={(e) =>
                        setFormData({ ...formData, requireStrictWindow: e.target.checked })
                      }
                      className="rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span>Strict Time Window Enforcement</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary px-4 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingSession ? 'Update Session' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Attendee Roster */}
      {rosterModalOpen && activeRosterSession && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 max-w-2xl w-full shadow-lg max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A] tracking-tight">
                  Session Attendance Roster
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {activeRosterSession.name} • {rosterSummary.totalAttended} Students Checked In
                </p>
              </div>

              <button
                onClick={() => setRosterModalOpen(false)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Metrics pills & search */}
            <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-[#F0FDF4] text-[#16A34A] rounded-full text-xs font-semibold border border-[#DCFCE7]">
                  Total Checked-in: {rosterSummary.totalAttended}
                </span>
                {rosterSummary.manualOverrides > 0 && (
                  <span className="px-2.5 py-1 bg-[#FFFBEB] text-[#D97706] rounded-full text-xs font-semibold border border-[#FEF3C7] flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Overrides: {rosterSummary.manualOverrides}
                  </span>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="text"
                  placeholder="Search attendee..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              {rosterLoading ? (
                <TableSkeleton rows={5} />
              ) : filteredRoster.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#64748B]">
                  No attendance records found for this session yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F8FAFC] text-[#475569] uppercase text-[11px] font-semibold tracking-wider sticky top-0 border-b border-[#E2E8F0]">
                    <tr>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Department / ID</th>
                      <th className="px-4 py-3">Check-In Time</th>
                      <th className="px-4 py-3 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredRoster.map((att) => (
                      <tr key={att._id} className="hover:bg-[#F8FAFC] transition-colors h-14">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#0F172A]">{att.studentId?.name || 'Unknown Student'}</div>
                          <div className="text-[11px] text-[#64748B]">
                            {att.studentId?.email}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#334155]">
                          {att.studentId?.department || '—'}{' '}
                          {att.studentId?.studentIdNumber && (
                            <span className="text-[#64748B]">({att.studentId.studentIdNumber})</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#64748B]">
                          {new Date(att.checkedInAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {att.isManualOverride ? (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7]"
                              title={att.overrideReason || 'Organizer Override'}
                            >
                              <ShieldAlert className="w-3 h-3" />
                              Override
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]">
                              <CheckCircle2 className="w-3 h-3" />
                              Standard
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => setRosterModalOpen(false)}
                className="btn-secondary px-4 py-2 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Attendance Session"
        message={`Are you sure you want to remove "${sessionToDelete?.name}"? Past attendance records for this session will be preserved.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Session'}
        isDestructive={true}
      />
    </div>
  );
};
