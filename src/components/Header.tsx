interface HeaderProps {
  onFetchData: () => void;
  onLoadSample: () => void;
  loading: boolean;
  usingSample: boolean;
}

export function Header({ onFetchData, onLoadSample, loading, usingSample }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              공사 데이터 대시보드
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              공사 종류 / 규모 / 예산 / 특징 / 기술적 요구사항 종합 현황
            </p>
          </div>
          <div className="flex items-center gap-3">
            {usingSample && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                샘플 데이터
              </span>
            )}
            {!usingSample && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                API 연동
              </span>
            )}
            <button
              onClick={onLoadSample}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              샘플 데이터
            </button>
            <button
              onClick={onFetchData}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'API 조회중...' : 'API 데이터 조회'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
