import type { ConstructionProject } from '../types/construction';

interface StatsBarProps {
  projects: ConstructionProject[];
}

export function StatsBar({ projects }: StatsBarProps) {
  const typeCount = new Set(projects.map((p) => p.type)).size;
  const totalBudget = projects.reduce((sum, p) => {
    const match = p.budget.match(/[\d,.]+/);
    if (match) return sum + parseFloat(match[0].replace(/,/g, ''));
    return sum;
  }, 0);

  const statusCounts = projects.reduce<Record<string, number>>((acc, p) => {
    const status = p.status || '미정';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const stats = [
    { label: '총 프로젝트', value: `${projects.length}건`, color: 'bg-blue-500' },
    { label: '공사 유형', value: `${typeCount}종`, color: 'bg-indigo-500' },
    { label: '총 예산 규모', value: `₩ ${totalBudget.toLocaleString()}억`, color: 'bg-emerald-500' },
    { label: '진행 현황', value: Object.entries(statusCounts).map(([k, v]) => `${k} ${v}`).join(' / '), color: 'bg-amber-500' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-10 rounded-full ${stat.color}`} />
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
