import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  Award,
  Users,
  Calendar,
  CheckCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationService } from '../services/api';
import { Notification } from '../types';
import { TableSkeleton } from '../components/SkeletonLoader';

export const StudentNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await notificationService.getMyNotifications();
      const items = Array.isArray(res?.data)
        ? res.data
        : Array.isArray((res as any)?.notifications)
        ? (res as any).notifications
        : [];
      setNotifications(items);
      setUnreadCount(typeof res?.unreadCount === 'number' ? res.unreadCount : 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setNotifications([]);
      toast.error('Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read.');
    } catch (err) {
      console.error('Failed to mark all read:', err);
      toast.error('Failed to mark all as read.');
    }
  };

  const filteredNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.read : true
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'session_reminder':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'certificate_issued':
        return <Award className="w-4 h-4 text-emerald-600" />;
      case 'team_request':
        return <Users className="w-4 h-4 text-indigo-600" />;
      case 'event_reminder':
        return <Calendar className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
            Real-Time Alerts & Updates
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-[#334155] mt-1">
            Session reminders, verification notices, team requests, and activity alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Mark All Read</span>
            </button>
          )}

          <div className="flex items-center bg-[#F1F5F9] p-1 rounded-lg text-xs border border-[#E2E8F0]">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                filter === 'all' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                filter === 'unread' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center shadow-xs">
          <Bell className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#0F172A]">No notifications to display</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            {filter === 'unread'
              ? 'You have caught up with all attendance and team alerts!'
              : 'You will receive reminders when attendance sessions open for your registered events.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const hasData = notif.data && Object.keys(notif.data).length > 0;
            return (
              <div
                key={notif._id}
                onClick={() => !notif.read && handleMarkAsRead(notif._id)}
                className={`p-4 sm:p-5 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                  notif.read
                    ? 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                    : 'bg-[#EFF6FF]/40 border-[#DBEAFE] hover:border-[#BFDBFE] shadow-xs'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
                    notif.read ? 'bg-[#F1F5F9] text-[#64748B]' : 'bg-white shadow-2xs border border-[#DBEAFE]'
                  }`}
                >
                  {getTypeIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`text-sm tracking-tight ${
                        notif.read ? 'font-semibold text-[#0F172A]' : 'font-bold text-[#0F172A]'
                      }`}
                    >
                      {notif.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#64748B] whitespace-nowrap">
                        {new Date(notif.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[#2563EB] flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#334155] mt-1 leading-relaxed">{notif.message}</p>

                  {/* Context pills if session reminder or certificate */}
                  {hasData && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
                      {notif.data?.sessionName && (
                        <span className="px-2 py-0.5 rounded-md bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7] font-semibold">
                          Session: {notif.data.sessionName}
                        </span>
                      )}

                      {notif.data?.startTime && (
                        <span className="px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] font-medium">
                          Opens: {new Date(notif.data.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}

                      {notif.data?.endTime && (
                        <span className="px-2 py-0.5 rounded-md bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2] font-medium">
                          Deadline: {new Date(notif.data.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}

                      {notif.data?.certificateId && (
                        <Link
                          to={`/verify-certificate/${notif.data.certificateId}`}
                          className="px-2 py-0.5 rounded-md bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] font-semibold hover:underline inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>View Certificate</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
