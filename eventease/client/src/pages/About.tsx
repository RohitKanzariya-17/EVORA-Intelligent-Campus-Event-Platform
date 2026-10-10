import React from 'react';
import {
  ShieldCheck,
  Zap,
  QrCode,
  WifiOff,
  Layers,
  Lock,
  Database,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const About: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2 max-w-3xl mx-auto">
        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
          PROBLEM STATEMENT PS-03 • CODE CARNIVAL 3.0
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
          About EVORA Platform
        </h1>
        <p className="text-sm sm:text-base text-[#334155] leading-relaxed">
          An enterprise-grade College Event Registration & Check-In System designed to eliminate paper tickets, prevent venue overbooking, and deliver sub-second QR check-ins.
        </p>
      </div>

      {/* The Core Challenge vs Our Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl p-6 space-y-3">
          <h3 className="text-base font-bold text-[#DC2626]">The Traditional Problem</h3>
          <ul className="space-y-2 text-xs text-[#991B1B]">
            <li className="flex items-start gap-2">
              <span className="text-[#DC2626] font-bold">•</span>
              <span>Manual paper tickets & wristbands get lost, damaged, or forged.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#DC2626] font-bold">•</span>
              <span>Long physical registration queues cause auditorium entry bottlenecks.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#DC2626] font-bold">•</span>
              <span>Concurrent registrations result in overbooked halls beyond fire codes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#DC2626] font-bold">•</span>
              <span>Inaccurate manual paper roll-calls make event attendance audit impossible.</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl p-6 space-y-3">
          <h3 className="text-base font-bold text-[#16A34A]">The EVORA Solution</h3>
          <ul className="space-y-2 text-xs text-[#166534]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>Instant digital registration with 100% atomic seat reservation.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>Opaque cryptographic QR passes containing zero sensitive user data.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>Fast live camera scanning with sub-second duplicate ticket detection.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>Offline queueing with robust conflict-aware server synchronization.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Security Architecture Highlights */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
          <span>Security & Engineering Standards</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-[10px] bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A]">Zero Personal Data in QR</h4>
            <p className="text-xs text-[#334155] leading-relaxed">
              The QR encodes only a 64-character unguessable cryptographic token. Passwords, student IDs, and emails are never exposed inside QR payloads.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-[10px] bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A]">Hash-Only Token Storage</h4>
            <p className="text-xs text-[#334155] leading-relaxed">
              The database stores strictly SHA-256 hashes of ticket tokens. Even in the event of a raw database dump, ticket tokens cannot be reversed.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-[10px] bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center">
              <WifiOff className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A]">Offline Scan Verification</h4>
            <p className="text-xs text-[#334155] leading-relaxed">
              Organizers can download an event-specific encrypted ticket roster before entering basements or dead zones, queueing scans with idempotency keys.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Call to Action */}
      <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-2xl p-8 sm:p-10 text-center space-y-3">
        <h3 className="text-2xl font-bold text-[#0F172A] tracking-tight">Ready to explore college events?</h3>
        <p className="text-[#334155] text-xs sm:text-sm max-w-md mx-auto">
          Sign up today to register for upcoming hackathons, tech bootcamps, and campus guest lectures.
        </p>
        <div className="flex justify-center items-center gap-3 pt-2">
          <Link
            to="/events"
            className="btn-primary flex items-center gap-1.5 text-xs py-2.5 px-5"
          >
            <span>Browse Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/register"
            className="btn-secondary text-xs py-2.5 px-5"
          >
            Create Student Account
          </Link>
        </div>
      </div>
    </div>
  );
};
