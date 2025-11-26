'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatInterface.module.css';
import { Agent, Message, AgentId, Conversation } from '@/types';
import Sidebar from './Sidebar';

const AGENTS: Agent[] = [
    {
        id: 'perplexity',
        name: 'Perplexity',
        role: 'Fact Checker',
        color: '#00ACC1',
        avatar: 'P',
        description: 'Focuses on real-time data and factual accuracy.'
    },
    {
        id: 'gemini',
        name: 'Gemini',
        role: 'Analyst',
        color: '#4285F4',
        avatar: 'G',
        description: 'Provides deep reasoning and multimodal analysis.'
    },
    {
        id: 'gpt',
        name: 'GPT-4',
        role: 'Strategist',
        color: '#10A37F',
        avatar: 'O',
        description: 'Offers creative solutions and broad knowledge.'
    },
    {
        id: 'claude',
        name: 'Claude',
        role: 'Ethicist',
        color: '#D97757',
        avatar: 'C',
        description: 'Ensures safety, nuance, and ethical consideration.'
    }
];

type OrchestrationStrategy = 'parallel' | 'sequential' | 'debate' | 'voting' | 'consensus';

interface DebateRound {
    roundNumber: number;
    responses: Array<{
        agentId: AgentId;
        agentName: string;
        content: string;
        timestamp: number;
    }>;
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [strategy, setStrategy] = useState<OrchestrationStrategy>('sequential');
    const [showFullDebate, setShowFullDebate] = useState(false);
    const [currentDebate, setCurrentDebate] = useState<DebateRound[] | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load conversations from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('ai-council-conversations');
        if (saved) {
            const parsed = JSON.parse(saved);
            setConversations(parsed);
        }
    }, []);

    // Save conversations to localStorage whenever they change
    useEffect(() => {
        if (conversations.length > 0) {
            localStorage.setItem('ai-council-conversations', JSON.stringify(conversations));
        }
    }, [conversations]);

    // Update active conversation when messages change
    useEffect(() => {
        if (activeConversationId && messages.length > 0) {
            setConversations(prev => prev.map(conv =>
                conv.id === activeConversationId
                    ? { ...conv, messages, timestamp: Date.now() }
                    : conv
            ));
        }
    }, [messages, activeConversationId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, currentDebate]);

    const generateConversationTitle = (firstMessage: string): string => {
        return firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
    };

    const handleNewConversation = () => {
        const newConv: Conversation = {
            id: Date.now().toString(),
            title: 'New Debate',
            timestamp: Date.now(),
            messages: []
        };
        setConversations(prev => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        setMessages([]);
        setCurrentDebate(null);
    };

    const handleSelectConversation = (id: string) => {
        const conv = conversations.find(c => c.id === id);
        if (conv) {
            setActiveConversationId(id);
            setMessages(conv.messages);
            setCurrentDebate(null);
        }
    };

    const handleDeleteConversation = (id: string) => {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeConversationId === id) {
            setActiveConversationId(null);
            setMessages([]);
            setCurrentDebate(null);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isProcessing) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            agentId: 'user',
            content: inputValue,
            timestamp: Date.now()
        };

        // If no active conversation, create one
        if (!activeConversationId) {
            const newConv: Conversation = {
                id: Date.now().toString(),
                title: generateConversationTitle(inputValue),
                timestamp: Date.now(),
                messages: [userMessage]
            };
            setConversations(prev => [newConv, ...prev]);
            setActiveConversationId(newConv.id);
        } else {
            // Update title if this is the first message
            const currentConv = conversations.find(c => c.id === activeConversationId);
            if (currentConv && currentConv.title === 'New Debate') {
                setConversations(prev => prev.map(conv =>
                    conv.id === activeConversationId
                        ? { ...conv, title: generateConversationTitle(inputValue) }
                        : conv
                ));
            }
        }

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInputValue('');
        setIsProcessing(true);
        setCurrentDebate(null);

        // Call API with orchestration strategy
        await runCouncilDebate(inputValue, newMessages);

        setIsProcessing(false);
    };

    const runCouncilDebate = async (topic: string, currentHistory: Message[]) => {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: topic,
                    history: currentHistory,
                    strategy: strategy,
                    returnFullDebate: showFullDebate
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to fetch');

            if (showFullDebate && data.rounds) {
                // Display full debate
                setCurrentDebate(data.rounds);

                // Add consensus as the final message
                const consensusMsg: Message = {
                    id: Date.now().toString(),
                    agentId: 'gpt',
                    content: data.consensus,
                    timestamp: Date.now()
                };
                setMessages(prev => [...prev, consensusMsg]);
            } else {
                // Display only consensus
                const responseMsg: Message = {
                    id: Date.now().toString(),
                    agentId: data.agentId || 'gpt',
                    content: data.content,
                    timestamp: Date.now(),
                    metadata: data.metadata
                };
                setMessages(prev => [...prev, responseMsg]);
            }

        } catch (error) {
            console.error('Error in council debate:', error);
            const errorMsg: Message = {
                id: Date.now().toString(),
                agentId: 'gpt',
                content: 'Error: Could not reach the council. Please try again.',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMsg]);
        }
    };

    const getAgentById = (id: AgentId) => AGENTS.find(a => a.id === id);

    const renderMarkdown = (content: string) => {
        // Simple markdown rendering (you can enhance this or use a library like react-markdown)
        return content
            .split('\n')
            .map((line, i) => {
                if (line.startsWith('# ')) {
                    return <h1 key={i}>{line.slice(2)}</h1>;
                } else if (line.startsWith('## ')) {
                    return <h2 key={i}>{line.slice(3)}</h2>;
                } else if (line.startsWith('### ')) {
                    return <h3 key={i}>{line.slice(4)}</h3>;
                } else if (line.startsWith('- ')) {
                    return <li key={i}>{line.slice(2)}</li>;
                } else if (line.trim() === '') {
                    return <br key={i} />;
                } else {
                    return <p key={i}>{line}</p>;
                }
            });
    };

    return (
        <>
            <Sidebar
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
                onDeleteConversation={handleDeleteConversation}
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            <div className={`${styles.container} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
                <header className={`${styles.header} glass-card`}>
                    <div className={styles.title}>
                        <span className="text-gradient">AI Council</span>
                    </div>

                    <div className={styles.controls}>
                        <div className={styles.strategySelector}>
                            <label>Strategy:</label>
                            <select
                                value={strategy}
                                onChange={(e) => setStrategy(e.target.value as OrchestrationStrategy)}
                                disabled={isProcessing}
                                className={styles.select}
                            >
                                <option value="parallel">Parallel (Fast)</option>
                                <option value="sequential">Sequential (Builds Context)</option>
                                <option value="debate">Debate (2 Rounds)</option>
                                <option value="voting">Voting (Best Answer)</option>
                                <option value="consensus">Consensus (Iterative)</option>
                            </select>
                        </div>

                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                checked={showFullDebate}
                                onChange={(e) => setShowFullDebate(e.target.checked)}
                                disabled={isProcessing}
                            />
                            <span>Show Full Debate</span>
                        </label>
                    </div>

                    <div className={styles.agentsGrid}>
                        {AGENTS.map(agent => (
                            <div key={agent.id} className={`${styles.agentCard} active`} style={{ color: agent.color }}>
                                <div className={styles.agentDot} />
                                {agent.name}
                            </div>
                        ))}
                    </div>
                </header>

                <div className={styles.messagesArea}>
                    {messages.length === 0 && (
                        <div className="flex-center" style={{ height: '100%', flexDirection: 'column', opacity: 0.5 }}>
                            <h2>Start a debate</h2>
                            <p>Ask the council anything...</p>
                            <div style={{ marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
                                <p>Choose your orchestration strategy above:</p>
                                <ul style={{ textAlign: 'left', marginTop: 10 }}>
                                    <li><strong>Parallel:</strong> All agents respond simultaneously</li>
                                    <li><strong>Sequential:</strong> Each agent builds on previous responses</li>
                                    <li><strong>Debate:</strong> Multiple rounds of discussion</li>
                                    <li><strong>Voting:</strong> Agents vote on the best answer</li>
                                    <li><strong>Consensus:</strong> Iterative refinement to agreement</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Render user messages */}
                    {messages.filter(m => m.agentId === 'user').map(msg => (
                        <div key={msg.id} className={styles.messageWrapper} style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                            <div className={styles.contentWrapper}>
                                <span style={{ color: 'var(--primary)', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>You</span>
                                <div className={styles.messageContent}>{msg.content}</div>
                            </div>
                        </div>
                    ))}

                    {/* Show full debate if enabled */}
                    {showFullDebate && currentDebate && currentDebate.map((round, roundIdx) => (
                        <div key={roundIdx} className={styles.debateRound}>
                            <div className={styles.roundHeader}>
                                <h3>Round {round.roundNumber}</h3>
                            </div>
                            {round.responses.map((response, respIdx) => {
                                const agent = getAgentById(response.agentId);
                                return (
                                    <div
                                        key={respIdx}
                                        className={styles.messageWrapper}
                                        style={{
                                            borderLeft: `4px solid ${agent?.color}`,
                                            background: 'var(--bg-card)',
                                            marginBottom: 12
                                        }}
                                    >
                                        <div className={styles.contentWrapper}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                <div
                                                    className={styles.agentAvatar}
                                                    style={{ background: agent?.color }}
                                                >
                                                    {agent?.avatar}
                                                </div>
                                                <div>
                                                    <div style={{ color: agent?.color, fontSize: 14, fontWeight: 600 }}>
                                                        {agent?.name}
                                                    </div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                                                        {response.agentName}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.messageContent}>
                                                {renderMarkdown(response.content)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {/* Show consensus only if not showing full debate */}
                    {!showFullDebate && messages.filter(m => m.agentId !== 'user').map(msg => (
                        <div
                            key={msg.id}
                            className={styles.messageWrapper}
                            style={{
                                background: '#f0fff0',
                                border: '1px solid #c8e6c8',
                                borderRadius: '8px',
                                padding: '20px',
                                margin: '16px 0'
                            }}
                        >
                            <div className={styles.contentWrapper}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <span style={{ color: '#2d8a2d', fontSize: 12, fontWeight: 600 }}>
                                        Council Consensus
                                    </span>
                                    {msg.metadata && (
                                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                                            {msg.metadata.strategy} • {msg.metadata.rounds} rounds • {msg.metadata.duration}ms
                                        </span>
                                    )}
                                </div>
                                <div className={styles.messageContent} style={{ color: '#333', fontSize: 15, lineHeight: 1.7 }}>
                                    {renderMarkdown(msg.content)}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isProcessing && (
                        <div className={styles.messageWrapper} style={{ background: 'var(--bg-card)', opacity: 0.7 }}>
                            <div className={styles.contentWrapper}>
                                <div className={styles.thinking}>
                                    <div className={styles.thinkingDots}>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                    <span>Council is deliberating...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <div className={styles.inputArea}>
                    <form onSubmit={handleSendMessage} className={styles.inputForm}>
                        <input
                            type="text"
                            className={styles.input}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask the council..."
                            disabled={isProcessing}
                        />
                        <button type="submit" className={styles.sendButton} disabled={isProcessing || !inputValue.trim()}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
