import type { FaceStats } from '../hooks/useFaceDetection';
import { StatCounter } from './StatCounter';

interface StatsPanelProps {
  stats: FaceStats;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  const topExpression = Object.entries(stats.expressions).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="flex flex-wrap gap-4 justify-center mt-8">
      <StatCounter value={stats.count} label="Faces Detected" />
      
      {topExpression && (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl min-w-[140px]">
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-500 capitalize">
            {topExpression[0]}
          </div>
          <div className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-wider">
            Dominant Expr
          </div>
        </div>
      )}
    </div>
  );
}
