import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

export default function AIChatWidget({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: 'Assalamu Alaikum! I am your AI Fitness Buddy. Ask me about desi food swaps, managing shadis/dawats, knee-friendly exercise alternatives, or clarifying your workout/nutrition plans!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.sendMessage(user?.id, text);
      setMessages((prev) => [...prev, { sender: 'assistant', text: res.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: 'Sorry, I ran into an error. Please check your backend connection.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'Swap 100g chicken breast',
    'How to handle a Shadi buffer',
    'Tips for training with PCOS',
    'Missed workout advice'
  ];

  return (
    <div className="chat-widget-container">
      {/* Trigger Button */}
      <button className="chat-trigger" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? (
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>×</span>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-title">AI Fitness Buddy</div>
            <button className="chat-close" onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-msg ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="chat-msg assistant" style={{ fontStyle: 'italic', color: '#94a3b8' }}>
                Typing...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestions chips */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.4rem',
              padding: '0.5rem',
              background: '#0b0f19',
              borderTop: '1px solid rgba(148, 163, 184, 0.08)'
            }}
          >
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                style={{
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '12px',
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.75rem',
                  color: '#818cf8',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            <input
              type="text"
              className="chat-input"
              placeholder="Ask about Pakistani food swaps..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
            />
            <button className="chat-send" onClick={() => handleSend()} disabled={loading}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
