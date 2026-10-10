import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  QrCode,
  ShieldCheck,
  TrendingUp,
  Activity,
  Calendar,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventService, liveMonitorService } from '../services/api';
import { Event, LiveCrowdData } from '../types';
import { TableSkeleton } from '../components/SkeletonLoader';
import { KPICard } from '../components/KPICard';
import { StatusBadge } from '../components/StatusBadge';

export const LiveCrowdMonitor: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId');

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventIdParam || '');
  const [liveData, setLiveData] = useState<LiveCrowdData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(5); // seconds, 0 = off
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const timerRef = useRef<any>(null);

  // Load events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventService.getEvents({ limit: 100 });
        setEvents(res.data);
        if (res.data.length > 0) {
          const initialId = eventIdParam || res.data[0]._id;
          setSelectedEventId(initialId);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    };
    fetchEvents();
  }, []);

  const fetchLiveStats = async (eventId: string, silent = false) => {
    if (!eventId) return;
    if (!silent) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const data = await liveMonitorService.getLiveStats(eventId);
      setLiveData(data);
      setLastRefreshedAt(new Date());
    } catch (err: any) {
      console.error('Failed to fetch live stats:', err);
      if (!silent) toast.error(err.response?.data?.message || 'Failed to fetch live monitor stats');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      setSearchParams({ eventId: selectedEventId });
      fetchLiveStats(selectedEventId);
    }
  }, [selectedEventId]);

  // Polling mechanism
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (autoRefreshInterval > 0 && selectedEventId) {
      timerRef.current = setInterval(() => {
        fetchLiveStats(selectedEventId, true);
      }, autoRefreshInterval * 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefreshInterval, selectedEventId]);

  const metrics = liveData?.metrics;
  const capacityPct = liveData && liveData.event.capacity > 0
    ? Math.min(100, Math.round((liveData.metrics.uniqueCheckedIn / liveData.event.capacity) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
            Real-Time Attendance Telemetry
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <span>Live Crowd & Entry Monitor</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse" />
          </h1>
          <p className="text-sm text-[#334155] mt-1">
            Real-time venue check-in monitoring, capacity thresholds, session progression, and live entry audit.
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

          {/* Auto Refresh Selector */}
          <div className="flex items-center gap-2">
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="px-2.5 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#334155] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/20"
              title="Polling frequency"
            >
              <option value={0}>Auto-refresh: Off</option>
              <option value={3}>Auto-refresh: 3s</option>
              <option value={5}>Auto-refresh: 5s</option>
              <option value={10}>Auto-refresh: 10s</option>
              <option value={30}>Auto-refresh: 30s</option>
            </select>

            <button
              onClick={() => fetchLiveStats(selectedEventId)}
              disabled={isRefreshing}
              className="p-2 btn-secondary rounded-lg transition"
              title="Refresh now"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#2563EB]' : 'text-[#64748B]'}`} />
            </button>
          </div>

          {selectedEventId && (
            <Link
              to={`/organizer/scanner?eventId=${selectedEventId}`}
              className="btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold"
            >
              <QrCode className="w-4 h-4" />
              <span>Launch Scanner</span>
            </Link>
          )}
        </div>
      </div>

      {isLoading && !liveData ? (
        <TableSkeleton rows={4} />
      ) : !liveData ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center shadow-xs">
          <Activity className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#0F172A]">No live data available</h3>
          <p className="text-xs text-[#64748B] mt-1">Please select an event to view live crowd metrics.</p>
        </div>
      ) : (
        <>
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Registered"
              value={metrics?.totalRegistered || 0}
              subtitle="Registered students"
              icon={<Users className="w-5 h-5 text-[#2563EB]" />}
              iconColorTheme="blue"
            />
            <KPICard
              title="Checked In"
              value={metrics?.uniqueCheckedIn || 0}
              subtitle={`${metrics?.attendancePercentage || 0}% verified turnout`}
              icon={<CheckCircle2 className="w-5 h-5 text-[#16A34A]" />}
              iconColorTheme="green"
            />
            <KPICard
              title="Pending Arrival"
              value={metrics?.pendingCheckIn || 0}
              subtitle="Awaiting entrance scan"
              icon={<Clock className="w-5 h-5 text-[#D97706]" />}
              iconColorTheme="amber"
            />
            <KPICard
              title="Remaining Seats"
              value={metrics?.remainingCapacity !== undefined ? metrics.remainingCapacity : '—'}
              subtitle={
                liveData.event.capacity > 0
                  ? `Of ${liveData.event.capacity} total seats`
                  : 'Unlimited venue'
              }
              icon={<TrendingUp className="w-5 h-5 text-[#7C3AED]" />}
              iconColorTheme="purple"
            />
          </div>

          {/* Capacity Bar (if capacity is configured) */}
          {liveData.event.capacity > 0 && (
            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-[#0F172A]">Venue Capacity Utilization</span>
                <span className="text-[#2563EB] font-bold">{capacityPct}% Filled</span>
              </div>
              <div className="w-full bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    capacityPct >= 90
                      ? 'bg-[#DC2626]'
                      : capacityPct >= 75
                      ? 'bg-[#D97706]'
                      : 'bg-[#16A34A]'
                  }`}
                  style={{ width: `${capacityPct}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-[#64748B] mt-2">
                <span>0</span>
                <span className="font-medium text-[#334155]">
                  {liveData.metrics.uniqueCheckedIn} Checked In / {liveData.event.capacity} Max Seats
                </span>
                <span>{liveData.event.capacity} Max Capacity</span>
              </div>
            </div>
          )}

          {/* Session Progression Breakdown */}
          <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                  Session Attendance Breakdown
                </h2>
                <p className="text-xs text-[#64748B]">
                  Granular counts per attendance session for multi-stage tracking.
                </p>
              </div>

              <Link
                to={`/organizer/sessions?eventId=${selectedEventId}`}
                className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
              >
                Manage Sessions →
              </Link>
            </div>

            {liveData.sessions.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                No attendance sessions configured for this event. Whole-event attendance is being tracked.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveData.sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className={`p-4 rounded-xl border transition-all ${
                      sess.isActive
                        ? 'border-[#DBEAFE] bg-[#EFF6FF]/40'
                        : 'border-[#E2E8F0] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          sess.status === 'Active'
                            ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]'
                            : sess.status === 'Closed'
                            ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2]'
                            : 'bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            sess.status === 'Active'
                              ? 'bg-[#22C55E]'
                              : sess.status === 'Closed'
                              ? 'bg-[#EF4444]'
                              : 'bg-[#F59E0B]'
                          }`}
                        />
                        {sess.status}
                      </span>

                      {sess.isActive && (
                        <span className="text-[10px] font-bold text-[#2563EB] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                          Live Now
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-[#0F172A]">{sess.name}</h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {new Date(sess.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(sess.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>

                    <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                      <span className="text-[#64748B] font-medium">Attended:</span>
                      <span className="font-bold text-[#0F172A]">
                        {sess.attendanceCount} ({sess.attendanceRate}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Recent Activity Log */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
                  <span>Recent Entry Activity Feed</span>
                  <span className="text-[10px] font-semibold bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded-full border border-[#E2E8F0]">
                    Last 20 scans
                  </span>
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Updated automatically every {autoRefreshInterval > 0 ? `${autoRefreshInterval}s` : 'manual refresh'}. Last sync at {lastRefreshedAt.toLocaleTimeString()}.
                </p>
              </div>
            </div>

            {liveData.recentActivity.length === 0 ? (
              <div className="p-10 text-center text-xs text-[#64748B]">
                No check-in entries recorded for this event yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F8FAFC] text-[#475569] uppercase text-[11px] font-semibold tracking-wider border-b border-[#E2E8F0]">
                    <tr>
                      <th className="px-5 py-3.5">Student</th>
                      <th className="px-5 py-3.5">Department / ID</th>
                      <th className="px-5 py-3.5">Session</th>
                      <th className="px-5 py-3.5">Scanned At</th>
                      <th className="px-5 py-3.5 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {liveData.recentActivity.map((act) => (
                      <tr key={act.id} className="hover:bg-[#F8FAFC] transition-colors h-14">
                        <td className="px-5 py-3">
                          <div className="font-semibold text-[#0F172A]">{act.studentName}</div>
                          <div className="text-[11px] text-[#64748B]">{act.studentEmail}</div>
                        </td>
                        <td className="px-5 py-3 text-[#334155]">
                          {act.department || '—'}{' '}
                          {act.studentIdNumber && <span className="text-[#64748B]">({act.studentIdNumber})</span>}
                        </td>
                        <td className="px-5 py-3 font-medium text-[#0F172A]">
                          {act.sessionName}
                        </td>
                        <td className="px-5 py-3 text-[#64748B]">
                          {new Date(act.checkedInAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {act.isManualOverride ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7]">
                              <ShieldAlert className="w-3 h-3 text-[#D97706]" />
                              Override
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]">
                              <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                              Verified
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
