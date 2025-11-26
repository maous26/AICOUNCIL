import { AgentId, Message } from '@/types';

export type OrchestrationStrategy =
  | 'parallel'      // All agents respond simultaneously
  | 'sequential'    // Agents respond in order, each seeing previous responses
  | 'debate'        // Multiple rounds where agents can challenge each other
  | 'voting'        // Agents vote on best response after initial round
  | 'consensus';    // Iterative refinement until agreement

export interface AgentPromptConfig {
  agentId: AgentId;
  systemPrompt: string;
  role: string;
  expertise: string[];
  priority: number;
  temperature?: number;
}

export interface OrchestrationConfig {
  strategy: OrchestrationStrategy;
  maxRounds?: number;
  consensusThreshold?: number;
  allowCritique?: boolean;
  requireUnanimous?: boolean;
}

export interface DebateRound {
  roundNumber: number;
  responses: AgentResponse[];
  critiques?: AgentCritique[];
  consensus?: string;
}

export interface AgentResponse {
  agentId: AgentId;
  content: string;
  confidence?: number;
  reasoning?: string;
  timestamp: number;
}

export interface AgentCritique {
  fromAgent: AgentId;
  toAgent: AgentId;
  critique: string;
  suggestion?: string;
}

export interface OrchestrationResult {
  strategy: OrchestrationStrategy;
  rounds: DebateRound[];
  finalConsensus: string;
  participatingAgents: AgentId[];
  metadata: {
    totalTokens?: number;
    duration: number;
    consensusReached: boolean;
  };
}

export interface ContextWindow {
  userQuery: string;
  conversationHistory: Message[];
  previousRounds: DebateRound[];
  sharedContext: Record<string, any>;
}
