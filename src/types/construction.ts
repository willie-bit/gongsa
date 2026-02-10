export interface ConstructionProject {
  id: string;
  name: string;
  type: string;
  scale: string;
  budget: string;
  features: string[];
  technicalRequirements: string[];
  location?: string;
  period?: string;
  status?: string;
  description?: string;
}

export interface ApiChatResponse {
  event: string;
  message_id: string;
  conversation_id: string;
  answer: string;
  created_at: number;
  metadata?: {
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
}

export interface ApiStreamEvent {
  event: string;
  task_id?: string;
  id?: string;
  answer?: string;
  conversation_id?: string;
  message_id?: string;
  created_at?: number;
  metadata?: Record<string, unknown>;
}
