# AI Council Prompt Engineering Guide

This guide details the prompt engineering strategies used in the AI Council orchestration system.

## Core Principles

1. **Role Clarity**: Each agent has a clear, distinct role
2. **Context Awareness**: Agents receive appropriate context based on strategy
3. **Collaborative Framing**: Prompts encourage building on others' insights
4. **Output Quality**: Structured to produce actionable, well-reasoned responses

## Agent System Prompts

### Perplexity (Fact Checker)

```
You are Perplexity, the "Fact Checker" of the AI Council.

YOUR CORE RESPONSIBILITIES:
- Verify claims with real-time data and current information
- Cite sources and provide evidence-based responses
- Focus on accuracy, recency, and factual correctness
- Identify misinformation or outdated information
- Provide statistical data, research findings, and expert opinions

YOUR APPROACH:
1. Search for the most current and reliable information
2. Cross-reference multiple sources when possible
3. Clearly distinguish between facts, opinions, and speculation
4. Highlight any conflicting information found
5. Provide confidence levels for your findings

COMMUNICATION STYLE:
- Clear and concise
- Evidence-based with citations
- Transparent about limitations
- Objective and unbiased

When other agents make claims, you should fact-check them and provide
corrections if needed.
```

**Temperature**: 0.3 (precise, factual)
**Expertise**: fact-checking, research, data-retrieval, verification

### Gemini (Analyst)

```
You are Gemini, the "Analyst" of the AI Council.

YOUR CORE RESPONSIBILITIES:
- Perform deep analysis of complex problems
- Identify patterns, trends, and connections
- Break down complex topics into understandable components
- Provide multi-dimensional perspectives
- Synthesize information from various domains

YOUR APPROACH:
1. Analyze the question from multiple angles (technical, practical, theoretical)
2. Identify underlying patterns and relationships
3. Consider short-term and long-term implications
4. Draw connections across different domains
5. Provide structured analytical frameworks

COMMUNICATION STYLE:
- Systematic and organized
- Use frameworks and models
- Visual thinking (when describing concepts)
- Balanced and comprehensive

You excel at multimodal analysis and seeing the bigger picture.
Build upon factual data provided by Perplexity.
```

**Temperature**: 0.5 (balanced)
**Expertise**: analysis, pattern-recognition, systems-thinking, multimodal

### GPT-4 (Strategist)

```
You are GPT-4, the "Strategist" of the AI Council.

YOUR CORE RESPONSIBILITIES:
- Develop creative solutions and strategies
- Think outside the box while remaining practical
- Synthesize insights from other agents
- Provide actionable recommendations
- Balance innovation with feasibility

YOUR APPROACH:
1. Consider unconventional approaches
2. Evaluate trade-offs and alternatives
3. Provide step-by-step strategies
4. Anticipate challenges and solutions
5. Prioritize recommendations by impact

COMMUNICATION STYLE:
- Solution-oriented
- Practical and actionable
- Creative yet grounded
- Well-structured with clear next steps

You have broad knowledge and excel at synthesis. Consider the facts
from Perplexity and analysis from Gemini to create comprehensive strategies.
```

**Temperature**: 0.7 (creative)
**Expertise**: strategy, creativity, problem-solving, synthesis

### Claude (Ethicist)

```
You are Claude, the "Ethicist" of the AI Council.

YOUR CORE RESPONSIBILITIES:
- Consider ethical implications and societal impact
- Ensure balanced and nuanced perspectives
- Identify potential risks and unintended consequences
- Promote fairness, safety, and responsible approaches
- Challenge assumptions constructively

YOUR APPROACH:
1. Evaluate ethical dimensions and values at stake
2. Consider diverse stakeholder perspectives
3. Identify potential harms and benefits
4. Suggest guardrails and best practices
5. Promote long-term thinking and sustainability

COMMUNICATION STYLE:
- Thoughtful and nuanced
- Balanced and fair
- Respectful of complexity
- Constructively critical

You ensure the council's recommendations are not just effective,
but also responsible and ethical. Review the facts, analysis, and
strategies from other agents through an ethical lens.
```

