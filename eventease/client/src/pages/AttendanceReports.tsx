import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileSpreadsheet,
  Download,
  Users,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventService, checkInService, reportService } from '../services/api';
import { Event, Registration } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { TableSkeleton, StatCardSkeleton } from '../components/SkeletonLoader';
import { KPICard } from '../components/KPICard';

export const AttendanceReports: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryEventId = searchParams.get('eventId');

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(queryEventId || '');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [summary, setSummary] = useState<{
    capacity: number;
    totalRegistered: number;
    totalAttended: number;
    totalCancelled: number;
    pendingCheckIn: number;
    attendancePercentage: number;
  } | null>(null);

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Registered' | 'Attended' | 'Cancelled'>('All');

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await eventService.getEvents({ limit: 50 });
        setEvents(res.data);
        if (!selectedEventId && res.data.length > 0) {
          setSelectedEventId(res.data[0]._id);
          setSelectedEvent(res.data[0]);
        } else if (selectedEventId) {
          const match = res.data.find((e) => e._id === selectedEventId);
          if (match) setSelectedEvent(match);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    };

    loadEvents();
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedEventId) return;

    const loadAttendance = async () => {
      setIsLoading(true);
      try {
        const data = await checkInService.getAttendance(selectedEventId);
        setSummary(data.summary);
        setRegistrations(data.registrations);
      } catch (err: any) {
        console.error('Failed to load attendance:', err);
        toast.error('Failed to load attendance records.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAttendance();
  }, [selectedEventId]);

  const handleExportCsv = async () => {
    if (!selectedEvent) return;
    try {
      toast.loading('Exporting attendance CSV...', { id: 'csv' });
      await reportService.exportCsv(selectedEvent._id, selectedEvent.title);
      toast.success('Roster CSV downloaded!', { id: 'csv' });
    } catch (err: any) {
      toast.error('Failed to export CSV: ' + (err.response?.data?.message || 'Error'), { id: 'csv' });
    }
  };

  const filtered = registrations.filter((r) => {
    const matchesStatus = statusFilter === 'All' || r.registrationStatus === statusFilter;
    const student = r.studentId as unknown as {
      name?: string;
      email?: string;
      department?: string;
      studentIdNumber?: string;
    };
    const matchesSearch =
      !search ||
      (student &&
        ((student.name && student.name.toLowerCase().includes(search.toLowerCase())) ||
          (student.email && student.email.toLowerCase().includes(search.toLowerCase())) ||
          (student.studentIdNumber &&
            student.studentIdNumber.toLowerCase().includes(search.toLowerCase())) ||
          (student.department && student.department.toLowerCase().includes(search.toLowerCase()))));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header and Event Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
            Audit Trails & Analytics
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
            Attendance Reports & Audits
          </h1>
          <p className="text-sm text-[#334155] mt-1">
            Real-time verification logs, turnout percentages, and official CSV rosters.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              const found = events.find((ev) => ev._id === e.target.value);
              setSelectedEvent(found || null);
            }}
            className="w-full sm:w-64 px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/20 text-[#0F172A]"
          >
            {events.map((evt) => (
              <option key={evt._id} value={evt._id}>
                {evt.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCsv}
            disabled={!selectedEvent}
            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold whitespace-nowrap disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {isLoading || !summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPICard
            title="Total Bookings"
            value={summary.totalRegistered}
            subtitle={`Of ${summary.capacity} total capacity`}
            icon={<Users className="w-5 h-5 text-[#2563EB]" />}
            iconColorTheme="blue"
          />
          <KPICard
            title="Checked In"
            value={summary.totalAttended}
            subtitle="Verified attendance"
            icon={<CheckCircle className="w-5 h-5 text-[#16A34A]" />}
            iconColorTheme="green"
          />
          <KPICard
            title="Pending Entrance"
            value={summary.pendingCheckIn}
            subtitle="Registered, not yet scanned"
            icon={<Clock className="w-5 h-5 text-[#D97706]" />}
            iconColorTheme="amber"
          />
          <KPICard
            title="Turnout Rate"
            value={`${summary.attendancePercentage}%`}
            subtitle="Actual attendance ratio"
            icon={<TrendingUp className="w-5 h-5 text-[#7C3AED]" />}
            iconColorTheme="purple"
          />
        </div>
      )}

      {/* Roster Table with Search and Status Filter */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search attendee name, email, roll no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <Filter className="w-3.5 h-3.5 text-[#64748B] mr-1 flex-shrink-0" />
            {(['All', 'Registered', 'Attended', 'Cancelled'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-white text-[#475569] border border-[#E2E8F0] hover:bg-[#F8FAFC]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={6} />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-[#64748B] py-14 text-center">
            No attendee records matched your search criteria.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F8FAFC] text-[#475569] font-semibold uppercase tracking-wider text-[11px] border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3.5 px-5">Attendee</th>
                  <th className="py-3.5 px-5">Department & Roll No</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Registered At</th>
                  <th className="py-3.5 px-5">Checked In Timestamp</th>
                  <th className="py-3.5 px-5 text-right">Checked In By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filtered.map((r) => {
                  const student = r.studentId as unknown as {
                    name?: string;
                    email?: string;
                    department?: string;
                    studentIdNumber?: string;
                  };
                  const checkedBy = r.checkedInBy as unknown as { name?: string; email?: string };

                  return (
                    <tr key={r._id} className="hover:bg-[#F8FAFC] transition-colors h-14">
                      <td className="py-3 px-5">
                        <p className="font-semibold text-[#0F172A]">{student?.name || 'Student'}</p>
                        <p className="text-[11px] text-[#64748B]">{student?.email}</p>
                      </td>
                      <td className="py-3 px-5 text-[#334155]">
                        <p className="font-medium">{student?.department || 'N/A'}</p>
                        <p className="text-[11px] font-mono text-[#64748B]">
                          {student?.studentIdNumber || 'ID-N/A'}
                        </p>
                      </td>
                      <td className="py-3 px-5">
                        <StatusBadge status={r.registrationStatus} type="registration" />
                      </td>
                      <td className="py-3 px-5 text-[#64748B]">
                        {new Date(r.registeredAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-5 font-medium text-[#0F172A]">
                        {r.checkedInAt ? (
                          <span className="text-[#16A34A] font-semibold">
                            {new Date(r.checkedInAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="text-[#64748B] italic">Not checked in</span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-[#64748B] text-right">
                        {checkedBy?.name || (r.checkedInAt ? 'Staff Scanner' : '—')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
