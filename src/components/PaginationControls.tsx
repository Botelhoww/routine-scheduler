import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Texto descritivo opcional (ex: "12 rotinas em 4 grupos") */
  summary?: string;
}

/** Calcula até 5 números de página visíveis centrados na atual. */
function getVisiblePages(current: number, total: number, maxVisible = 5): number[] {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, current - half);
  let end = start + maxVisible - 1;
  if (end > total) {
    end = total;
    start = end - maxVisible + 1;
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function PaginationControls({ currentPage, totalPages, onPageChange, summary }: Props) {
  if (totalPages <= 1) {
    return summary ? (
      <div className="flex items-center justify-end text-[11px] text-[#888] py-2">
        {summary}
      </div>
    ) : null;
  }

  const pages = getVisiblePages(currentPage, totalPages);
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 py-2"
      aria-label="Paginação de rotinas"
    >
      <div className="text-[11px] text-[#888]">
        Página <strong className="text-[#1a1a1a] font-medium">{currentPage}</strong> de {totalPages}
        {summary && <span className="ml-2 text-[#aaa]">· {summary}</span>}
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 px-2 text-xs"
          disabled={!canPrev}
          onClick={() => canPrev && onPageChange(currentPage - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" />
          Anterior
        </Button>

        {pages[0] > 1 && (
          <span className="px-1 text-[11px] text-[#aaa]">…</span>
        )}

        {pages.map(p => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'h-8 min-w-8 px-2 rounded text-xs font-medium border transition-colors',
                isActive
                  ? 'bg-[#0A2540] border-[#0A2540] text-white'
                  : 'bg-white border-[#E2E4E8] text-[#444] hover:bg-[#F0F2F5]',
              )}
            >
              {p}
            </button>
          );
        })}

        {pages[pages.length - 1] < totalPages && (
          <span className="px-1 text-[11px] text-[#aaa]">…</span>
        )}

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 px-2 text-xs"
          disabled={!canNext}
          onClick={() => canNext && onPageChange(currentPage + 1)}
          aria-label="Próxima página"
        >
          Próximo
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </nav>
  );
}
