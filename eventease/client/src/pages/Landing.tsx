import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  QrCode,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { eventService } from '../services/api';
import { Event } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CardSkeleton } from '../components/SkeletonLoader';

export const Landing: React.FC = () => {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await eventService.getEvents({ limit: 3, sort: 'soonest' });
        setFeaturedEvents(response.data);
      } catch (error) {
        console.error('Error fetching featured events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-[#E2E8F0] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#1D4ED8] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Code Carnival 3.0 • Problem Statement PS-03</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0F172A] tracking-tight leading-[1.12]">
                Modern College Event Registration &{' '}
                <span className="text-[#2563EB] underline decoration-[#DBEAFE] underline-offset-8">
                  Instant QR Check-In
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#334155] max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Replace manual spreadsheets, paper tickets, and crowded venue queues. Register in seconds, generate tamper-proof QR tickets, and verify attendance seamlessly with live camera scanning.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to="/events"
                  className="btn-primary w-full sm:w-auto px-6 py-3 text-sm flex items-center justify-center gap-2"
                >
                  <span>Explore Events</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/register"
                  className="btn-secondary w-full sm:w-auto px-6 py-3 text-sm flex items-center justify-center gap-2"
                >
                  <span>Get Started (Sign Up)</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-[#E2E8F0] flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#64748B] font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  <span>Atomic Concurrency Booking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  <span>Zero Personal Data in Passes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  <span>Offline Check-in & Sync</span>
                </div>
              </div>
            </div>

            {/* Hero Right Preview Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-white rounded-2xl p-6 shadow-xs border border-[#E2E8F0]">
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-[10px] bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0F172A]">Digital Access Pass</h4>
                      <p className="text-[11px] text-[#64748B]">Code Carnival Hackathon</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                    Verified
                  </span>
                </div>

                {/* Simulated QR Code */}
                <div className="my-5 p-5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex flex-col items-center justify-center text-center">
                  <div className="w-40 h-40 bg-white p-2.5 rounded-xl shadow-2xs border border-[#E2E8F0] flex items-center justify-center">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=eventease-demo-ticket-token-cc30"
                      alt="Sample Event Pass QR"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                  <p className="mt-2.5 text-[10px] font-mono text-[#64748B]">
                    TOKEN: e9f2a7•••82c1 (SHA-256 Verified)
                  </p>
                </div>

                {/* Simulated Info Grid */}
                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] uppercase font-bold">Attendee</span>
                    <p className="font-bold text-[#0F172A]">Alex Rivera</p>
                    <p className="text-[11px] text-[#64748B]">CS2026-101</p>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] uppercase font-bold">Seat Status</span>
                    <p className="font-bold text-[#16A34A]">Confirmed Entry</p>
                    <p className="text-[11px] text-[#64748B]">Gate A • Scanner 1</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Counter Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="text-center sm:text-left">
            <p className="text-3xl sm:text-4xl font-bold text-[#2563EB] tracking-tight">100%</p>
            <p className="text-xs sm:text-sm font-bold text-[#0F172A] mt-1">Paperless Workflow</p>
            <p className="text-xs text-[#64748B]">Zero physical tickets needed</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-3xl sm:text-4xl font-bold text-[#2563EB] tracking-tight">&lt; 1s</p>
            <p className="text-xs sm:text-sm font-bold text-[#0F172A] mt-1">Check-In Speed</p>
            <p className="text-xs text-[#64748B]">Instant camera QR recognition</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-3xl sm:text-4xl font-bold text-[#2563EB] tracking-tight">0</p>
            <p className="text-xs sm:text-sm font-bold text-[#0F172A] mt-1">Overbooking Collisions</p>
            <p className="text-xs text-[#64748B]">Atomic database constraints</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-3xl sm:text-4xl font-bold text-[#2563EB] tracking-tight">Offline</p>
            <p className="text-xs sm:text-sm font-bold text-[#0F172A] mt-1">Ready Check-In</p>
            <p className="text-xs text-[#64748B]">Queue & sync on reconnect</p>
          </div>
        </div>
      </section>

      {/* 4-Step Process Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
            STREAMLINED WORKFLOW
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            How EVORA Replaces The Old Way
          </h2>
          <p className="text-[#334155] text-sm sm:text-base mt-1">
            Engineered from the ground up for college campus scale, institutional reliability, and security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-[#CBD5E1] transition group">
            <div className="w-10 h-10 rounded-[10px] bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center font-bold text-base mb-4 group-hover:bg-[#2563EB] group-hover:text-white transition">
              1
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mb-1.5">Browse & Register</h3>
            <p className="text-xs text-[#334155] leading-relaxed">
              Students browse upcoming events and register with one click. Capacity checks are atomic to prevent concurrent overbooking.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-[#CBD5E1] transition group">
            <div className="w-10 h-10 rounded-[10px] bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center font-bold text-base mb-4 group-hover:bg-[#2563EB] group-hover:text-white transition">
              2
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mb-1.5">Cryptographic Ticket</h3>
            <p className="text-xs text-[#334155] leading-relaxed">
              Generates an opaque cryptographic QR pass. The QR code contains zero personal data, making it tamper-proof and privacy-safe.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-[#CBD5E1] transition group">
            <div className="w-10 h-10 rounded-[10px] bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center font-bold text-base mb-4 group-hover:bg-[#2563EB] group-hover:text-white transition">
              3
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mb-1.5">Camera QR Check-In</h3>
            <p className="text-xs text-[#334155] leading-relaxed">
              Event staff scan attendees using their phone or webcam. Duplicate tickets, wrong events, and cancelled passes are immediately blocked.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-[#CBD5E1] transition group">
            <div className="w-10 h-10 rounded-[10px] bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center font-bold text-base mb-4 group-hover:bg-[#2563EB] group-hover:text-white transition">
              4
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mb-1.5">Live Reports & CSV</h3>
            <p className="text-xs text-[#334155] leading-relaxed">
              Organizers track live attendance statistics, seat utilization, and export injection-protected CSV rosters for institutional records.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Upcoming Events */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              LIVE CAMPUS CALENDAR
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
              Featured Upcoming Events
            </h2>
          </div>
          <Link
            to="/events"
            className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1.5 transition"
          >
            <span>View All Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : featuredEvents.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-[#E2E8F0] shadow-xs">
            <Calendar className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#0F172A]">No events found</h3>
            <p className="text-xs text-[#64748B] mt-1">Check back soon for new college activities.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredEvents.map((event) => {
              const eventDate = new Date(event.date);
              const isFull = event.registeredCount >= event.capacity;

              return (
                <div
                  key={event._id}
                  className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs hover:border-[#CBD5E1] transition flex flex-col group"
                >
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white text-[#0F172A] shadow-xs">
                        {event.category}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <StatusBadge status={event.status} />
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#2563EB] transition mb-1.5 line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="text-xs text-[#64748B] line-clamp-2 mb-4 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="space-y-2 text-xs text-[#64748B] mt-auto pt-4 border-t border-[#E2E8F0]">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>
                          {eventDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          • {event.startTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 text-[#334155] font-semibold">
                          <Users className="w-3.5 h-3.5 text-[#64748B]" />
                          <span>
                            {event.registeredCount} / {event.capacity} seats filled
                          </span>
                        </div>
                        {isFull && (
                          <span className="text-[11px] font-bold text-[#DC2626] bg-[#FEF2F2] border border-[#FEE2E2] px-2 py-0.5 rounded">
                            Full
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                      <Link
                        to={`/events/${event._id}`}
                        className="btn-primary w-full text-center text-xs py-2 block"
                      >
                        View Event & Register
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
