import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Ticket,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  QrCode,
  Sparkles,
  Users,
  Bell,
  Award,
} from 'lucide-react';
import { registrationService, eventService } from '../services/api';
import { Registration, Event } from '../types';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge } from '../components/StatusBadge';
import { StatCardSkeleton, CardSkeleton } from '../components/SkeletonLoader';
import { KPICard } from '../components/KPICard';
import { QuickActionCard } from '../components/QuickActionCard';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [exploreEvents, setExploreEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const [regs, recEvents] = await Promise.all([
          registrationService.getMyRegistrations(),
          eventService.getEvents({ limit: 3, sort: 'soonest' }),
        ]);
        setRegistrations(Array.isArray(regs) ? regs : []);
        setExploreEvents(Array.isArray(recEvents?.data) ? recEvents.data : []);
      } catch (error) {
        console.error('Error loading student dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const totalRegistered = registrations.filter((r) => r.registrationStatus !== 'Cancelled').length;
  const totalAttended = registrations.filter((r) => r.registrationStatus === 'Attended').length;
  const pendingUpcoming = registrations.filter((r) => r.registrationStatus === 'Registered').length;

  return (
    <div className="space-y-6">
      {/* 1. Welcome Header Row */}
      <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B] mb-1">
            Student Workspace
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Department: <span className="font-semibold text-[#334155]">{user?.department || 'General Student'}</span> • Roll No: <span className="font-semibold text-[#334155]">{user?.studentIdNumber || 'N/A'}</span>
          </p>
        </div>

        <Link to="/events" className="btn-primary">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Explore Campus Events</span>
        </Link>
      </div>

      {/* 2. KPI / Stat Cards (42x42px icon badge, pastel bg, trend chip) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <KPICard
            title="Active Bookings"
            value={totalRegistered}
            subtitle="Confirmed seat reservations"
            icon={Ticket}
            theme="blue"
            trend={{ value: `${totalRegistered} Total`, isPositive: true }}
          />

          <KPICard
            title="Events Attended"
            value={totalAttended}
            subtitle="Verified attendance check-ins"
            icon={CheckCircle2}
            theme="green"
            trend={{ value: `${totalAttended} Completed`, isPositive: true }}
          />

          <KPICard
            title="Upcoming Events"
            value={pendingUpcoming}
            subtitle="Scheduled sessions on calendar"
            icon={Clock}
            theme="amber"
            trend={{ value: 'Pending Check-In', isPositive: true }}
          />
        </div>
      )}

      {/* 3. Quick Action Hubs (Grid of interactive workflow cards) */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[#64748B]">
            Quick Portals & Workflows
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <QuickActionCard
            to="/student/teams"
            icon={Users}
            badge="Squad Finder"
            title="Hackathon Teams"
            description="Discover project teams, match complimentary skills, and assemble hackathon squads."
            actionText="Browse teams"
            theme="blue"
          />

          <QuickActionCard
            to="/student/notifications"
            icon={Bell}
            badge="Real-Time"
            title="Notification Center"
            description="Real-time alerts for session timings, upcoming check-in deadlines, and reminders."
            actionText="Check alerts"
            theme="amber"
          />

          <QuickActionCard
            to="/student/passport"
            icon={Award}
            badge="Credentials"
            title="Digital Passport & Certs"
            description="View cryptographically verified digital certificates, attendance stamps, and milestones."
            actionText="View credentials"
            theme="green"
          />
        </div>
      </div>

      {/* 4. Booked Events Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
            My Registered Events
          </h2>
          <Link
            to="/student/registrations"
            className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 transition"
          >
            <span>View All Registrations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : registrations.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-[#E2E8F0] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
              <Ticket className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#0F172A]">No active registrations found</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              You have not reserved seats for any events yet. Check out the campus catalog to find upcoming hackathons, seminars, and workshops.
            </p>
            <Link to="/events" className="btn-primary inline-flex mt-1">
              Browse Campus Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {registrations.slice(0, 4).map((reg) => {
              const event = reg.eventId;
              if (!event) return null;
              const eventDate = new Date(event.date);

              return (
                <div
                  key={reg._id}
                  className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs hover:border-[#CBD5E1] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-200 flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] border border-[#DBEAFE] px-2 py-0.5 rounded-full">
                          {event.category}
                        </span>
                        <StatusBadge status={reg.registrationStatus} type="registration" />
                      </div>
                      <h3 className="text-sm font-bold text-[#0F172A] line-clamp-1">
                        {event.title}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#64748B] pt-2 border-t border-[#F1F5F9]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                      <span>
                        {eventDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        • {event.startTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    {reg.registrationStatus !== 'Cancelled' ? (
                      <Link
                        to="/student/tickets"
                        className="w-full py-2 bg-[#EFF6FF] hover:bg-[#2563EB] text-[#2563EB] hover:text-white rounded-lg text-center text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>View QR Entry Ticket</span>
                      </Link>
                    ) : (
                      <span className="text-xs text-[#DC2626] font-medium italic">
                        Registration Cancelled
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Recommended Events Row */}
      <div className="space-y-3.5 pt-4 border-t border-[#E2E8F0]">
        <h2 className="text-base font-bold text-[#0F172A] tracking-tight">Recommended for You</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {exploreEvents.map((evt) => (
            <div
              key={evt._id}
              className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs hover:border-[#CBD5E1] transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] border border-[#DBEAFE] px-2 py-0.5 rounded-full">
                  {evt.category}
                </span>
                <h4 className="text-sm font-bold text-[#0F172A] mt-2 line-clamp-1">{evt.title}</h4>
                <p className="text-xs text-[#64748B] line-clamp-2 mt-1 leading-relaxed">
                  {evt.description}
                </p>
              </div>

              <Link
                to={`/events/${evt._id}`}
                className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 pt-2 border-t border-[#F1F5F9] transition"
              >
                <span>View Event Details</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