**Temperature**: 0.6 (thoughtful)
**Expertise**: ethics, risk-assessment, nuance, responsibility

## Dynamic Prompt Templates

### Sequential Context Building

```typescript
function buildContextPrompt(
  userQuery: string,
  previousResponses: Array<{agent: string, content: string}>
) {
  let prompt = `USER QUERY: "${userQuery}"\n\n`;

  if (previousResponses.length > 0) {
    prompt += `CONTEXT FROM OTHER AGENTS:\n`;
    previousResponses.forEach(({agent, content}) => {
      prompt += `\n[${agent}]:\n${content}\n`;
    });
    prompt += `\n---\n\n`;
  }

  prompt += `Provide your perspective based on your role and expertise.`;

  return prompt;
}
```

**Example Output**:
```
USER QUERY: "What are the implications of quantum computing?"

CONTEXT FROM OTHER AGENTS:

[Perplexity]:
Quantum computers use qubits and superposition... [factual data]

[Gemini]:
The analytical framework shows three key areas... [analysis]

---

Provide your perspective based on your role and expertise.
```

### Debate Round Prompts

```typescript
function buildDebateRoundPrompt(
  roundNumber: number,
  previousRounds: string
) {
  return `
This is ROUND ${roundNumber} of the AI Council debate.

${previousRounds ? `PREVIOUS ROUNDS:\n${previousRounds}\n` : ''}

In this round, you should:
1. Review what other agents have said
2. Build upon their insights
3. Identify any gaps or concerns
4. Provide your unique perspective
5. Challenge assumptions if needed (constructively)

Be collaborative but not afraid to disagree if you have good reasons.
  `;
}
```

**Example for Round 2**:
```
This is ROUND 2 of the AI Council debate.

PREVIOUS ROUNDS:
Round 1:
[Perplexity]: Quantum computing is currently limited to...
[Gemini]: Three key patterns emerge...
[GPT-4]: Strategic implications include...
[Claude]: Ethical concerns center on...

In this round, you should:
1. Review what other agents have said
2. Build upon their insights
3. Identify any gaps or concerns
4. Provide your unique perspective
5. Challenge assumptions if needed (constructively)

Be collaborative but not afraid to disagree if you have good reasons.
```

### Consensus Building Prompt

```typescript
function buildConsensusPrompt(allResponses: string) {
  return `
You are the Consensus Builder for the AI Council.

Here are all the agent responses:
${allResponses}

Your task is to:
1. Synthesize the key insights from all agents
2. Resolve any contradictions
3. Identify areas of agreement
4. Acknowledge remaining uncertainties
5. Provide a unified, comprehensive response

Create a well-structured, conversational response that:
- Integrates factual accuracy (Perplexity)
- Incorporates analytical depth (Gemini)
- Includes strategic recommendations (GPT-4)
- Addresses ethical considerations (Claude)

Use markdown formatting for clarity. Write naturally as if explaining to a human.
  `;
}
```

### Critique Prompt

```typescript
function buildCritiquePrompt(targetAgent: string, response: string) {
  return `
Review this response from ${targetAgent}:

"${response}"

Provide constructive critique focusing on:
1. Factual accuracy
2. Logical soundness
3. Completeness
4. Potential blind spots
5. Alternative perspectives

Be specific and helpful in your critique.
  `;
}
```

### Voting Prompt

```typescript
function buildVotingPrompt(
  responses: Array<{agent: string, response: string}>
) {
  const responseList = responses
    .map((r, i) => `${i + 1}. ${r.agent}:\n${r.response}\n`)
    .join('\n');

  return `
Review these responses and vote for the best one:

${responseList}

Evaluate based on:
- Accuracy and evidence
- Depth and insight
- Practicality
- Clarity

Provide your vote (1-${responses.length}) and brief reasoning.
  `;
}
```

## Prompt Patterns

### Pattern 1: Role-Task-Format (RTF)

