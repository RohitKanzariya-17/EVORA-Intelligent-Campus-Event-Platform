import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Download,
  Printer,
  Shield,
  Sparkles,
  Info,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { registrationService } from '../services/api';
import { Registration, TicketData } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CardSkeleton } from '../components/SkeletonLoader';

export const MyQRTickets: React.FC = () => {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTickets = async () => {
      setIsLoading(true);
      try {
        const regs = await registrationService.getMyRegistrations();
        const activeRegs = regs.filter((r) => r.registrationStatus !== 'Cancelled');

        // Fetch ticket data for active registrations
        const ticketPromises = activeRegs.map((r) =>
          registrationService.getTicket(r._id).catch(() => null)
        );
        const resolved = await Promise.all(ticketPromises);
        const validTickets = resolved.filter((t): t is TicketData => t !== null);
        setTickets(validTickets);
      } catch (error) {
        console.error('Error loading tickets:', error);
        toast.error('Failed to load tickets.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTickets();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = (qrDataUrl: string, eventTitle: string) => {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `evora_ticket_${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Pass saved to your device!');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
          SECURE ENTRY PASSES
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
              My Digital QR Ticket Passes
            </h1>
            <p className="text-sm text-[#334155] mt-1">
              Present these cryptographic QR passes at the entrance for instant camera scanning.
            </p>
          </div>
          {tickets.length > 0 && (
            <button
              onClick={handlePrint}
              className="btn-secondary flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Printer className="w-4 h-4 text-[#64748B]" />
              <span>Print All Passes</span>
            </button>
          )}
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-[10px] bg-white border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] shrink-0 mt-0.5">
          <Shield className="w-4 h-4 text-[#2563EB]" />
        </div>
        <div className="text-xs text-[#1E3A8A] space-y-0.5">
          <p className="font-bold text-[#1E40AF]">Cryptographically Verified Entry Passes</p>
          <p className="text-[#3B82F6] leading-relaxed">
            Each ticket encodes an unguessable 64-character token with zero personal data embedded. Verification occurs securely against SHA-256 database hashes.
          </p>
        </div>
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl p-14 text-center border border-[#E2E8F0] space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-[10px] bg-[#F1F5F9] flex items-center justify-center text-[#64748B] mx-auto">
            <QrCode className="w-6 h-6 text-[#64748B]" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">No active QR passes found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            You don't currently have any active tickets. Register for an upcoming event to generate an admission pass.
          </p>
          <Link
            to="/events"
            className="btn-primary inline-flex mt-2"
          >
            <span>Explore Events & Register</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tickets.map((t) => {
            const eventDate = new Date(t.event.date);

            return (
              <div
                key={t.registrationId}
                className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col justify-between hover:border-[#CBD5E1] transition"
              >
                {/* Pass Header */}
                <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-4 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE]">
                      {t.event.category}
                    </span>
                    <h3 className="text-base font-bold text-[#0F172A] mt-1 line-clamp-1">
                      {t.event.title}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge status={t.registrationStatus} type="registration" />
                  </div>
                </div>

                {/* Pass Body */}
                <div className="p-5 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                  {/* Left QR Code Container */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center text-center">
                    <div className="w-40 h-40 bg-[#F8FAFC] p-2.5 rounded-xl border-2 border-dashed border-[#CBD5E1] flex items-center justify-center">
                      <img
                        src={t.qrCodeDataUrl}
                        alt="Event Pass QR"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[#64748B] mt-2 truncate max-w-[160px]">
                      {t.ticketToken.slice(0, 16)}•••
                    </span>
                  </div>

                  {/* Right Event & Attendee Details */}
                  <div className="sm:col-span-7 space-y-3 text-xs text-[#334155]">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-[#64748B]">Date & Time</span>
                      <p className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>
                          {eventDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          • {t.event.startTime}
                        </span>
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-[#64748B]">Venue</span>
                      <p className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span className="truncate">{t.event.venue}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#E2E8F0] space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-[#64748B]">Attendee</span>
                      <p className="font-bold text-[#0F172A] text-sm">{t.student.name}</p>
                      <p className="text-[11px] text-[#64748B]">
                        {t.student.department || 'Student'} • {t.student.studentIdNumber || 'ID Verified'}
                      </p>
                    </div>

                    {t.checkedInAt && (
                      <div className="p-2 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg text-[#16A34A] text-[11px] font-semibold flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" />
                        <span>Checked in at {new Date(t.checkedInAt).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pass Footer Actions */}
                <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#64748B] font-mono">ID: {t.registrationId.slice(0, 10)}...</span>
                  <button
                    onClick={() => handleDownloadQR(t.qrCodeDataUrl, t.event.title)}
                    className="inline-flex items-center gap-1.5 text-[#2563EB] hover:text-[#1D4ED8] font-semibold transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download QR</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
