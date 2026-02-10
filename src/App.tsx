import { useState } from 'react';
import { useConstructionData } from './hooks/useConstructionData';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { ProjectCard } from './components/ProjectCard';
import { ProjectTable } from './components/ProjectTable';
import { QueryPanel } from './components/QueryPanel';
import { ErrorBanner } from './components/ErrorBanner';

type ViewMode = 'cards' | 'table';

function App() {
  const { projects, loading, error, usingSample, fetchData, loadSampleData } = useConstructionData();
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const displayError = error || errorMsg;

  const handleFetch = async (query?: string) => {
    setErrorMsg(null);
    await fetchData(query);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Header
        onFetchData={() => handleFetch()}
        onLoadSample={loadSampleData}
        loading={loading}
        usingSample={usingSample}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Banner */}
        {displayError && (
          <ErrorBanner
            message={displayError}
            onDismiss={() => setErrorMsg(null)}
          />
        )}

        {/* Stats */}
        <StatsBar projects={projects} />

        {/* Query Panel */}
        <QueryPanel onQuery={(q) => handleFetch(q)} loading={loading} />

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            공사 프로젝트 ({projects.length}건)
          </h2>
          <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              카드 뷰
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              테이블 뷰
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-slate-500">API에서 데이터를 불러오는 중...</p>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && viewMode === 'cards' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {!loading && viewMode === 'table' && (
          <ProjectTable projects={projects} />
        )}

        {/* API Info Footer */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-2">API 연동 정보</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-500">
            <div>
              <span className="font-medium text-slate-600">Endpoint:</span>{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                https://api.holdings.miso.gs/ext/v1
              </code>
            </div>
            <div>
              <span className="font-medium text-slate-600">API Key:</span>{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                app-5N9l70h4wf...M3952R
              </code>
            </div>
            <div>
              <span className="font-medium text-slate-600">인증 방식:</span>{' '}
              Bearer Token (Authorization Header)
            </div>
            <div>
              <span className="font-medium text-slate-600">응답 형식:</span>{' '}
              JSON (공사 종류, 규모, 예산, 특징, 기술적 요구사항)
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
