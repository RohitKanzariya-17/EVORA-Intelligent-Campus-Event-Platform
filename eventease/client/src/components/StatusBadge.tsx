import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'event' | 'registration' | 'user' | 'certificate' | 'session';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const norm = (status || '').toLowerCase().trim();

  let badgeStyle = 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]';
  let dotStyle = 'bg-[#94A3B8]';

  if (
    ['published', 'attended', 'active', 'success', 'completed', 'valid', 'approved'].includes(norm)
  ) {
    // Active / Success / Completed
    badgeStyle = 'bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]';
    dotStyle = 'bg-[#22C55E]';
  } else if (
    ['registered', 'in-progress', 'available', 'info', 'live', 'upcoming'].includes(norm)
  ) {
    // In-Progress / Available / Info
    badgeStyle = 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]';
    dotStyle = 'bg-[#3B82F6]';
  } else if (
    ['draft', 'warning', 'maintenance', 'pending', 'pending approval'].includes(norm)
  ) {
    // Warning / Maintenance / Pending Approval
    badgeStyle = 'bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]';
    dotStyle = 'bg-[#F59E0B]';
  } else if (
    ['cancelled', 'suspended', 'critical', 'danger', 'rejected', 'revoked'].includes(norm)
  ) {
    // Critical / Danger / Rejected / Cancelled
    badgeStyle = 'bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]';
    dotStyle = 'bg-[#EF4444]';
  } else if (['attention', 'scrap', 'disposed'].includes(norm)) {
    // Attention / Scrap / Disposed
    badgeStyle = 'bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5]';
    dotStyle = 'bg-[#F97316]';
  } else if (['transfer', 'in-transit', 'special'].includes(norm)) {
    // Transfer / In-Transit / Special
    badgeStyle = 'bg-[#F5F3FF] text-[#7C3AED] border-[#EDE9FE]';
    dotStyle = 'bg-[#8B5CF6]';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-semibold border ${badgeStyle} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyle}`} />
      <span className="capitalize">{status}</span>
    </span>
  );
};

export default StatusBadge;
