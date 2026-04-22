'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, Award, Zap, BarChart3 } from 'lucide-react';

interface Notification {
  id: string;
  icon: 'milestone' | 'trend' | 'tip' | 'insight';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const ICON_MAP = {
  milestone: Award,
  trend: TrendingUp,
  tip: Zap,
  insight: BarChart3,
};

const ICON_COLORS = {
  milestone: 'text-burnt bg-burnt/10',
  trend: 'text-success bg-success/10',
  tip: 'text-platform-twitter bg-platform-twitter/10',
  insight: 'text-platform-instagram bg-platform-instagram/10',
};

function generateNotifications(): Notification[] {
  // Generate contextual notifications from localStorage data
  const notifications: Notification[] = [];
  const now = new Date();

  try {
    const raw = localStorage.getItem('armadillo-export-data');
    if (raw) {
      const data = JSON.parse(raw);
      const followers = data?.profile?.followers;
      const engRate = data?.computedMetrics?.avgEngagementRate;

      if (followers && followers > 1000) {
        notifications.push({
          id: 'milestone-followers',
          icon: 'milestone',
          title: 'Follower Milestone',
          body: `You've passed ${Math.floor(followers / 1000) * 1000} followers! Keep up the momentum.`,
          time: 'Today',
          read: false,
        });
      }

      if (engRate && engRate > 3) {
        notifications.push({
          id: 'insight-eng',
          icon: 'insight',
          title: 'Strong Engagement',
          body: `Your ${engRate}% engagement rate is above the creator average. Your audience is highly active.`,
          time: 'Today',
          read: false,
        });
      }
    }
  } catch { /* ignore */ }

  // Always show a tip
  const tips = [
    { title: 'Posting Tip', body: 'Posts with 3-5 hashtags tend to get the best reach. Avoid over-tagging.' },
    { title: 'Best Time to Post', body: 'Most creator audiences are active 6-9 PM local time. Try scheduling around then.' },
    { title: 'Media Kit Reminder', body: 'Keep your media kit updated with fresh stats — brands check engagement rates first.' },
    { title: 'Content Mix', body: 'Mix carousel posts with reels for maximum algorithmic reach on Instagram.' },
  ];
  const tipIdx = now.getDate() % tips.length;
  notifications.push({
    id: 'tip-daily',
    icon: 'tip',
    title: tips[tipIdx].title,
    body: tips[tipIdx].body,
    time: 'Daily tip',
    read: false,
  });

  return notifications;
}

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (open) {
      setNotifications(generateNotifications());
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 safe-area-top">
        <div className="bg-armadillo-card border-b border-armadillo-border rounded-b-2xl shadow-2xl max-h-[70vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-armadillo-card/95 backdrop-blur-sm flex items-center justify-between px-4 py-3 border-b border-armadillo-border">
            <h2 className="font-display text-lg text-armadillo-text">Notifications</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-armadillo-bg flex items-center justify-center text-armadillo-muted active:scale-90 transition-transform"
            >
              <X size={16} />
            </button>
          </div>

          {/* Notification list */}
          <div className="divide-y divide-armadillo-border/50">
            {notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-armadillo-muted">
                No notifications yet. Keep posting!
              </div>
            )}
            {notifications.map((notif) => {
              const Icon = ICON_MAP[notif.icon];
              const colorClass = ICON_COLORS[notif.icon];
              return (
                <div key={notif.id} className="flex gap-3 px-4 py-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-armadillo-text">{notif.title}</span>
                      <span className="text-[10px] text-armadillo-muted ml-2 shrink-0">{notif.time}</span>
                    </div>
                    <p className="text-xs text-armadillo-muted mt-0.5 leading-relaxed">{notif.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
