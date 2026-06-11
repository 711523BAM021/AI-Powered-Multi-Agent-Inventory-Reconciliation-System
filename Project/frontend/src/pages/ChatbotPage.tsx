import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { inventoryAPI } from '../services/api';
import { Reconciliation } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [selectedReconId, setSelectedReconId] = useState<number | undefined>();
  const [reconsLoading, setReconsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  let nextId = useRef(0);

  useEffect(() => {
    loadReconciliations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadReconciliations = async () => {
    try {
      const res = await inventoryAPI.listReconciliations();
      setReconciliations(res.data);
      if (res.data.length > 0) {
        setSelectedReconId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReconsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: nextId.current++,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await inventoryAPI.chatbot(userMsg.content, selectedReconId);
      const botMsg: Message = {
        id: nextId.current++,
        role: 'assistant',
        content: res.data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: nextId.current++,
        role: 'assistant',
        content: err.response?.data?.detail || 'Sorry, I encountered an error processing your request.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQueries = [
    'What is the overall compliance rate?',
    'Which assets are missing from live infrastructure?',
    'What are the main configuration mismatches?',
    'Summarize the risk assessment',
    'What corrective actions should we prioritize?',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-[calc(100vh-140px)] flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">AI Chatbot</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Context:</label>
          <select
            value={selectedReconId || ''}
            onChange={(e) => setSelectedReconId(e.target.value ? Number(e.target.value) : undefined)}
            className="select-field text-sm py-1.5 w-auto"
          >
            <option value="">No context</option>
            {reconciliations.map((r) => (
              <option key={r.id} value={r.id}>
                Reconciliation #{r.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat area */}
      <div className="card flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-5xl mb-4">🤖</div>
              <h2 className="text-lg font-semibold text-primary mb-2">
                Inventory AI Assistant
              </h2>
              <p className="text-sm text-gray-500 mb-6 max-w-md">
                Ask questions about your inventory data, reconciliation results, or get AI-powered insights.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {suggestedQueries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="text-xs px-3 py-1.5 bg-primary-50 text-primary-600 rounded-full hover:bg-primary-100 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className={`text-[10px] mt-1 ${
                  msg.role === 'user' ? 'text-white/60' : 'text-gray-400'
                }`}>
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <LoadingSpinner size="sm" message="Thinking..." />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-gray-100 p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your inventory data..."
              className="input-field flex-1"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="btn-primary px-5"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
