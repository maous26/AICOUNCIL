import { AgentId } from '@/types';
import { OPENROUTER_API_URL } from './config';

export interface AgentClientConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
}

export abstract class AgentClient {
  protected config: AgentClientConfig;

  constructor(config: AgentClientConfig) {
    this.config = config;
  }

  abstract execute(prompt: string, systemPrompt: string): Promise<string>;
}

// Perplexity Client
export class PerplexityClient extends AgentClient {
  async execute(prompt: string, systemPrompt: string): Promise<string> {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'sonar-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: this.config.temperature || 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Perplexity API error: ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response generated.';
  }
}

// Gemini Client (via OpenRouter - no Google API key needed!)
export class GeminiClient extends AgentClient {
  async execute(prompt: string, systemPrompt: string): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Council'
      },
      body: JSON.stringify({
        model: this.config.model || 'google/gemini-pro-1.5',
        messages: [
          { role: 'user', content: prompt }
        ],
        system: systemPrompt,
        temperature: this.config.temperature || 0.5,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response generated.';
  }
}

// GPT-4 Client (via OpenRouter)
export class GPTClient extends AgentClient {
  async execute(prompt: string, systemPrompt: string): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Council'
      },
      body: JSON.stringify({
        model: this.config.model || 'openai/gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: this.config.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GPT API error: ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response generated.';
  }
}

// Claude Client (via OpenRouter)
export class ClaudeClient extends AgentClient {
  async execute(prompt: string, systemPrompt: string): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Council'
      },
      body: JSON.stringify({
        model: this.config.model || 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'user', content: prompt }
        ],
        system: systemPrompt,
        temperature: this.config.temperature || 0.6,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response generated.';
  }
}

// Factory function to create appropriate client
export function createAgentClient(agentId: AgentId, temperature?: number): AgentClient {
  const config: AgentClientConfig = {
    apiKey: '', // Will be fetched from env in each client
    temperature
  };

  switch (agentId) {
    case 'perplexity':
      return new PerplexityClient(config);
    case 'gemini':
      return new GeminiClient(config);
    case 'gpt':
      return new GPTClient(config);
    case 'claude':
      return new ClaudeClient(config);
    default:
      throw new Error(`Unknown agent: ${agentId}`);
  }
}

// Execute agent with retry logic
export async function executeAgent(
  agentId: AgentId,
  prompt: string,
  systemPrompt: string,
  maxRetries: number = 2
): Promise<string> {
  const client = createAgentClient(agentId);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await client.execute(prompt, systemPrompt);
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`Failed to execute ${agentId} after ${maxRetries} retries:`, error);
        return `[${agentId.toUpperCase()} ERROR: Unable to generate response]`;
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  return `[${agentId.toUpperCase()} ERROR: Unable to generate response]`;
}
