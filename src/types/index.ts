export interface Conversation {
  id: string;
  title: string;
  timestamp: number;
  messages: Message[];
}

export type AgentId = 'perplexity' | 'gemini' | 'gpt' | 'claude' | 'user';

export interface Agent {
  id: AgentId;
  name: string;
  role: string;
  color: string;
  avatar: string;
  description: string;
}

export interface Message {
  id: string;
  agentId: AgentId;
  content: string;
  timestamp: number;
  isThinking?: boolean; // For showing loading state
  roundNumber?: number; // For debate/multi-round strategies
  metadata?: {
    reasoning?: string;
    confidence?: number;
    sources?: string[];
    strategy?: string;
    rounds?: number;
    duration?: number;
  };
}

export interface CouncilState {
  messages: Message[];
  isDebating: boolean;
  consensusReached: boolean;
}
