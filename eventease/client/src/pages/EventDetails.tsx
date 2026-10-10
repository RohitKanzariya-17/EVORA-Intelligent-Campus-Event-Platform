import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  CheckCircle,
  Share2,
  ArrowLeft,
  QrCode,
  Star,
  Download,
  Building,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventService, registrationService, reportService, feedbackService } from '../services/api';
import { Event, TicketData } from '../types';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge } from '../components/StatusBadge';

export const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState<TicketData | null>(null);
  const [existingRegistrationId, setExistingRegistrationId] = useState<string | null>(null);
  const [reviewsData, setReviewsData] = useState<{
    averageRating: number;
    totalReviews: number;
    feedbacks: Array<{
      _id: string;
      studentId: { name: string; department?: string };
      rating: number;
      comment?: string;
      createdAt: string;
    }>;
  }>({ averageRating: 0, totalReviews: 0, feedbacks: [] });

  useEffect(() => {
    if (!id) return;

    const loadEventDetails = async () => {
      setIsLoading(true);
      try {
        const [eventData, reviews] = await Promise.all([
          eventService.getEventById(id),
          feedbackService.getEventFeedback(id).catch(() => ({ averageRating: 0, totalReviews: 0, feedbacks: [] })),
        ]);
        setEvent(eventData);
        setReviewsData(reviews);

        // Check if student is already registered for this event
        if (isAuthenticated && user?.role === 'student') {
          const myRegs = await registrationService.getMyRegistrations().catch(() => []);
          const currentReg = myRegs.find((r) => r.eventId._id === id && r.registrationStatus !== 'Cancelled');
          if (currentReg) {
            setExistingRegistrationId(currentReg._id);
          }
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load event details');
        navigate('/events');
      } finally {
        setIsLoading(false);
      }
    };

    loadEventDetails();
  }, [id, isAuthenticated, user, navigate]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      toast('Please sign in or create a student account to register.', { icon: '🔑' });
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }

    if (!id) return;
    setIsRegistering(true);

    try {
      const res = await registrationService.registerForEvent(id);
      toast.success(res.message || 'Registration confirmed!');
      setGeneratedTicket({
        registrationId: res.data.registration._id,
        ticketToken: res.data.ticketToken,
        qrCodeDataUrl: res.data.qrCodeDataUrl,
        registrationStatus: 'Registered',
        registeredAt: new Date().toISOString(),
        event: event!,
        student: {
          _id: user!.id,
          name: user!.name,
          email: user!.email,
          department: user?.department,
          studentIdNumber: user?.studentIdNumber,
        },
      });
      setExistingRegistrationId(res.data.registration._id);

      // Increment registeredCount locally
      if (event) {
        setEvent({ ...event, registeredCount: event.registeredCount + 1 });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete registration.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleExportCsv = async () => {
    if (!event) return;
    try {
      toast.loading('Preparing CSV export...', { id: 'csv-export' });
      await reportService.exportCsv(event._id, event.title);
      toast.success('Attendance CSV downloaded successfully!', { id: 'csv-export' });
    } catch (error: any) {
      toast.error('Failed to export CSV: ' + (error.response?.data?.message || 'Unauthorized'), {
        id: 'csv-export',
      });
    }
  };

  if (isLoading || !event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#64748B] font-medium">Loading event details...</p>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const deadlineDate = new Date(event.registrationDeadline);
  const isPastDeadline = new Date() > deadlineDate;
  const isFull = event.registeredCount >= event.capacity;
  const isOrganizer = user && event.organizerId && event.organizerId._id === user.id;
  const isAdmin = user?.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Events</span>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Event Hero & Description */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs">
            {/* Cover Image */}
            <div className="relative h-64 sm:h-80 w-full bg-slate-900 overflow-hidden">
              <img
                src={event.coverImage}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white text-[#0F172A] shadow-xs">
                  {event.category}
                </span>
                <StatusBadge status={event.status} />
              </div>
            </div>

            {/* Event Title & Meta Info */}
            <div className="p-6 sm:p-8 space-y-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
                  {event.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] mt-3 pt-3 border-t border-[#E2E8F0]">
                  <span className="flex items-center gap-1.5 font-medium text-[#334155]">
                    <Building className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Hosted by {event.organizerId?.name || 'Department Organizer'}</span>
                  </span>
                  <span>•</span>
                  <span>{event.organizerId?.department || 'College Campus'}</span>
                </div>
              </div>

              {/* Event Description */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  About This Event
                </h3>
                <div className="text-[#334155] text-sm leading-relaxed whitespace-pre-line">
                  {event.description}
                </div>
              </div>
            </div>
          </div>

          {/* Attendee Reviews & Feedback */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Attendee Feedback</h3>
                <p className="text-xs text-[#64748B]">Verified reviews from checked-in students</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center text-[#F59E0B]">
                  <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                  <span className="ml-1 text-sm font-bold text-[#0F172A]">
                    {reviewsData.averageRating > 0 ? reviewsData.averageRating : 'New'}
                  </span>
                </div>
                <span className="text-xs text-[#64748B]">({reviewsData.totalReviews} ratings)</span>
              </div>
            </div>

            {reviewsData.feedbacks.length === 0 ? (
              <p className="text-xs text-[#64748B] py-4 text-center">
                No reviews yet. Feedback opens for registered students once checked in.
              </p>
            ) : (
              <div className="space-y-3">
                {reviewsData.feedbacks.map((f) => (
                  <div key={f._id} className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#0F172A]">
                        {f.studentId?.name || 'Anonymous Student'}
                      </span>
                      <div className="flex items-center text-[#F59E0B]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < f.rating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#CBD5E1]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {f.comment && <p className="text-xs text-[#334155] leading-relaxed">{f.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Registration Card & Logistics */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-5 sticky top-24">
            {/* Key Logistics */}
            <div className="space-y-3.5 pb-5 border-b border-[#E2E8F0] text-xs text-[#334155]">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-[10px] bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase font-bold">Date</span>
                  <p className="font-semibold text-[#0F172A] text-sm">
                    {eventDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-[10px] bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase font-bold">Timing</span>
                  <p className="font-semibold text-[#0F172A] text-sm">
                    {event.startTime} - {event.endTime}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-[10px] bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase font-bold">Location / Venue</span>
                  <p className="font-semibold text-[#0F172A] text-sm">{event.venue}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-[10px] bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase font-bold">Capacity</span>
                  <p className="font-semibold text-[#0F172A] text-sm">
                    {event.registeredCount} / {event.capacity} registered
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#FFFBEB] rounded-lg border border-[#FEF3C7] text-[#D97706] text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#D97706]" />
                <span>
                  Registration Deadline:{' '}
                  <strong>
                    {deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                    at 11:59 PM
                  </strong>
                </span>
              </div>
            </div>

            {/* Registration Action */}
            <div className="space-y-3">
              {existingRegistrationId ? (
                <div className="space-y-2">
                  <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg text-[#16A34A] text-xs font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#22C55E]" />
                    <span>You are registered for this event!</span>
                  </div>
                  <Link
                    to="/student/tickets"
                    className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-xs"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>View Your QR Ticket Pass</span>
                  </Link>
                </div>
              ) : isPastDeadline ? (
                <button
                  disabled
                  className="w-full py-2.5 bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] rounded-lg text-xs font-semibold cursor-not-allowed"
                >
                  Registration Closed (Deadline Passed)
                </button>
              ) : isFull ? (
                <button
                  disabled
                  className="w-full py-2.5 bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2] rounded-lg text-xs font-semibold cursor-not-allowed"
                >
                  Event Is Fully Booked (0 Seats Left)
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {isRegistering ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <QrCode className="w-4 h-4" />
                  )}
                  <span>{isAuthenticated ? 'Register Now (Instant QR Ticket)' : 'Sign In to Register'}</span>
                </button>
              )}

              {/* Organizer / Admin Management Shortcuts */}
              {(isOrganizer || isAdmin) && (
                <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                    Host Actions
                  </span>
                  <Link
                    to="/organizer/scanner"
                    className="w-full py-2 px-3 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] rounded-lg text-xs font-semibold border border-[#DCFCE7] transition flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Open QR Scanner</span>
                  </Link>
                  <button
                    onClick={handleExportCsv}
                    className="btn-secondary w-full py-2 text-xs flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Attendance CSV</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instant Ticket Modal After Registration */}
      {generatedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#E2E8F0] text-center space-y-4">
            <div className="w-12 h-12 bg-[#F0FDF4] border border-[#DCFCE7] text-[#16A34A] rounded-xl flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-[#22C55E]" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#0F172A]">Registration Confirmed!</h3>
              <p className="text-xs text-[#64748B] mt-1">
                Your entry pass has been generated. Save or screenshot this QR code.
              </p>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex flex-col items-center">
              <img
                src={generatedTicket.qrCodeDataUrl}
                alt="Ticket QR Code"
                className="w-48 h-48 rounded-lg bg-white p-2 border border-[#E2E8F0] shadow-2xs"
              />
              <span className="text-[10px] text-[#64748B] font-mono mt-2 truncate max-w-xs">
                PASS: {generatedTicket.ticketToken.slice(0, 16)}•••
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setGeneratedTicket(null)}
                className="btn-secondary w-full py-2 text-xs"
              >
                Close
              </button>
              <Link
                to="/student/tickets"
                className="btn-primary w-full py-2 text-xs flex items-center justify-center"
              >
                My Tickets
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
