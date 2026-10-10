import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  QrCode,
  Edit,
  Trash2,
  FileSpreadsheet,
  Download,
  CalendarPlus,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventService, reportService } from '../services/api';
import { Event, EventStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { TableSkeleton } from '../components/SkeletonLoader';

export const ManageEvents: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | EventStatus>('All');

  // Delete / Cancel modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await eventService.getEvents({
        organizerId: user?.role === 'organizer' ? user.id : undefined,
        limit: 50,
      });
      setEvents(res.data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Failed to load events.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const handleDeleteClick = (event: Event) => {
    setSelectedEvent(event);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEvent) return;
    setIsDeleting(true);
    try {
      await eventService.deleteEvent(selectedEvent._id);
      toast.success(
        selectedEvent.registeredCount > 0
          ? 'Event marked as Cancelled to preserve registered records.'
          : 'Event deleted successfully.'
      );
      setDeleteModalOpen(false);
      fetchEvents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete event.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadCsv = async (event: Event) => {
    try {
      toast.loading('Generating attendance CSV...', { id: 'csv-download' });
      await reportService.exportCsv(event._id, event.title);
      toast.success('Roster CSV downloaded!', { id: 'csv-download' });
    } catch (error: any) {
      toast.error('Export failed: ' + (error.response?.data?.message || 'Unauthorized'), {
        id: 'csv-download',
      });
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchesStatus = statusFilter === 'All' || ev.status === statusFilter;
    const matchesSearch =
      !search ||
      ev.title.toLowerCase().includes(search.toLowerCase()) ||
      ev.venue.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
            Event Portfolio & Capacity
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
            Manage Campus Events
          </h1>
          <p className="text-sm text-[#334155] mt-1">
            Track seat capacities, launch QR scanners, export attendance CSVs, and update event status.
          </p>
        </div>
        <Link
          to="/organizer/create-event"
          className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Create New Event</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search events by title or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-[#64748B] mr-1 flex-shrink-0" />
          {(['All', 'Published', 'Draft', 'Completed', 'Cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-white text-[#475569] border border-[#E2E8F0] hover:bg-[#F8FAFC]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table / Card List */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-xl p-14 text-center border border-[#E2E8F0] shadow-xs space-y-3">
          <Calendar className="w-12 h-12 text-[#CBD5E1] mx-auto" />
          <h3 className="text-base font-bold text-[#0F172A]">No events found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            {search || statusFilter !== 'All'
              ? 'No events match your current filter criteria.'
              : 'You have not created any events yet.'}
          </p>
          <Link
            to="/organizer/create-event"
            className="btn-primary inline-flex items-center px-4 py-2 text-xs font-semibold"
          >
            Create Your First Event
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((evt) => {
            const eventDate = new Date(evt.date);
            const isFull = evt.registeredCount >= evt.capacity;

            return (
              <div
                key={evt._id}
                className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs hover:border-[#CBD5E1] transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Event Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] border border-[#DBEAFE] px-2 py-0.5 rounded-md">
                      {evt.category}
                    </span>
                    <StatusBadge status={evt.status} />
                    <span className="text-xs text-[#64748B] font-medium">
                      Deadline: {new Date(evt.registrationDeadline).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                    <span>{evt.title}</span>
                    <Link
                      to={`/events/${evt._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open Public Event Page"
                      className="text-[#64748B] hover:text-[#2563EB] transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-1">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>
                        {eventDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        • {evt.startTime} - {evt.endTime}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>{evt.venue}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-[#334155]">
                      <Users className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>
                        {evt.registeredCount} / {evt.capacity} Booked{' '}
                        {isFull && <strong className="text-[#DC2626] font-semibold">(Full)</strong>}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Operations & Management Actions */}
                <div className="flex items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#E2E8F0] flex-wrap">
                  <Link
                    to={`/organizer/scanner?eventId=${evt._id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg text-xs font-semibold shadow-xs transition"
                    title="Launch QR Camera Check-in Scanner"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan Passes</span>
                  </Link>

                  <Link
                    to={`/organizer/reports?eventId=${evt._id}`}
                    className="btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold"
                    title="View Attendance Records"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Roster</span>
                  </Link>

                  <button
                    onClick={() => handleDownloadCsv(evt)}
                    className="btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold"
                    title="Export Attendance CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>CSV</span>
                  </button>

                  <Link
                    to={`/organizer/edit-event/${evt._id}`}
                    className="p-2 text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded-lg transition"
                    title="Edit Event Details"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleDeleteClick(evt)}
                    className="p-2 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition"
                    title="Delete or Cancel Event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete / Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Cancel or Delete Event?"
        message={
          selectedEvent && selectedEvent.registeredCount > 0
            ? `This event currently has ${selectedEvent.registeredCount} registered students. To prevent data corruption, its status will be updated to 'Cancelled'.`
            : 'Are you sure you want to permanently delete this event? This action cannot be undone.'
        }
        confirmText="Confirm Action"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};