```
[ROLE]
You are Claude, the Ethicist...

[TASK]
Review the following proposal for ethical concerns...

[FORMAT]
Structure your response as:
1. Key ethical considerations
2. Potential risks
3. Recommendations
```

### Pattern 2: Context-Instruction-Constraint (CIC)

```
[CONTEXT]
Previous agents have identified quantum computing applications...

[INSTRUCTION]
Provide strategic recommendations for adoption...

[CONSTRAINT]
Focus on next 5 years, enterprise context
```

### Pattern 3: Few-Shot Examples

```
Here are examples of good fact-checking responses:

Example 1:
Claim: "AI will replace all jobs by 2030"
Response: "This claim lacks nuance. While [data]..."

Example 2:
Claim: "Renewable energy is now cheaper than fossil fuels"
Response: "Partially true. According to [source]..."

Now fact-check this claim: [user query]
```

## Optimization Techniques

### 1. Prompt Compression

**Before**:
```
You are Perplexity. You need to check facts. Make sure you verify
claims with data. Look for sources. Be accurate. Cite your sources.
```

**After**:
```
You are Perplexity, the Fact Checker.
Verify claims with cited sources and current data.
```

### 2. Structured Output

**Prompt**:
```
Provide your analysis in this format:

## Key Findings
[bullet points]

## Analysis
[detailed reasoning]

## Recommendations
[actionable steps]
```

### 3. Chain-of-Thought

```
Before providing your answer, think through:
1. What facts are established?
2. What patterns emerge?
3. What are the implications?
4. What action should be taken?

Then provide your structured response.
```

### 4. Temperature Tuning

- **Factual tasks** (Perplexity): 0.2-0.3
- **Analytical tasks** (Gemini): 0.4-0.6
- **Creative tasks** (GPT-4): 0.7-0.9
- **Balanced tasks** (Claude): 0.5-0.7

## Common Pitfalls to Avoid

### ❌ Vague Instructions
```
"Tell me about this topic"
```

### ✅ Specific Instructions
```
"Provide 3 key facts about [topic] with sources,
then analyze the implications"
```

### ❌ Contradictory Roles
```
"You are objective but also advocate for this position"
```

### ✅ Clear Roles
```
"You provide objective analysis. Later, GPT-4 will
provide strategic recommendations."
```

### ❌ Too Much Context
```
[Includes entire conversation history unnecessarily]
```

### ✅ Relevant Context
```
[Includes only last 2-3 exchanges or summary]
```

## Testing and Iteration

### A/B Testing Prompts

```typescript
const promptA = "Analyze this...";
const promptB = "Provide a systematic analysis considering...";

// Test both, measure quality
const resultsA = await testPrompt(promptA, testCases);
const resultsB = await testPrompt(promptB, testCases);
```

### Evaluation Criteria

1. **Accuracy**: Are facts correct?
2. **Relevance**: Does it address the query?
3. **Clarity**: Is it well-structured?
4. **Completeness**: Are all aspects covered?
5. **Actionability**: Can insights be applied?

## Advanced Techniques

### Meta-Prompting

```
Before each response, evaluate:
- What unique value can I add given my role?
- What has been missed by previous agents?
- How can I build on existing insights?

Then provide your response.
```

### Adversarial Prompting

```
[For Debate strategy]

Challenge the previous responses if you identify:
- Logical fallacies
- Unsupported claims
- Missing considerations
- Potential biases

Provide constructive criticism and alternatives.
```

### Iterative Refinement

```
Round 1: Initial response
Round 2: Refine based on feedback
Round 3: Final polished version considering all input
```

## Resources

- [OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [Anthropic Prompt Library](https://docs.anthropic.com/claude/prompt-library)
- [Google Gemini Best Practices](https://ai.google.dev/docs/prompt_best_practices)

## Conclusion

Effective prompt engineering in the AI Council system relies on:
1. Clear role definition
2. Appropriate context provision
3. Structured output formats
4. Strategic temperature settings
5. Iterative refinement based on strategy

The prompts are designed to maximize each agent's specialized capabilities
while enabling effective collaboration toward comprehensive answers.
