'use client';

import { Users, TrendingUp, Eye, Zap } from 'lucide-react';
import KpiCard from '@/components/cards/KpiCard';
import PostCard from '@/components/cards/PostCard';
import PlatformSummaryCard from '@/components/cards/PlatformSummaryCard';
import EngagementChart from '@/components/charts/EngagementChart';
import PlatformBarChart from '@/components/charts/PlatformBarChart';
import { mockDashboardOverview } from '@/lib/mock-data';
import type { Platform } from '@/lib/types';

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

export default function DashboardPage() {
  const data = mockDashboardOverview;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-armadillo-text mb-1">Dashboard</h1>
        <p className="text-sm text-armadillo-muted">Your cross-platform analytics overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Followers"
          value={formatNumber(data.totalFollowers)}
          trend={3.2}
          trendLabel="vs last month"
          icon={<Users size={16} />}
        />
        <KpiCard
          label="Total Engagement"
          value={formatNumber(data.totalEngagement)}
          trend={8.4}
          trendLabel="vs last month"
          icon={<TrendingUp size={16} />}
        />
        <KpiCard
          label="Avg Engagement Rate"
          value={`${data.avgEngagementRate}%`}
          trend={1.2}
          trendLabel="vs last month"
          icon={<Zap size={16} />}
        />
        <KpiCard
          label="Connected Platforms"
          value="5"
          icon={<Eye size={16} />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <EngagementChart />
        <PlatformBarChart />
      </div>

      {/* Platform Summary Cards */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-armadillo-text mb-3">Platform Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {data.platformBreakdown.map((p) => (
            <PlatformSummaryCard
              key={p.platform}
              platform={p.platform as Platform}
              followers={p.followers}
              engagement={p.engagement}
            />
          ))}
        </div>
      </div>

      {/* Top Posts */}
      <div>
        <h2 className="text-sm font-medium text-armadillo-text mb-3">Top Performing Posts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.topPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
