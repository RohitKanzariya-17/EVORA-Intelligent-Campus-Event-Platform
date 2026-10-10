import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { eventService } from '../services/api';
import { Event, EventCategory } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CardSkeleton } from '../components/SkeletonLoader';

const categories: Array<'All' | EventCategory> = [
  'All',
  'Hackathon',
  'Workshop',
  'Technical',
  'Seminar',
  'Cultural',
  'Sports',
  'Other',
];

export const BrowseEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'All' | EventCategory>('All');
  const [sort, setSort] = useState('soonest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await eventService.getEvents({
        search: search.trim() || undefined,
        category: category !== 'All' ? category : undefined,
        sort,
        page,
        limit: 9,
      });
      setEvents(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [search, category, sort, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleReset = () => {
    setSearch('');
    setCategory('All');
    setSort('soonest');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div>
        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
          CAMPUS ACTIVITIES DISCOVERY
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
          Explore Campus Events
        </h1>
        <p className="text-sm text-[#334155] mt-1">
          Discover hackathons, engineering bootcamps, workshops, and cultural fests happening across the college.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by title, description, or venue..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
            />
          </div>

          {/* Sort Select */}
          <div className="md:col-span-3">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
            >
              <option value="soonest">Sort by: Happening Soonest</option>
              <option value="latest">Sort by: Latest Created</option>
              <option value="popular">Sort by: Most Popular</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="md:col-span-3 flex items-center justify-end">
            <button
              onClick={handleReset}
              className="btn-secondary w-full sm:w-auto text-xs py-2 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
          <Filter className="w-3.5 h-3.5 text-[#64748B] mr-1 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                category === cat
                  ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE]'
                  : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-[#64748B]">
        <span>
          Showing <strong className="text-[#0F172A]">{events.length}</strong> of{' '}
          <strong className="text-[#0F172A]">{totalCount}</strong> published events
        </span>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center border border-[#E2E8F0] space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-center mx-auto text-[#64748B]">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">No events matched your criteria</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            Try adjusting your search terms, changing the category filter, or resetting all filters.
          </p>
          <button
            onClick={handleReset}
            className="btn-primary inline-flex text-xs py-2 px-4"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((event) => {
            const eventDate = new Date(event.date);
            const isFull = event.registeredCount >= event.capacity;
            const percentFilled = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));

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
                  <div className="absolute top-3 left-3">
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
                        • {event.startTime} - {event.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span className="truncate">{event.venue}</span>
                    </div>

                    {/* Progress Bar for seats */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                        <span className="text-[#64748B]">Capacity Filled</span>
                        <span className={isFull ? 'text-[#DC2626]' : 'text-[#334155]'}>
                          {event.registeredCount} / {event.capacity} ({percentFilled}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden border border-[#E2E8F0]">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isFull ? 'bg-[#DC2626]' : 'bg-[#2563EB]'
                          }`}
                          style={{ width: `${percentFilled}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#E2E8F0]">
                    <Link
                      to={`/events/${event._id}`}
                      className={`w-full block py-2 px-4 rounded-lg text-center text-xs font-semibold transition ${
                        isFull
                          ? 'btn-secondary text-center'
                          : 'btn-primary text-center'
                      }`}
                    >
                      {isFull ? 'View Event Details (Full)' : 'View Event & Register'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-4 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] rounded-lg">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
