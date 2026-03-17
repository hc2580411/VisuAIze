import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Sparkles, X, Copy, Check, Play, MessageSquare, Plus } from 'lucide-react';
import { generateResponse } from '../services/aiService';
import './AIAssistant.css';
import { BACKGROUND_THEMES } from '../constants';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

// Separate component for code blocks to properly use React hooks
const CodeBlock = ({ children, onVisualizeCode, onClose, ...props }) => {
    const [copied, setCopied] = useState(false);
    const codeContent = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(codeContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleVisualize = () => {
        if (onVisualizeCode) {
            onVisualizeCode(codeContent);
            onClose();
        }
    };

    return (
        <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '12px',
            borderRadius: '8px',
            margin: '8px 0',
            overflowX: 'auto',
            border: '1px solid rgba(255,255,255,0.1)',
            fontFamily: 'monospace',
            position: 'relative'
        }}>
            <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                display: 'flex',
                gap: '8px',
                zIndex: 10
            }}>
                <button
                    onClick={handleVisualize}
                    style={{
                        background: 'var(--primary)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                    title="Visualize this code"
                >
                    <Play size={12} fill="white" />
                    Visualize
                </button>
                <button
                    onClick={handleCopy}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px',
                        cursor: 'pointer',
                        color: copied ? 'var(--sorted)' : 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}
                    title="Copy code"
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
            </div>
            <pre style={{ margin: 0 }}><code {...props}>{children}</code></pre>
        </div>
    );
};

