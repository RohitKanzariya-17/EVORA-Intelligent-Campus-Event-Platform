import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import {
  Menu,
  ChevronRight,
  Home,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { notificationService } from '../services/api';

export const DashboardLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('eventease_sidebar_collapsed') === 'true';
  });
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user && user.role === 'student') {
      notificationService
        .getMyNotifications()
        .then((res) => setUnreadNotifs(res.unreadCount))
        .catch(() => {});
    }
  }, [user, location.pathname]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('eventease_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Generate dynamic breadcrumb segments
  const pathnames = location.pathname.split('/').filter((x) => x);

  const getBreadcrumbLabel = (seg: string) => {
    switch (seg) {
      case 'student':
        return 'Student';
      case 'organizer':
        return 'Organizer';
      case 'admin':
        return 'Administration';
      case 'dashboard':
        return 'Dashboard';
      case 'registrations':
        return 'Registrations';
      case 'tickets':
        return 'QR Tickets';
      case 'passport':
        return 'Event Passport';
      case 'notifications':
        return 'Notifications';
      case 'teams':
        return 'Hackathon Teams';
      case 'sessions':
        return 'Attendance Sessions';
      case 'live-monitor':
        return 'Live Monitor';
      case 'certificates':
        return 'Digital Certificates';
      case 'feedback':
        return 'Feedback';
      case 'create-event':
        return 'Create Event';
      case 'manage-events':
        return 'Manage Events';
      case 'scanner':
        return 'QR Scanner';
      case 'reports':
        return 'Reports';
      case 'users':
        return 'Users';
      case 'events':
        return 'Events';
      case 'analytics':
        return 'Analytics';
      default:
        return seg.charAt(0).toUpperCase() + seg.slice(1);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      {/* Top App Bar (Height: 70px, Fixed at top, Pure White, Border #E2E8F0) */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] h-[70px] flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Sidebar Toggle / Minimize Button */}
          <button
            onClick={toggleSidebar}
            className="hidden md:inline-flex items-center gap-1.5 p-2 rounded-lg text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition"
            title={isCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-[#2563EB]" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-[#64748B]" />
            )}
          </button>

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-medium text-[#64748B]">
            <Link to="/" className="hover:text-[#2563EB] flex items-center gap-1 transition-colors">
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            {pathnames.map((segment, index) => {
              const isLast = index === pathnames.length - 1;
              return (
                <React.Fragment key={segment}>
                  <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1]" />
                  <span className={isLast ? 'text-[#0F172A] font-semibold' : 'hover:text-[#2563EB] transition-colors'}>
                    {getBreadcrumbLabel(segment)}
                  </span>
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          <Link
            to="/events"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] px-3 py-1.5 rounded-lg shadow-2xs transition"
          >
            <span>Live Portal</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#64748B]" />
          </Link>

          {user?.role === 'student' && (
            <Link
              to="/student/notifications"
              className="relative p-2 rounded-lg text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
              )}
            </Link>
          )}

          {/* User Status Badge */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-[#E2E8F0]">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-[#0F172A] leading-tight">
                {user?.name}
              </span>
              <span className="text-[10px] text-[#64748B] leading-tight mt-0.5">
                {user?.email}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
              {user?.role}
            </span>
          </div>
        </div>
      </header>

      {/* Main Layout Area with Precise Margin Offset */}
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-70px)]">
        <Sidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleSidebar}
        />

        {/* Dynamic Wrapper that scales smoothly with 248px sidebar width */}
        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${
            isCollapsed ? 'md:ml-20' : 'md:ml-[248px]'
          } min-w-0 bg-[#F8FAFC]`}
        >
          <main className="p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
