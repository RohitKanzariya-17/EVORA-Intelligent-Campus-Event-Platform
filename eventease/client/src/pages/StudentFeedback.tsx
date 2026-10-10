import React, { useEffect, useState } from 'react';
import { MessageSquareHeart, Star, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { registrationService, feedbackService } from '../services/api';
import { Registration } from '../types';

export const StudentFeedback: React.FC = () => {
  const [attendedRegistrations, setAttendedRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadAttended = async () => {
      setIsLoading(true);
      try {
        const regs = await registrationService.getMyRegistrations();
        const attended = regs.filter((r) => r.registrationStatus === 'Attended');
        setAttendedRegistrations(attended);
        if (attended.length > 0 && attended[0].eventId) {
          setSelectedEventId(attended[0].eventId._id);
        }
      } catch (error) {
        console.error('Failed to load attended events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAttended();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      toast.error('Please select an event to review.');
      return;
    }

    setIsSubmitting(true);
    try {
      await feedbackService.submitFeedback(selectedEventId, rating, comment);
      toast.success('Thank you! Your feedback has been recorded.');
      setComment('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
          POST-EVENT EVALUATION
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
          Event Attendance & Feedback
        </h1>
        <p className="text-sm text-[#334155] mt-1">
          Share your experience for events you checked in to. Feedback helps organizers improve college activities.
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white p-8 rounded-xl border border-[#E2E8F0] animate-pulse h-64" />
      ) : attendedRegistrations.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-[#E2E8F0] space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-[10px] bg-[#F1F5F9] flex items-center justify-center text-[#64748B] mx-auto">
            <MessageSquareHeart className="w-6 h-6 text-[#64748B]" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">No attended events yet</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            Feedback is enabled after your QR code is scanned and checked in by an event organizer.
          </p>
          <Link
            to="/student/registrations"
            className="btn-secondary inline-flex mt-2"
          >
            View My Registrations
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Event Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Select Attended Event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
              >
                {attendedRegistrations.map((r) => (
                  <option key={r._id} value={r.eventId._id}>
                    {r.eventId.title} (Checked in on{' '}
                    {r.checkedInAt
                      ? new Date(r.checkedInAt).toLocaleDateString()
                      : new Date(r.registeredAt).toLocaleDateString()}
                    )
                  </option>
                ))}
              </select>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-2">
                Overall Experience Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-105 transition focus:outline-hidden"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'fill-[#F59E0B] text-[#F59E0B]'
                          : 'text-[#CBD5E1] hover:text-[#F59E0B]'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-semibold text-[#334155]">
                  {rating === 5
                    ? 'Excellent (5/5)'
                    : rating === 4
                    ? 'Very Good (4/5)'
                    : rating === 3
                    ? 'Good (3/5)'
                    : rating === 2
                    ? 'Fair (2/5)'
                    : 'Poor (1/5)'}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Comments & Suggestions (Optional)
              </label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like about the speakers, venue, or practical sessions? What could be improved?"
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/10 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>Submit Verified Feedback</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
