import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  QrCode,
  CalendarPlus,
  CalendarCheck,
  FileSpreadsheet,
  Users,
  LogOut,
  MessageSquareHeart,
  BarChart3,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Award,
  Clock,
  Bell,
  Activity,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!user) return [];

    if (user.role === 'student') {
      return [
        { label: 'Overview', to: '/student/dashboard', icon: LayoutDashboard },
        { label: 'My Registrations', to: '/student/registrations', icon: CalendarCheck },
        { label: 'QR Tickets', to: '/student/tickets', icon: Ticket },
        { label: 'Event Passport', to: '/student/passport', icon: Award },
        { label: 'Hackathon Teams', to: '/student/teams', icon: Users },
        { label: 'Notifications', to: '/student/notifications', icon: Bell },
        { label: 'Event Feedback', to: '/student/feedback', icon: MessageSquareHeart },
        { label: 'Browse Events', to: '/events', icon: Calendar },
      ];
    }

    if (user.role === 'organizer') {
      return [
        { label: 'Dashboard', to: '/organizer/dashboard', icon: LayoutDashboard },
        { label: 'Create New Event', to: '/organizer/create-event', icon: CalendarPlus },
        { label: 'Manage Events', to: '/organizer/manage-events', icon: CalendarCheck },
        { label: 'Attendance Sessions', to: '/organizer/sessions', icon: Clock },
        { label: 'QR Scanner', to: '/organizer/scanner', icon: QrCode },
        { label: 'Live Crowd Monitor', to: '/organizer/live-monitor', icon: Activity },
        { label: 'Digital Certificates', to: '/organizer/certificates', icon: Award },
        { label: 'Attendance Reports', to: '/organizer/reports', icon: FileSpreadsheet },
        { label: 'Browse Public View', to: '/events', icon: Calendar },
      ];
    }

    if (user.role === 'admin') {
      return [
        { label: 'Admin Overview', to: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'User Management', to: '/admin/users', icon: Users },
        { label: 'All Campus Events', to: '/admin/events', icon: CalendarCheck },
        { label: 'Attendance Sessions', to: '/admin/sessions', icon: Clock },
        { label: 'Live Crowd Monitor', to: '/admin/live-monitor', icon: Activity },
        { label: 'Digital Certificates', to: '/admin/certificates', icon: Award },
        { label: 'Platform Analytics', to: '/admin/analytics', icon: BarChart3 },
        { label: 'QR Scanner', to: '/admin/scanner', icon: QrCode },
        { label: 'Public Portal', to: '/events', icon: Calendar },
      ];
    }

    return [];
  };

  const navLinks = getNavLinks();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return {
          bg: 'bg-[#EFF6FF]',
          text: 'text-[#2563EB]',
          border: 'border-[#DBEAFE]',
          dot: 'bg-[#3B82F6]',
        };
      case 'organizer':
        return {
          bg: 'bg-[#F5F3FF]',
          text: 'text-[#7C3AED]',
          border: 'border-[#EDE9FE]',
          dot: 'bg-[#8B5CF6]',
        };
      default:
        return {
          bg: 'bg-[#F0FDF4]',
          text: 'text-[#16A34A]',
          border: 'border-[#DCFCE7]',
          dot: 'bg-[#22C55E]',
        };
    }
  };

  const roleBadge = getRoleBadge(user?.role);

  const sidebarContent = (
    <div
      className={`flex flex-col h-full bg-white border-r border-[#E2E8F0] transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-[248px]'
      }`}
    >
      {/* 1. Brand Header */}
      <div
        className={`flex items-center ${
          isCollapsed ? 'justify-center px-2 py-4' : 'justify-between px-4 py-3.5'
        } border-b border-[#E2E8F0] min-h-[64px]`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Modern SVG Logo Icon (32px x 32px) */}
          <div className="w-8 h-8 rounded-[10px] bg-[#2563EB] flex items-center justify-center text-white shadow-xs shrink-0">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[13.5px] font-bold text-[#0F172A] leading-tight tracking-tight truncate">
                EVORA
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748B] truncate mt-0.5">
                {user?.role} Console
              </span>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Desktop Collapse / Minimize Toggle Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`hidden md:flex p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition ${
              isCollapsed ? 'mt-1' : ''
            }`}
            title={isCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* 2. User Identity Card (Embedded below header) */}
      {!isCollapsed ? (
        <div className="px-3 pt-3 pb-2">
          <div className="bg-white p-3 rounded-[10px] border border-[#E2E8F0] shadow-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[12.5px] font-semibold text-[#0F172A] truncate">
                  {user?.name}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shrink-0 ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}
                >
                  <span className={`w-1 h-1 rounded-full ${roleBadge.dot}`} />
                  {user?.role}
                </span>
              </div>
              <span className="text-[11px] text-[#64748B] truncate mt-0.5">{user?.email}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-2.5 border-b border-[#F1F5F9]">
          <div
            className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shadow-2xs"
            title={`${user?.name} (${user?.role})`}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      )}

      {/* 3. Navigation Menu */}
      <div className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B] px-3 pt-2 pb-1">
            Menu
          </div>
        )}
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-lg text-xs font-semibold transition-all relative ${
                  isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#1D4ED8] font-bold border-l-[3px] border-[#2563EB]'
                    : 'text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#0F172A] border-l-[3px] border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive ? 'text-[#2563EB]' : 'text-[#64748B]'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* 4. Footer: Minimize Toggle & Logout */}
      <div className="p-2.5 border-t border-[#E2E8F0] space-y-1">
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`w-full flex items-center rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition ${
              isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'
            }`}
            title={isCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-[#64748B]" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 text-[#64748B] shrink-0" />
                <span>Collapse Navigation</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Sign Out' : undefined}
          className={`w-full flex items-center rounded-lg text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition ${
            isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0 text-[#DC2626]" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block fixed inset-y-0 left-0 z-30 pt-[70px] transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-[248px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs" onClick={onClose} />
          <div className="relative flex-1 flex flex-col max-w-[248px] w-full bg-white z-10 shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
