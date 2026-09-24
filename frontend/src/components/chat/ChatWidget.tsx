'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AlertTriangle, Leaf, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { sendChatMessage, type ChatMessage, type ChatTripContext } from '@/lib/api-client';
import { loadTripResult } from '@/lib/tripStore';
import { useI18n } from '@/i18n/I18nProvider';
import { useCurrency } from '@/lib/CurrencyProvider';

function nightsBetween(startDate: string, endDate: string): number {
  const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.max(Math.round(ms / (1000 * 60 * 60 * 24)), 1);
}

/** Reads the same sessionStorage trip result the itinerary page reads, so
 * the widget becomes trip-aware exactly when the user is looking at a
 * trip -- no shared state/context plumbing needed between pages. */
function useActiveTripContext(): { tripContext: ChatTripContext | null; label: string | null } {
  const pathname = usePathname();
  const { formatInr, rate } = useCurrency();
  const [state, setState] = useState<{ tripContext: ChatTripContext | null; label: string | null }>({
    tripContext: null,
    label: null,
  });

  useEffect(() => {
    const match = pathname?.match(/^\/itinerary\/([^/]+)/);
    if (!match) {
      setState({ tripContext: null, label: null });
      return;
    }
    const trip = loadTripResult(match[1]);
    if (!trip) {
      setState({ tripContext: null, label: null });
      return;
    }
    const { request, response } = trip;
    const recommended = response.itineraries.find((o) => o.label === 'BALANCED') ?? response.itineraries[0];
    setState({
      tripContext: {
        origin: request.origin,
        destination: request.destination.name,
        nights: nightsBetween(request.startDate, request.endDate),
        preference: request.preference,
        recommended_transport_mode: recommended.transportMode,
        recommended_accommodation_tier: recommended.accommodationTier,
        recommended_carbon_kg: recommended.carbon.total_co2e,
        recommended_cost_usd: recommended.costUsd,
        // Rupee string computed client-side from the live rate the page
        // already displays, so the assistant quotes the same figure the
        // user sees rather than the ai-service re-deriving one.
        recommended_cost_inr_formatted: formatInr(recommended.costUsd),
      },
      label: `${request.origin} → ${request.destination.name}`,
    });
    // `rate` is included so this recomputes once the live exchange rate
    // finishes loading (it starts null); `formatInr` itself is excluded
    // since it's a new function identity every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, rate]);

  return state;
}

export function ChatWidget() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tripContext, label } = useActiveTripContext();
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
      const reply = await sendChatMessage(nextMessages, tripContext, locale);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setError(t('chat.unavailable'));
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('chat.openLabel')}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex h-[520px] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between bg-emerald-600 px-4 py-3 text-white">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Leaf className="h-4 w-4" />
            {t('chat.assistantName')}
          </p>
          {label && <p className="text-xs text-emerald-50/90">{t('chat.chattingAbout', { trip: label })}</p>}
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t('chat.closeLabel')}
          className="rounded-md p-1 hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="text-xs text-slate-400">{label ? t('chat.introWithTrip') : t('chat.introGeneral')}</p>
        )}
        {messages.map((message, i) => (
          <div key={i} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <p
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                message.role === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-800'
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <p className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
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

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-200 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chat.placeholder')}
          disabled={sending}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label={t('chat.sendLabel')}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
