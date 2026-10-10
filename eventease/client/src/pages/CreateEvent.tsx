import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Image as ImageIcon,
  CheckCircle,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventService } from '../services/api';

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

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum([
    'Technical',
    'Cultural',
    'Sports',
    'Workshop',
    'Seminar',
    'Hackathon',
    'Other',
  ]),
  coverImage: z.string().url('Cover image must be a valid URL'),
  date: z.string().min(1, 'Event date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  venue: z.string().min(2, 'Venue is required'),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
  registrationDeadline: z.string().min(1, 'Registration deadline is required'),
  status: z.enum(['Draft', 'Published']),
});

export const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 5);
  const defaultDeadlineStr = deadline.toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(eventSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      category: 'Hackathon',
      coverImage: PRESET_COVERS[0].url,
      date: defaultDateStr,
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      venue: 'Main Auditorium & Innovation Lab',
      capacity: 100,
      registrationDeadline: defaultDeadlineStr,
      status: 'Published',
    },
  });

  const selectedCover = watch('coverImage');

  const onSubmit = async (data: any) => {
    if (new Date(data.registrationDeadline) > new Date(data.date)) {
      toast.error('Registration deadline cannot be after the event date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await eventService.createEvent(data);
      toast.success('Event created successfully!');
      navigate('/organizer/manage-events');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
          EVENT CREATION
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
              Create New Campus Event
            </h1>
            <p className="text-sm text-[#334155] mt-1">
              Publish a college hackathon, technical workshop, or seminar with automated atomic registrations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/organizer/manage-events')}
            className="btn-secondary self-start sm:self-auto flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
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
              placeholder="e.g. NextGen Web3 & AI Hackathon"
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
            />
            {errors.title?.message && (
              <p className="text-xs text-[#DC2626] mt-1">{String(errors.title.message)}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1.5">
              Event Description & Schedule Details
            </label>
            <textarea
              rows={4}
              {...register('description')}
              placeholder="Provide a detailed overview of the event, guidelines, eligibility, and what attendees should bring..."
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
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
                Publishing Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
              >
                <option value="Published">Published (Open for Registration)</option>
                <option value="Draft">Draft (Hidden from Public)</option>
              </select>
            </div>
          </div>

          {/* Cover Image Presets */}
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
                placeholder="https://..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
              />
            </div>
            {errors.coverImage?.message && (
              <p className="text-xs text-[#DC2626] mt-1">{String(errors.coverImage.message)}</p>
            )}
          </div>

          {/* Date and Time Fields */}
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
              {errors.date?.message && (
                <p className="text-xs text-[#DC2626] mt-1">{String(errors.date.message)}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Start Time
              </label>
              <input
                type="text"
                {...register('startTime')}
                placeholder="09:00 AM"
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
              />
              {errors.startTime?.message && (
                <p className="text-xs text-[#DC2626] mt-1">{String(errors.startTime.message)}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                End Time
              </label>
              <input
                type="text"
                {...register('endTime')}
                placeholder="05:00 PM"
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
              />
              {errors.endTime?.message && (
                <p className="text-xs text-[#DC2626] mt-1">{String(errors.endTime.message)}</p>
              )}
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
                placeholder="e.g. Auditorium Hall 2"
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
              />
              {errors.venue?.message && (
                <p className="text-xs text-[#DC2626] mt-1">{String(errors.venue.message)}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Max Capacity (Seats)
              </label>
              <input
                type="number"
                min="1"
                {...register('capacity')}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
              />
              {errors.capacity?.message && (
                <p className="text-xs text-[#DC2626] mt-1">{String(errors.capacity.message)}</p>
              )}
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
              {errors.registrationDeadline?.message && (
                <p className="text-xs text-[#DC2626] mt-1">
                  {String(errors.registrationDeadline.message)}
                </p>
              )}
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
              <span>Create Event</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
