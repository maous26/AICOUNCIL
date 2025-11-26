# AI Council Orchestration System

This document explains the advanced orchestration system that coordinates multiple AI agents to produce comprehensive answers.

## Overview

The orchestration system manages how 4 specialized AI agents (Perplexity, Gemini, GPT-4, Claude) collaborate to answer user queries. Different orchestration strategies produce different types of interactions and outputs.

## Architecture

### Core Components

1. **Orchestration Engine** (`src/lib/orchestration/engine.ts`)
   - Coordinates agent execution based on selected strategy
   - Manages multi-round debates
   - Handles error recovery and retries
   - Synthesizes final consensus

2. **Agent Clients** (`src/lib/agents/clients.ts`)
   - Interfaces with external AI APIs
   - Handles authentication and API calls
   - Implements retry logic and error handling

3. **Prompt Management** (`src/lib/orchestration/prompts.ts`)
   - Defines role-specific system prompts
   - Builds context-aware prompts
   - Manages debate and consensus prompts

## Orchestration Strategies

### 1. Parallel Strategy
**Use Case**: Quick answers requiring multiple perspectives

**How it works**:
- All 4 agents receive the query simultaneously
- Each responds independently without seeing others' responses
- GPT-4 synthesizes all responses into consensus

**Pros**:
- Fastest execution (agents run concurrently)
- Independent perspectives reduce bias
- Good for straightforward questions

**Cons**:
- No inter-agent context sharing
- May have redundant or contradictory information

**Example**:
```typescript
User: "What are the benefits of exercise?"
→ Perplexity: [Factual health data]
→ Gemini: [Analysis of benefits]
→ GPT-4: [Strategic recommendations]
→ Claude: [Ethical considerations]
→ Consensus: [Synthesized answer]
```

### 2. Sequential Strategy
**Use Case**: Complex questions requiring deep analysis

**How it works**:
- Agents execute in order: Perplexity → Gemini → GPT-4 → Claude
- Each agent sees all previous responses
- Builds upon and refines earlier contributions
- GPT-4 creates final consensus

**Pros**:
- Deep contextual understanding
- Each agent builds on previous insights
- Reduces redundancy

**Cons**:
- Slower execution (sequential processing)
- Later agents have more context than earlier ones

**Example**:
```typescript
User: "How should we address climate change?"
→ Perplexity: Facts about current climate situation
→ Gemini: Analysis of trends + Perplexity's data
→ GPT-4: Strategies based on facts + analysis
→ Claude: Ethical review of all perspectives
→ Consensus: Comprehensive synthesized answer
```

### 3. Debate Strategy
**Use Case**: Complex topics benefiting from critique and refinement

**How it works**:
- Round 1: All agents provide initial responses (sequential)
- Round 2: Agents see Round 1 and refine/challenge ideas
- Optional critiques between rounds
- GPT-4 synthesizes both rounds

**Pros**:
- Iterative refinement
- Agents can challenge assumptions
- More thorough exploration

**Cons**:
- Slower (multiple rounds)
- More API costs

**Example**:
```typescript
User: "Is AI alignment solvable?"

Round 1:
→ Perplexity: Current research state
→ Gemini: Technical analysis
→ GPT-4: Strategic assessment
→ Claude: Ethical implications

Round 2 (seeing Round 1):
→ Perplexity: Updated facts challenging assumptions
→ Gemini: Deeper analysis addressing gaps
→ GPT-4: Refined strategy considering critiques
→ Claude: Additional ethical concerns

→ Consensus: Multi-faceted synthesized answer
```

### 4. Voting Strategy
**Use Case**: When you want agents to evaluate and select best response

**How it works**:
- Round 1: All agents provide initial answers (parallel)
- Round 2: Each agent votes on the best response with reasoning
- GPT-4 synthesizes votes and creates consensus

**Pros**:
- Democratic selection process
- Agents evaluate quality
- Meta-reasoning about solutions

**Cons**:
- May lose nuance from non-selected responses
- Voting criteria can be subjective

**Example**:
```typescript
User: "Best programming language for beginners?"

Round 1 (Responses):
→ Perplexity: Python (most popular)
→ Gemini: JavaScript (web opportunities)
→ GPT-4: Python (versatile)
→ Claude: Depends on goals

Round 2 (Votes):
→ Each agent evaluates all responses
→ Votes tallied with reasoning
→ Consensus: Nuanced answer considering all votes
```

### 5. Consensus Strategy
**Use Case**: Nuanced topics requiring careful deliberation

**How it works**:
- Multiple rounds (up to 3) of sequential responses
- Each round agents refine based on convergence
- Stops early if consensus detected
- GPT-4 creates final synthesis

**Pros**:
- Most thorough exploration
- Iterative convergence
- Handles complex, nuanced topics

**Cons**:
- Slowest execution
- Highest API costs
- May over-analyze simple questions

