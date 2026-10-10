import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Ticket,
  TrendingUp,
  UserCheck,
  UserX,
  ArrowRight,
  BarChart3,
  Award,
} from 'lucide-react';
import { adminService } from '../services/api';
import { AdminStats } from '../types';
import { StatCardSkeleton, TableSkeleton } from '../components/SkeletonLoader';
import { KPICard } from '../components/KPICard';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const data = await adminService.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading || !stats) {
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

  const { users, events, registrations, popularEvents } = stats;

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
              Governance Console
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
              Root Level
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Central Administration Console
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Institutional governance, user permission auditing, and platform-wide metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/certificates"
            className="btn-secondary"
          >
            <Award className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Digital Certificates</span>
          </Link>
          <Link
            to="/admin/users"
            className="btn-primary"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage Users</span>
          </Link>
          <Link
            to="/admin/events"
            className="btn-secondary"
          >
            <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
            <span>All Events</span>
          </Link>
        </div>
      </div>

      {/* 2. Primary Metrics Grid (42x42px icon badge, pastel bg, trend chips) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title="Total Users"
          value={users.total}
          subtitle={`${users.students} Students • ${users.organizers} Organizers`}
          icon={Users}
          theme="blue"
          trend={{ value: `${users.active} Active`, isPositive: true }}
        />

        <KPICard
          title="All Events"
          value={events.total}
          subtitle={`${events.published} Published • ${events.draft} Drafts`}
          icon={Calendar}
          theme="purple"
          trend={{ value: `${events.published} Live`, isPositive: true }}
        />

        <KPICard
          title="Total Bookings"
          value={registrations.total}
          subtitle={`${registrations.cancelled} Cancelled passes`}
          icon={Ticket}
          theme="amber"
          trend={{ value: 'Campus-wide', isPositive: true }}
        />

        <KPICard
          title="Platform Turnout"
          value={`${registrations.attendanceRate}%`}
          subtitle={`${registrations.attended} Verified Check-Ins`}
          icon={TrendingUp}
          theme="green"
          trend={{ value: `${registrations.attendanceRate}%`, isPositive: registrations.attendanceRate >= 50 }}
        />
      </div>

      {/* 3. Role Breakdown & Account Status */}
      <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
            User Governance Distribution
          </h3>
          <span className="text-xs text-[#64748B]">Audited Accounts</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 text-xs">
          <div className="p-3.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Students</span>
            <p className="text-xl font-bold text-[#0F172A] mt-0.5">{users.students}</p>
          </div>
          <div className="p-3.5 bg-[#EFF6FF] rounded-lg border border-[#DBEAFE]">
            <span className="text-[10px] text-[#2563EB] uppercase font-bold tracking-wider">Organizers</span>
            <p className="text-xl font-bold text-[#2563EB] mt-0.5">{users.organizers}</p>
          </div>
          <div className="p-3.5 bg-[#F5F3FF] rounded-lg border border-[#EDE9FE]">
            <span className="text-[10px] text-[#7C3AED] uppercase font-bold tracking-wider">Admins</span>
            <p className="text-xl font-bold text-[#7C3AED] mt-0.5">{users.admins}</p>
          </div>
          <div className="p-3.5 bg-[#F0FDF4] rounded-lg border border-[#DCFCE7]">
            <span className="text-[10px] text-[#16A34A] uppercase font-bold tracking-wider">Active</span>
            <p className="text-xl font-bold text-[#16A34A] mt-0.5">{users.active}</p>
          </div>
          <div className="p-3.5 bg-[#FEF2F2] rounded-lg border border-[#FEE2E2]">
            <span className="text-[10px] text-[#DC2626] uppercase font-bold tracking-wider">Suspended</span>
            <p className="text-xl font-bold text-[#DC2626] mt-0.5">{users.suspended}</p>
          </div>
        </div>
      </div>

      {/* 4. Enterprise Data Table: Most Popular Campus Events */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
              Most Popular Campus Events
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">Highest registration volume across academic tracks</p>
          </div>
          <Link
            to="/admin/events"
            className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#475569] font-semibold uppercase tracking-wider text-[11px] border-b border-[#E2E8F0]">
              <tr>
                <th className="py-3.5 px-5">Event Title</th>
                <th className="py-3.5 px-5">Category</th>
                <th className="py-3.5 px-5">Capacity</th>
                <th className="py-3.5 px-5">Registrations</th>
                <th className="py-3.5 px-5">Utilization</th>
                <th className="py-3.5 px-5">Scheduled Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {popularEvents.map((evt) => {
                const percent = Math.min(
                  100,
                  Math.round((evt.registeredCount / evt.capacity) * 100)
                );
                return (
                  <tr key={evt._id} className="h-14 hover:bg-[#F8FAFC] transition">
                    <td className="py-3.5 px-5 font-bold text-[#0F172A]">{evt.title}</td>
                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                        {evt.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-[#334155]">{evt.capacity} seats</td>
                    <td className="py-3.5 px-5 font-semibold text-[#2563EB]">
                      {evt.registeredCount} booked
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#2563EB] rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-[#64748B]">{percent}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-[#64748B]">
                      {new Date(evt.date).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
