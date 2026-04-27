import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  summary?: string;
}

function getVisiblePages(current: number, total: number, maxVisible = 5): number[] {
  if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1);
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, current - half);
  let end = start + maxVisible - 1;
  if (end > total) { end = total; start = end - maxVisible + 1; }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function PaginationControls({ currentPage, totalPages, onPageChange, summary }: Props) {
  if (totalPages <= 1) {
    return summary ? (
      <div className="flex items-center justify-end font-tech text-[10px] text-muted-foreground/80 py-2 tabular-nums">
        {summary}
      </div>
    ) : null;
  }

  const pages = getVisiblePages(currentPage, totalPages);
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-2 py-2"
      aria-label="Paginação"
    >
      <div className="font-tech text-[10px] text-muted-foreground/80 tabular-nums">
        {currentPage}/{totalPages}
        {summary && <span className="ml-2 text-muted-foreground/60">· {summary}</span>}
      </div>

      <div className="flex items-center gap-0.5">
        <Button
          type="button" size="sm" variant="ghost"
          className="h-7 w-7 p-0"
          disabled={!canPrev}
          onClick={() => canPrev && onPageChange(currentPage - 1)}
          aria-label="Anterior"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        {pages[0] > 1 && <span className="px-1 text-[10px] text-muted-foreground/60">…</span>}

        {pages.map(p => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'h-7 min-w-7 px-1.5 rounded font-tech text-[11px] tabular-nums transition-colors',
                isActive
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-[hsl(var(--surface-muted))] hover:text-foreground',
              )}
            >
              {p}
            </button>
          );
        })}

        {pages[pages.length - 1] < totalPages && (
          <span className="px-1 text-[10px] text-muted-foreground/60">…</span>
        )}

        <Button
          type="button" size="sm" variant="ghost"
          className="h-7 w-7 p-0"
          disabled={!canNext}
          onClick={() => canNext && onPageChange(currentPage + 1)}
          aria-label="Próximo"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </nav>
  );
}
