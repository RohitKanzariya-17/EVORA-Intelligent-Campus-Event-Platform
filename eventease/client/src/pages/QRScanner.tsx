import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScannerState } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  Download,
  UploadCloud,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  CreditCard,
  User,
  Shield,
  Layers,
  Lock,
  Unlock,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { checkInService, eventService, sessionService } from '../services/api';
import { Event, User as UserType, OfflineTicketRecord, OfflineScanItem, EventSession } from '../types';

// Audio feedback helper via Web Audio API
const playSound = (type: 'success' | 'error') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.setValueAtTime(164.81, ctx.currentTime + 0.15); // E3
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Ignore audio failures if browser blocks autoplay
  }
};

// SHA-256 computation in browser for offline verification
const sha256Browser = async (message: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(message.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const QRScanner: React.FC = () => {
  const [searchParams] = useSearchParams();
  const eventIdFromQuery = searchParams.get('eventId');

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventIdFromQuery || '');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // FEATURE 1 & 3: Sessions & strict time window
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<EventSession | null>(null);
  const [manualOverride, setManualOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  // Scanner state
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [cameraErrorMessage, setCameraErrorMessage] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [manualToken, setManualToken] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanLocked, setIsScanLocked] = useState(false);

  // Synchronous refs to prevent race conditions & duplicate scans
  const isLockedRef = useRef(false);
  const isProcessingRef = useRef(false);
  const lastScannedTokenRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);
  const processTokenVerificationRef = useRef<((token: string) => Promise<void>) | null>(null);

  // Scan Outcome state
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'error' | 'idle';
    message: string;
    student?: {
      name?: string;
      email?: string;
      department?: string;
      studentIdNumber?: string;
    };
    checkedInAt?: string;
    alreadyCheckedIn?: boolean;
    isOffline?: boolean;
  }>({ status: 'idle', message: '' });

  // Phase 6 Offline Check-In State
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);
  const [offlinePack, setOfflinePack] = useState<OfflineTicketRecord[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<OfflineScanItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncReport, setSyncReport] = useState<{
    total: number;
    syncedCount: number;
    conflictsCount: number;
    invalidCount: number;
  } | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Load available events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await eventService.getEvents({ limit: 50 });
        setEvents(res.data);
        if (!selectedEventId && res.data.length > 0) {
          setSelectedEventId(res.data[0]._id);
          setSelectedEvent(res.data[0]);
        } else if (selectedEventId) {
          const match = res.data.find((e) => e._id === selectedEventId);
          if (match) setSelectedEvent(match);
        }
      } catch (err) {
        console.error('Failed to load events for scanner:', err);
      }
    };
    loadEvents();
  }, [selectedEventId]);

  // Load sessions for active event
  useEffect(() => {
    if (!selectedEventId) {
      setSessions([]);
      setSelectedSessionId('');
      setSelectedSession(null);
      return;
    }
    const loadSessions = async () => {
      try {
        const data = await sessionService.getEventSessions(selectedEventId);
        setSessions(data);
        if (data && data.length > 0) {
          const active = data.find((s) => s.status === 'Active') || data[0];
          setSelectedSessionId(active._id);
          setSelectedSession(active);
        } else {
          setSelectedSessionId('');
          setSelectedSession(null);
        }
      } catch (err) {
        console.error('Failed to load sessions for event:', err);
        setSessions([]);
        setSelectedSessionId('');
        setSelectedSession(null);
      }
    };
    loadSessions();
  }, [selectedEventId]);

  // Load cached offline pack & queue for current event from localStorage
  useEffect(() => {
    if (!selectedEventId) return;

    try {
      const savedPack = localStorage.getItem(`eventease_offline_pack_${selectedEventId}`);
      if (savedPack) {
        setOfflinePack(JSON.parse(savedPack));
      } else {
        setOfflinePack([]);
      }

      const savedQueue = localStorage.getItem(`eventease_offline_queue_${selectedEventId}`);
      if (savedQueue) {
        setOfflineQueue(JSON.parse(savedQueue));
      } else {
        setOfflineQueue([]);
      }
    } catch (e) {
      console.error('Error loading localStorage offline cache:', e);
    }
  }, [selectedEventId]);

  // Online / Offline network listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOfflineMode(false);
      toast.success('Internet connection restored. Online verification active.', { icon: '🟢' });
    };
    const handleOffline = () => {
      setIsOfflineMode(true);
      toast('Operating in Offline Mode. Scans will be queued.', { icon: '📡' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Download Offline dataset for current event
  const handleDownloadOfflinePack = async () => {
    if (!selectedEventId) {
      toast.error('Please select an event first.');
      return;
    }

    try {
      toast.loading('Downloading offline ticket roster...', { id: 'offline-pack' });
      const pack = await checkInService.getOfflinePack(selectedEventId);
      setOfflinePack(pack.tickets);
      localStorage.setItem(`eventease_offline_pack_${selectedEventId}`, JSON.stringify(pack.tickets));
      toast.success(
        `Downloaded ${pack.tickets.length} valid ticket records for offline scanning!`,
        { id: 'offline-pack' }
      );
    } catch (error: any) {
      toast.error('Failed to download offline pack: ' + (error.response?.data?.message || 'Error'), {
        id: 'offline-pack',
      });
    }
  };

  // Sync queued offline scans to server
  const handleSyncOfflineScans = async () => {
    if (!selectedEventId || offlineQueue.length === 0) {
      toast('No pending scans in offline queue.');
      return;
    }

    setIsSyncing(true);
    try {
      toast.loading(`Syncing ${offlineQueue.length} scans to server...`, { id: 'sync-scans' });
      const res = await checkInService.syncOfflineScans(selectedEventId, offlineQueue);

      setSyncReport(res.summary);
      // Clear offline queue
      setOfflineQueue([]);
      localStorage.removeItem(`eventease_offline_queue_${selectedEventId}`);

      toast.success(
        `Sync complete: ${res.summary.syncedCount} checked-in, ${res.summary.conflictsCount} conflicts, ${res.summary.invalidCount} invalid.`,
        { id: 'sync-scans' }
      );
    } catch (error: any) {
      toast.error('Sync failed: ' + (error.response?.data?.message || 'Server error'), {
        id: 'sync-scans',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Process a scanned raw token (either online or offline)
  const processTokenVerification = useCallback(
    async (rawToken: string) => {
      if (!selectedEventId) {
        toast.error('Please select an event before scanning.');
        isLockedRef.current = false;
        setIsScanLocked(false);
        return;
      }

      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      setIsProcessing(true);
      isLockedRef.current = true;
      setIsScanLocked(true);

      const trimmedToken = rawToken.trim();

      // IF OFFLINE MODE:
      if (isOfflineMode) {
        try {
          if (offlinePack.length === 0) {
            playSound('error');
            setScanResult({
              status: 'error',
              message:
                'No offline ticket data found! Please connect to internet and click "Download Offline Dataset" before scanning offline.',
              isOffline: true,
            });
            toast.error('No offline ticket data found! Scanner locked.', { id: 'scan-toast', icon: '⚠️' });
            return;
          }

          const tokenHash = await sha256Browser(trimmedToken);
          const matched = offlinePack.find((t) => t.tokenHash === tokenHash);

          if (!matched) {
            playSound('error');
            setScanResult({
              status: 'error',
              message: 'Invalid ticket token. QR pass was not found in downloaded event roster.',
              isOffline: true,
            });
            toast.error('Invalid ticket token! Scanner locked.', { id: 'scan-toast', icon: '❌' });
            return;
          }

          if (matched.registrationStatus === 'Cancelled') {
            playSound('error');
            setScanResult({
              status: 'error',
              message: 'Ticket has been marked as cancelled.',
              student: {
                name: matched.studentName,
                email: matched.studentEmail,
                department: matched.department,
                studentIdNumber: matched.studentIdNumber,
              },
              isOffline: true,
            });
            toast.error('Ticket cancelled! Scanner locked.', { id: 'scan-toast', icon: '❌' });
            return;
          }

          // Check if already in local queue or already attended
          const alreadyQueued = offlineQueue.some((q) => q.token === trimmedToken);
          if (alreadyQueued || matched.registrationStatus === 'Attended') {
            playSound('error');
            setScanResult({
              status: 'error',
              message: 'Duplicate check-in detected! This pass was already scanned.',
              alreadyCheckedIn: true,
              student: {
                name: matched.studentName,
                email: matched.studentEmail,
                department: matched.department,
                studentIdNumber: matched.studentIdNumber,
              },
              isOffline: true,
            });
            toast.error('Duplicate ticket detected! Scanner locked.', { id: 'scan-toast', icon: '⚠️' });
            return;
          }

          // Add to offline queue
          const newQueueItem: OfflineScanItem = {
            idempotencyKey: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            token: trimmedToken,
            eventId: selectedEventId,
            registrationId: matched.registrationId,
            studentName: matched.studentName,
            scannedAt: new Date().toISOString(),
          };

          const updatedQueue = [...offlineQueue, newQueueItem];
          setOfflineQueue(updatedQueue);
          localStorage.setItem(
            `eventease_offline_queue_${selectedEventId}`,
            JSON.stringify(updatedQueue)
          );

          playSound('success');
          setScanResult({
            status: 'success',
            message: 'Verified Offline & Queued for Synchronization.',
            student: {
              name: matched.studentName,
              email: matched.studentEmail,
              department: matched.department,
              studentIdNumber: matched.studentIdNumber,
            },
            checkedInAt: newQueueItem.scannedAt,
            isOffline: true,
          });
          toast.success('Offline check-in verified! Scanner locked.', { id: 'scan-toast', icon: '✅' });
        } catch (e: any) {
          playSound('error');
          setScanResult({
            status: 'error',
            message: 'Offline verification error: ' + (e.message || 'Unknown error'),
            isOffline: true,
          });
          toast.error('Offline verification error! Scanner locked.', { id: 'scan-toast', icon: '❌' });
        } finally {
          setIsProcessing(false);
          isProcessingRef.current = false;
        }
        return;
      }

      // ONLINE MODE:
      try {
        const res = await checkInService.scanCheckIn({
          token: trimmedToken,
          eventId: selectedEventId,
          sessionId: selectedSessionId || undefined,
          manualOverride,
          overrideReason: manualOverride ? (overrideReason || 'Organizer manual override check-in') : undefined,
        });
        playSound('success');
        setScanResult({
          status: 'success',
          message: res.message || 'Check-in verified successfully!',
          student: res.student,
          checkedInAt: res.checkedInAt,
          isOffline: false,
        });
        toast.success(res.message || 'Check-in verified! Scanner locked.', { id: 'scan-toast', icon: '✅' });
      } catch (error: any) {
        playSound('error');
        const errorData = error.response?.data;
        setScanResult({
          status: 'error',
          message: errorData?.message || 'Invalid ticket or check-in verification failed.',
          alreadyCheckedIn: errorData?.alreadyCheckedIn,
          student: errorData?.student,
          checkedInAt: errorData?.checkedInAt,
          isOffline: false,
        });
        toast.error(errorData?.message || 'Check-in rejected! Scanner locked.', { id: 'scan-toast', icon: '❌' });
      } finally {
        setIsProcessing(false);
        isProcessingRef.current = false;
      }
    },
    [selectedEventId, selectedSessionId, manualOverride, overrideReason, isOfflineMode, offlinePack, offlineQueue]
  );

  // Keep fresh callback in ref to prevent stale closures in camera loop
  useEffect(() => {
    processTokenVerificationRef.current = processTokenVerification;
  }, [processTokenVerification]);

  // Handle incoming camera QR code detection with lock enforcement
  const handleIncomingScan = useCallback((decodedText: string) => {
    // If locked or currently processing, reject immediately
    if (isLockedRef.current || isProcessingRef.current) {
      return;
    }

    const trimmed = decodedText.trim();
    if (!trimmed) return;

    // Cooldown guard against accidental re-scan of identical pass within 3.5 seconds
    if (
      lastScannedTokenRef.current === trimmed &&
      Date.now() - lastScannedTimeRef.current < 3500
    ) {
      return;
    }

    lastScannedTokenRef.current = trimmed;
    lastScannedTimeRef.current = Date.now();

    // Lock camera scanning immediately
    isLockedRef.current = true;
    setIsScanLocked(true);

    // Pause html5-qrcode internal detection loop
    try {
      if (
        html5QrCodeRef.current &&
        html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING
      ) {
        html5QrCodeRef.current.pause(false);
      }
    } catch {
      // Ignore pause error
    }

    if (processTokenVerificationRef.current) {
      processTokenVerificationRef.current(trimmed);
    }
  }, []);

  // Initialize and start Camera Scanner
  const startCamera = async () => {
    setCameraPermissionDenied(false);
    setCameraErrorMessage('');
    setIsScanLocked(false);
    isLockedRef.current = false;
    isProcessingRef.current = false;

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader-container', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      const qrScanner = html5QrCodeRef.current;
      if (qrScanner.isScanning) {
        await qrScanner.stop();
      }

      const config = {
        fps: 12,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await qrScanner.start(
        { facingMode: facingMode },
        config,
        (decodedText) => {
          handleIncomingScan(decodedText);
        },
        () => {
          // Scanning frame error, ignore
        }
      );

      setScannerActive(true);
    } catch (err: any) {
      console.error('Camera startup error:', err);
      setCameraPermissionDenied(true);
      setCameraErrorMessage(
        err?.message ||
          'Camera access was denied or device not found. Please enable camera permissions in your browser or use manual token input.'
      );
      setScannerActive(false);
    }
  };

  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }
    } catch (err) {
      console.error('Error stopping camera:', err);
    } finally {
      setScannerActive(false);
      setIsScanLocked(false);
      isLockedRef.current = false;
      isProcessingRef.current = false;
    }
  };

  // Flip camera (front / back)
  const toggleFacingMode = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    if (scannerActive) {
      await stopCamera();
      setTimeout(startCamera, 300);
    }
  };

  // Stop camera on component unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(() => {});
        }
        html5QrCodeRef.current.clear();
      }
    };
  }, []);

  // Handle Manual Token Submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) {
      toast.error('Please enter a ticket token to check in.');
      return;
    }
    const token = manualToken.trim();
    isLockedRef.current = true;
    setIsScanLocked(true);
    try {
      if (
        html5QrCodeRef.current &&
        html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING
      ) {
        html5QrCodeRef.current.pause(false);
      }
    } catch {
      // Ignore pause failure
    }
    processTokenVerification(token);
    setManualToken('');
  };

  // Reset result state and unlock camera for the 2nd / next scan
  const handleUnlockAndScanNext = () => {
    setScanResult({ status: 'idle', message: '' });
    setIsScanLocked(false);
    isLockedRef.current = false;
    isProcessingRef.current = false;

    try {
      if (
        html5QrCodeRef.current &&
        html5QrCodeRef.current.getState() === Html5QrcodeScannerState.PAUSED
      ) {
        html5QrCodeRef.current.resume();
      }
    } catch (err) {
      console.warn('Error resuming scanner:', err);
    }

    toast('Scanner unlocked! Ready for next ticket.', { icon: '📷', id: 'scan-ready' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Event Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
            ATTENDANCE SCANNING & VERIFICATION
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
            <span>Live QR Attendance Scanner</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse" />
          </h1>
          <p className="text-xs text-[#334155] mt-1">
            Fast camera QR verification with duplicate entry rejection, cryptographic validation, and offline sync.
          </p>
        </div>

        {/* Event Select Dropdown */}
        <div className="w-full sm:w-72">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
            Active Event
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              const ev = events.find((item) => item._id === e.target.value);
              setSelectedEvent(ev || null);
              setScanResult({ status: 'idle', message: '' });
              setIsScanLocked(false);
              isLockedRef.current = false;
              isProcessingRef.current = false;
              try {
                if (
                  html5QrCodeRef.current &&
                  html5QrCodeRef.current.getState() === Html5QrcodeScannerState.PAUSED
                ) {
                  html5QrCodeRef.current.resume();
                }
              } catch {
                // ignore
              }
            }}
            className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 text-[#0F172A]"
          >
            {events.map((evt) => (
              <option key={evt._id} value={evt._id}>
                {evt.title} ({evt.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* FEATURE 1 & 3: Attendance Session & Strict Window Selector */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[10px] bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#0F172A]">Attendance Session</span>
              <p className="text-[11px] text-[#64748B]">
                {sessions.length > 0
                  ? 'Select an active session to record session-specific check-ins.'
                  : 'No separate sessions found; general event attendance will be recorded.'}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-80">
            <select
              value={selectedSessionId}
              onChange={(e) => {
                setSelectedSessionId(e.target.value);
                const s = sessions.find((item) => item._id === e.target.value);
                setSelectedSession(s || null);
              }}
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 text-[#0F172A]"
            >
              <option value="">General Event Attendance (No Session)</option>
              {sessions.map((sess) => (
                <option key={sess._id} value={sess._id}>
                  {sess.name} ({sess.status}) — {new Date(sess.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedSession && (
          <div className="pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                selectedSession.status === 'Active'
                  ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]'
                  : selectedSession.status === 'Closed'
                  ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2]'
                  : 'bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7]'
              }`}>
                {selectedSession.status}
              </span>
              <span className="text-[#334155] font-medium">
                Window: {new Date(selectedSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {selectedSession.requireStrictWindow && (
                <span className="text-[10px] bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded font-mono">
                  Strict Window Enforced
                </span>
              )}
            </div>

            {/* Manual Override Option */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-[#334155] font-semibold select-none">
                <input
                  type="checkbox"
                  checked={manualOverride}
                  onChange={(e) => setManualOverride(e.target.checked)}
                  className="rounded border-[#CBD5E1] text-[#D97706] focus:ring-[#D97706]"
                />
                <span className="text-[11px] flex items-center gap-1 text-[#D97706]">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Manual Organizer Override
                </span>
              </label>

              {manualOverride && (
                <input
                  type="text"
                  placeholder="Reason for late/override..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-[#FFFBEB] border border-[#FEF3C7] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:ring-1 focus:ring-[#D97706]"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Standout Feature: Offline Mode & Sync Controls Banner */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-[10px] ${
                isOfflineMode ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7]' : 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]'
              }`}
            >
              {isOfflineMode ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0F172A]">
                  {isOfflineMode ? 'Offline Check-In Mode Active' : 'Live Cloud Verification Active'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isOfflineMode
                      ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7]'
                      : 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]'
                  }`}
                >
                  {isOfflineMode ? 'Local Queueing' : 'Connected'}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {isOfflineMode
                  ? 'Verifying against downloaded event dataset. Scans stored in local storage queue.'
                  : 'Instant server verification with live database attendance records.'}
              </p>
            </div>
          </div>

          {/* Toggle Offline Mode manually */}
          <button
            type="button"
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155] transition self-start sm:self-auto"
          >
            Switch to {isOfflineMode ? 'Online Mode' : 'Offline Mode'}
          </button>
        </div>

        {/* Offline Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadOfflinePack}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] rounded-lg font-semibold transition border border-[#DBEAFE]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Offline Dataset ({offlinePack.length} cached)</span>
            </button>

            {offlineQueue.length > 0 && (
              <button
                onClick={handleSyncOfflineScans}
                disabled={isSyncing}
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Sync {offlineQueue.length} Queued Scans</span>
              </button>
            )}
          </div>

          {offlineQueue.length > 0 && (
            <span className="text-[#D97706] font-semibold text-[11px]">
              ⚠️ {offlineQueue.length} scans waiting to be synced to database
            </span>
          )}
        </div>

        {/* Sync Report Modal / Alert */}
        {syncReport && (
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#0F172A]">Latest Sync Summary</span>
              <p className="text-xs text-[#334155]">
                Total Scans: <strong>{syncReport.total}</strong> | Successfully Synced:{' '}
                <strong className="text-[#16A34A]">{syncReport.syncedCount}</strong> | Conflicts /
                Already Checked In:{' '}
                <strong className="text-[#D97706]">{syncReport.conflictsCount}</strong> | Invalid:{' '}
                <strong className="text-[#DC2626]">{syncReport.invalidCount}</strong>
              </p>
            </div>
            <button
              onClick={() => setSyncReport(null)}
              className="text-xs text-[#64748B] hover:text-[#0F172A]"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Camera Viewport */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-[#0F172A]">Camera Feed Viewport</h3>
              {scannerActive && (
                isScanLocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7] animate-pulse">
                    <Lock className="w-2.5 h-2.5 text-[#D97706]" />
                    Scanner Locked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                    Live Scanning
                  </span>
                )
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFacingMode}
                className="px-2.5 py-1 text-xs text-[#334155] hover:bg-[#F1F5F9] rounded-lg border border-[#E2E8F0] transition"
              >
                Flip ({facingMode === 'environment' ? 'Back' : 'Front'})
              </button>
              {scannerActive ? (
                <button
                  onClick={stopCamera}
                  className="px-3 py-1 bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg text-xs font-semibold border border-[#FEE2E2] transition"
                >
                  Stop Camera
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="btn-primary text-xs py-1 px-3"
                >
                  Start Camera
                </button>
              )}
            </div>
          </div>

          {/* Camera Container */}
          <div className="relative min-h-[300px] sm:min-h-[340px] bg-slate-950 rounded-xl overflow-hidden flex flex-col items-center justify-center text-center p-4">
            <div id="qr-reader-container" className="w-full max-w-[340px]" />

            {/* Locked Scan Overlay - Displays immediately upon scan and locks further scanning */}
            {scannerActive && isScanLocked && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-white z-20 animate-fadeIn">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-xl ${
                    isProcessing
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : scanResult.status === 'success'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {isProcessing ? (
                    <RefreshCw className="w-7 h-7 animate-spin" />
                  ) : scanResult.status === 'success' ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  ) : (
                    <Lock className="w-7 h-7 text-amber-400" />
                  )}
                </div>

                <div className="space-y-1.5 mb-5 text-center max-w-xs">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>Scan Done & Locked</span>
                  </div>

                  <h4 className="text-base font-bold text-white">
                    {isProcessing
                      ? 'Verifying Ticket Pass...'
                      : scanResult.status === 'success'
                      ? 'Check-In Verified!'
                      : 'Check-In Rejected'}
                  </h4>

                  <p className="text-xs text-slate-300 line-clamp-2">
                    {scanResult.student?.name
                      ? `Attendee: ${scanResult.student.name}`
                      : scanResult.message || 'Pass processed successfully.'}
                  </p>

                  <p className="text-[11px] text-amber-200/70">
                    Scanner is locked to prevent automatic duplicate scans. Click below to scan the next pass.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleUnlockAndScanNext}
                  className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-2 transform active:scale-95 cursor-pointer ring-2 ring-[#2563EB]/40"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Click to Unlock & Scan Next</span>
                </button>
              </div>
            )}

            {!scannerActive && !cameraPermissionDenied && (
              <div className="space-y-3 py-8 text-slate-300">
                <Camera className="w-12 h-12 mx-auto text-slate-600" />
                <div>
                  <p className="text-sm font-semibold text-white">Camera is inactive</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click "Start Camera" above to enable live QR scanning via webcam or mobile camera.
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  className="btn-primary text-xs py-2 px-5 inline-flex"
                >
                  Enable Camera Scanner
                </button>
              </div>
            )}

            {/* Permission Denied Help Banner */}
            {cameraPermissionDenied && (
              <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-xl max-w-sm text-left space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Camera Permission Required</span>
                </div>
                <p className="text-[11px] text-rose-200 leading-relaxed">{cameraErrorMessage}</p>
                <div className="text-[11px] text-rose-300 pt-1 space-y-1">
                  <p>1. Check browser URL bar: Click the 🔒 lock icon</p>
                  <p>2. Allow "Camera" permissions for localhost / site</p>
                  <p>3. Or use the manual token fallback input on the right</p>
                </div>
                <button
                  onClick={startCamera}
                  className="w-full mt-2 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold transition"
                >
                  Retry Camera Permissions
                </button>
              </div>
            )}
          </div>

          <p className="text-[11px] text-[#64748B] text-center">
            Point camera directly at attendee’s phone screen or printed ticket pass.
          </p>
        </div>

        {/* Right Column: Scan Result & Manual Fallback */}
        <div className="lg:col-span-5 space-y-6">
          {/* Outcome Display Card */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] pb-3 border-b border-[#E2E8F0] flex items-center justify-between">
              <span>Verification Result</span>
              {isProcessing ? (
                <span className="text-xs text-[#2563EB] flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </span>
              ) : isScanLocked && scanResult.status !== 'idle' ? (
                <span className="text-[10px] font-bold text-[#D97706] bg-[#FFFBEB] border border-[#FEF3C7] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Locked</span>
                </span>
              ) : null}
            </h3>

            {scanResult.status === 'idle' ? (
              <div className="py-12 text-center text-[#64748B] space-y-2">
                <div className="w-12 h-12 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center mx-auto text-[#64748B]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-[#0F172A]">Waiting for next ticket</p>
                <p className="text-[11px] text-[#64748B] max-w-xs mx-auto">
                  Scan a QR code with your camera or enter the token manually below.
                </p>
              </div>
            ) : scanResult.status === 'success' ? (
              /* GREEN SUCCESS STATE */
              <div className="p-5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl space-y-4 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-[#16A34A] text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#16A34A] flex items-center gap-2">
                      <span>Check-In Verified!</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#16A34A] border border-[#DCFCE7]">
                        Scan Done
                      </span>
                    </h4>
                    <p className="text-xs text-[#15803D] font-medium">{scanResult.message}</p>
                  </div>
                </div>

                {scanResult.student && (
                  <div className="bg-white p-4 rounded-lg border border-[#DCFCE7] space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#64748B]">Attendee</span>
                      <p className="text-sm font-bold text-[#0F172A]">{scanResult.student.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[#334155] pt-1 border-t border-[#E2E8F0]">
                      <div>
                        <span className="text-[#64748B]">Roll/ID:</span>{' '}
                        <strong>{scanResult.student.studentIdNumber || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-[#64748B]">Dept:</span>{' '}
                        <strong>{scanResult.student.department || 'N/A'}</strong>
                      </div>
                    </div>
                    <div className="text-[10px] text-[#16A34A] font-medium">
                      Timestamp:{' '}
                      {new Date(scanResult.checkedInAt || Date.now()).toLocaleTimeString()}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUnlockAndScanNext}
                  className="w-full py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Click to Scan Next Attendee</span>
                </button>
              </div>
            ) : (
              /* RED FAILURE STATE */
              <div className="p-5 bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl space-y-4 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-[#DC2626] text-white flex items-center justify-center shadow-xs">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#DC2626] flex items-center gap-2">
                      <span>Check-In Rejected</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#DC2626] border border-[#FEE2E2]">
                        Scan Done
                      </span>
                    </h4>
                    <p className="text-xs text-[#B91C1C] font-medium leading-relaxed">
                      {scanResult.message}
                    </p>
                  </div>
                </div>

                {scanResult.student && (
                  <div className="bg-white p-3 rounded-lg border border-[#FEE2E2] text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B]">Attendee Found</span>
                    <p className="font-bold text-[#0F172A]">{scanResult.student.name}</p>
                    <p className="text-[11px] text-[#64748B]">
                      {scanResult.student.studentIdNumber} • {scanResult.student.department}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleUnlockAndScanNext}
                  className="btn-destructive w-full py-2.5 flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Ready for Next Pass (Unlock Scanner)</span>
                </button>
              </div>
            )}
          </div>

          {/* Manual Token Fallback Input */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Manual Token Fallback
              </h3>
            </div>
            <p className="text-[11px] text-[#64748B]">
              If an attendee’s phone screen is cracked or camera cannot focus, type or paste the 64-character raw ticket code:
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Paste 64-character ticket token..."
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-mono focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition text-[#0F172A]"
              />
              <button
                type="submit"
                disabled={isProcessing}
                className="btn-primary w-full py-2 text-xs flex items-center justify-center disabled:opacity-50"
              >
                Verify & Check In Manually
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
