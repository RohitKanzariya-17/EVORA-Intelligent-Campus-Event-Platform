import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs animate-pulse flex flex-col gap-4">
      <div className="w-full h-44 bg-[#F1F5F9] rounded-lg" />
      <div className="flex gap-2">
        <div className="w-20 h-5 bg-[#F1F5F9] rounded-full" />
        <div className="w-16 h-5 bg-[#F1F5F9] rounded-full" />
      </div>
      <div className="w-3/4 h-5 bg-[#E2E8F0] rounded-md" />
      <div className="w-full h-10 bg-[#F8FAFC] rounded-md" />
      <div className="flex justify-between items-center pt-2 border-t border-[#F1F5F9]">
        <div className="w-24 h-4 bg-[#F1F5F9] rounded" />
        <div className="w-20 h-7 bg-[#E2E8F0] rounded-lg" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs animate-pulse">
      <div className="h-5 w-48 bg-[#E2E8F0] rounded mb-5" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-[#F1F5F9]">
            <div className="w-1/4 h-4 bg-[#E2E8F0] rounded" />
            <div className="w-1/4 h-4 bg-[#F1F5F9] rounded" />
            <div className="w-1/6 h-4 bg-[#F1F5F9] rounded" />
            <div className="w-20 h-6 bg-[#E2E8F0] rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs animate-pulse flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between">
        <div className="w-[42px] h-[42px] bg-[#EFF6FF] rounded-[10px]" />
        <div className="w-14 h-5 bg-[#F1F5F9] rounded-full" />
      </div>
      <div className="space-y-1.5">
        <div className="w-20 h-7 bg-[#E2E8F0] rounded-md" />
        <div className="w-28 h-3.5 bg-[#F1F5F9] rounded" />
      </div>
    </div>
  );
};
