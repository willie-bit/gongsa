import { API_CONFIG } from './config';
import type { ApiChatResponse, ConstructionProject } from '../types/construction';

const headers = {
  'Authorization': `Bearer ${API_CONFIG.apiKey}`,
  'Content-Type': 'application/json',
};

export async function sendChatMessage(
  query: string,
  conversationId?: string,
): Promise<ApiChatResponse> {
  const response = await fetch(`${API_CONFIG.baseUrl}/chat-messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      inputs: {},
      query,
      response_mode: 'blocking',
      conversation_id: conversationId || '',
      user: 'dashboard-user',
    }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function fetchConstructionData(
  query: string = '현재 등록된 공사 데이터를 JSON 형식으로 모두 보여주세요. 공사 종류, 규모, 예산, 특징, 기술적 요구사항을 포함해주세요.',
): Promise<ConstructionProject[]> {
  const response = await sendChatMessage(query);
  return parseConstructionData(response.answer);
}

function parseConstructionData(answer: string): ConstructionProject[] {
  try {
    // Try to extract JSON from the response
    const jsonMatch = answer.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return normalizeProjects(parsed);
    }

    // Try parsing the whole answer as JSON
    const parsed = JSON.parse(answer);
    if (Array.isArray(parsed)) {
      return normalizeProjects(parsed);
    }
    if (parsed.data && Array.isArray(parsed.data)) {
      return normalizeProjects(parsed.data);
    }
    if (parsed.projects && Array.isArray(parsed.projects)) {
      return normalizeProjects(parsed.projects);
    }

    return [];
  } catch {
    console.warn('Failed to parse construction data from API response:', answer);
    return [];
  }
}

function normalizeProjects(raw: Record<string, unknown>[]): ConstructionProject[] {
  return raw.map((item, index) => ({
    id: String(item.id || `project-${index + 1}`),
    name: String(item.name || item['공사명'] || item.title || '미정'),
    type: String(item.type || item['공사종류'] || item['종류'] || item.category || '미분류'),
    scale: String(item.scale || item['규모'] || item.size || '미정'),
    budget: String(item.budget || item['예산'] || item.cost || '미정'),
    features: toStringArray(item.features || item['특징'] || item.characteristics || []),
    technicalRequirements: toStringArray(
      item.technicalRequirements ||
      item.technical_requirements ||
      item['기술적요구사항'] ||
      item['기술요구사항'] ||
      [],
    ),
    location: String(item.location || item['위치'] || item['지역'] || ''),
    period: String(item.period || item['공사기간'] || item['기간'] || ''),
    status: String(item.status || item['상태'] || item['진행상태'] || ''),
    description: String(item.description || item['설명'] || item['상세설명'] || ''),
  }));
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}
