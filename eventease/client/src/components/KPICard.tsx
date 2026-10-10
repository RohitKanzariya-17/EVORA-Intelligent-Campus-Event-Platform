import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export type KPITheme = 'blue' | 'green' | 'amber' | 'purple' | 'red' | 'slate';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon | React.ReactNode;
  theme?: KPITheme;
  iconColorTheme?: string;
  iconBgColor?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  onClick?: () => void;
  className?: string;
}

const themeStyles: Record<
  KPITheme,
  { iconBg: string; iconColor: string; border: string; accentDot: string }
> = {
  blue: {
    iconBg: 'bg-[#EFF6FF]',
    iconColor: 'text-[#2563EB]',
    border: 'hover:border-[#BFDBFE]',
    accentDot: 'bg-[#3B82F6]',
  },
  green: {
    iconBg: 'bg-[#F0FDF4]',
    iconColor: 'text-[#16A34A]',
    border: 'hover:border-[#BBF7D0]',
    accentDot: 'bg-[#22C55E]',
  },
  amber: {
    iconBg: 'bg-[#FFFBEB]',
    iconColor: 'text-[#D97706]',
    border: 'hover:border-[#FDE68A]',
    accentDot: 'bg-[#F59E0B]',
  },
  purple: {
    iconBg: 'bg-[#F5F3FF]',
    iconColor: 'text-[#7C3AED]',
    border: 'hover:border-[#DDD6FE]',
    accentDot: 'bg-[#8B5CF6]',
  },
  red: {
    iconBg: 'bg-[#FEF2F2]',
    iconColor: 'text-[#DC2626]',
    border: 'hover:border-[#FECACA]',
    accentDot: 'bg-[#EF4444]',
  },
  slate: {
    iconBg: 'bg-[#F1F5F9]',
    iconColor: 'text-[#475569]',
    border: 'hover:border-[#CBD5E1]',
    accentDot: 'bg-[#64748B]',
  },
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  theme = 'blue',
  iconColorTheme,
  iconBgColor,
  trend,
  onClick,
  className = '',
}) => {
  const chosenTheme = ((iconColorTheme as KPITheme) || theme) as KPITheme;
  const styles = themeStyles[chosenTheme] || themeStyles.blue;

  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    const IconComp = Icon as LucideIcon;
    return <IconComp className="w-5 h-5" />;
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-200 ${
        styles.border
      } ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''} ${className}`}
    >
      {/* Top row: 42x42px icon badge (10px rounded) + Trend chip */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div
          style={iconBgColor ? { backgroundColor: iconBgColor } : undefined}
          className={`w-[42px] h-[42px] rounded-[10px] ${!iconBgColor ? styles.iconBg : ''} ${
            styles.iconColor
          } flex items-center justify-center shrink-0 border border-black/5`}
        >
          {renderIcon()}
        </div>

        {trend ? (
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              trend.isPositive !== false
                ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]'
                : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2]'
            }`}
          >
            {trend.isPositive !== false ? (
              <TrendingUp className="w-3 h-3 text-[#22C55E]" />
            ) : (
              <TrendingDown className="w-3 h-3 text-[#EF4444]" />
            )}
            <span>{trend.value}</span>
          </div>
        ) : (
          <span className={`w-2 h-2 rounded-full ${styles.accentDot}`} />
        )}
      </div>

      {/* Bottom row: Large numeric value + Subtitle */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B] mb-1">
          {title}
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight leading-none mb-1">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-[#64748B] line-clamp-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default KPICard;
