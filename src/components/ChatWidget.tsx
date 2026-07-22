import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Best SUVs under 50 lakhs',
  'Fuel efficient sedans',
  'Luxury cars in Karachi',
  'Best family cars 2025',
];

export default function ChatWidget() {
  const { getSetting } = useSiteSettings();
  const siteName = getSetting('site_name', 'XYZ Automobiles');
  const advisorName = `${siteName} AI Advisor`;

  const WELCOME: Message = {
    id: 'welcome',
    role: 'assistant',
    content: `Hello! I'm your ${siteName} AI advisor 🚗 How can I help you find your perfect car today?`,
  };

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text.trim() };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '' };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setStreaming(true);

    abortRef.current = new AbortController();
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/ai-chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.filter(m => m.id !== 'welcome'), userMsg].map(m => ({
            role: m.role, content: m.content,
          })),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error('Failed');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (chunk) {
              setMessages(prev => prev.map(m =>
                m.id === assistantMsg.id ? { ...m, content: m.content + chunk } : m
              ));
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: "Sorry, I couldn't connect. Please try again." } : m
        ));
      }
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="chat-widget">
      {/* Collapsed FAB */}
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          className="w-14 h-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:scale-105 transition-transform animate-scale-in"
          aria-label="Open AI chat"
        >
          <Bot className="w-6 h-6" />
        </Button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="flex flex-col w-[340px] md:w-[380px] max-h-[520px] bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{advisorName}</p>
                <p className="text-xs opacity-70 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-dot inline-block" />
                  Online
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-primary-foreground/70 hover:bg-primary-foreground/10 w-7 h-7"
              onClick={() => setOpen(false)}>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map(msg => (
              <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div className={cn(
                  'max-w-[85%] rounded-2xl px-3 py-2 text-sm animate-chat-bubble',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted text-foreground rounded-tl-sm'
                )}>
                  {msg.content || (streaming && msg.role === 'assistant' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : '')}
                </div>
              </div>
            ))}

            {/* Suggestions after welcome */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="text-xs border border-border rounded-full px-3 py-1 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 p-3 border-t border-border shrink-0">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Ask about any car..."
              className="text-sm h-9"
              disabled={streaming}
            />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => sendMessage(input)} disabled={!input.trim() || streaming}>
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
