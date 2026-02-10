import { useState } from 'react';
import type { ConstructionProject } from '../types/construction';

interface ProjectCardProps {
  project: ConstructionProject;
}

const TYPE_COLORS: Record<string, string> = {
  '토목공사': 'bg-orange-100 text-orange-800 border-orange-200',
  '건축공사': 'bg-blue-100 text-blue-800 border-blue-200',
  '항만공사': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  '철도/교통공사': 'bg-purple-100 text-purple-800 border-purple-200',
  '전기/에너지공사': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  '환경/플랜트공사': 'bg-green-100 text-green-800 border-green-200',
};

const STATUS_COLORS: Record<string, string> = {
  '진행중': 'bg-green-50 text-green-700 border-green-200',
  '시공중': 'bg-green-50 text-green-700 border-green-200',
  '설계완료': 'bg-blue-50 text-blue-700 border-blue-200',
  '착공준비': 'bg-amber-50 text-amber-700 border-amber-200',
  '허가완료': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  '실시설계': 'bg-violet-50 text-violet-700 border-violet-200',
};

export function ProjectCard({ project }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);

  const typeColor = TYPE_COLORS[project.type] || 'bg-slate-100 text-slate-800 border-slate-200';
  const statusColor = STATUS_COLORS[project.status || ''] || 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${typeColor}`}>
                {project.type}
              </span>
              {project.status && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${statusColor}`}>
                  {project.status}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              {project.name}
            </h3>
          </div>
        </div>

        {project.description && (
          <p className="text-sm text-slate-500 mt-2 line-clamp-2">{project.description}</p>
        )}
      </div>

      {/* Info Grid */}
      <div className="px-5 pb-4 grid grid-cols-2 gap-3">
        <InfoItem icon="📐" label="규모" value={project.scale} />
        <InfoItem icon="💰" label="예산" value={project.budget} highlight />
        {project.location && <InfoItem icon="📍" label="위치" value={project.location} />}
        {project.period && <InfoItem icon="📅" label="기간" value={project.period} />}
      </div>

      {/* Features & Tech Requirements */}
      <div className="border-t border-slate-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-5 py-3 flex items-center justify-between text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <span>특징 및 기술적 요구사항</span>
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded && (
          <div className="px-5 pb-5 space-y-4">
            {/* Features */}
            {project.features.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  주요 특징
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {project.features.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Requirements */}
            {project.technicalRequirements.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  기술적 요구사항
                </h4>
                <ul className="space-y-1.5">
                  {project.technicalRequirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-base mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className={`text-sm font-semibold leading-snug ${highlight ? 'text-blue-700' : 'text-slate-800'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
