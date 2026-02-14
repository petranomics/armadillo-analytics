import { ArrowUp, ArrowDown } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
}

export default function KpiCard({ label, value, trend, trendLabel, icon }: KpiCardProps) {
  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium tracking-wider uppercase text-armadillo-muted">{label}</span>
        {icon && <span className="text-armadillo-muted">{icon}</span>}
      </div>
      <div className="font-display text-2xl text-armadillo-text mb-1">{value}</div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
          {trend >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          <span>{Math.abs(trend)}%</span>
          {trendLabel && <span className="text-armadillo-muted ml-1">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
