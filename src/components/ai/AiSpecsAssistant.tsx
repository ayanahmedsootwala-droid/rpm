import { useState, useRef } from 'react';
import { Bot, Send, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Car } from '@/types/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Is this a good price?',
  'What are common issues?',
  'Monthly maintenance cost?',
  'Is it suitable for families?',
];

interface Props {
  car: Car;
}

export default function AiSpecsAssistant({ car }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text.trim() };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '' };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setStreaming(true);

    abortRef.current = new AbortController();

    const carPayload = {
      brand_name: car.brand_name, model_name: car.model_name, variant_name: car.variant_name,
      year: car.year, registration_year: car.registration_year, price: car.price,
      mileage: car.mileage, fuel_type: car.fuel_type, transmission: car.transmission,
      body_type: car.body_type, engine_capacity: car.engine_capacity, color: car.color,
      condition: car.condition, assembly: car.assembly, city: car.city, description: car.description,
    };

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/car-specs-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseKey}`,
          apikey: supabaseKey,
        },
        body: JSON.stringify({
          car: carPayload,
          messages: [...messages.filter(m => m.content), userMsg].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.body) throw new Error('No stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const chunk = JSON.parse(data)?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (chunk) {
              setMessages(prev => prev.map(m =>
                m.id === assistantMsg.id ? { ...m, content: m.content + chunk } : m
              ));
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: 'Sorry, something went wrong. Please try again.' } : m
        ));
      }
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header — always visible */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-secondary/40 hover:bg-secondary/60 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Ask AI about this car</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="flex flex-col">
          {/* Message area */}
          <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Ask anything about this {car.year} {car.brand_name} {car.model_name}
              </p>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground'
                )}>
                  {msg.content || (streaming && <Loader2 className="w-3 h-3 animate-spin" />)}
                </div>
              </div>
            ))}
          </div>

          {/* Quick suggestions */}
          {messages.length === 0 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-[10px] border border-border rounded-full px-2.5 py-1 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 px-3 pb-3 pt-1 border-t border-border">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Ask about specs, pricing, reliability…"
              className="h-8 text-xs flex-1"
              disabled={streaming}
            />
            {streaming ? (
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => abortRef.current?.abort()}>
                <X className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => sendMessage(input)} disabled={!input.trim()}>
                <Send className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
