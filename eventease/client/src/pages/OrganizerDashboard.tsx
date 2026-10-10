import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  QrCode,
  CalendarPlus,
  FileSpreadsheet,
  Award,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { reportService } from '../services/api';
import { OrganizerDashboardData } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { StatCardSkeleton, TableSkeleton } from '../components/SkeletonLoader';
import { KPICard } from '../components/KPICard';

const PIE_COLORS = ['#22C55E', '#2563EB', '#F59E0B', '#8B5CF6', '#EC4899'];

export const OrganizerDashboard: React.FC = () => {
  const [data, setData] = useState<OrganizerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const res = await reportService.getOrganizerDashboard();
        setData(res);
      } catch (error) {
        console.error('Failed to fetch organizer dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  const { metrics, upcomingEvents, recentActivity, charts } = data;

  return (
    <div className="space-y-6">
      {/* 1. Header with Quick Actions */}
      <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B] mb-1">
            Operations Console
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Organizer Command Center
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Real-time event check-ins, attendee metrics, and live session operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/organizer/certificates"
            className="btn-secondary"
          >
            <Award className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Certificates</span>
          </Link>
          <Link
            to="/organizer/scanner"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F0FDF4] hover:bg-[#DCFCE7] active:scale-[0.98] text-[#16A34A] border border-[#DCFCE7] text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Launch Scanner</span>
          </Link>
          <Link
            to="/organizer/create-event"
            className="btn-primary"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>New Event</span>
          </Link>
        </div>
      </div>

      {/* 2. 4 Enterprise KPI Cards (42x42px icon badge, pastel bg, trend chips) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title="Hosted Events"
          value={metrics.totalEvents}
          subtitle="Total platform sessions"
          icon={Calendar}
          theme="blue"
          trend={{ value: 'Active', isPositive: true }}
        />

        <KPICard
          title="Total Registrations"
          value={metrics.totalRegistrations}
          subtitle={`${metrics.remainingSeats} open seats remaining`}
          icon={Users}
          theme="purple"
          trend={{ value: 'Bookings', isPositive: true }}
        />

        <KPICard
          title="Checked-In Attendees"
          value={metrics.totalCheckIns}
          subtitle={`${metrics.notYetCheckedIn} pending arrival`}
          icon={CheckCircle2}
          theme="green"
          trend={{ value: 'Verified', isPositive: true }}
        />

        <KPICard
          title="Turnout Rate"
          value={`${metrics.attendancePercentage}%`}
          subtitle="Actual vs booked attendance"
          icon={TrendingUp}
          theme="amber"
          trend={{ value: `${metrics.attendancePercentage}%`, isPositive: metrics.attendancePercentage >= 50 }}
        />
      </div>

      {/* 3. Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Registrations vs Capacity by Event */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
                Registrations vs Event Capacity
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">Attendee volume across top active sessions</p>
            </div>
            <span className="text-[11px] font-semibold text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-full">
              Top Events
            </span>
          </div>
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.registrationsByEvent} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    value,
                    name === 'registered' ? 'Registered Attendees' : 'Max Capacity',
                  ]}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    fontSize: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                />
                <Bar dataKey="registered" fill="#2563EB" radius={[6, 6, 0, 0]} name="registered" />
                <Bar dataKey="capacity" fill="#E2E8F0" radius={[6, 6, 0, 0]} name="capacity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Turnout vs Pending Check-In */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
                Attendance Ratio
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">Total checked-in vs pending check-in</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.attendanceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={84}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {charts.attendanceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    fontSize: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#64748B' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Second Charts & Upcoming Sessions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Category Breakdown */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">Events by Category</h3>
            <span className="text-xs text-[#64748B]">Distribution</span>
          </div>
          <div className="h-60 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.categoryDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    fontSize: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                />
                <Bar dataKey="count" fill="#93C5FD" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Events Box */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">Upcoming Sessions</h3>
            <Link to="/organizer/manage-events" className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition">
              View All Events
            </Link>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-56">
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-[#64748B] py-6 text-center">No upcoming events scheduled.</p>
            ) : (
              upcomingEvents.map((evt) => (
                <div
                  key={evt._id}
                  className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] hover:border-[#CBD5E1] transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#0F172A] truncate">{evt.title}</h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {new Date(evt.date).toLocaleDateString()} • {evt.startTime} • {evt.venue}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#2563EB] bg-white px-2.5 py-1 rounded-md border border-[#E2E8F0] shrink-0">
                    {evt.registeredCount} / {evt.capacity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. Enterprise Data Table: Live Recent Activity Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
              Recent Attendee Activity
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">Live stream of student registrations and check-ins</p>
          </div>
          <Link
            to="/organizer/reports"
            className="btn-secondary"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Attendance Reports</span>
          </Link>
        </div>

        {recentActivity.length === 0 ? (
          <p className="text-xs text-[#64748B] py-10 text-center">No attendee activity recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#475569] font-semibold uppercase tracking-wider text-[11px] border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3.5 px-5">Attendee Name</th>
                  <th className="py-3.5 px-5">Student ID / Dept</th>
                  <th className="py-3.5 px-5">Event Name</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {recentActivity.map((r) => {
                  const student = r.studentId as unknown as {
                    name?: string;
                    department?: string;
                    studentIdNumber?: string;
                  };
                  const event = r.eventId as unknown as { title?: string };

                  return (
                    <tr key={r._id} className="h-14 hover:bg-[#F8FAFC] transition">
                      <td className="py-3.5 px-5 font-semibold text-[#0F172A]">
                        {student?.name || 'Registered Student'}
                      </td>
                      <td className="py-3.5 px-5 text-[#64748B]">
                        {student?.studentIdNumber || 'ID-N/A'} • {student?.department || 'Dept'}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-[#334155]">
                        {event?.title || 'Event'}
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusBadge status={r.registrationStatus} type="registration" />
                      </td>
                      <td className="py-3.5 px-5 text-[#64748B]">
                        {new Date(r.checkedInAt || r.registeredAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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

export default OrganizerDashboard;
