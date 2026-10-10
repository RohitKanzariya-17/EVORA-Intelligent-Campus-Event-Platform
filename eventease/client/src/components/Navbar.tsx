import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Ticket,
  QrCode,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'organizer':
        return '/organizer/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/student/dashboard';
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[70px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-[10px] bg-[#2563EB] flex items-center justify-center text-white shadow-xs group-hover:bg-[#1D4ED8] transition">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-[#0F172A] leading-tight">
                EVORA
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-[#64748B]">
                Intelligent Campus Event Platform
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/events"
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                isActive('/events')
                  ? 'text-[#1D4ED8] bg-[#EFF6FF] border border-[#DBEAFE]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
              }`}
            >
              Browse Events
            </Link>
            <Link
              to="/about"
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                isActive('/about')
                  ? 'text-[#1D4ED8] bg-[#EFF6FF] border border-[#DBEAFE]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
              }`}
            >
              About Platform
            </Link>
          </nav>

          {/* User Auth Section (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link
                  to={getDashboardPath()}
                  className="btn-secondary text-xs py-2 flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#2563EB]" />
                  <span>Dashboard</span>
                </Link>

                {user.role === 'student' && (
                  <Link
                    to="/student/tickets"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#DBEAFE] rounded-lg transition"
                  >
                    <Ticket className="w-4 h-4 text-[#2563EB]" />
                    <span>My Tickets</span>
                  </Link>
                )}

                {(user.role === 'organizer' || user.role === 'admin') && (
                  <Link
                    to="/organizer/scanner"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#DCFCE7] rounded-lg transition"
                  >
                    <QrCode className="w-4 h-4 text-[#16A34A]" />
                    <span>QR Scanner</span>
                  </Link>
                )}

                {/* Profile Pill */}
                <div className="flex items-center gap-2.5 pl-2 border-l border-[#E2E8F0]">
                  <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-[#0F172A] leading-tight">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-semibold text-[#64748B] capitalize">
                      {user.role}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition ml-1"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="btn-secondary text-xs py-2 px-3.5"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
                >
                  <span>Student Sign Up</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#334155] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E2E8F0] bg-white px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
          <nav className="flex flex-col gap-1">
            <Link
              to="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-[#334155] hover:bg-[#F1F5F9]"
            >
              Browse Events
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-[#334155] hover:bg-[#F1F5F9]"
            >
              About Platform
            </Link>
          </nav>

          <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-2">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-3 p-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#0F172A]">{user.name}</span>
                    <span className="text-[10px] font-semibold text-[#64748B] capitalize">{user.role}</span>
                  </div>
                </div>

                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#1D4ED8] bg-[#EFF6FF] rounded-lg border border-[#DBEAFE]"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-secondary w-full text-center py-2"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary w-full text-center py-2"
                >
                  Student Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
