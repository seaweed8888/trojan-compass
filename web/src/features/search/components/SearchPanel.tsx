import { Search } from 'lucide-react';
import { LocationAutocomplete } from './LocationAutocomplete';
import { INPUT, ACTION } from '@/components/ui/form-styles';
import { useRef, useState } from 'react';

export function SearchPanel({
  dataVersion,
  query,
  setQuery,
  onSearch,
  setNotice,
}: {
  dataVersion: string;
  query: string;
  setQuery: (value: string) => void;
  onSearch: (query: string) => Promise<boolean>;
  setNotice: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const draft = useRef(query);
  draft.current = query;
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const submitted = query;
        try {
          await onSearch(query);
          if (draft.current === submitted) setNotice('');
        } catch (error) {
          if (draft.current === submitted)
            setNotice(error instanceof Error ? error.message : 'Search failed. Please retry.');
        } finally {
          setPending(false);
        }
      }}
    >
      <p className="text-[13px] leading-relaxed text-neutral-500">
        Find your next class, meeting, or study spot.
      </p>
      <div>
        <label htmlFor="room-search" className="block text-[12px] font-semibold text-neutral-700">
          Building and room code
        </label>
        <LocationAutocomplete
          dataVersion={dataVersion}
          id="room-search"
          value={query}
          onChange={(value) => {
            setQuery(value);
            setNotice('');
          }}
          placeholder="e.g. LAW 101"
          required
          className={INPUT}
        />
      </div>
      <button onPointerDown={(event) => event.preventDefault()} disabled={pending} className={ACTION}>
        <Search className="h-4 w-4" /> {pending ? 'Searching…' : 'Search rooms'}
      </button>
    </form>
  );
}
