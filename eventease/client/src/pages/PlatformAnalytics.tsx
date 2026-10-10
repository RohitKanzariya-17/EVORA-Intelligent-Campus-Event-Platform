import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Users,
  Calendar,
  CheckCircle,
  Activity,
  Layers,
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
import { adminService } from '../services/api';
import { AdminStats } from '../types';
import { StatCardSkeleton } from '../components/SkeletonLoader';
import { KPICard } from '../components/KPICard';

const USER_COLORS = ['#2563EB', '#16A34A', '#7C3AED'];
const ATTENDANCE_COLORS = ['#16A34A', '#2563EB', '#DC2626'];

export const PlatformAnalytics: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await adminService.getStats();
        setStats(data);
      } catch (e) {
        console.error('Failed to load analytics:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    );
  }

  const { users, events, registrations, popularEvents } = stats;

  const attendanceRate =
    registrations.total > 0
      ? Math.round((registrations.attended / registrations.total) * 100)
      : 0;

  const userDistributionData = [
    { name: 'Students', value: users.students },
    { name: 'Organizers', value: users.organizers },
    { name: 'Admins', value: users.admins },
  ];

  const attendanceDistributionData = [
    { name: 'Checked-In (Attended)', value: registrations.attended, color: '#16A34A' },
    { name: 'Pending Entry', value: registrations.pending, color: '#2563EB' },
    { name: 'Cancelled Passes', value: registrations.cancelled, color: '#DC2626' },
  ];

  const popularEventsChartData = popularEvents.map((e) => ({
    name: e.title.length > 18 ? `${e.title.slice(0, 16)}...` : e.title,
    registered: e.registeredCount,
    capacity: e.capacity,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
          INSTITUTIONAL INTELLIGENCE
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
          Platform Analytics & Health
        </h1>
        <p className="text-sm text-[#334155] mt-1">
          System-wide performance metrics across student engagement, venue capacity utilization, and check-in velocity.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total User Base"
          value={users.total.toLocaleString()}
          subtitle={`${users.students} Students • ${users.organizers} Organizers`}
          icon={<Users className="w-5 h-5 text-[#2563EB]" />}
          iconBgColor="#EFF6FF"
          trend={{ value: '+14% MoM', isPositive: true }}
        />
        <KPICard
          title="Events Published"
          value={events.published.toLocaleString()}
          subtitle={`${events.published} Published • ${events.completed} Completed`}
          icon={<Calendar className="w-5 h-5 text-[#16A34A]" />}
          iconBgColor="#F0FDF4"
          trend={{ value: `${events.total} Total`, isPositive: true }}
        />
        <KPICard
          title="Pass Registrations"
          value={registrations.total.toLocaleString()}
          subtitle={`${registrations.attended} Verified at door`}
          icon={<Activity className="w-5 h-5 text-[#7C3AED]" />}
          iconBgColor="#F5F3FF"
          trend={{ value: '+22.5%', isPositive: true }}
        />
        <KPICard
          title="Overall Attendance Rate"
          value={`${attendanceRate}%`}
          subtitle={`${registrations.cancelled} cancellations`}
          icon={<CheckCircle className="w-5 h-5 text-[#D97706]" />}
          iconBgColor="#FFFBEB"
          trend={{ value: attendanceRate >= 70 ? 'High Turnout' : 'Normal', isPositive: attendanceRate >= 70 }}
        />
      </div>

      {/* Grid of Key Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Breakdown */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#2563EB]" />
              <span>Registration Fulfillment & Turnout</span>
            </h3>
            <span className="text-xs font-semibold text-[#64748B]">All-Time Breakdown</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {attendanceDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    fontSize: 12,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Roles Breakdown */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#2563EB]" />
              <span>Platform User Demographics</span>
            </h3>
            <span className="text-xs font-semibold text-[#64748B]">Role Distribution</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {userDistributionData.map((_, index) => (
                    <Cell key={`user-cell-${index}`} fill={USER_COLORS[index % USER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    fontSize: 12,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Popular Events Chart */}
      <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#2563EB]" />
            <span>Top Event Capacity Utilization</span>
          </h3>
          <span className="text-xs font-semibold text-[#64748B]">Bookings vs Max Capacity</span>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={popularEventsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} angle={-10} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  fontSize: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              />
              <Bar dataKey="registered" fill="#2563EB" radius={[4, 4, 0, 0]} name="Booked Attendees" />
              <Bar dataKey="capacity" fill="#E2E8F0" radius={[4, 4, 0, 0]} name="Total Capacity" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
