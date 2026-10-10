import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  XCircle,
  MessageSquareHeart,
  Search,
  Filter,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { registrationService } from '../services/api';
import { Registration } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { TableSkeleton } from '../components/SkeletonLoader';

export const MyRegistrations: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Registered' | 'Attended' | 'Cancelled'>('All');
  const [search, setSearch] = useState('');

  // Cancel registration modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedRegId, setSelectedRegId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const data = await registrationService.getMyRegistrations();
      setRegistrations(data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load registrations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCancelClick = (regId: string) => {
    setSelectedRegId(regId);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedRegId) return;
    setIsCancelling(true);
    try {
      await registrationService.cancelRegistration(selectedRegId, cancelReason);
      toast.success('Registration cancelled successfully. Your seat has been released.');
      setCancelModalOpen(false);
      fetchRegistrations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel registration.');
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesStatus = statusFilter === 'All' || reg.registrationStatus === statusFilter;
    const event = reg.eventId;
    const matchesSearch =
      !search ||
      (event &&
        (event.title.toLowerCase().includes(search.toLowerCase()) ||
          event.venue.toLowerCase().includes(search.toLowerCase())));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
          BOOKING & ADMISSION
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
              My Event Registrations
            </h1>
            <p className="text-sm text-[#334155] mt-1">
              Manage your booked campus activities, access digital QR passes, and submit verified attendance feedback.
            </p>
          </div>
          <Link
            to="/events"
            className="btn-primary self-start sm:self-auto"
          >
            <span>Browse More Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search by event title or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-[#64748B] mr-1 shrink-0" />
          {(['All', 'Registered', 'Attended', 'Cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE]'
                  : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Registrations List */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : filteredRegistrations.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-[#E2E8F0] space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-[10px] bg-[#F1F5F9] flex items-center justify-center text-[#64748B] mx-auto">
            <Calendar className="w-6 h-6 text-[#64748B]" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">No registrations found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            {search || statusFilter !== 'All'
              ? 'No bookings match your current search and filter settings.'
              : 'You have not registered for any events yet.'}
          </p>
          <Link
            to="/events"
            className="btn-primary inline-flex mt-2"
          >
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredRegistrations.map((reg) => {
            const event = reg.eventId;
            if (!event) return null;
            const eventDate = new Date(event.date);

            return (
              <div
                key={reg._id}
                className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs hover:border-[#CBD5E1] transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE]">
                      {event.category}
                    </span>
                    <StatusBadge status={reg.registrationStatus} type="registration" />
                    <span className="text-[11px] text-[#64748B]">
                      Booked on {new Date(reg.registeredAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0F172A]">
                    <Link to={`/events/${event._id}`} className="hover:text-[#2563EB] transition">
                      {event.title}
                    </Link>
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-0.5">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                      <span>
                        {eventDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        • {event.startTime} - {event.endTime}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                      <span>{event.venue}</span>
                    </span>
                    {reg.checkedInAt && (
                      <span className="text-[#16A34A] font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>
                          Checked in at{' '}
                          {new Date(reg.checkedInAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-[#E2E8F0] flex-wrap">
                  {reg.registrationStatus === 'Registered' && (
                    <>
                      <Link
                        to="/student/tickets"
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Ticket Pass</span>
                      </Link>
                      <button
                        onClick={() => handleCancelClick(reg._id)}
                        className="btn-destructive text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    </>
                  )}

                  {reg.registrationStatus === 'Attended' && (
                    <>
                      <Link
                        to="/student/tickets"
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>View Pass</span>
                      </Link>
                      <Link
                        to={`/student/feedback`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] rounded-lg text-xs font-semibold border border-[#FEF3C7] transition"
                      >
                        <MessageSquareHeart className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>Rate Event</span>
                      </Link>
                    </>
                  )}

                  {reg.registrationStatus === 'Cancelled' && (
                    <span className="text-xs text-[#DC2626] italic">
                      Cancelled {reg.cancellationReason ? `(${reg.cancellationReason})` : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={cancelModalOpen}
        title="Cancel Registration?"
        message="Are you sure you want to cancel your registration? Your reserved seat will be immediately released back to other students, and your cryptographic QR pass will be invalidated."
        confirmText="Yes, Cancel My Seat"
        isDestructive={true}
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onClose={() => setCancelModalOpen(false)}
      />
    </div>
  );
};