export default function AIAssistant({ onClose, theme, backgroundId, onVisualizeCode }) {
    const { user } = useAuth();
    const defaultMessage = { id: 1, type: 'bot', text: "### Welcome to VisuAize AI 🌟\nI'm your elite algorithm specialist. Whether you're debugging a complex BST or exploring sorting efficiencies, I'm here to guide you. \n\nWhat are we visualizing today?" };

    const [messages, setMessages] = useState([defaultMessage]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [fontSize, setFontSize] = useState(13);
    const messagesEndRef = useRef(null);

    // Conversation State
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false);

    useEffect(() => {
        if (!user) return;
        const controller = new AbortController();
        fetchConversations(controller.signal);
        return () => controller.abort();
    }, [user]);

    const fetchConversations = async (signal) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/conversations`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
                signal
            });
            const data = await res.json();
            if (res.ok) {
                setConversations(data);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Failed to fetch conversations', error);
            }
        }
    };

    const loadConversation = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/conversations/${id}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setMessages(data.messages);
                setCurrentConversationId(data.id);
            }
        } catch (error) {
            console.error('Failed to load conversation', error);
        }
    };

    const saveConversation = async (newMessages) => {
        if (!user) return;

        const title = currentConversationId
            ? null
            : newMessages[1]?.text.substring(0, 30) + '...';

        try {
            const res = await fetch(`${API_BASE_URL}/api/conversations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    id: currentConversationId,
                    title,
                    messages: newMessages
                })
            });
            const data = await res.json();
            if (res.ok && !currentConversationId) {
                setCurrentConversationId(data.id);
                fetchConversations();
            }
        } catch (error) {
            console.error('Failed to save conversation', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        let processedInput = input;
        const codePatterns = [/function\s+\w+\s*\(/, /=>/, /const\s+\w+\s*=/, /let\s+\w+\s*=/, /for\s*\(/, /while\s*\(/, /if\s*\(/, /\{[\s\S]*\}/];
        const looksLikeCode = codePatterns.some(pattern => pattern.test(input));

        if (looksLikeCode && !input.trim().startsWith('```')) {
            processedInput = `\`\`\`javascript\n${input}\n\`\`\``;
        }

        const userMsg = { id: Date.now(), type: 'user', text: processedInput };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput("");
        setIsTyping(true);

        try {
            const responseText = await generateResponse(input, newMessages);
            const finalMessages = [...newMessages, { id: Date.now() + 1, type: 'bot', text: responseText }];
            setMessages(finalMessages);
            saveConversation(finalMessages);
        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: `Error: ${error.message}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    const activeBg = BACKGROUND_THEMES.find(b => b.id === backgroundId) || BACKGROUND_THEMES[0];
    const currentGradient = theme === 'dark' ? activeBg.dark : activeBg.light;

    const style = {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60vw',
        height: '70vh',
        minWidth: '600px',
        minHeight: '500px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        background: currentGradient,
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'row', // Changed to row for sidebar
        overflow: 'hidden',
        zIndex: 2000,
    };

    return (
        <div
            className="ai-assistant-backdrop"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(8px)',
                zIndex: 1999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'fadeIn 0.3s ease-out'
            }}
            onClick={(e) => {
                if (e.target.className === 'ai-assistant-backdrop') onClose();
            }}
        >
            <div className="ai-assistant-panel" style={style}>
                {/* Conversations Sidebar */}
                {showSidebar && (
                    <div className="ai-sidebar" style={{
                        width: '250px',
                        borderRight: '1px solid var(--border-color)',
                        background: 'rgba(0,0,0,0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '16px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>History</span>
                            <button
                                onClick={() => {
                                    setMessages([defaultMessage]);
                                    setCurrentConversationId(null);
                                }}
                                style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '11px',
                                    fontWeight: '600'
                                }}
                            >
                                <Plus size={12} /> New
                            </button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {conversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => loadConversation(conv.id)}
                                    style={{
                                        background: currentConversationId === conv.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                        color: currentConversationId === conv.id ? 'white' : 'var(--text-secondary)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        padding: '10px',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s',
                                        fontSize: '12px'
                                    }}
                                >
                                    <MessageSquare size={14} />
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {conv.title || 'Conversation'}
                                    </span>
                                </button>
                            ))}
                            {conversations.length === 0 && (
                                <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
                                    No past conversations
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Chat Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    {/* Header */}
                    <div className="ai-header" style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255, 255, 255, 0.05)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: '600' }}>
                            <button
                                onClick={() => setShowSidebar(!showSidebar)}
                                title="Toggle History"
                                style={{
                                    background: showSidebar ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <MessageSquare size={16} />
                            </button>
                            <Bot size={18} color="var(--primary)" />
                            <span>AI Assistant</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                                onClick={() => {
                                    const sizes = [12, 14, 16];
                                    const currentIndex = sizes.indexOf(fontSize);
                                    const nextIndex = (currentIndex + 1) % sizes.length;
                                    setFontSize(sizes[nextIndex]);
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s',
                                    backdropFilter: 'blur(4px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                                title="Change Font Size"
                            >
                                Text: {fontSize === 12 ? 'S' : fontSize === 14 ? 'M' : 'L'}
                            </button>
                            <button
                                onClick={() => setMessages([defaultMessage])}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s',
                                    backdropFilter: 'blur(4px)'
                                }}
                            >
                                Clear Chat
                            </button>
                            <button
                                onClick={onClose}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="ai-messages" style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(5px)'
                    }}>
                        {messages.map(msg => (
                            <div key={msg.id} style={{
                                alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '11px',
                                    color: 'var(--text-muted)',
                                    flexDirection: msg.type === 'user' ? 'row-reverse' : 'row'
                                }}>
                                    {msg.type === 'bot' ? <Sparkles size={12} /> : <User size={12} />}
                                    <span>{msg.type === 'bot' ? 'AI' : 'You'}</span>
                                </div>
                                <div className="message-content" style={{
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    borderTopRightRadius: msg.type === 'user' ? '2px' : '12px',
                                    borderTopLeftRadius: msg.type === 'bot' ? '2px' : '12px',
                                    backgroundColor: msg.type === 'user' ? 'var(--primary)' : 'var(--bg-input)',
                                    color: msg.type === 'user' ? '#fff' : 'var(--text-main)',
                                    fontSize: `${fontSize}px`,
                                    lineHeight: '1.5',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                }}>
                                    <ReactMarkdown
                                        components={{
                                            code({ inline, children, ...props }) {
                                                if (inline) {
                                                    return (
                                                        <code style={{
                                                            background: 'rgba(255,255,255,0.1)',
                                                            padding: '2px 4px',
                                                            borderRadius: '4px',
                                                            fontFamily: 'monospace',
                                                            fontSize: '0.9em'
                                                        }} {...props}>
                                                            {children}
                                                        </code>
                                                    );
                                                }
                                                return (
                                                    <CodeBlock
                                                        onVisualizeCode={onVisualizeCode}
                                                        onClose={onClose}
                                                        {...props}
                                                    >
                                                        {children}
                                                    </CodeBlock>
                                                );
                                            },
                                            p: ({ children }) => <p style={{ margin: '0 0 12px 0' }}>{children}</p>,
                                            h3: ({ children }) => <h3 style={{ margin: '16px 0 8px 0', fontSize: `${fontSize + 2}px`, fontWeight: '700', color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>{children}</h3>,
                                            h4: ({ children }) => <h4 style={{ margin: '12px 0 6px 0', fontSize: `${fontSize}px`, fontWeight: '700', color: 'var(--text-primary)' }}>{children}</h4>,
                                            ul: ({ children }) => <ul style={{ margin: '8px 0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>{children}</ul>,
                                            ol: ({ children }) => <ol style={{ margin: '8px 0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>{children}</ol>,
                                            li: ({ children }) => <li style={{ marginBottom: '4px', listStyleType: 'disc' }}>{children}</li>,
                                            strong: ({ children }) => <strong style={{ color: 'var(--primary)', fontWeight: '700' }}>{children}</strong>,
                                        }}
                                    >
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="ai-typing-indicator" style={{
                                alignSelf: 'flex-start',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 16px',
                                backgroundColor: 'var(--bg-input)',
                                borderRadius: '16px',
                                borderTopLeftRadius: '2px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                animation: 'fadeIn 0.3s ease-out'
                            }}>
                                <Bot size={14} className="animate-pulse" style={{ color: 'var(--primary)' }} />
                                <div className="typing-dots">
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', marginLeft: '4px' }}>AI is thinking...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} style={{
                        padding: '12px',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        gap: '8px',
                        background: 'rgba(255, 255, 255, 0.02)'
                    }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about an algorithm..."
                                maxLength={500}
                                style={{
                                    width: '100%',
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '20px',
                                    padding: '8px 16px',
                                    paddingRight: '60px',
                                    color: 'var(--text-primary)',
                                    fontSize: `${fontSize}px`,
                                    outline: 'none'
                                }}
                            />
                            <span style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '10px',
                                color: input.length >= 450 ? 'var(--primary)' : 'var(--text-muted)',
                                opacity: input.length > 0 ? 1 : 0
                            }}>
                                {input.length}/500
                            </span>
                        </div>
                        <button type="submit" disabled={!input.trim() || isTyping} style={{
                            background: 'var(--primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: (input.trim() && !isTyping) ? 'pointer' : 'default',
                            opacity: (input.trim() && !isTyping) ? 1 : 0.5,
                            transition: 'all 0.2s'
                        }}>
                            {isTyping ? <div className="typing-dot-small" /> : <Send size={16} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
