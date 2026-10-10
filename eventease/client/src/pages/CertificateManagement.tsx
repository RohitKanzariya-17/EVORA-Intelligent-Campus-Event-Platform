import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ExternalLink,
  ShieldAlert,
  Search,
  Filter,
  Users,
  Calendar,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventService, certificateService } from '../services/api';
import { Event, Certificate } from '../types';
import { TableSkeleton } from '../components/SkeletonLoader';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { KPICard } from '../components/KPICard';
import { StatusBadge } from '../components/StatusBadge';

export const CertificateManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId');

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventIdParam || '');
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Generate Modal
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [minSessions, setMinSessions] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Revoke Modal
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [certToRevoke, setCertToRevoke] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  // Load events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventService.getEvents({ limit: 100 });
        const list = Array.isArray(res?.data) ? res.data : [];
        setEvents(list);
        if (list.length > 0) {
          const initialId = eventIdParam && list.some((e) => e._id === eventIdParam) ? eventIdParam : list[0]._id;
          setSelectedEventId(initialId);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const fetchCertificates = async (eventId: string) => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await certificateService.getEventCertificates(eventId);
      setCertificates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load certificates:', err);
      setCertificates([]);
      toast.error('Failed to load issued certificates.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      setSearchParams({ eventId: selectedEventId });
      fetchCertificates(selectedEventId);
    }
  }, [selectedEventId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;

    setIsGenerating(true);
    try {
      const res = await certificateService.generateCertificates(selectedEventId, minSessions);
      toast.success(
        res.message || `Successfully issued ${res.count} verified digital certificates!`,
        { icon: '🎓' }
      );
      setGenerateModalOpen(false);
      fetchCertificates(selectedEventId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to issue certificates.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!certToRevoke) return;
    const certLookupId = certToRevoke.certificateId || certToRevoke._id;
    setIsRevoking(true);
    try {
      await certificateService.revokeCertificate(certLookupId, revokeReason);
      toast.success('Certificate marked as Revoked.');
      setRevokeModalOpen(false);
      setCertToRevoke(null);
      setRevokeReason('');
      fetchCertificates(selectedEventId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to revoke certificate');
    } finally {
      setIsRevoking(false);
    }
  };

  const safeCertificates = Array.isArray(certificates) ? certificates : [];
  const filteredCerts = safeCertificates.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.certificateId && c.certificateId.toLowerCase().includes(q)) ||
      (c.studentName && c.studentName.toLowerCase().includes(q)) ||
      (c.studentEmail && c.studentEmail.toLowerCase().includes(q))
    );
  });

  const validCount = safeCertificates.filter((c) => c.status === 'Valid').length;
  const revokedCount = safeCertificates.filter((c) => c.status === 'Revoked').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
            Credential Governance
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
            Verified Digital Certificates
          </h1>
          <p className="text-sm text-[#334155] mt-1">
            Issue cryptographically verifiable participation credentials to eligible attendees based on session attendance records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Event Selector */}
          <div className="w-full md:w-64">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/20 text-[#0F172A]"
            >
              {events.map((evt) => (
                <option key={evt._id} value={evt._id}>
                  {evt.title} ({evt.status})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setGenerateModalOpen(true)}
            disabled={!selectedEventId}
            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Issue Certificates</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Total Issued"
          value={certificates.length}
          subtitle="Credentials on record"
          icon={<Award className="w-5 h-5 text-[#2563EB]" />}
          iconColorTheme="blue"
        />
        <KPICard
          title="Valid & Verifiable"
          value={validCount}
          subtitle="Cryptographically verified"
          icon={<CheckCircle2 className="w-5 h-5 text-[#16A34A]" />}
          iconColorTheme="green"
        />
        <KPICard
          title="Revoked Credentials"
          value={revokedCount}
          subtitle="Deactivated credentials"
          icon={<ShieldAlert className="w-5 h-5 text-[#DC2626]" />}
          iconColorTheme="rose"
        />
      </div>

      {/* Certificates Table Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
              Issued Credentials Roster
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Showing {filteredCerts.length} of {safeCertificates.length} credentials
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search by ID, student, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 transition"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={5} />
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#64748B] max-w-sm mx-auto px-4">
            <Award className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" />
            <p className="font-semibold text-[#0F172A]">No certificates found</p>
            <p className="mt-1">
              Select an event and click &quot;Issue Certificates&quot; to generate verified digital credentials for qualifying attendees.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F8FAFC] text-[#475569] uppercase text-[11px] font-semibold tracking-wider border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-5 py-3.5">Certificate ID</th>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Sessions Attended</th>
                  <th className="px-5 py-3.5">Issued On</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredCerts.map((cert) => (
                  <tr key={cert._id} className="hover:bg-[#F8FAFC] transition-colors h-14">
                    <td className="px-5 py-3 font-mono font-bold text-[#0F172A]">
                      {cert.certificateId}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-[#0F172A]">{cert.studentName}</div>
                      <div className="text-[11px] text-[#64748B]">{cert.studentEmail}</div>
                    </td>
                    <td className="px-5 py-3 text-[#334155]">
                      <span className="font-semibold text-[#2563EB]">{cert.sessionsAttended}</span> session(s)
                    </td>
                    <td className="px-5 py-3 text-[#64748B]">
                      {new Date(cert.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={cert.status === 'Valid' ? 'Active' : 'Critical'} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/verify-certificate/${cert.certificateId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
                        >
                          <span>Verify</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>

                        {cert.status === 'Valid' && (
                          <button
                            onClick={() => {
                              setCertToRevoke(cert);
                              setRevokeModalOpen(true);
                            }}
                            className="text-[11px] font-semibold text-[#DC2626] hover:text-red-700 hover:underline ml-2"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Generate Certificates */}
      {generateModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 max-w-md w-full shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-lg font-bold text-[#0F172A] mb-1">
              Issue Verified Digital Certificates
            </h2>
            <p className="text-xs text-[#64748B] mb-5">
              Certificates will only be issued to students with verified check-in records meeting your session threshold. Duplicate issuance is prevented.
            </p>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Minimum Attendance Sessions Required
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={minSessions}
                  onChange={(e) => setMinSessions(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20"
                />
                <p className="text-[11px] text-[#64748B] mt-1">
                  Set to 1 or higher for multi-session events, or 0 for general event check-in eligibility.
                </p>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setGenerateModalOpen(false)}
                  className="btn-secondary px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="btn-primary px-4 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Issue Verified Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Revoke Certificate */}
      {revokeModalOpen && certToRevoke && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 max-w-md w-full shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-lg font-bold text-[#DC2626] mb-1">
              Revoke Digital Certificate
            </h2>
            <p className="text-xs text-[#64748B] mb-4">
              Revoking credential <span className="font-mono font-bold text-[#0F172A]">{certToRevoke.certificateId}</span> for {certToRevoke.studentName}.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Reason for Revocation *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Incomplete final submission, academic misconduct..."
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#DC2626]/20"
                />
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRevokeModalOpen(false)}
                  className="btn-secondary px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRevoke}
                  disabled={isRevoking || !revokeReason.trim()}
                  className="btn-destructive px-4 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {isRevoking ? 'Revoking...' : 'Confirm Revocation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

