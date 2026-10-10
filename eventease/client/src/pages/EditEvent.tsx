import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, MapPin, Users, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { eventService } from '../services/api';
import { Event } from '../types';

const PRESET_COVERS = [
  {
    name: 'Hackathon / Tech',
    url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'AI & Robotics',
    url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Web Dev & Coding',
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Cultural Festival',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Cybersecurity',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
  },
];

const updateEventSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().min(10),
  category: z.enum([
    'Technical',
    'Cultural',
    'Sports',
    'Workshop',
    'Seminar',
    'Hackathon',
    'Other',
  ]),
  coverImage: z.string().url(),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  venue: z.string().min(2),
  capacity: z.coerce.number().int().min(1),
  registrationDeadline: z.string().min(1),
  status: z.enum(['Draft', 'Published', 'Cancelled', 'Completed']),
});

export const EditEvent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(updateEventSchema) as any,
  });

  const selectedCover = watch('coverImage');

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      setIsLoading(true);
      try {
        const ev = await eventService.getEventById(id);
        setCurrentEvent(ev);
        reset({
          title: ev.title,
          description: ev.description,
          category: ev.category,
          coverImage: ev.coverImage,
          date: new Date(ev.date).toISOString().split('T')[0],
          startTime: ev.startTime,
          endTime: ev.endTime,
          venue: ev.venue,
          capacity: ev.capacity,
          registrationDeadline: new Date(ev.registrationDeadline).toISOString().split('T')[0],
          status: ev.status,
        });
      } catch (error: any) {
        toast.error('Failed to load event for editing.');
        navigate('/organizer/manage-events');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id, reset, navigate]);

  const onSubmit = async (data: any) => {
    if (!id) return;
    if (new Date(data.registrationDeadline) > new Date(data.date)) {
      toast.error('Registration deadline cannot be after the event date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await eventService.updateEvent(id, data);
      toast.success('Event updated successfully!');
      navigate('/organizer/manage-events');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !currentEvent) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-xs text-[#64748B]">
        Loading event details...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
          EVENT MODIFICATION
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
              Edit Event: {currentEvent.title}
            </h1>
            <p className="text-sm text-[#334155] mt-1">
              Update event parameters, timings, venue capacity, or publishing state.
            </p>
          </div>
          <button
            onClick={() => navigate('/organizer/manage-events')}
            className="btn-secondary self-start sm:self-auto flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Events</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1.5">
              Event Title
            </label>
            <input
              type="text"
              {...register('title')}
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
            />
            {errors.title?.message && (
              <p className="text-xs text-[#DC2626] mt-1">{String(errors.title.message)}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1.5">
              Event Description
            </label>
            <textarea
              rows={4}
              {...register('description')}
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
            />
            {errors.description?.message && (
              <p className="text-xs text-[#DC2626] mt-1">{String(errors.description.message)}</p>
            )}
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Category
              </label>
              <select
                {...register('category')}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
              >
                <option value="Hackathon">Hackathon</option>
                <option value="Technical">Technical</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
              >
                <option value="Published">Published (Open for Registration)</option>
                <option value="Draft">Draft (Hidden)</option>
                <option value="Completed">Completed (Past Event)</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Cover Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#334155]">
              Cover Image URL
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_COVERS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setValue('coverImage', preset.url)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    selectedCover === preset.url
                      ? 'bg-[#EFF6FF] border-[#DBEAFE] text-[#1D4ED8]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
            <div className="relative">
              <ImageIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="url"
                {...register('coverImage')}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
              />
            </div>
            {errors.coverImage?.message && (
              <p className="text-xs text-[#DC2626] mt-1">{String(errors.coverImage.message)}</p>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Event Date
              </label>
              <input
                type="date"
                {...register('date')}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Start Time
              </label>
              <input
                type="text"
                {...register('startTime')}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                End Time
              </label>
              <input
                type="text"
                {...register('endTime')}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
              />
            </div>
          </div>

          {/* Venue & Capacity & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Venue Location
              </label>
              <input
                type="text"
                {...register('venue')}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Capacity (Min: {currentEvent.registeredCount} booked)
              </label>
              <input
                type="number"
                min={currentEvent.registeredCount}
                {...register('capacity')}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Registration Deadline
              </label>
              <input
                type="date"
                {...register('registrationDeadline')}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/organizer/manage-events')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
