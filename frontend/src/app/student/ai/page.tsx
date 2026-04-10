'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Bot, RefreshCw, Send, Sparkles, User } from 'lucide-react';
import AppShell from '@/components/shared/AppShell';
import { Panel } from '@/components/shared/Panel';
import { useAuth } from '@/contexts/AuthContext';
import { aiApi } from '@/lib/api';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export default function StudentAIPage() {
  const { user } = useAuth();
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && messages.length === 0) {
      setMessages([
        {
          role: 'ai',
          content: `Hello ${user.name}! I can summarize study material, explain concepts, and answer your questions about coursework.`,
        },
      ]);
    }
  }, [user, messages.length]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);
    setError('');

    try {
      if (userMessage.toLowerCase().startsWith('summarize')) {
        const response = await aiApi.summarize(userMessage.replace(/summarize/i, '').trim());
        setMessages((prev) => [...prev, { role: 'ai', content: response.data.summary }]);
      } else {
        const response = await aiApi.ask(userMessage, messages);
        setMessages((prev) => [...prev, { role: 'ai', content: response.data.answer }]);
      }
    } catch (err) {
      console.error(err);
      setError('Sorry, I had trouble connecting. Please try again.');
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Sorry, I had trouble reaching the assistant service.' },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AppShell
      role="student"
      title="Gen AI"
      subtitle="Chat, summarize notes, and get concept help inside SmartClass 360."
    >
      <div className="mx-auto max-w-5xl">
        {error ? (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
            <AlertCircle size={18} />
            {error}
          </div>
        ) : null}

        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-violet-50 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">SmartClass AI</p>
                <p className="text-sm text-slate-500">Summaries, explanations, and Q&A</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setMessages([
                  {
                    role: 'ai',
                    content: `Conversation cleared. What would you like to explore next, ${user?.name ?? 'student'}?`,
                  },
                ])
              }
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="space-y-5 bg-slate-50 p-6">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'ai' ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-white">
                    <Bot size={16} />
                  </div>
                ) : null}
                <div
                  className={`max-w-[80%] rounded-3xl px-5 py-4 text-sm leading-7 ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : 'border border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {message.content}
                </div>
                {message.role === 'user' ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                    <User size={16} />
                  </div>
                ) : null}
              </div>
            ))}

            {isTyping ? (
              <div className="flex gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-white">
                  <Bot size={16} />
                </div>
                <div className="flex items-center gap-1 rounded-3xl border border-slate-200 bg-white px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: '0.2s' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSend} className="border-t border-slate-100 bg-white p-5">
            <div className="flex gap-3">
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask a question or start with 'summarize'..."
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isTyping}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </Panel>
      </div>
    </AppShell>
  );
}
