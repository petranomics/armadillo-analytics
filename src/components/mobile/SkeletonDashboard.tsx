'use client';

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-armadillo-card ${className || ''}`} />
  );
}

export default function SkeletonDashboard() {
  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Shimmer className="h-8 w-48" />
        <Shimmer className="h-8 w-8 rounded-full" />
      </div>

      {/* Platform badges */}
      <div className="flex gap-2">
        <Shimmer className="h-7 w-20 rounded-full" />
        <Shimmer className="h-7 w-20 rounded-full" />
      </div>

      {/* Hero KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <Shimmer className="h-24" />
        <Shimmer className="h-24" />
        <Shimmer className="h-24" />
        <Shimmer className="h-24" />
      </div>

      {/* Chart placeholder */}
      <Shimmer className="h-48" />

      {/* Metric rows */}
      <div className="space-y-3">
        <Shimmer className="h-14" />
        <Shimmer className="h-14" />
        <Shimmer className="h-14" />
        <Shimmer className="h-14" />
        <Shimmer className="h-14" />
      </div>
    </div>
  );
}

export function SkeletonPlatform() {
  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shimmer className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Shimmer className="h-5 w-32" />
          <Shimmer className="h-3 w-24" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Shimmer className="h-20" />
        <Shimmer className="h-20" />
        <Shimmer className="h-20" />
      </div>

      {/* Posts */}
      <Shimmer className="h-6 w-28" />
      <div className="space-y-3">
        <Shimmer className="h-28" />
        <Shimmer className="h-28" />
        <Shimmer className="h-28" />
      </div>
    </div>
  );
}

export function SkeletonInsights() {
  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      {/* Tab bar */}
      <div className="flex gap-2">
        <Shimmer className="h-9 w-20 rounded-full" />
        <Shimmer className="h-9 w-20 rounded-full" />
        <Shimmer className="h-9 w-20 rounded-full" />
      </div>

      {/* AI writeup */}
      <Shimmer className="h-6 w-40" />
      <div className="space-y-2">
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-5/6" />
        <Shimmer className="h-4 w-4/6" />
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-3/6" />
      </div>

      {/* Cards */}
      <div className="space-y-3 mt-4">
        <Shimmer className="h-32" />
        <Shimmer className="h-32" />
      </div>
    </div>
  );
}
