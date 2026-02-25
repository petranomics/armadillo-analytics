'use client';

import type { Post } from '@/lib/types';
import { Users, BadgeCheck } from 'lucide-react';

interface CollabTrackerCardProps {
  posts: Post[];
}

interface CollabEntry {
  username: string;
  full_name?: string;
  is_verified: boolean;
  postCount: number;
  totalEng: number;
  avgEng: number;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

export default function CollabTrackerCard({ posts }: CollabTrackerCardProps) {
  const collabMap: Record<string, { full_name?: string; is_verified: boolean; postCount: number; totalEng: number }> = {};

  for (const post of posts) {
    if (!post.taggedUsers || post.taggedUsers.length === 0) continue;
    const eng = post.metrics.likes + post.metrics.comments;
    for (const user of post.taggedUsers) {
      if (!user.username) continue;
      const key = user.username.toLowerCase();
      if (!collabMap[key]) {
        collabMap[key] = { full_name: user.full_name, is_verified: user.is_verified || false, postCount: 0, totalEng: 0 };
      }
      collabMap[key].postCount += 1;
      collabMap[key].totalEng += eng;
      if (user.is_verified) collabMap[key].is_verified = true;
      if (user.full_name && !collabMap[key].full_name) collabMap[key].full_name = user.full_name;
    }
  }

  const collabs: CollabEntry[] = Object.entries(collabMap)
    .map(([username, data]) => ({
      username,
      full_name: data.full_name,
      is_verified: data.is_verified,
      postCount: data.postCount,
      totalEng: data.totalEng,
      avgEng: Math.round(data.totalEng / data.postCount),
    }))
    .sort((a, b) => b.totalEng - a.totalEng)
    .slice(0, 8);

  // Calculate collab lift
  const collabPosts = posts.filter(p => p.taggedUsers && p.taggedUsers.length > 0);
  const soloPosts = posts.filter(p => !p.taggedUsers || p.taggedUsers.length === 0);
  const collabAvg = collabPosts.length > 0
    ? collabPosts.reduce((s, p) => s + p.metrics.likes + p.metrics.comments, 0) / collabPosts.length
    : 0;
  const soloAvg = soloPosts.length > 0
    ? soloPosts.reduce((s, p) => s + p.metrics.likes + p.metrics.comments, 0) / soloPosts.length
    : 0;

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users size={14} className="text-burnt" />
        <h3 className="text-sm font-medium text-armadillo-text">Collaborations</h3>
      </div>
      {collabs.length === 0 ? (
        <p className="text-xs text-armadillo-muted">No tagged users found in recent posts. Tag brands and collaborators to track partnership performance.</p>
      ) : (
        <div className="space-y-2">
          {collabs.map((collab) => (
            <div key={collab.username} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs text-armadillo-text truncate">@{collab.username}</span>
                {collab.is_verified && <BadgeCheck size={12} className="text-burnt flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[10px] text-armadillo-muted">{collab.postCount} {collab.postCount === 1 ? 'post' : 'posts'}</span>
                <span className="text-[10px] text-burnt font-medium">{formatNumber(collab.avgEng)} avg</span>
              </div>
            </div>
          ))}
          {collabPosts.length > 0 && soloPosts.length > 0 && (
            <div className="pt-2 border-t border-armadillo-border/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-armadillo-muted">Collab vs solo performance</span>
                <span className={`text-[10px] font-medium ${collabAvg >= soloAvg ? 'text-success' : 'text-danger'}`}>
                  {collabAvg >= soloAvg ? '+' : ''}{soloAvg > 0 ? Math.round(((collabAvg - soloAvg) / soloAvg) * 100) : 0}% engagement
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
