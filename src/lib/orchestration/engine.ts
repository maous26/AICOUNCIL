import {
  OrchestrationStrategy,
  OrchestrationConfig,
  OrchestrationResult,
  DebateRound,
  AgentResponse,
  ContextWindow,
  AgentCritique
} from './types';
import { AGENT_PROMPTS, buildContextPrompt, ORCHESTRATION_PROMPTS } from './prompts';
import { AgentId, Message } from '@/types';

export class OrchestrationEngine {
  private config: OrchestrationConfig;

  constructor(config: OrchestrationConfig) {
    this.config = {
      maxRounds: 1,
      consensusThreshold: 0.8,
      allowCritique: false,
      requireUnanimous: false,
      ...config
    };
  }

  async orchestrate(
    userQuery: string,
    conversationHistory: Message[],
    agentExecutor: (agentId: AgentId, prompt: string, systemPrompt: string) => Promise<string>
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const agents: AgentId[] = ['perplexity', 'gemini', 'gpt', 'claude'];

    const context: ContextWindow = {
      userQuery,
      conversationHistory,
      previousRounds: [],
      sharedContext: {}
    };

    const rounds: DebateRound[] = [];

    switch (this.config.strategy) {
      case 'parallel':
        rounds.push(await this.executeParallel(agents, context, agentExecutor));
        break;

      case 'sequential':
        rounds.push(await this.executeSequential(agents, context, agentExecutor));
        break;

      case 'debate':
        for (let i = 0; i < (this.config.maxRounds || 2); i++) {
          const round = await this.executeDebateRound(agents, context, i + 1, agentExecutor);
          rounds.push(round);
          context.previousRounds.push(round);
        }
        break;

      case 'voting':
        const initialRound = await this.executeParallel(agents, context, agentExecutor);
        rounds.push(initialRound);
        const votingRound = await this.executeVoting(agents, initialRound, agentExecutor);
        rounds.push(votingRound);
        break;

      case 'consensus':
        rounds.push(...await this.executeConsensusRounds(agents, context, agentExecutor));
        break;

      default:
        rounds.push(await this.executeParallel(agents, context, agentExecutor));
    }

    // Generate final consensus
    const finalConsensus = await this.generateFinalConsensus(rounds, agentExecutor);

    return {
      strategy: this.config.strategy,
      rounds,
      finalConsensus,
      participatingAgents: agents,
      metadata: {
        duration: Date.now() - startTime,
        consensusReached: true
      }
    };
  }

  private async executeParallel(
    agents: AgentId[],
    context: ContextWindow,
    executor: (agentId: AgentId, prompt: string, systemPrompt: string) => Promise<string>
  ): Promise<DebateRound> {
    const prompt = buildContextPrompt(context.userQuery, []);

    const responses = await Promise.all(
      agents.map(async (agentId) => {
        const config = AGENT_PROMPTS[agentId];
        const content = await executor(agentId, prompt, config.systemPrompt);

        return {
          agentId,
          content,
          timestamp: Date.now()
        } as AgentResponse;
      })
    );

    return {
      roundNumber: 1,
      responses
    };
  }

  private async executeSequential(
    agents: AgentId[],
    context: ContextWindow,
    executor: (agentId: AgentId, prompt: string, systemPrompt: string) => Promise<string>
  ): Promise<DebateRound> {
    const responses: AgentResponse[] = [];

    for (const agentId of agents) {
      const config = AGENT_PROMPTS[agentId];
      const previousResponses = responses.map(r => ({
        agent: r.agentId,
        content: r.content
      }));

      const prompt = buildContextPrompt(context.userQuery, previousResponses);
      const content = await executor(agentId, prompt, config.systemPrompt);

      responses.push({
        agentId,
        content,
        timestamp: Date.now()
      });
    }

    return {
      roundNumber: 1,
      responses
    };
  }

  private async executeDebateRound(
    agents: AgentId[],
    context: ContextWindow,
    roundNumber: number,
    executor: (agentId: AgentId, prompt: string, systemPrompt: string) => Promise<string>
  ): Promise<DebateRound> {
    const previousRoundsContext = context.previousRounds
      .map(round =>
        `Round ${round.roundNumber}:\n` +
        round.responses.map(r => `[${r.agentId}]: ${r.content}`).join('\n\n')
      )
      .join('\n\n---\n\n');

    const responses: AgentResponse[] = [];

    for (const agentId of agents) {
      const config = AGENT_PROMPTS[agentId];
      const previousResponses = responses.map(r => ({
        agent: r.agentId,
        content: r.content
      }));

      let systemPrompt = config.systemPrompt;
      if (roundNumber > 1 || previousResponses.length > 0) {
        systemPrompt += '\n\n' + ORCHESTRATION_PROMPTS.DEBATE_ROUND_SYSTEM(
          roundNumber,
          previousRoundsContext
        );
      }

      const prompt = buildContextPrompt(context.userQuery, previousResponses, roundNumber);
      const content = await executor(agentId, prompt, systemPrompt);

      responses.push({
        agentId,
        content,
        timestamp: Date.now()
      });
    }

    // Generate critiques if enabled
    let critiques: AgentCritique[] | undefined;
    if (this.config.allowCritique && roundNumber < (this.config.maxRounds || 2)) {
      critiques = await this.generateCritiques(agents, responses, executor);
    }

    return {
      roundNumber,
      responses,
      critiques
    };
  }

