import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, ArrowRight } from 'lucide-react';

export type ActionTheme = 'blue' | 'green' | 'amber' | 'purple' | 'red';

interface QuickActionCardProps {
  to: string;
  icon: LucideIcon;
  badge?: string;
  title: string;
  description: string;
  actionText?: string;
  theme?: ActionTheme;
  className?: string;
}

const themeStyles: Record<
  ActionTheme,
  {
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    actionColor: string;
    hoverBorder: string;
  }
> = {
  blue: {
    iconBg: 'bg-[#EFF6FF]',
    iconColor: 'text-[#2563EB]',
    badgeBg: 'bg-[#EFF6FF]',
    badgeText: 'text-[#2563EB]',
    badgeBorder: 'border-[#DBEAFE]',
    actionColor: 'text-[#2563EB]',
    hoverBorder: 'hover:border-[#93C5FD]',
  },
  green: {
    iconBg: 'bg-[#F0FDF4]',
    iconColor: 'text-[#16A34A]',
    badgeBg: 'bg-[#F0FDF4]',
    badgeText: 'text-[#16A34A]',
    badgeBorder: 'border-[#DCFCE7]',
    actionColor: 'text-[#16A34A]',
    hoverBorder: 'hover:border-[#86EFAC]',
  },
  amber: {
    iconBg: 'bg-[#FFFBEB]',
    iconColor: 'text-[#D97706]',
    badgeBg: 'bg-[#FFFBEB]',
    badgeText: 'text-[#D97706]',
    badgeBorder: 'border-[#FEF3C7]',
    actionColor: 'text-[#D97706]',
    hoverBorder: 'hover:border-[#FCD34D]',
  },
  purple: {
    iconBg: 'bg-[#F5F3FF]',
    iconColor: 'text-[#7C3AED]',
    badgeBg: 'bg-[#F5F3FF]',
    badgeText: 'text-[#7C3AED]',
    badgeBorder: 'border-[#EDE9FE]',
    actionColor: 'text-[#7C3AED]',
    hoverBorder: 'hover:border-[#C4B5FD]',
  },
  red: {
    iconBg: 'bg-[#FEF2F2]',
    iconColor: 'text-[#DC2626]',
    badgeBg: 'bg-[#FEF2F2]',
    badgeText: 'text-[#DC2626]',
    badgeBorder: 'border-[#FEE2E2]',
    actionColor: 'text-[#DC2626]',
    hoverBorder: 'hover:border-[#FCA5A5]',
  },
};

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  to,
  icon: Icon,
  badge,
  title,
  description,
  actionText = 'Launch workflow',
  theme = 'blue',
  className = '',
}) => {
  const styles = themeStyles[theme] || themeStyles.blue;

  return (
    <Link
      to={to}
      className={`bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between ${
        styles.hoverBorder
      } ${className}`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div
            className={`w-10 h-10 rounded-[10px] ${styles.iconBg} ${styles.iconColor} flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 border border-black/5`}
          >
            <Icon className="w-5 h-5" />
          </div>
          {badge && (
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles.badgeBg} ${styles.badgeText} ${styles.badgeBorder}`}
            >
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-sm font-bold text-[#0F172A] tracking-tight group-hover:text-[#2563EB] transition-colors">
          {title}
        </h3>
        <p className="text-xs text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      <div
        className={`mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs font-semibold ${styles.actionColor}`}
      >
        <span>{actionText}</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
};

export default QuickActionCard;
