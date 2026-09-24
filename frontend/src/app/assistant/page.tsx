'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Leaf, Loader2, Send } from 'lucide-react';
import { sendChatMessage, type ChatMessage } from '@/lib/api-client';
import { useI18n } from '@/i18n/I18nProvider';

export default function AssistantPage() {
  const { t, locale } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setSending(true);

    try {
      const reply = await sendChatMessage(nextMessages, null, locale);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setError(t('chat.unavailable'));
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto flex h-[calc(100vh-4rem)] max-w-2xl flex-col px-4 py-8">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <Leaf className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-semibold text-slate-900">{t('assistantPage.title')}</h1>
          <p className="text-xs text-slate-500">{t('assistantPage.subtitle')}</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
        {messages.length === 0 && <p className="text-sm text-slate-400">{t('assistantPage.intro')}</p>}
        {messages.map((message, i) => (
          <div key={i} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <p
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                message.role === 'user' ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-slate-50 text-slate-800'
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <p className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('chat.thinking')}
            </p>
          </div>
        )}
        {error && (
          <p className="flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
            {error}
          </p>
        )}
      </div>

      <form onSubmit={handleSend} className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chat.placeholder')}
          disabled={sending}
          className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label={t('chat.sendLabel')}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </main>
  );
}
