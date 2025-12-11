import { useState, useEffect, useRef } from 'react';
import api from '../../api';
import './ChatStyles.css';

interface ChatMessage {
    id: number;
    text: string;
    sender: 'user' | 'agent';
    timestamp: Date;
}

interface ChatWidgetProps {
    isOpen: boolean;
    onClose: () => void;
    context: {
        courseId: number | null;
        topicId: number | null;
        courseName: string;
        topicName: string;
    };
}

const ChatWidget = ({ isOpen, onClose, context }: ChatWidgetProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 1, text: "Hi! I'm your Study Buddy AI. Ask me anything about this module!", sender: 'agent', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [provider, setProvider] = useState<string>('auto');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Helper to get initials
    const getInitials = () => 'AI';

    // Send Message
    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now(),
            text: input,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Call API
            const res = await api.post('/api/chat', {
                message: userMsg.text,
                course_id: context.courseId,
                topic_id: context.topicId,
                context_str: `Course: ${context.courseName}, Topic: ${context.topicName}`,
                provider: provider
            });

            const agentMsg: ChatMessage = {
                id: Date.now() + 1,
                text: res.data.answer,
                sender: 'agent',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, agentMsg]);
        } catch (err) {
            console.error("Chat Error", err);
            const errorMsg: ChatMessage = {
                id: Date.now() + 1,
                text: "Sorry, I'm having trouble connecting to my brain right now. Please try again later.",
                sender: 'agent',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="chat-widget-container">
            <div className="chat-window">
                <div className="chat-header">
                    <div className="chat-title">
                        <span style={{ fontSize: '1.4rem' }}>🤖</span> Study Buddy AI
                    </div>
                    <select
                        value={provider}
                        onChange={e => setProvider(e.target.value)}
                        style={{
                            marginLeft: 'auto', marginRight: '10px',
                            padding: '4px 8px', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                            fontSize: '0.75rem', cursor: 'pointer', outline: 'none'
                        }}
                    >
                        <option value="auto" style={{ color: '#333' }}>⚡ Auto</option>
                        <option value="openai" style={{ color: '#333' }}>🟢 OpenAI</option>
                        <option value="gemini" style={{ color: '#333' }}>🔵 Gemini</option>
                    </select>
                    <button className="chat-close" onClick={onClose} title="Close Chat">✕</button>
                </div>

                {/* Context Bar */}
                <div style={{ padding: '8px 16px', background: 'var(--surface-color)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, borderBottom: '1px solid var(--border-light)' }}>
                    Context: {context.courseName || 'General'} {context.topicName ? `> ${context.topicName}` : ''}
                </div>

                <div className="chat-messages">
                    {messages.map(msg => (
                        <div key={msg.id} className={`message ${msg.sender}`}>
                            {msg.text}
                        </div>
                    ))}
                    {loading && (
                        <div className="typing-indicator">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Ask a doubt..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        disabled={loading}
                    />
                    <button
                        className="chat-send-btn"
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWidget;
