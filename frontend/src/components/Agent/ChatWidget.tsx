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
    mode?: 'popup' | 'page';
}

const ChatWidget = ({ isOpen, onClose, context, mode = 'popup' }: ChatWidgetProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 1, text: "Hi! I'm your Study Buddy AI. Ask me anything about this module!", sender: 'agent', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [provider, setProvider] = useState<string>(sessionStorage.getItem('ai_provider') || 'auto');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);



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
        <div className={`chat-widget-container ${mode === 'page' ? 'chat-mode-page' : ''}`}>
            <div className={`chat-window ${mode === 'page' ? 'chat-window-page' : ''}`}>
                <div className="chat-header">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="chat-title">
                            <span style={{ fontSize: '1.4rem' }}>🤖</span> Study Buddy
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500, marginLeft: '4px' }}>
                            {context.courseName || 'General'} {context.topicName ? `> ${context.topicName}` : ''}
                        </div>
                    </div>
                    <select
                        className="provider-select"
                        value={provider}
                        onChange={e => {
                            setProvider(e.target.value);
                            sessionStorage.setItem('ai_provider', e.target.value);
                        }}
                    >
                        <option value="auto">⚡ Auto</option>
                        <option value="openai">🟢 OpenAI</option>
                        <option value="gemini">🔵 Gemini</option>
                    </select>
                    <button className="chat-close" onClick={onClose} title="Close Chat">✕</button>
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