  private async executeVoting(
    agents: AgentId[],
    initialRound: DebateRound,
    executor: (agentId: AgentId, prompt: string, systemPrompt: string) => Promise<string>
  ): Promise<DebateRound> {
    const responsesForVoting = initialRound.responses.map(r => ({
      agent: r.agentId,
      response: r.content
    }));

    const votingPrompt = ORCHESTRATION_PROMPTS.VOTING_SYSTEM(responsesForVoting);

    const votes = await Promise.all(
      agents.map(async (agentId) => {
        const config = AGENT_PROMPTS[agentId];
        const vote = await executor(agentId, votingPrompt, config.systemPrompt);

        return {
          agentId,
          content: vote,
          timestamp: Date.now()
        } as AgentResponse;
      })
    );

    return {
      roundNumber: 2,
      responses: votes
    };
  }

  private async executeConsensusRounds(
    agents: AgentId[],
    context: ContextWindow,
    executor: (agentId: AgentId, prompt: string, systemPrompt: string) => Promise<string>
  ): Promise<DebateRound[]> {
    const rounds: DebateRound[] = [];
    const maxRounds = this.config.maxRounds || 3;

    for (let i = 0; i < maxRounds; i++) {
      const round = await this.executeDebateRound(agents, context, i + 1, executor);
      rounds.push(round);
      context.previousRounds.push(round);

      // Check for consensus (simplified - could be more sophisticated)
      if (i > 0 && this.checkConsensus(round)) {
        break;
      }
    }

    return rounds;
  }

  private checkConsensus(round: DebateRound): boolean {
    // Simplified consensus check
    // In a real implementation, you might use similarity metrics or voting
    return round.roundNumber >= 2;
  }

  private async generateCritiques(
    agents: AgentId[],
    responses: AgentResponse[],
    executor: (agentId: AgentId, prompt: string, systemPrompt: string) => Promise<string>
  ): Promise<AgentCritique[]> {
    const critiques: AgentCritique[] = [];

    for (const response of responses) {
      // Each agent critiques others (simplified - you might want round-robin)
      const otherAgents = agents.filter(a => a !== response.agentId);
      const critic = otherAgents[0]; // Simplified: just use first other agent

      if (critic) {
        const config = AGENT_PROMPTS[critic];
        const critiquePrompt = ORCHESTRATION_PROMPTS.CRITIQUE_SYSTEM(
          response.agentId,
          response.content
        );

        const critique = await executor(critic, critiquePrompt, config.systemPrompt);

        critiques.push({
          fromAgent: critic,
          toAgent: response.agentId,
          critique
        });
      }
    }

    return critiques;
  }

  private async generateFinalConsensus(
    rounds: DebateRound[],
    executor: (agentId: AgentId, prompt: string, systemPrompt: string) => Promise<string>
  ): Promise<string> {
    const allResponses = rounds
      .flatMap(round => round.responses)
      .map(r => `[${r.agentId.toUpperCase()}]:\n${r.content}`)
      .join('\n\n---\n\n');

    const consensusPrompt = ORCHESTRATION_PROMPTS.CONSENSUS_SYSTEM(allResponses);

    // Use GPT-4 as the consensus builder
    const config = AGENT_PROMPTS.gpt;
    return await executor('gpt', consensusPrompt, config.systemPrompt);
  }
}

export function createOrchestrator(strategy: OrchestrationStrategy): OrchestrationEngine {
  const configs: Record<OrchestrationStrategy, OrchestrationConfig> = {
    parallel: {
      strategy: 'parallel',
      maxRounds: 1
    },
    sequential: {
      strategy: 'sequential',
      maxRounds: 1
    },
    debate: {
      strategy: 'debate',
      maxRounds: 2,
      allowCritique: true
    },
    voting: {
      strategy: 'voting',
      maxRounds: 2
    },
    consensus: {
      strategy: 'consensus',
      maxRounds: 3,
      allowCritique: true,
      consensusThreshold: 0.8
    }
  };

  return new OrchestrationEngine(configs[strategy]);
}