**Example**:
```typescript
User: "Should we regulate AI development?"

Round 1: Initial perspectives
Round 2: Refinement based on Round 1
Round 3: Final convergence (if needed)
→ Consensus: Carefully deliberated answer
```

## Agent Specializations

### Perplexity (Fact Checker)
- **Role**: Information retrieval and verification
- **Temperature**: 0.3 (factual, precise)
- **Focus**: Real-time data, sources, accuracy
- **Prompt Engineering**: Emphasizes citations and evidence

### Gemini (Analyst)
- **Role**: Deep analysis and pattern recognition
- **Temperature**: 0.5 (balanced)
- **Focus**: Connections, frameworks, systems thinking
- **Prompt Engineering**: Structured analytical approach

### GPT-4 (Strategist)
- **Role**: Creative solutions and synthesis
- **Temperature**: 0.7 (creative)
- **Focus**: Actionable strategies, innovation
- **Prompt Engineering**: Solution-oriented with trade-offs

### Claude (Ethicist)
- **Role**: Ethical review and nuanced perspective
- **Temperature**: 0.6 (thoughtful)
- **Focus**: Ethics, risks, fairness, long-term thinking
- **Prompt Engineering**: Balanced, considers stakeholders

## Prompt Engineering Techniques

### Context Building
```typescript
// Sequential: Each agent sees previous responses
const prompt = `
USER QUERY: "${userQuery}"

PREVIOUS AGENT RESPONSES:
[Perplexity]: ${perplexityResponse}
[Gemini]: ${geminiResponse}

Now provide your perspective as GPT-4...
`;
```

### Debate Rounds
```typescript
// Multi-round with history
const prompt = `
This is ROUND 2 of the debate.

ROUND 1 RESPONSES:
[All agent responses from round 1]

Based on Round 1, refine your position or challenge others...
`;
```

### Consensus Building
```typescript
// Final synthesis
const prompt = `
Synthesize these perspectives into a unified answer:

[Perplexity]: ${factualData}
[Gemini]: ${analysis}
[GPT-4]: ${strategy}
[Claude]: ${ethics}

Create a comprehensive response that:
1. Integrates all perspectives
2. Resolves contradictions
3. Provides actionable insights
`;
```

## API Integration

### OpenRouter (GPT-4, Claude)
```typescript
fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'openai/gpt-4o', // or 'anthropic/claude-3.5-sonnet'
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  })
});
```

### Perplexity
```typescript
fetch('https://api.perplexity.ai/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'sonar-pro',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  })
});
```

### Google Gemini
```typescript
fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ parts: [{ text: userPrompt }] }]
  })
});
```

## Error Handling

### Retry Logic
```typescript
async function executeAgent(agentId, prompt, systemPrompt, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await client.execute(prompt, systemPrompt);
    } catch (error) {
      if (attempt === maxRetries) {
        return `[${agentId.toUpperCase()} ERROR: Unable to generate response]`;
      }
      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}
```

### Graceful Degradation
- If one agent fails, others continue
- Error messages are clearly marked
- Consensus still generated from available responses

## Performance Optimization

### Parallel Execution
```typescript
// Run independent agents concurrently
const responses = await Promise.all(
  agents.map(agent => executeAgent(agent, prompt, systemPrompt))
);
```

### Request Caching
- Conversation history cached in localStorage
- Reduces redundant context building

### Streaming (Future)
```typescript
// Planned: Real-time streaming responses
const stream = await fetch('/api/chat', {
  body: JSON.stringify({ stream: true })
});
```

## Usage Examples

### Basic Usage
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Explain quantum computing",
    strategy: "sequential"
  })
});

const { content } = await response.json();
```

### Full Debate Mode
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: "Should we colonize Mars?",
    strategy: "debate",
    returnFullDebate: true
  })
});

const { rounds, consensus } = await response.json();
// rounds[0].responses[0] = Perplexity's Round 1 response
// rounds[1].responses[0] = Perplexity's Round 2 response
// consensus = Final synthesized answer
```

## Best Practices

1. **Choose Strategy Based on Question Type**
   - Simple factual: Parallel
   - Complex analysis: Sequential
   - Controversial topics: Debate or Consensus
   - Decision-making: Voting

2. **Optimize for Cost vs Quality**
   - Parallel: Cheapest
   - Sequential: Moderate
   - Debate/Consensus: Most expensive

3. **Monitor API Usage**
   - Track token consumption
   - Implement rate limiting
   - Cache common queries

4. **Prompt Engineering**
   - Keep system prompts concise but clear
   - Provide sufficient context
   - Use structured output formats

## Extending the System

### Adding New Strategies
1. Define strategy in `types.ts`
2. Implement in `engine.ts`
3. Add UI option in `ChatInterface.tsx`

### Custom Agent Roles
1. Define in `prompts.ts`
2. Create API client in `clients.ts`
3. Update agent selection logic

### Advanced Features
- Agent weighting based on expertise
- Dynamic strategy selection
- Multi-language support
- Custom temperature controls
