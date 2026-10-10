import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Sparkles,
  Trophy,
  User,
  ShieldCheck,
  Check,
  Layers,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { passportService } from '../services/api';
import { PassportData } from '../types';
import { TableSkeleton } from '../components/SkeletonLoader';
import { StatusBadge } from '../components/StatusBadge';

export const EventPassport: React.FC = () => {
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'certificates' | 'achievements'>('events');

  useEffect(() => {
    const fetchPassport = async () => {
      setIsLoading(true);
      try {
        const data = await passportService.getStudentPassport();
        setPassport(data);
      } catch (err) {
        console.error('Failed to load student passport:', err);
        toast.error('Failed to load Event Passport.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPassport();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (!passport) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-[10px] bg-[#F1F5F9] flex items-center justify-center text-[#64748B] mx-auto mb-3">
          <Trophy className="w-6 h-6 text-[#64748B]" />
        </div>
        <h3 className="text-base font-bold text-[#0F172A]">Passport Unavailable</h3>
        <p className="text-xs text-[#64748B] mt-1">Please try again later or contact campus administration.</p>
      </div>
    );
  }

  const { student, metrics, events, certificates, achievements } = passport;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
          STUDENT CREDENTIAL RECORD
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
              Digital Event Passport
            </h1>
            <p className="text-sm text-[#334155] mt-1">
              Cryptographically verified record of your campus workshops, hackathons, and certified achievements.
            </p>
          </div>
          <Link
            to="/events"
            className="btn-primary self-start sm:self-auto"
          >
            <span>Explore Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Passport Identity Surface Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Identity & Scholar Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] text-2xl font-bold shadow-xs">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">{student.name}</h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                  Verified Scholar
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                {student.department || 'Campus Student'}{' '}
                {student.studentIdNumber && <span>• ID: {student.studentIdNumber}</span>} • {student.email}
              </p>

              {/* Skills Tags */}
              {student.skills && student.skills.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  {student.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#F8FAFC] text-[#334155] border border-[#E2E8F0]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Chips */}
          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
            <div className="text-center px-3">
              <div className="text-xl font-bold text-[#2563EB] tracking-tight">{metrics.attendanceRate}%</div>
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mt-0.5">
                Turnout
              </div>
            </div>
            <div className="text-center px-3 border-x border-[#E2E8F0]">
              <div className="text-xl font-bold text-[#16A34A] tracking-tight">{metrics.totalCompleted}</div>
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mt-0.5">
                Completed
              </div>
            </div>
            <div className="text-center px-3">
              <div className="text-xl font-bold text-[#D97706] tracking-tight">{metrics.certificatesEarned}</div>
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mt-0.5">
                Certificates
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'events'
              ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE]'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Participation History ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'certificates'
              ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE]'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Certificates ({certificates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'achievements'
              ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE]'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Achievements ({achievements.length})</span>
        </button>
      </div>

      {/* Tab: Events Participation */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-[10px] bg-[#F1F5F9] flex items-center justify-center text-[#64748B] mx-auto mb-3">
                <Calendar className="w-6 h-6 text-[#64748B]" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A]">No events registered yet</h3>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                Explore upcoming campus workshops, hackathons, and guest lectures to start building your Digital Passport.
              </p>
              <Link
                to="/events"
                className="btn-primary mt-4 inline-flex"
              >
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {events.map((evt) => (
                <div
                  key={evt.eventId}
                  className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between hover:border-[#CBD5E1] transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]">
                        {evt.category}
                      </span>

                      <StatusBadge status={evt.participationStatus} />
                    </div>

                    <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
                      {evt.title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-[#64748B] mt-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                        <span>{new Date(evt.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    </div>

                    {/* Sessions Breakdown */}
                    {evt.sessionsBreakdown.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2 flex items-center justify-between">
                          <span>Session Breakdown</span>
                          <span>
                            {evt.attendedSessionsCount} of {evt.totalSessionsCount} attended
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {evt.sessionsBreakdown.map((s) => (
                            <div
                              key={s.sessionId}
                              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs ${
                                s.isAttended
                                  ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]'
                                  : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {s.isAttended ? (
                                  <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                                ) : (
                                  <span className="w-3.5 h-3.5 rounded-full border border-[#CBD5E1]" />
                                )}
                                <span className="font-medium text-[#334155]">{s.name}</span>
                              </div>
                              <span className="text-[10px] text-[#64748B]">
                                {new Date(s.startTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer with Certificate link if available */}
                  <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                    <Link
                      to={`/events/${evt.eventId}`}
                      className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                    >
                      View Event →
                    </Link>

                    {evt.certificate && (
                      <Link
                        to={`/verify-certificate/${evt.certificate.certificateId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] rounded-md text-xs font-semibold border border-[#FEF3C7] transition"
                      >
                        <Award className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>Verified Certificate</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Certificates */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          {certificates.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-[10px] bg-[#F1F5F9] flex items-center justify-center text-[#64748B] mx-auto mb-3">
                <Award className="w-6 h-6 text-[#64748B]" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A]">No certificates earned yet</h3>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                Attend scheduled sessions and complete events to earn official verified credentials.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs flex flex-col justify-between hover:border-[#CBD5E1] transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-[10px] bg-[#FFFBEB] border border-[#FEF3C7] flex items-center justify-center text-[#D97706]">
                        <Award className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                        Cryptographically Verified
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
                      {cert.eventTitle}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">{cert.eventCategory}</p>

                    <div className="mt-4 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1 text-xs">
                      <div className="text-[11px] text-[#64748B]">Credential ID:</div>
                      <div className="font-mono font-bold text-[#0F172A] break-all text-[11px]">
                        {cert.certificateId}
                      </div>
                      <div className="text-[11px] text-[#64748B] pt-1">
                        Issued: {new Date(cert.issueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-[11px] text-[#64748B]">{cert.eligibilityCriteria}</span>
                    <Link
                      to={`/verify-certificate/${cert.certificateId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                    >
                      <span>Public Proof</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Achievements */}
      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs flex items-start gap-3.5 hover:border-[#CBD5E1] transition"
            >
              <div className="w-11 h-11 rounded-[10px] bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-xl shrink-0">
                {ach.icon}
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0F172A]">{ach.title}</h4>
                <p className="text-xs text-[#64748B] mt-0.5">{ach.description}</p>
                <span className="inline-block mt-2 text-[10px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#DBEAFE]">
                  Unlocked {new Date(ach.earnedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
