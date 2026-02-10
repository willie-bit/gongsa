import type { ConstructionProject } from '../types/construction';

interface ProjectTableProps {
  projects: ConstructionProject[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <h2 className="text-base font-bold text-slate-900">공사 현황 요약표</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">공사명</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">종류</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">규모</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">예산</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">위치</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">기간</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900 max-w-[200px] truncate">{project.name}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{project.type}</td>
                <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">{project.scale}</td>
                <td className="px-4 py-3 font-semibold text-blue-700 whitespace-nowrap">{project.budget}</td>
                <td className="px-4 py-3 text-slate-600 max-w-[150px] truncate">{project.location || '-'}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{project.period || '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={project.status || '미정'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    '진행중': 'bg-green-100 text-green-700',
    '시공중': 'bg-green-100 text-green-700',
    '설계완료': 'bg-blue-100 text-blue-700',
    '착공준비': 'bg-amber-100 text-amber-700',
    '허가완료': 'bg-indigo-100 text-indigo-700',
    '실시설계': 'bg-violet-100 text-violet-700',
  };
  const color = colors[status] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}
