# AI Council

A sophisticated multi-agent AI orchestration system where different AI models (Perplexity, Gemini, GPT-4, Claude) collaborate using various strategies to provide comprehensive, well-reasoned answers.

## Features

### Advanced Agent Orchestration
- **5 Orchestration Strategies**:
  - **Parallel**: All agents respond simultaneously for fast results
  - **Sequential**: Each agent builds upon previous responses for deeper context
  - **Debate**: Multiple rounds of discussion where agents can challenge each other
  - **Voting**: Agents evaluate and vote on the best response
  - **Consensus**: Iterative refinement until agents reach agreement

### Specialized AI Agents
Each agent has a distinct role and expertise:
- **Perplexity** (Fact Checker): Real-time data retrieval and factual verification
- **Gemini** (Analyst): Deep analysis and pattern recognition
- **GPT-4** (Strategist): Creative problem-solving and synthesis
- **Claude** (Ethicist): Ethical considerations and nuanced perspectives

### Smart Prompt Engineering
- Role-based system prompts for each agent
- Context-aware prompts that build upon previous responses
- Debate-specific prompts for multi-round discussions
- Consensus-building mechanisms

### Modern UI/UX
- Glassmorphism design with dark theme
- Real-time orchestration strategy selection
- Toggle between consensus view and full debate transcript
- Conversation history with localStorage persistence
- Responsive sidebar navigation

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules with CSS Variables
- **AI APIs**:
  - OpenRouter (GPT-4, Claude)
  - Perplexity AI
  - Google Generative AI (Gemini)

## Architecture

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # API endpoint with orchestration
│   ├── globals.css               # Global styles
│   └── page.tsx                  # Main page
├── components/
│   ├── ChatInterface.tsx         # Main chat UI
│   ├── ChatInterface.module.css  # Component styles
│   └── Sidebar.tsx               # Conversation sidebar
├── lib/
│   ├── agents/
│   │   ├── clients.ts            # AI API clients for each agent
│   │   └── config.ts             # API configuration
│   └── orchestration/
│       ├── engine.ts             # Orchestration engine
│       ├── prompts.ts            # Agent prompts and configurations
│       └── types.ts              # TypeScript interfaces
└── types/
    └── index.ts                  # Shared types
```

## Getting Started

### Prerequisites
- Node.js 18+
- API keys for:
  - OpenRouter (for GPT-4 and Claude)
  - Perplexity AI
  - Google Generative AI (Gemini)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd AIcouncil
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Add your API keys to `.env`:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-...
   PERPLEXITY_API_KEY=pplx-...
   GOOGLE_GENERATIVE_AI_API_KEY=AIza...
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Usage

### Selecting an Orchestration Strategy

Choose from 5 different strategies in the header:

1. **Parallel (Fast)**: Best for quick answers when you need multiple perspectives simultaneously
2. **Sequential (Builds Context)**: Best for complex questions requiring deep analysis
3. **Debate (2 Rounds)**: Best when you want agents to challenge and refine each other's ideas
4. **Voting (Best Answer)**: Best when you want agents to evaluate and select the strongest response
5. **Consensus (Iterative)**: Best for nuanced topics requiring careful deliberation

### Viewing Results

- **Consensus Mode** (default): See only the final synthesized answer
- **Full Debate Mode**: Enable "Show Full Debate" to see all agent responses organized by round

### API Usage

You can also use the API directly:

```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Your question here",
    strategy: "sequential", // or parallel, debate, voting, consensus
    returnFullDebate: false, // true to get all responses
    history: [] // optional conversation history
  })
});

const data = await response.json();
console.log(data.content); // Final consensus
```

## How It Works

### Orchestration Flow

1. **User Query**: User submits a question with selected strategy
2. **Strategy Execution**: Orchestration engine coordinates agents based on strategy
3. **Agent Responses**: Each agent processes the query using its specialized prompt
4. **Synthesis**: GPT-4 synthesizes all perspectives into a final consensus
5. **Delivery**: Result is formatted and displayed to the user

### Prompt Engineering

Each agent receives:
- A specialized system prompt defining its role
- The user's query
- Context from previous agent responses (in sequential/debate modes)
- Round-specific instructions (in multi-round strategies)

Example flow for Sequential strategy:
```
1. Perplexity → Gathers factual data
2. Gemini → Analyzes data + Perplexity's findings
3. GPT-4 → Creates strategy + previous insights
4. Claude → Reviews ethics + all perspectives
5. GPT-4 → Synthesizes final consensus
```

## Customization

### Adding New Agents

1. Add agent to `src/lib/orchestration/prompts.ts`:
```typescript
export const AGENT_PROMPTS: Record<AgentId, AgentPromptConfig> = {
  // ... existing agents
  newAgent: {
    agentId: 'newAgent',
    role: 'Your Role',
    systemPrompt: 'Your system prompt...',
    expertise: ['skill1', 'skill2'],
    priority: 5,
    temperature: 0.7
  }
};
```

2. Create client in `src/lib/agents/clients.ts`
3. Update types in `src/types/index.ts`
4. Add to UI in `src/components/ChatInterface.tsx`

### Creating Custom Orchestration Strategies

Add new strategy to `src/lib/orchestration/engine.ts`:

```typescript
case 'custom':
  rounds.push(await this.executeCustomStrategy(agents, context, agentExecutor));
  break;
```

## Performance Considerations

- **Parallel**: Fastest (all agents run concurrently) ~5-10s
- **Sequential**: Moderate (agents run in order) ~15-25s
- **Debate**: Slower (multiple rounds) ~30-45s
- **Voting**: Moderate (2 rounds) ~20-30s
- **Consensus**: Slowest (iterative until agreement) ~40-60s

## API Rate Limits

Be mindful of API rate limits:
- OpenRouter: Varies by model
- Perplexity: Check your plan limits
- Google Gemini: 60 requests/minute (free tier)

## Future Enhancements

- [ ] Streaming responses for real-time updates
- [ ] Custom agent selection (enable/disable specific agents)
- [ ] Export conversations to markdown/PDF
- [ ] Agent performance analytics
- [ ] Custom temperature and parameter controls
- [ ] Multi-language support
- [ ] Voice input/output

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Acknowledgments

- Built with Next.js and TypeScript
- Powered by OpenRouter, Perplexity, and Google AI APIs
- Inspired by multi-agent AI research and deliberative systems
