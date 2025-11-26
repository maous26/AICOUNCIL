/**
 * OpenRouter Council Preset Integration
 *
 * OpenRouter provides a @preset/council model that automatically
 * orchestrates multiple AI models and synthesizes their responses.
 * This is an alternative to our custom orchestration system.
 */

export interface OpenRouterCouncilConfig {
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call OpenRouter's @preset/council model
 * This preset automatically coordinates multiple models and returns a synthesized response
 */
export async function callOpenRouterCouncil(
  message: string,
  config: OpenRouterCouncilConfig
): Promise<string> {
  const apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OpenRouter API key is required');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      'X-Title': 'AI Council'
    },
    body: JSON.stringify({
      model: '@preset/council',
      messages: [
        {
          role: 'user',
          content: message
        }
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens,
      top_p: config.topP
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter Council API error: ${error}`);
  }

  const data: OpenRouterResponse = await response.json();
  return data.choices[0]?.message?.content || 'No response generated';
}

/**
 * Call with conversation history
 */
export async function callOpenRouterCouncilWithHistory(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  config: OpenRouterCouncilConfig
): Promise<string> {
  const apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OpenRouter API key is required');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      'X-Title': 'AI Council'
    },
    body: JSON.stringify({
      model: '@preset/council',
      messages,
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens,
      top_p: config.topP
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter Council API error: ${error}`);
  }

  const data: OpenRouterResponse = await response.json();
  return data.choices[0]?.message?.content || 'No response generated';
}

/**
 * Test the OpenRouter Council preset
 */
export async function testOpenRouterCouncil(): Promise<void> {
  try {
    console.log('Testing OpenRouter Council preset...');

    const response = await callOpenRouterCouncil(
      'Hello! How are you today?',
      {
        apiKey: process.env.OPENROUTER_API_KEY!,
        temperature: 0.7
      }
    );

    console.log('✅ OpenRouter Council Response:');
    console.log(response);
  } catch (error) {
    console.error('❌ Error testing OpenRouter Council:', error);
    throw error;
  }
}
