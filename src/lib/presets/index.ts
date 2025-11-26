import { OrchestrationStrategy } from '@/lib/orchestration/types';

/**
 * Preset configurations for common use cases
 * Use these to quickly configure the AI Council for specific scenarios
 */

export interface CouncilPreset {
  name: string;
  description: string;
  strategy: OrchestrationStrategy;
  showFullDebate: boolean;
  useCase: string;
  example: string;
}

export const COUNCIL_PRESETS: Record<string, CouncilPreset> = {
  // Quick Answer - Fast responses for straightforward questions
  quick: {
    name: 'Quick Answer',
    description: 'Fast parallel responses for straightforward questions',
    strategy: 'parallel',
    showFullDebate: false,
    useCase: 'General knowledge, quick facts, simple explanations',
    example: 'What are the benefits of exercise?'
  },

  // Deep Analysis - Thorough investigation of complex topics
  analysis: {
    name: 'Deep Analysis',
    description: 'Sequential context-building for complex topics',
    strategy: 'sequential',
    showFullDebate: false,
    useCase: 'Complex topics requiring thorough analysis',
    example: 'Analyze the implications of quantum computing on cryptography'
  },

  // Full Debate - See all perspectives in detail
  debate: {
    name: 'Full Debate',
    description: 'Multi-round discussion with visible agent responses',
    strategy: 'debate',
    showFullDebate: true,
    useCase: 'Controversial topics, decision-making, exploring trade-offs',
    example: 'Should we regulate AI development?'
  },

  // Best Answer - Democratic selection of optimal response
  vote: {
    name: 'Best Answer',
    description: 'Agents vote on the best response',
    strategy: 'voting',
    showFullDebate: false,
    useCase: 'Recommendations, choosing between options',
    example: 'What is the best programming language for beginners?'
  },

  // Consensus - Iterative refinement for nuanced topics
  consensus: {
    name: 'Consensus Building',
    description: 'Iterative refinement until agreement',
    strategy: 'consensus',
    showFullDebate: true,
    useCase: 'Nuanced ethical questions, policy decisions',
    example: 'What are the ethical considerations of gene editing?'
  },

  // Research Mode - Fact-focused with full transparency
  research: {
    name: 'Research Mode',
    description: 'Sequential analysis with full debate visibility',
    strategy: 'sequential',
    showFullDebate: true,
    useCase: 'Academic research, fact-checking, deep dives',
    example: 'What is the current state of fusion energy research?'
  },

  // Strategy Session - Solution-oriented deliberation
  strategy: {
    name: 'Strategy Session',
    description: 'Debate mode focused on strategic planning',
    strategy: 'debate',
    showFullDebate: false,
    useCase: 'Business planning, project strategy, problem-solving',
    example: 'How should a startup approach market entry?'
  },

  // Ethics Review - Thorough ethical examination
  ethics: {
    name: 'Ethics Review',
    description: 'Consensus-driven ethical analysis',
    strategy: 'consensus',
    showFullDebate: false,
    useCase: 'Ethical dilemmas, policy reviews, risk assessment',
    example: 'What are the ethical implications of facial recognition?'
  }
};

/**
 * Get a preset by name
 */
export function getPreset(presetName: string): CouncilPreset | undefined {
  return COUNCIL_PRESETS[presetName];
}

/**
 * Get all available presets
 */
export function getAllPresets(): CouncilPreset[] {
  return Object.values(COUNCIL_PRESETS);
}

/**
 * Apply a preset to your configuration
 * @example
 * const config = applyPreset('debate');
 * // Use config.strategy and config.showFullDebate in your API call
 */
export function applyPreset(presetName: string): {
  strategy: OrchestrationStrategy;
  showFullDebate: boolean;
} {
  const preset = getPreset(presetName);
  if (!preset) {
    console.warn(`Preset "${presetName}" not found. Using default.`);
    return {
      strategy: 'sequential',
      showFullDebate: false
    };
  }

  return {
    strategy: preset.strategy,
    showFullDebate: preset.showFullDebate
  };
}

/**
 * Get recommended preset based on query type
 */
export function getRecommendedPreset(query: string): string {
  const lowerQuery = query.toLowerCase();

  // Ethics-related keywords
  if (lowerQuery.match(/\b(ethical|ethics|moral|right|wrong|should we|fairness)\b/)) {
    return 'ethics';
  }

  // Strategy/business keywords
  if (lowerQuery.match(/\b(strategy|plan|approach|business|startup|market|growth)\b/)) {
    return 'strategy';
  }

  // Research keywords
  if (lowerQuery.match(/\b(research|study|current state|latest|findings|data)\b/)) {
    return 'research';
  }

  // Debate/controversy keywords
  if (lowerQuery.match(/\b(debate|controversial|pros and cons|advantages|disadvantages)\b/)) {
    return 'debate';
  }

  // Recommendation keywords
  if (lowerQuery.match(/\b(best|recommend|choose|which|compare|versus|vs)\b/)) {
    return 'vote';
  }

  // Complex analysis keywords
  if (lowerQuery.match(/\b(analyze|implications|impact|consequences|complex)\b/)) {
    return 'analysis';
  }

  // Default to quick for simple questions
  return 'quick';
}

// Export types
export type PresetName = keyof typeof COUNCIL_PRESETS;
