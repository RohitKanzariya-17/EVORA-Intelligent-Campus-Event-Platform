import React from 'react';
import { Calendar, Shield, Sparkles, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-[#E2E8F0] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-[#2563EB] flex items-center justify-center text-white shadow-2xs">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-[#0F172A]">
                EVORA
              </span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Real-time college event registration, cryptographic QR check-in passes, and live attendance tracking built for Code Carnival 3.0 (PS-03).
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-xs text-[#64748B]">
              <li>
                <Link to="/events" className="hover:text-[#2563EB] transition">
                  Upcoming Campus Events
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#2563EB] transition">
                  About EVORA
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#2563EB] transition">
                  Student Portal Signup
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#2563EB] transition">
                  Portal Login
                </Link>
              </li>
            </ul>
          </div>

          {/* System Highlights */}
          <div>
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">
              Core Capabilities
            </h4>
            <ul className="space-y-2 text-xs text-[#334155]">
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                <span>Atomic Concurrency Booking</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                <span>Opaque Cryptographic QR Passes</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                <span>Live Camera QR Scanner</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                <span>Offline Queue & Conflict Sync</span>
              </li>
            </ul>
          </div>

          {/* Hackathon Demo Credentials */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
              <h4 className="text-xs font-bold text-[#0F172A]">Demo Accounts</h4>
            </div>
            <p className="text-[11px] text-[#64748B] mb-2">
              Password for all: <code className="bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0] font-mono text-[#0F172A]">Password123!</code>
            </p>
            <div className="text-[11px] space-y-1 font-mono text-[#334155]">
              <div><strong className="text-[#2563EB]">Admin:</strong> admin@evora.edu</div>
              <div><strong className="text-[#2563EB]">Organizer:</strong> sarah.organizer@evora.edu</div>
              <div><strong className="text-[#2563EB]">Student:</strong> alex.student@evora.edu</div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4">
          <p>© {new Date().getFullYear()} EVORA — Intelligent Campus Event Platform.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-[#334155] font-medium">
              <Shield className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Production-Grade Security</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
