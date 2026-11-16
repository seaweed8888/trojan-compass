import { Send, Sparkles } from 'lucide-react';
import { useRef, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';
import type { ChatTextRequest, ChatResponse, Candidate } from '@trojan-compass/shared';
import { INPUT } from '@/components/ui/form-styles';

export type ChatMessage = { role: 'assistant' | 'user'; text: string };

// Responses and structured actions come from the shared backend.
export function ChatPanel({
  conversation,
  messages,
  setMessages,
  draft,
  setDraft,
  onChat,
  preferences,
}: {
  conversation: RefObject<HTMLDivElement | null>;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  draft: string;
  setDraft: (value: string) => void;
  onChat: (
    request: Pick<ChatTextRequest, 'message' | 'history' | 'preferences'>
  ) => Promise<ChatResponse>;
  preferences: ChatTextRequest['preferences'];
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const latestDraft = useRef(draft);
  latestDraft.current = draft;
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div
        ref={conversation}
        role="log"
        aria-label="Compass conversation"
        aria-live="polite"
        className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`rounded-xl px-3 py-2.5 text-[13px] leading-relaxed ${message.role === 'user' ? 'ml-6 bg-cardinal text-white' : 'mr-3 bg-neutral-100 text-neutral-700'}`}
          >
            <span
              className={`mb-1 flex items-center gap-1.5 text-[11px] font-bold ${message.role === 'user' ? 'text-white/70' : 'text-cardinal'}`}
            >
              {message.role === 'assistant' && <Sparkles className="h-3 w-3" />}
              {message.role === 'user' ? 'You' : 'Compass'}
            </span>
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
          </div>
        ))}
      </div>
      {candidates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {candidates.map((candidate, index) => (
            <button
              type="button"
              key={index}
              className="rounded border border-cardinal/30 px-2 py-1 text-xs text-cardinal"
              onClick={() =>
                setDraft(
                  `For my previous request: ${(messages.findLast((m) => m.role === 'user')?.text ?? '').slice(0, 2800)}. I choose ${candidate.kind === 'place' ? candidate.location.placeId : candidate.buildingId}.`
                )
              }
            >
              {candidate.label}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="text-xs text-cardinal">
          {error}
        </p>
      )}
      {pending && (
        <p role="status" className="text-xs text-neutral-500">
          Compass is working…
        </p>
      )}
      <form
        className="flex shrink-0 items-end gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const submitted = draft.trim();
          if (!submitted || pending) return;
          setPending(true);
          setError('');
          try {
            const response = await onChat({
              message: submitted,
              history: messages
                .slice(-20)
                .map((m) => ({ role: m.role, content: m.text.slice(0, 4000) })),
              preferences,
            });
            setMessages((current) => [
              ...current,
              { role: 'user', text: submitted },
              { role: 'assistant', text: response.message },
            ]);
            setCandidates(response.clarification?.candidates ?? []);
            if (latestDraft.current.trim() === submitted) setDraft('');
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : 'Chat request failed. Your draft has been kept.'
            );
          } finally {
            setPending(false);
          }
        }}
      >
        {' '}
        <label className="min-w-0 flex-1">
          <span className="sr-only">Message</span>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            maxLength={4000}
            placeholder="Show LAW 101, or route from LAW 101 to LAW 107"
            rows={2}
            className={`${INPUT} mt-0 resize-none`}
          />
        </label>
        <button
          aria-label="Send message"
          disabled={pending || !draft.trim()}
          className="mb-1 rounded-lg bg-cardinal p-3 text-white transition hover:bg-cardinal-dark disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
