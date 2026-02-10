import { useState } from 'react';

interface QueryPanelProps {
  onQuery: (query: string) => void;
  loading: boolean;
}

const PRESET_QUERIES = [
  { label: '전체 공사 조회', query: '등록된 모든 공사 데이터를 JSON 형식으로 보여주세요.' },
  { label: '토목공사만', query: '토목공사 관련 데이터만 JSON으로 보여주세요.' },
  { label: '100억 이상', query: '예산 100억 이상인 공사를 JSON으로 보여주세요.' },
  { label: '진행중 공사', query: '현재 진행중인 공사만 JSON으로 보여주세요.' },
];

export function QueryPanel({ onQuery, loading }: QueryPanelProps) {
  const [customQuery, setCustomQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customQuery.trim()) {
      onQuery(customQuery.trim());
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h2 className="text-base font-bold text-slate-900 mb-3">API 질의</h2>

      {/* Preset Queries */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESET_QUERIES.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onQuery(preset.query)}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Query */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          placeholder="공사 데이터에 대해 질의하세요..."
          className="flex-1 px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !customQuery.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          조회
        </button>
      </form>
    </div>
  );
}
