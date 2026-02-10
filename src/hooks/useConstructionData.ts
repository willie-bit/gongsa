import { useState, useCallback } from 'react';
import type { ConstructionProject } from '../types/construction';
import { fetchConstructionData } from '../api/client';
import { SAMPLE_PROJECTS } from '../api/sampleData';

interface UseConstructionDataReturn {
  projects: ConstructionProject[];
  loading: boolean;
  error: string | null;
  usingSample: boolean;
  fetchData: (query?: string) => Promise<void>;
  loadSampleData: () => void;
}

export function useConstructionData(): UseConstructionDataReturn {
  const [projects, setProjects] = useState<ConstructionProject[]>(SAMPLE_PROJECTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingSample, setUsingSample] = useState(true);

  const fetchData = useCallback(async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConstructionData(query);
      if (data.length > 0) {
        setProjects(data);
        setUsingSample(false);
      } else {
        setError('API에서 데이터를 가져왔지만 파싱할 수 없습니다. 샘플 데이터를 표시합니다.');
        setProjects(SAMPLE_PROJECTS);
        setUsingSample(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'API 연결에 실패했습니다.';
      setError(`${message} 샘플 데이터를 표시합니다.`);
      setProjects(SAMPLE_PROJECTS);
      setUsingSample(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSampleData = useCallback(() => {
    setProjects(SAMPLE_PROJECTS);
    setUsingSample(true);
    setError(null);
  }, []);

  return { projects, loading, error, usingSample, fetchData, loadSampleData };
}
